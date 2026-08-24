import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, typography, spacing, MIN_TOUCH_TARGET } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  subLabel?: string;
  style?: ViewStyle;
  testID?: string;
};

/**
 * The one-tap primary action. No opacity/scale animation on press — a
 * flat, instant state change (border weight) is used instead so nothing
 * moves or flashes on a photophobic screen.
 */
export function BigButton({
  label,
  onPress,
  disabled,
  variant = 'primary',
  subLabel,
  style,
  testID,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>
      {subLabel ? <Text style={styles.subLabel}>{subLabel}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET + 24,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.ember,
  },
  secondary: {
    backgroundColor: colors.background,
    borderColor: colors.emberDim,
  },
  danger: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  disabled: {
    borderColor: colors.textDisabled,
    backgroundColor: colors.background,
  },
  pressed: {
    borderWidth: 3,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.display,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    textAlign: 'center',
  },
  labelDisabled: {
    color: colors.textDisabled,
  },
  subLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.label,
    fontFamily: typography.fontFamily,
  },
});
