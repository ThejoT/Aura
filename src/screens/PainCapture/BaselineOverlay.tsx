import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NumberScalePicker } from '../../components';
import { colors, typography, spacing } from '../../theme';

type Props = {
  visible: boolean;
  onSubmit: (pain: number | null) => void;
};

/**
 * Deliberately non-blocking: the relief session has already started by the
 * time this renders (one-tap start is a hard requirement), this just
 * captures where pain was at that moment. Skippable with a single tap.
 */
export function BaselineOverlay({ visible, onSubmit }: Props) {
  const [value, setValue] = useState<number | null>(null);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <Text style={styles.title}>Pain right now?</Text>
          <NumberScalePicker value={value} onChange={setValue} />
          <View style={styles.actions}>
            <Pressable style={styles.skip} onPress={() => onSubmit(null)}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <Pressable
              style={[styles.done, value === null && styles.doneDisabled]}
              onPress={() => value !== null && onSubmit(value)}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
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
    marginBottom: spacing.md,
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
  skipText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
  },
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
  doneDisabled: {
    borderColor: colors.textDisabled,
  },
  doneText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
  },
});
