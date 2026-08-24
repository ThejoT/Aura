import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
};

/** Large +/- stepper — avoids requiring the keyboard for quick daily-log numbers. */
export function Stepper({ label, value, onChange, step = 1, min = 0, max = 24, unit }: Props) {
  const current = value ?? min;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          style={styles.btn}
          onPress={() => onChange(Math.max(min, current - step))}
          hitSlop={8}
          accessibilityLabel={`Decrease ${label}`}
        >
          <Text style={styles.btnText}>–</Text>
        </Pressable>
        <Text style={styles.value}>
          {value === null ? '—' : `${current}${unit ?? ''}`}
        </Text>
        <Pressable
          style={styles.btn}
          onPress={() => onChange(Math.min(max, current + step))}
          hitSlop={8}
          accessibilityLabel={`Increase ${label}`}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: { color: colors.textPrimary, fontSize: typography.body, fontFamily: typography.fontFamily, flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.textPrimary, fontSize: typography.title, fontFamily: typography.fontFamily },
  value: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    minWidth: 56,
    textAlign: 'center',
  },
});
