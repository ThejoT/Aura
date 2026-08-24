import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import type { SymptomTag } from '../../types';

const TAGS: { key: SymptomTag; label: string }[] = [
  { key: 'nausea', label: 'Nausea' },
  { key: 'aura', label: 'Aura' },
  { key: 'photophobia', label: 'Light sensitivity' },
  { key: 'phonophobia', label: 'Sound sensitivity' },
];

type Props = {
  value: SymptomTag[];
  onChange: (tags: SymptomTag[]) => void;
};

export function SymptomTagPicker({ value, onChange }: Props) {
  const toggle = (tag: SymptomTag) => {
    onChange(value.includes(tag) ? value.filter(t => t !== tag) : [...value, tag]);
  };

  return (
    <View style={styles.row}>
      {TAGS.map(t => {
        const active = value.includes(t.key);
        return (
          <Pressable
            key={t.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            onPress={() => toggle(t.key)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 2,
    borderColor: colors.emberDim,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    borderColor: colors.ember,
    backgroundColor: colors.surfaceRaised,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontFamily: typography.fontFamily,
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
