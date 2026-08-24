import { Platform } from 'react-native';

/**
 * Large, high-legibility type scale. Assume the reader is in pain, in a
 * dark room, operating the phone with one thumb — err toward bigger.
 */
export const typography = {
  fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  huge: 64, // session timer, big number pickers
  display: 40, // primary CTA label, headline numbers
  title: 24,
  body: 18,
  label: 15,
  caption: 12, // battery/connection status only
} as const;
