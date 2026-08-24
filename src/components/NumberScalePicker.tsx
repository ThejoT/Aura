import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  value: number | null;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
};

/** Single-tap 0-10 pain scale. Big numbers, thumb-reachable grid, no drag/slide required. */
export function NumberScalePicker({ value, onChange, min = 0, max = 10 }: Props) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={styles.grid}>
      {numbers.map(n => {
        const active = value === n;
        return (
          <Pressable
            key={n}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(n)}
            style={[styles.cell, active && styles.cellActive]}
          >
            <Text style={[styles.num, active && styles.numActive]}>{n}</Text>
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
    justifyContent: 'center',
  },
  cell: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: colors.emberBright,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 3,
  },
  num: {
    color: colors.textSecondary,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
  },
  numActive: {
    color: colors.textPrimary,
  },
});
