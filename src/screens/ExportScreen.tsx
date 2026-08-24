import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BigButton, SectionCard, WarningBanner } from '../components';
import { MidasForm } from './Export/MidasForm';
import { midasRepo, settingsRepo } from '../db';
import { generateAndShareHeadacheDiaryPdf } from '../services/pdfExport';
import { MIDAS_REMINDER_INTERVAL_MS } from '../services/midas';
import { scheduleMidasReminder } from '../services/notificationService';
import { colors, typography, spacing } from '../theme';
import type { MidasResult } from '../types';

export function ExportScreen() {
  const [latestMidas, setLatestMidas] = useState<MidasResult | null>(null);
  const [midasDue, setMidasDue] = useState(false);
  const [showMidasForm, setShowMidasForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    const [midas, lastCompletedRaw] = await Promise.all([
      midasRepo.getLatestMidasResult(),
      settingsRepo.getSetting(settingsRepo.SETTINGS_KEYS.lastMidasCompletedAt),
    ]);
    setLatestMidas(midas);
    const lastCompleted = lastCompletedRaw ? Number(lastCompletedRaw) : null;
    const dueAt = lastCompleted ? lastCompleted + MIDAS_REMINDER_INTERVAL_MS : 0;
    setMidasDue(Date.now() >= dueAt);
    if (dueAt > Date.now()) scheduleMidasReminder(dueAt);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const generate = async () => {
    setGenerating(true);
    try {
      await generateAndShareHeadacheDiaryPdf();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Export</Text>

        {midasDue ? (
          <WarningBanner text="Your 3-month MIDAS check-in is due." onPress={() => setShowMidasForm(true)} />
        ) : null}

        <SectionCard
          title="Headache diary PDF"
          caption="Headache days per month, mean severity, duration, acute medication days, device usage, and MIDAS — the format a neurologist expects."
        >
          <BigButton label={generating ? 'Generating…' : 'Generate PDF'} onPress={generate} disabled={generating} />
        </SectionCard>

        <SectionCard title="MIDAS assessment" caption="A short questionnaire that tracks migraine-related disability over the last 3 months.">
          {latestMidas ? (
            <Text style={styles.midasSummary}>
              Last score: {latestMidas.totalScore} (Grade {latestMidas.grade}) ·{' '}
              {new Date(latestMidas.completedAt).toLocaleDateString()}
            </Text>
          ) : (
            <Text style={styles.midasSummary}>Not completed yet.</Text>
          )}
          <BigButton label="Complete MIDAS" variant="secondary" onPress={() => setShowMidasForm(true)} />
        </SectionCard>
      </ScrollView>

      <MidasForm visible={showMidasForm} onClose={() => setShowMidasForm(false)} onSaved={load} />
    </SafeAreaView>
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
  midasSummary: { color: colors.textSecondary, fontSize: typography.label, fontFamily: typography.fontFamily, marginBottom: spacing.md },
});
