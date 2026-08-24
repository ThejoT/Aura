import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  label: string;
  value: number | null; // 1-5
  onChange: (n: number) => void;
  lowLabel?: string;
  highLabel?: string;
};

export function LikertRow({ label, value, onChange, lowLabel, highLabel }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {lowLabel ? <Text style={styles.endLabel}>{lowLabel}</Text> : null}
        {[1, 2, 3, 4, 5].map(n => {
          const active = value === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(n)}
              style={[styles.dot, active && styles.dotActive]}
            >
              <Text style={[styles.num, active && styles.numActive]}>{n}</Text>
            </Pressable>
          );
        })}
        {highLabel ? <Text style={styles.endLabel}>{highLabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  endLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
    width: 48,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.emberDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    borderColor: colors.emberBright,
    backgroundColor: colors.surfaceRaised,
  },
  num: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    fontWeight: '700',
  },
  numActive: {
    color: colors.textPrimary,
  },
});
