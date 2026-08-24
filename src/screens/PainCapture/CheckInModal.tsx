import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberScalePicker } from '../../components';
import { SymptomTagPicker } from './SymptomTagPicker';
import { colors, typography, spacing } from '../../theme';
import type { SymptomTag } from '../../types';

type Props = {
  visible: boolean;
  atMinutes: 30 | 120;
  onSubmit: (rating: number | null, tags: SymptomTag[], skipped: boolean) => void;
  onClose: () => void;
};

/** Follow-up rating — only ever shown when no session is active (see AttackModeScreen gating). */
export function CheckInModal({ visible, atMinutes, onSubmit, onClose }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<SymptomTag[]>([]);

  const label = atMinutes === 30 ? '30-minute check-in' : '2-hour check-in';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <Text style={styles.title}>{label}</Text>
          <Text style={styles.subtitle}>How is your pain now?</Text>
          <NumberScalePicker value={rating} onChange={setRating} />
          <Text style={styles.subtitle}>Anything else going on? (optional)</Text>
          <SymptomTagPicker value={tags} onChange={setTags} />
          <View style={styles.actions}>
            <Pressable style={styles.skip} onPress={() => onSubmit(null, [], true)}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable
              style={[styles.done, rating === null && styles.doneDisabled]}
              onPress={() => rating !== null && onSubmit(rating, tags, false)}
            >
              <Text style={styles.doneText}>Save</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopWidth: 2,
    borderColor: colors.emberDim,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  skip: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { color: colors.textSecondary, fontSize: typography.body, fontFamily: typography.fontFamily },
  done: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.ember,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneDisabled: { borderColor: colors.textDisabled },
  doneText: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '700', fontFamily: typography.fontFamily },
});
