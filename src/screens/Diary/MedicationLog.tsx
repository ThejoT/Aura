import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SectionCard, WarningBanner } from '../../components';
import { medicationRepo } from '../../db';
import { useMedicationOveruseStatus } from '../../hooks/useMedicationOveruseStatus';
import {
  SIMPLE_ANALGESIC_THRESHOLD,
  TRIPTAN_COMBO_THRESHOLD,
} from '../../services/medicationOveruseEngine';
import { colors, typography, spacing } from '../../theme';
import { toDateKey } from '../../utils/date';
import type { MedicationCategory, MedicationEvent } from '../../types';

const CATEGORY_LABELS: Record<MedicationCategory, string> = {
  triptan: 'Triptan',
  combination_analgesic: 'Combination analgesic',
  simple_analgesic: 'Simple analgesic',
};

export function MedicationLog() {
  const { status, refresh } = useMedicationOveruseStatus();
  const [recent, setRecent] = useState<MedicationEvent[]>([]);

  const loadRecent = useCallback(async () => {
    const events = await medicationRepo.getAllMedicationEvents();
    setRecent(events.slice(0, 10));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent]),
  );

  const logToday = async (category: MedicationCategory) => {
    await medicationRepo.logMedicationEvent(toDateKey(), category);
    await Promise.all([refresh(), loadRecent()]);
  };

  return (
    <SectionCard title="Acute medication" caption="Logging helps flag medication overuse headache risk early.">
      {status?.message ? <WarningBanner text={status.message} /> : null}

      <View style={styles.quickAddRow}>
        {(Object.keys(CATEGORY_LABELS) as MedicationCategory[]).map(cat => (
          <Pressable key={cat} style={styles.quickAddBtn} onPress={() => logToday(cat)}>
            <Text style={styles.quickAddText}>+ {CATEGORY_LABELS[cat]}</Text>
          </Pressable>
        ))}
      </View>

      {status ? (
        <View style={styles.countsRow}>
          <Text style={styles.count}>
            Triptan/combo: {status.triptanComboDays}/{TRIPTAN_COMBO_THRESHOLD} days
          </Text>
          <Text style={styles.count}>
            Simple analgesic: {status.simpleAnalgesicDays}/{SIMPLE_ANALGESIC_THRESHOLD} days
          </Text>
        </View>
      ) : null}

      {recent.map(e => (
        <View key={e.id} style={styles.eventRow}>
          <Text style={styles.eventText}>
            {e.date} · {CATEGORY_LABELS[e.category]}
          </Text>
          <Pressable
            onPress={async () => {
              await medicationRepo.deleteMedicationEvent(e.id);
              await Promise.all([refresh(), loadRecent()]);
            }}
            hitSlop={8}
          >
            <Text style={styles.remove}>Remove</Text>
          </Pressable>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  quickAddRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  quickAddBtn: {
    borderWidth: 2,
    borderColor: colors.emberDim,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  quickAddText: { color: colors.textPrimary, fontSize: typography.label, fontFamily: typography.fontFamily },
  countsRow: { marginBottom: spacing.sm },
  count: { color: colors.textSecondary, fontSize: typography.label, fontFamily: typography.fontFamily },
  eventRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  eventText: { color: colors.textSecondary, fontSize: typography.caption, fontFamily: typography.fontFamily },
  remove: { color: colors.textDisabled, fontSize: typography.caption, fontFamily: typography.fontFamily },
});
