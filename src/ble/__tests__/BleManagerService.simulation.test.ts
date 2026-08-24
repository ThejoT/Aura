import { bleService } from '../BleManagerService';

const CONNECT_DELAY_MS = 600; // must match SIMULATED_CONNECT_DELAY_MS in BleManagerService.ts

async function connectSimulated() {
  const connectPromise = bleService.connect();
  await jest.advanceTimersByTimeAsync(CONNECT_DELAY_MS);
  return connectPromise;
}

/**
 * Covers the simulated-device path (Settings → "Simulate headband") that
 * lets someone exercise Attack Mode without real BLE hardware. The real
 * `react-native-ble-plx` module is mocked at the jest.setup.js level for
 * every test in this project, so this only exercises the simulation branch
 * — never a real BleManager call.
 *
 * Uses advanceTimersByTimeAsync (not runAllTimersAsync) throughout: the
 * simulated battery drain is a recurring setInterval, and runAllTimersAsync
 * would try to exhaust it forever.
 */
describe('BleManagerService simulation mode', () => {
  afterEach(async () => {
    await bleService.setSimulationMode(false);
    jest.useRealTimers();
  });

  it('connects to a simulated device without going through scanning/connecting-to-real-hardware states', async () => {
    jest.useFakeTimers();
    await bleService.setSimulationMode(true);
    expect(bleService.isSimulationMode()).toBe(true);

    const connectPromise = bleService.connect();
    expect(bleService.getSnapshot().connection).toBe('connecting');

    await jest.advanceTimersByTimeAsync(CONNECT_DELAY_MS);
    const ok = await connectPromise;

    expect(ok).toBe(true);
    const snapshot = bleService.getSnapshot();
    expect(snapshot.connection).toBe('connected');
    expect(snapshot.deviceName).toContain('simulated');
    expect(snapshot.batteryPct).toBeGreaterThanOrEqual(60);
    expect(snapshot.batteryPct).toBeLessThanOrEqual(95);
  });

  it('drains simulated battery over time but never below the floor', async () => {
    jest.useFakeTimers();
    await bleService.setSimulationMode(true);
    await connectSimulated();

    const start = bleService.getSnapshot().batteryPct as number;
    await jest.advanceTimersByTimeAsync(45_000);
    expect(bleService.getSnapshot().batteryPct).toBe(start - 1);

    await jest.advanceTimersByTimeAsync(45_000 * 1000); // way past empty
    expect(bleService.getSnapshot().batteryPct).toBeGreaterThanOrEqual(5);
  });

  it('disconnect() resets state and stops the drain timer', async () => {
    jest.useFakeTimers();
    await bleService.setSimulationMode(true);
    await connectSimulated();

    await bleService.disconnect();
    const snapshot = bleService.getSnapshot();
    expect(snapshot.connection).toBe('disconnected');
    expect(snapshot.batteryPct).toBeNull();
    expect(snapshot.deviceName).toBeNull();
  });

  it('sendControl/sendStop are no-ops in simulation mode (no real device to write to)', async () => {
    jest.useFakeTimers();
    await bleService.setSimulationMode(true);
    await connectSimulated();

    await expect(
      bleService.sendControl({ paddles: true, vibration: false, rotation: false }, { paddles: 60, vibration: 0, rotation: 0 }, false),
    ).resolves.toBeUndefined();
    await expect(bleService.sendStop()).resolves.toBeUndefined();
  });

  it('toggling simulation mode off while connected disconnects first', async () => {
    jest.useFakeTimers();
    await bleService.setSimulationMode(true);
    await connectSimulated();
    expect(bleService.getSnapshot().connection).toBe('connected');

    await bleService.setSimulationMode(false);
    expect(bleService.getSnapshot().connection).toBe('disconnected');
    expect(bleService.isSimulationMode()).toBe(false);
  });
});
