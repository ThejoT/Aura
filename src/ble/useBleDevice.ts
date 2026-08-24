import { useSyncExternalStore } from 'react';
import { bleService } from './BleManagerService';

/** React binding over the BLE service's plain pub-sub snapshot. */
export function useBleDevice() {
  const snapshot = useSyncExternalStore(bleService.subscribe, bleService.getSnapshot, bleService.getSnapshot);
  return {
    ...snapshot,
    connect: bleService.connect.bind(bleService),
    disconnect: bleService.disconnect.bind(bleService),
    sendControl: bleService.sendControl.bind(bleService),
    sendStop: bleService.sendStop.bind(bleService),
  };
}
