import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, typography, spacing } from '../../theme';
import { toDateKey } from '../../utils/date';
import type { HeadacheDay } from '../../types';

type Props = {
  year: number;
  month: number; // 0-11
  headacheDays: HeadacheDay[];
  onSelectDate: (dateKey: string) => void;
};

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Severity 0-10 maps onto ember opacity steps — same hue as the rest of the app, just darker for lighter days. */
function severityToOpacity(severity: number): number {
  if (severity <= 0) return 0;
  return 0.25 + (severity / 10) * 0.75;
}

export function CalendarHeatmap({ year, month, headacheDays, onSelectDate }: Props) {
  const severityByDate = useMemo(() => new Map(headacheDays.map(d => [d.date, d.severity])), [headacheDays]);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstOfMonth.getDay();
    const out: (string | null)[] = Array(leadingBlanks).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      out.push(toDateKey(new Date(year, month, d)));
    }
    return out;
  }, [year, month]);

  const todayKey = toDateKey();

  return (
    <View>
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text key={i} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((dateKey, i) => {
          if (!dateKey) return <View key={`blank-${i}`} style={styles.cell} />;
          const severity = severityByDate.get(dateKey);
          const opacity = severity !== undefined ? severityToOpacity(severity) : 0;
          const isToday = dateKey === todayKey;
          return (
            <Pressable key={dateKey} style={styles.cell} onPress={() => onSelectDate(dateKey)}>
              <View
                style={[
                  styles.cellFill,
                  { backgroundColor: `rgba(196,106,55,${opacity})` },
                  isToday && styles.cellToday,
                ]}
              >
                <Text style={styles.cellText}>{Number(dateKey.slice(-2))}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    color: colors.textDisabled,
    fontSize: typography.caption,
    fontFamily: typography.fontFamily,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  cellFill: {
    width: CELL_SIZE - 6,
    height: CELL_SIZE - 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: { borderColor: colors.ember, borderWidth: 2 },
  cellText: { color: colors.textSecondary, fontSize: typography.caption, fontFamily: typography.fontFamily },
});
