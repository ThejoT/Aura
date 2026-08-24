import { BleManager, Device, State as BleState, Subscription } from 'react-native-ble-plx';
import {
  AURA_SERVICE_UUID,
  BATTERY_LEVEL_CHARACTERISTIC_UUID,
  BATTERY_SERVICE_UUID,
  CONTROL_CHARACTERISTIC_UUID,
  DEVICE_NAME_PREFIX,
  STOP_COMMAND,
  base64ToBytes,
  bytesToBase64,
  encodeControlCommand,
} from './protocol';
import { requestBlePermissions } from './permissions';
import type { IntensityState, ModeState } from '../types';

export type BleConnectionState = 'disconnected' | 'scanning' | 'connecting' | 'connected';

interface Snapshot {
  connection: BleConnectionState;
  batteryPct: number | null;
  deviceName: string | null;
  lastError: string | null;
}

const SCAN_TIMEOUT_MS = 15_000;
const SIMULATED_CONNECT_DELAY_MS = 600;
const SIMULATED_DRAIN_INTERVAL_MS = 45_000;
const SIMULATED_DEVICE_NAME = `${DEVICE_NAME_PREFIX}SIM (simulated)`;

/**
 * Thin wrapper around react-native-ble-plx exposing a plain pub-sub snapshot
 * so it can be read with React's useSyncExternalStore without pulling BLE
 * internals into every screen. One device connection at a time — this is a
 * single-user wearable, not a multi-device manager.
 */
class BleManagerServiceImpl {
  private manager = new BleManager();
  private device: Device | null = null;
  private disconnectSub: Subscription | null = null;
  private batterySub: Subscription | null = null;
  private listeners = new Set<() => void>();
  private simulationMode = false;
  private simulationDrainInterval: ReturnType<typeof setInterval> | null = null;
  private snapshot: Snapshot = {
    connection: 'disconnected',
    batteryPct: null,
    deviceName: null,
    lastError: null,
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): Snapshot => this.snapshot;

  private setSnapshot(patch: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach(l => l());
  }

