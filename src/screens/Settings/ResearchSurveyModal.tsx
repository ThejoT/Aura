import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton, LikertRow, SectionCard } from '../../components';
import { researchRepo, settingsRepo } from '../../db';
import { colors, typography, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** First-wear usability survey — opt-in via Research Mode, anonymous by construction (no identifiers collected). */
export function ResearchSurveyModal({ visible, onClose }: Props) {
  const [easeOfDonning, setEase] = useState<number | null>(null);
  const [comfort, setComfort] = useState<number | null>(null);
  const [perceivedPressure, setPressure] = useState<number | null>(null);
  const [perceivedSoothing, setSoothing] = useState<number | null>(null);
  const [discreteness, setDiscreteness] = useState<number | null>(null);
  const [freeText, setFreeText] = useState('');

  const allAnswered = [easeOfDonning, comfort, perceivedPressure, perceivedSoothing, discreteness].every(v => v !== null);

  const submit = async () => {
    if (!allAnswered) return;
    await researchRepo.saveResearchResponse({
      easeOfDonning: easeOfDonning as number,
      comfort: comfort as number,
      perceivedPressure: perceivedPressure as number,
      perceivedSoothing: perceivedSoothing as number,
      discreteness: discreteness as number,
      freeText,
    });
    await settingsRepo.setBoolSetting(settingsRepo.SETTINGS_KEYS.researchSurveyCompleted, true);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>First-wear feedback</Text>
          <Text style={styles.subtitle}>
            Anonymous — no name, email, or device ID is collected. Helps expand usability testing beyond
            in-person sessions.
          </Text>

          <SectionCard>
            <LikertRow label="Ease of putting it on" value={easeOfDonning} onChange={setEase} lowLabel="Hard" highLabel="Easy" />
            <LikertRow label="Comfort" value={comfort} onChange={setComfort} lowLabel="Poor" highLabel="Great" />
            <LikertRow label="Perceived pressure" value={perceivedPressure} onChange={setPressure} lowLabel="Too light" highLabel="Too strong" />
            <LikertRow label="Perceived soothing effect" value={perceivedSoothing} onChange={setSoothing} lowLabel="None" highLabel="Strong" />
            <LikertRow label="Discreteness (how noticeable)" value={discreteness} onChange={setDiscreteness} lowLabel="Obvious" highLabel="Discreet" />
          </SectionCard>

          <SectionCard title="Anything else?">
            <TextInput
              style={styles.input}
              multiline
              placeholder="Optional free-text feedback"
              placeholderTextColor={colors.textDisabled}
              value={freeText}
              onChangeText={setFreeText}
            />
          </SectionCard>

          <BigButton label="Submit" onPress={submit} disabled={!allAnswered} />
          <BigButton label="Not now" variant="secondary" onPress={onClose} style={styles.laterBtn} />
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
  input: {
    minHeight: 100,
    borderWidth: 2,
    borderColor: colors.emberDim,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    textAlignVertical: 'top',
  },
  laterBtn: { marginTop: spacing.md },
});
