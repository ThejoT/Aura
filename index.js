/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

// Registered at module scope (before the app mounts) per notifee's
// requirements — handles a notification tap while the app was killed or
// backgrounded. There's nothing to do here beyond letting the OS bring the
// app to the foreground; in-app state (pendingCheckIns, MIDAS due banner)
// is recomputed from SQLite on the next render either way, so no
// navigation logic is needed in the background handler itself.
notifee.onBackgroundEvent(async ({ type }) => {
  if (type === EventType.PRESS) {
    // no-op: app foregrounding is enough, screens re-derive state from SQLite
  }
});

AppRegistry.registerComponent(appName, () => App);
