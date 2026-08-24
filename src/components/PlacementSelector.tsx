import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing, MIN_TOUCH_TARGET } from '../theme';
import type { Placement } from '../types';

const OPTIONS: { key: Placement; label: string }[] = [
  { key: 'temples', label: 'Temples' },
  { key: 'occipital', label: 'Occipital' },
  { key: 'neck', label: 'Neck' },
  { key: 'wrist', label: 'Wrist' },
];

type Props = {
  value: Placement;
  onChange: (p: Placement) => void;
};

export function PlacementSelector({ value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {OPTIONS.map(opt => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: MIN_TOUCH_TARGET - 12,
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.ember,
    backgroundColor: colors.surfaceRaised,
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
});
