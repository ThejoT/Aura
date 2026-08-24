/**
 * Aura — migraine relief headband companion app.
 * @format
 */

import React, { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { TabNavigator } from './src/navigation/TabNavigator';
import { FirstLaunchScreen } from './src/screens/FirstLaunchScreen';
import { ResearchSurveyModal } from './src/screens/Settings/ResearchSurveyModal';
import { SessionProvider, useSession } from './src/state/SessionContext';
import { settingsRepo, sessionsRepo } from './src/db';
import { bleService } from './src/ble';
import { colors } from './src/theme';

const NAV_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.ember,
  },
};

function AppShell() {
  const [firstLaunchAcked, setFirstLaunchAcked] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [acked, simulate] = await Promise.all([
        settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.firstLaunchAcked),
        settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.simulateDevice),
      ]);
      // Set before any screen mounts and calls bleService.connect(), so Attack Mode
      // connects to the simulated device from the very first render when this is on.
      await bleService.setSimulationMode(simulate);
      setFirstLaunchAcked(acked);
    })();
  }, []);

  const acknowledge = async () => {
    await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.firstLaunchAcked, true);
    setFirstLaunchAcked(true);
  };

  if (firstLaunchAcked === null) {
    return <View style={styles.blank} />;
  }

  if (!firstLaunchAcked) {
    return <FirstLaunchScreen onAcknowledge={acknowledge} />;
  }

  return (
    <>
      <TabNavigator />
      <AutoResearchSurvey />
    </>
  );
}

/**
 * Fires the first-wear usability survey once: the first time a session
 * completes while Research Mode is on and the survey hasn't been taken.
 * Lives at the app root (rather than inside AttackModeScreen) so it isn't
 * tied to which tab happens to be focused when the session ends.
 */
function AutoResearchSurvey() {
  const session = useSession();
  const prevPhase = useRef(session.phase);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const justEnded = prevPhase.current === 'active' && session.phase === 'cooldown';
    prevPhase.current = session.phase;
    if (!justEnded) return;

    (async () => {
      const [researchMode, alreadyDone, allSessions] = await Promise.all([
        settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.researchModeEnabled),
        settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.researchSurveyCompleted),
        sessionsRepo.getAllSessions(),
      ]);
      if (researchMode && !alreadyDone && allSessions.length === 1) {
        setVisible(true);
      }
    })();
  }, [session.phase]);

  return <ResearchSurveyModal visible={visible} onClose={() => setVisible(false)} />;
}

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <SessionProvider>
        <NavigationContainer theme={NAV_THEME}>
          <AppShell />
        </NavigationContainer>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: { flex: 1, backgroundColor: colors.background },
});

export default App;
