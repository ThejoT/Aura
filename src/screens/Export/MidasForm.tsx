import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton, NumberScalePicker, SectionCard, Stepper } from '../../components';
import { midasRepo, settingsRepo } from '../../db';
import { scoreMidas, type MidasAnswers } from '../../services/midas';
import { colors, typography, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

const QUESTIONS: { key: keyof Omit<MidasAnswers, 'avgPainLast3Months'>; label: string }[] = [
  { key: 'q1MissedWork', label: 'Days missed work or school due to headache' },
  { key: 'q2ReducedWork', label: 'Days work/school productivity was halved or more (not already counted)' },
  { key: 'q3MissedHousehold', label: 'Days missed household work due to headache' },
  { key: 'q4ReducedHousehold', label: 'Days household productivity was halved or more (not already counted)' },
  { key: 'q5MissedSocial', label: 'Days missed family, social, or leisure activities' },
  { key: 'headacheDaysLast3Months', label: 'Total days with headache' },
];

export function MidasForm({ visible, onClose, onSaved }: Props) {
  const [answers, setAnswers] = useState<MidasAnswers>({
    q1MissedWork: 0,
    q2ReducedWork: 0,
    q3MissedHousehold: 0,
    q4ReducedHousehold: 0,
    q5MissedSocial: 0,
    headacheDaysLast3Months: 0,
    avgPainLast3Months: 5,
  });

  const save = async () => {
    const { totalScore, grade } = scoreMidas(answers);
    await midasRepo.saveMidasResult({ ...answers, totalScore, grade });
    await settingsRepo.setSetting(settingsRepo.SETTINGS_KEYS.lastMidasCompletedAt, String(Date.now()));
    onSaved();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>MIDAS assessment</Text>
          <Text style={styles.subtitle}>
            Over the last 3 months, on how many days did the following happen? (This isn't a diagnosis — it
            tracks how migraine is affecting your life, for you and your clinician.)
          </Text>

          <SectionCard>
            {QUESTIONS.map(q => (
              <Stepper
                key={q.key}
                label={q.label}
                value={answers[q.key]}
                onChange={v => setAnswers(prev => ({ ...prev, [q.key]: v ?? 0 }))}
                max={90}
              />
            ))}
            <Text style={styles.label}>Average pain intensity (0-10) on headache days</Text>
            <NumberScalePicker
              value={answers.avgPainLast3Months}
              onChange={n => setAnswers(prev => ({ ...prev, avgPainLast3Months: n }))}
            />
          </SectionCard>

          <BigButton label="Save" onPress={save} />
          <BigButton label="Cancel" variant="secondary" onPress={onClose} style={styles.cancelBtn} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '700', fontFamily: typography.fontFamily, marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: typography.label, fontFamily: typography.fontFamily, marginBottom: spacing.lg, lineHeight: 20 },
  label: { color: colors.textPrimary, fontSize: typography.body, fontFamily: typography.fontFamily, marginBottom: spacing.sm },
  cancelBtn: { marginTop: spacing.md },
});
