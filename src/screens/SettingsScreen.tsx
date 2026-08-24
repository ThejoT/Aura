import React, { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, SafetyDisclaimer, SectionCard } from '../components';
import { ResearchSurveyModal } from './Settings/ResearchSurveyModal';
import { getDb, settingsRepo } from '../db';
import { bleService } from '../ble';
import { requestNotificationPermission } from '../services/notificationService';
import { shareAnonymizedResearchExport } from '../services/researchExport';
import { colors, typography, spacing } from '../theme';

export function SettingsScreen() {
  const [researchMode, setResearchMode] = useState(false);
  const [trackCycle, setTrackCycle] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [simulateDevice, setSimulateDeviceState] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);

  const load = useCallback(async () => {
    const [research, cycle, notifs, simulate] = await Promise.all([
      settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.researchModeEnabled),
      settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.trackMenstrualCycle),
      settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.notificationsEnabled),
      settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.simulateDevice),
    ]);
    setResearchMode(research);
    setTrackCycle(cycle);
    setNotificationsEnabled(notifs);
    setSimulateDeviceState(simulate);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleResearchMode = async (on: boolean) => {
    setResearchMode(on);
    await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.researchModeEnabled, on);
  };

  const toggleCycle = async (on: boolean) => {
    setTrackCycle(on);
    await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.trackMenstrualCycle, on);
  };

  const toggleNotifications = async (on: boolean) => {
    if (on) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.notificationsEnabled, granted);
      return;
    }
    setNotificationsEnabled(false);
    await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.notificationsEnabled, false);
  };

  const toggleSimulateDevice = async (on: boolean) => {
    setSimulateDeviceState(on);
    await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.simulateDevice, on);
    await bleService.setSimulationMode(on);
  };

  const confirmClearData = () => {
    Alert.alert(
      'Clear all data',
      'This permanently deletes every session, diary entry, and rating stored on this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear everything', style: 'destructive', onPress: clearAllData },
      ],
    );
  };

  const clearAllData = async () => {
    const db = await getDb();
    const tables = [
      'follow_ups',
      'sessions',
      'headache_days',
      'diary_entries',
      'medication_events',
      'research_responses',
      'midas_results',
    ];
    await db.transaction(tx => {
      tables.forEach(t => tx.executeSql(`DELETE FROM ${t}`));
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        <SectionCard title="Research mode" caption="Opt-in. Anonymous first-wear usability survey and an anonymized export, to help expand testing beyond in-person sessions.">
          <Row label="Enable research mode" value={researchMode} onChange={toggleResearchMode} />
          {researchMode ? (
            <>
              <BigButton label="Take first-wear survey" variant="secondary" onPress={() => setShowSurvey(true)} style={styles.spacedBtn} />
              <BigButton label="Share anonymized export" variant="secondary" onPress={shareAnonymizedResearchExport} style={styles.spacedBtn} />
            </>
          ) : null}
        </SectionCard>

        <SectionCard title="Diary">
          <Row label="Track menstrual cycle day" value={trackCycle} onChange={toggleCycle} />
        </SectionCard>

        <SectionCard title="Notifications">
          <Row label="Pain check-in & MIDAS reminders" value={notificationsEnabled} onChange={toggleNotifications} />
        </SectionCard>

        <SectionCard
          title="Device"
          caption="No headband yet? Simulate one to try Attack Mode — connect, start a session, and see battery/connection status — without real hardware. Turn this off once you have a real headband to pair."
        >
          <Row label="Simulate headband" value={simulateDevice} onChange={toggleSimulateDevice} />
        </SectionCard>

        <SectionCard title="About">
          <BigButton label="Safety information" variant="secondary" onPress={() => setShowSafety(true)} />
        </SectionCard>

        <SectionCard title="Data">
          <Text style={styles.dataNote}>
            All data stays on this device. Nothing syncs to a server unless you explicitly export it.
          </Text>
          <BigButton label="Clear all data" variant="danger" onPress={confirmClearData} />
        </SectionCard>
      </ScrollView>

      <Modal visible={showSafety} animationType="none" onRequestClose={() => setShowSafety(false)}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.pageTitle}>Safety information</Text>
            <SafetyDisclaimer />
            <BigButton label="Close" onPress={() => setShowSafety(false)} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <ResearchSurveyModal visible={showSurvey} onClose={() => setShowSurvey(false)} />
    </SafeAreaView>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.emberDim, true: colors.ember }} thumbColor={colors.emberBright} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    marginBottom: spacing.lg,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  rowLabel: { color: colors.textPrimary, fontSize: typography.body, fontFamily: typography.fontFamily, flex: 1, paddingRight: spacing.md },
  spacedBtn: { marginTop: spacing.sm },
  dataNote: { color: colors.textSecondary, fontSize: typography.caption, fontFamily: typography.fontFamily, marginBottom: spacing.md },
});
