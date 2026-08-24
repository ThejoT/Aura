import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarRow, SectionCard } from '../../components';
import { computeCorrelations, correlationStrengthLabel, MIN_DAYS_FOR_CORRELATION } from '../../services/correlationEngine';
import { colors, typography, spacing } from '../../theme';
import type { DiaryEntry, HeadacheDay } from '../../types';

type Props = {
  diaryEntries: DiaryEntry[];
  headacheDays: HeadacheDay[];
};

export function CorrelationView({ diaryEntries, headacheDays }: Props) {
  if (diaryEntries.length < MIN_DAYS_FOR_CORRELATION) {
    return (
      <SectionCard title="Patterns">
        <Text style={styles.caption}>
          {diaryEntries.length}/{MIN_DAYS_FOR_CORRELATION} days logged — pattern view unlocks at{' '}
          {MIN_DAYS_FOR_CORRELATION} days.
        </Text>
      </SectionCard>
    );
  }

  const factors = computeCorrelations(diaryEntries, headacheDays)
    .filter(f => f.r !== null)
    .sort((a, b) => Math.abs(b.r as number) - Math.abs(a.r as number));

  return (
    <SectionCard
      title="Patterns"
      caption="These are associations in your own data, not proof of cause — worth a conversation with a clinician, not a conclusion on their own."
    >
      {factors.length === 0 ? (
        <Text style={styles.caption}>Not enough paired data yet for any factor.</Text>
      ) : (
        factors.map(f => (
          <View key={f.key} style={styles.row}>
            <BarRow label={f.label} pct={Math.round(Math.abs(f.r as number) * 100)} caption={`${correlationStrengthLabel(f.r as number)} · ${f.r! > 0 ? 'higher = more severe' : 'higher = less severe'} · n=${f.n}`} />
          </View>
        ))
      )}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  caption: { color: colors.textSecondary, fontSize: typography.label, fontFamily: typography.fontFamily },
  row: { marginBottom: spacing.sm },
});
