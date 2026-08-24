import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, typography, spacing, MIN_TOUCH_TARGET } from '../theme';

type Props = {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  disabledReason?: string;
};

/** A large tap target toggle — no switch thumb animation, just a filled/unfilled state. */
export function ModeToggle({ label, active, onToggle, disabled, disabledReason }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: active, disabled: !!disabled }}
      onPress={disabled ? undefined : onToggle}
      style={[
        styles.base,
        active && !disabled && styles.active,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, active && !disabled && styles.labelActive, disabled && styles.labelDisabled]}>
        {label}
      </Text>
      {disabled && disabledReason ? <Text style={styles.reason}>{disabledReason}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flex: 1,
  },
  active: {
    borderColor: colors.ember,
    backgroundColor: colors.surfaceRaised,
  },
  disabled: {
    borderColor: colors.textDisabled,
    opacity: 0.6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily,
  },
  labelActive: {
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
  reason: {
    color: colors.textDisabled,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
    marginTop: 2,
    textAlign: 'center',
  },
});