  private async waitForPoweredOn(): Promise<boolean> {
    const state = await this.manager.state();
    if (state === BleState.PoweredOn) return true;
    return new Promise(resolve => {
      const sub = this.manager.onStateChange(s => {
        if (s === BleState.PoweredOn) {
          sub.remove();
          resolve(true);
        }
      }, true);
      setTimeout(() => {
        sub.remove();
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Toggle simulated-device mode (Settings → "Simulate headband"). Lets
   * someone exercise the full Attack Mode session flow — connect, start,
   * intensity changes, battery display — without owning a real ESP32
   * headband. No real BLE calls happen while this is on. Switches by
   * disconnecting whatever is currently active first, so flipping the
   * toggle mid-connection never leaves a stale connection behind.
   */
  async setSimulationMode(enabled: boolean): Promise<void> {
    if (this.simulationMode === enabled) return;
    await this.disconnect();
    this.simulationMode = enabled;
  }

  isSimulationMode(): boolean {
    return this.simulationMode;
  }

  private async connectSimulated(): Promise<boolean> {
    this.setSnapshot({ connection: 'connecting', lastError: null });
    await new Promise<void>(resolve => setTimeout(resolve, SIMULATED_CONNECT_DELAY_MS));

    const startingBattery = 60 + Math.floor(Math.random() * 36); // 60-95%
    this.setSnapshot({ connection: 'connected', deviceName: SIMULATED_DEVICE_NAME, batteryPct: startingBattery, lastError: null });

    this.simulationDrainInterval = setInterval(() => {
      const current = this.snapshot.batteryPct ?? startingBattery;
      this.setSnapshot({ batteryPct: Math.max(5, current - 1) });
    }, SIMULATED_DRAIN_INTERVAL_MS);

    return true;
  }

  private stopSimulationDrain(): void {
    if (this.simulationDrainInterval) {
      clearInterval(this.simulationDrainInterval);
      this.simulationDrainInterval = null;
    }
  }

  async connect(): Promise<boolean> {
    if (this.snapshot.connection === 'connected' || this.snapshot.connection === 'connecting') return true;
    if (this.simulationMode) return this.connectSimulated();

    const granted = await requestBlePermissions();
    if (!granted) {
      this.setSnapshot({ lastError: 'Bluetooth/location permission denied' });
      return false;
    }

    const poweredOn = await this.waitForPoweredOn();
    if (!poweredOn) {
      this.setSnapshot({ lastError: 'Bluetooth is off' });
      return false;
    }

    this.setSnapshot({ connection: 'scanning', lastError: null });

    const found = await new Promise<Device | null>(resolve => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        this.manager.stopDeviceScan();
        resolve(null);
      }, SCAN_TIMEOUT_MS);

      this.manager.startDeviceScan([AURA_SERVICE_UUID], null, (error, device) => {
        if (settled) return;
        if (error) {
          settled = true;
          clearTimeout(timeout);
          this.manager.stopDeviceScan();
          resolve(null);
          return;
        }
        if (device && (device.name?.startsWith(DEVICE_NAME_PREFIX) || device.localName?.startsWith(DEVICE_NAME_PREFIX))) {
          settled = true;
          clearTimeout(timeout);
          this.manager.stopDeviceScan();
          resolve(device);
        }
      });
    });

    if (!found) {
      this.setSnapshot({ connection: 'disconnected', lastError: 'No Aura headband found nearby' });
      return false;
    }

    this.setSnapshot({ connection: 'connecting' });

    try {
      const connected = await found.connect();
      await connected.discoverAllServicesAndCharacteristics();
      this.device = connected;

      this.disconnectSub = this.manager.onDeviceDisconnected(connected.id, () => {
        this.device = null;
        this.batterySub?.remove();
        this.setSnapshot({ connection: 'disconnected', batteryPct: null });
      });

      this.batterySub = connected.monitorCharacteristicForService(
        BATTERY_SERVICE_UUID,
        BATTERY_LEVEL_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error || !characteristic?.value) return;
          const bytes = base64ToBytes(characteristic.value);
          this.setSnapshot({ batteryPct: bytes[0] ?? null });
        },
      );

      this.setSnapshot({
        connection: 'connected',
        deviceName: connected.name ?? DEVICE_NAME_PREFIX,
        lastError: null,
      });
      return true;
    } catch (e) {
      this.setSnapshot({ connection: 'disconnected', lastError: 'Failed to connect to headband' });
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.simulationMode) {
      this.stopSimulationDrain();
      this.setSnapshot({ connection: 'disconnected', batteryPct: null, deviceName: null });
      return;
    }

    this.disconnectSub?.remove();
    this.batterySub?.remove();
    if (this.device) {
      try {
        await this.device.cancelConnection();
      } catch {
        // already disconnected
      }
    }
    this.device = null;
    this.setSnapshot({ connection: 'disconnected', batteryPct: null, deviceName: null });
  }

  async sendControl(modes: ModeState, intensities: IntensityState, quietMode: boolean): Promise<void> {
    if (!this.device || this.snapshot.connection !== 'connected') return;
    const command = encodeControlCommand(modes, intensities, quietMode);
    await this.device.writeCharacteristicWithResponseForService(
      AURA_SERVICE_UUID,
      CONTROL_CHARACTERISTIC_UUID,
      bytesToBase64(command),
    );
  }

  async sendStop(): Promise<void> {
    if (!this.device || this.snapshot.connection !== 'connected') return;
    await this.device.writeCharacteristicWithResponseForService(
      AURA_SERVICE_UUID,
      CONTROL_CHARACTERISTIC_UUID,
      bytesToBase64(STOP_COMMAND),
    );
  }

  destroy(): void {
    this.stopSimulationDrain();
    this.disconnectSub?.remove();
    this.batterySub?.remove();
    this.manager.destroy();
  }
}

export const bleService = new BleManagerServiceImpl();
