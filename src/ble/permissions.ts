import { Platform } from 'react-native';
import { PERMISSIONS, RESULTS, request, requestMultiple } from 'react-native-permissions';

/** Requests whatever BLE-related permissions the running OS version needs. */
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const results = await requestMultiple([
        PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
        PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
      ]);
      return Object.values(results).every(r => r === RESULTS.GRANTED);
    }
    const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    return result === RESULTS.GRANTED;
  }

  if (Platform.OS === 'ios') {
    const result = await request(PERMISSIONS.IOS.BLUETOOTH);
    return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
  }

  return true;
}
