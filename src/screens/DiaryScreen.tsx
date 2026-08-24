import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { SectionCard } from '../components';
import { CalendarHeatmap } from './Diary/CalendarHeatmap';
import { DayDetailModal } from './Diary/DayDetailModal';
import { MedicationLog } from './Diary/MedicationLog';
import { CorrelationView } from './Diary/CorrelationView';
import { diaryRepo } from '../db';
import { colors, typography, spacing } from '../theme';
import { formatMonthLabel } from '../utils/date';
import type { DiaryEntry, HeadacheDay } from '../types';

export function DiaryScreen() {
  const [cursor, setCursor] = useState(() => new Date());
  const [monthHeadacheDays, setMonthHeadacheDays] = useState<HeadacheDay[]>([]);
  const [allDiaryEntries, setAllDiaryEntries] = useState<DiaryEntry[]>([]);
  const [allHeadacheDays, setAllHeadacheDays] = useState<HeadacheDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const load = useCallback(async () => {
    const start = new Date(year, month, 1).toISOString().slice(0, 10);
    const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const [monthDays, entries, days] = await Promise.all([
      diaryRepo.getHeadacheDaysInRange(start, end),
      diaryRepo.getAllDiaryEntries(),
      diaryRepo.getAllHeadacheDays(),
    ]);
    setMonthHeadacheDays(monthDays);
    setAllDiaryEntries(entries);
    setAllHeadacheDays(days);
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Diary</Text>

        <SectionCard>
          <View style={styles.monthRow}>
            <Pressable onPress={() => setCursor(new Date(year, month - 1, 1))} hitSlop={12}>
              <Text style={styles.monthNav}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{formatMonthLabel(cursor)}</Text>
            <Pressable onPress={() => setCursor(new Date(year, month + 1, 1))} hitSlop={12}>
              <Text style={styles.monthNav}>›</Text>
            </Pressable>
          </View>
          <CalendarHeatmap year={year} month={month} headacheDays={monthHeadacheDays} onSelectDate={setSelectedDate} />
          <Text style={styles.hint}>Tap a day to log headache severity, daily factors, and weather.</Text>
        </SectionCard>

        <MedicationLog />

        <CorrelationView diaryEntries={allDiaryEntries} headacheDays={allHeadacheDays} />
      </ScrollView>

      <DayDetailModal dateKey={selectedDate} onClose={() => setSelectedDate(null)} onSaved={load} />
    </SafeAreaView>
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
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  monthNav: { color: colors.textPrimary, fontSize: typography.title, fontFamily: typography.fontFamily, paddingHorizontal: spacing.md },
  monthLabel: { color: colors.textPrimary, fontSize: typography.body, fontWeight: '600', fontFamily: typography.fontFamily },
  hint: { color: colors.textDisabled, fontSize: typography.caption, fontFamily: typography.fontFamily, marginTop: spacing.sm },
});
