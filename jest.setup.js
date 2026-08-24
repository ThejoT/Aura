/**
 * Native modules used by Aura have no JS-only implementation, so the
 * default RN smoke test needs lightweight mocks to mount `<App />` in Jest
 * (a plain Node environment, not a device). These are test doubles only —
 * production code always talks to the real native modules.
 */

jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() =>
    Promise.resolve({
      transaction: jest.fn(cb => {
        cb({ executeSql: jest.fn() });
        return Promise.resolve();
      }),
      executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0, item: () => null } }])),
    }),
  ),
}));

jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    state: jest.fn(() => Promise.resolve('PoweredOn')),
    onStateChange: jest.fn(() => ({ remove: jest.fn() })),
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    onDeviceDisconnected: jest.fn(() => ({ remove: jest.fn() })),
    destroy: jest.fn(),
  })),
  State: { PoweredOn: 'PoweredOn' },
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(() => Promise.resolve()),
    requestPermission: jest.fn(() => Promise.resolve({ authorizationStatus: 1 })),
    createTriggerNotification: jest.fn(() => Promise.resolve()),
    cancelTriggerNotification: jest.fn(() => Promise.resolve()),
    displayNotification: jest.fn(() => Promise.resolve()),
    onForegroundEvent: jest.fn(),
    onBackgroundEvent: jest.fn(),
  },
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  TriggerType: { TIMESTAMP: 0 },
  EventType: { PRESS: 1 },
}));

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
  PERMISSIONS: { IOS: {}, ANDROID: {} },
  RESULTS: { GRANTED: 'granted', DENIED: 'denied', LIMITED: 'limited', BLOCKED: 'blocked' },
  request: jest.fn(() => Promise.resolve('granted')),
  requestMultiple: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@react-native-community/slider', () => 'Slider');

jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn(() => Promise.resolve({ filePath: '/tmp/mock.pdf' })),
}));
