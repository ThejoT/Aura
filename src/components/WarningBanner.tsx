import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  text: string;
  onPress?: () => void;
  onDismiss?: () => void;
};

/** Non-modal, non-animated warning strip — used for MOH flags and pending check-ins. Never blocks input. */
export function WarningBanner({ text, onPress, onDismiss }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.banner} accessibilityRole={onPress ? 'button' : 'text'}>
      <Text style={styles.text}>{text}</Text>
      {onDismiss ? (
        <Pressable onPress={onDismiss} hitSlop={12} style={styles.dismiss}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 2,
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    fontWeight: '600',
  },
  dismiss: {
    marginTop: spacing.sm,
    alignSelf: 'flex-end',
  },
  dismissText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
  },
});
