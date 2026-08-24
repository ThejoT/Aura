import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../theme';

type Props = {
  label: string;
  pct: number; // 0-100
  caption?: string;
};

/** Flat, non-animated horizontal bar — used for distributions, kept inside the ember palette. */
export function BarRow({ label, pct, caption }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, pct))}%` }]} />
      </View>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  label: { color: colors.textPrimary, fontSize: typography.label, fontFamily: typography.fontFamily },
  pct: { color: colors.textSecondary, fontSize: typography.label, fontFamily: typography.fontFamily },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.emberMuted,
  },
  caption: { color: colors.textDisabled, fontSize: typography.caption, fontFamily: typography.fontFamily, marginTop: 2 },
});
