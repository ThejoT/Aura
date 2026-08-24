import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BarRow, SectionCard } from '../components';
import { sessionsRepo } from '../db';
import {
  computePerModalityEfficacy,
  computeTimeToReliefDistribution,
  generateRecommendationText,
  MIN_SESSIONS_FOR_CONFIDENCE,
  MODE_LABELS,
  PLACEMENT_LABELS,
  type EfficacyRow,
  type TimeToReliefDistribution,
} from '../services/insightsEngine';
import { colors, typography, spacing } from '../theme';
import type { Session } from '../types';

const RELIEF_BUCKET_LABELS: Record<TimeToReliefDistribution['bucket'], string> = {
  relief_by_30min: 'Relief within 30 min',
  relief_by_2h: 'Relief by 2 hours',
  no_relief: 'No meaningful relief by 2h',
  unknown: 'No follow-up data',
};

export function InsightsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(
    useCallback(() => {
      sessionsRepo.getAllSessions().then(setSessions);
    }, []),
  );

  const efficacyRows = computePerModalityEfficacy(sessions);
  const recommendation = generateRecommendationText(efficacyRows);
  const distribution = computeTimeToReliefDistribution(sessions);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Insights</Text>

        {recommendation ? (
          <SectionCard title="What's working">
            <Text style={styles.recommendation}>{recommendation}</Text>
          </SectionCard>
        ) : (
          <SectionCard title="What's working">
            <Text style={styles.caveat}>
              Not enough data yet. A recommendation appears once any mode/placement combination has
              {' '}{MIN_SESSIONS_FOR_CONFIDENCE}+ sessions with both a baseline and 2-hour rating.
            </Text>
          </SectionCard>
        )}

        <SectionCard title="Per-modality efficacy" caption="Mean point-drop at 2 hours. Single-mode sessions only, so results aren't confounded by combined use.">
          {efficacyRows.length === 0 ? (
            <Text style={styles.caveat}>No single-mode sessions logged yet.</Text>
          ) : (
            efficacyRows.map(row => <EfficacyRowView key={`${row.mode}-${row.placement}`} row={row} />)
          )}
        </SectionCard>

        <SectionCard title="Time-to-relief" caption="Based on your 30-minute and 2-hour check-ins.">
          {distribution.every(d => d.count === 0) ? (
            <Text style={styles.caveat}>No check-in data yet.</Text>
          ) : (
            distribution
              .filter(d => d.count > 0)
              .map(d => <BarRow key={d.bucket} label={RELIEF_BUCKET_LABELS[d.bucket]} pct={d.pct} caption={`${d.count} session${d.count === 1 ? '' : 's'}`} />)
          )}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function EfficacyRowView({ row }: { row: EfficacyRow }) {
  return (
    <View style={styles.efficacyRow}>
      <Text style={styles.efficacyLabel}>
        {MODE_LABELS[row.mode]} · {PLACEMENT_LABELS[row.placement]}
      </Text>
      {row.meanDrop !== null ? (
        <Text style={styles.efficacyValue}>{row.meanDrop.toFixed(1)}-pt drop</Text>
      ) : (
        <Text style={styles.caveat}>No paired ratings yet</Text>
      )}
      <Text style={styles.efficacyN}>
        n={row.n}
        {!row.confident ? ` — need ${MIN_SESSIONS_FOR_CONFIDENCE - row.n} more for confidence` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageTitle: {
    color: colors.textPrimary,
    fontSize: typography.title,
    fontWeight: '700',
    fontFamily: typography.fontFamily,
    marginBottom: spacing.lg,
  },
  recommendation: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    lineHeight: 24,
  },
  caveat: {
    color: colors.textSecondary,
    fontSize: typography.label,
    fontFamily: typography.fontFamily,
  },
  efficacyRow: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  efficacyLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: typography.fontFamily,
  },
  efficacyValue: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontFamily: typography.fontFamily,
    marginTop: 2,
  },
  efficacyN: {
    color: colors.textDisabled,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
    marginTop: 2,
  },
});
