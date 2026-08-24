import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigButton, NumberScalePicker, SectionCard, Stepper } from '../../components';
import { diaryRepo, settingsRepo } from '../../db';
import { fetchCurrentWeather, fetchHistoricalWeather } from '../../services/weatherService';
import { colors, typography, spacing } from '../../theme';
import { toDateKey } from '../../utils/date';
import type { DiaryEntry, HeadacheDay } from '../../types';

type Props = {
  dateKey: string | null;
  onClose: () => void;
  onSaved: () => void;
};

const emptyEntry = (date: string): DiaryEntry => ({
  date,
  sleepHours: null,
  caffeineServings: null,
  screenTimeHours: null,
  stress: null,
  cycleDay: null,
  skippedMeals: false,
  pressureHpa: null,
  temperatureC: null,
  weatherFetchedAt: null,
});

export function DayDetailModal({ dateKey, onClose, onSaved }: Props) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [headache, setHeadache] = useState<HeadacheDay | null>(null);
  const [hasHeadache, setHasHeadache] = useState(false);
  const [trackCycle, setTrackCycle] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!dateKey) return;
    (async () => {
      const [existingEntry, days, cycleEnabled] = await Promise.all([
        diaryRepo.getDiaryEntry(dateKey),
        diaryRepo.getHeadacheDaysInRange(dateKey, dateKey),
        settingsRepo.getBoolSetting(settingsRepo.SETTINGS_KEYS.trackMenstrualCycle),
      ]);
      setEntry(existingEntry ?? emptyEntry(dateKey));
      setHeadache(days[0] ?? { date: dateKey, severity: 5, durationHours: null, notes: null });
      setHasHeadache(!!days[0]);
      setTrackCycle(cycleEnabled);
    })();
  }, [dateKey]);

  if (!dateKey || !entry || !headache) return null;

  const isToday = dateKey === toDateKey();

  const pullWeather = async () => {
    setWeatherLoading(true);
    const reading = isToday ? await fetchCurrentWeather() : await fetchHistoricalWeather(dateKey);
    setWeatherLoading(false);
    if (reading) {
      setEntry(prev =>
        prev ? { ...prev, pressureHpa: reading.pressureHpa, temperatureC: reading.temperatureC, weatherFetchedAt: Date.now() } : prev,
      );
    }
  };

  const save = async () => {
    await diaryRepo.upsertDiaryEntry(entry);
    if (hasHeadache) {
      await diaryRepo.upsertHeadacheDay(headache);
    } else {
      await diaryRepo.deleteHeadacheDay(dateKey);
    }
    onSaved();
    onClose();
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <ScrollView>
            <Text style={styles.title}>{dateKey}</Text>

            <SectionCard title="Headache">
              <View style={styles.switchRow}>
                <Text style={styles.label}>Headache day</Text>
                <Switch
                  value={hasHeadache}
                  onValueChange={setHasHeadache}
                  trackColor={{ false: colors.emberDim, true: colors.ember }}
                  thumbColor={colors.emberBright}
                />
              </View>
              {hasHeadache ? (
                <>
                  <Text style={styles.label}>Severity</Text>
                  <NumberScalePicker value={headache.severity} onChange={n => setHeadache({ ...headache, severity: n })} />
                  <Stepper
                    label="Duration"
                    value={headache.durationHours}
                    onChange={v => setHeadache({ ...headache, durationHours: v })}
                    step={0.5}
                    min={0}
                    max={72}
                    unit="h"
                  />
                </>
              ) : null}
            </SectionCard>

            <SectionCard title="Daily factors">
              <Stepper label="Sleep" value={entry.sleepHours} onChange={v => setEntry({ ...entry, sleepHours: v })} step={0.5} max={16} unit="h" />
              <Stepper label="Caffeine" value={entry.caffeineServings} onChange={v => setEntry({ ...entry, caffeineServings: v })} max={12} unit=" servings" />
              <Stepper label="Screen time" value={entry.screenTimeHours} onChange={v => setEntry({ ...entry, screenTimeHours: v })} step={0.5} max={20} unit="h" />
              <Text style={styles.label}>Stress</Text>
              <NumberScalePicker value={entry.stress} onChange={n => setEntry({ ...entry, stress: n })} min={1} max={5} />
              {trackCycle ? (
                <Stepper label="Cycle day" value={entry.cycleDay} onChange={v => setEntry({ ...entry, cycleDay: v })} max={40} />
              ) : null}
              <View style={styles.switchRow}>
                <Text style={styles.label}>Skipped a meal</Text>
                <Switch
                  value={entry.skippedMeals}
                  onValueChange={v => setEntry({ ...entry, skippedMeals: v })}
                  trackColor={{ false: colors.emberDim, true: colors.ember }}
                  thumbColor={colors.emberBright}
                />
              </View>
            </SectionCard>

            <SectionCard title="Weather" caption="Auto-pulled from your location — a trigger you can't reliably self-report.">
              {entry.pressureHpa !== null ? (
                <Text style={styles.label}>
                  {entry.pressureHpa.toFixed(0)} hPa · {entry.temperatureC?.toFixed(0)}°C
                </Text>
              ) : (
                <Text style={styles.caption}>Not fetched yet</Text>
              )}
              <Pressable style={styles.weatherBtn} onPress={pullWeather}>
                <Text style={styles.weatherBtnText}>{weatherLoading ? 'Fetching…' : 'Pull weather'}</Text>
              </Pressable>
            </SectionCard>

            <BigButton label="Save" onPress={save} />
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopWidth: 2,
    borderColor: colors.emberDim,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
  },
  title: { color: colors.textPrimary, fontSize: typography.title, fontWeight: '700', fontFamily: typography.fontFamily, marginBottom: spacing.md },
  label: { color: colors.textPrimary, fontSize: typography.body, fontFamily: typography.fontFamily, marginBottom: spacing.sm },
  caption: { color: colors.textSecondary, fontSize: typography.caption, fontFamily: typography.fontFamily },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  weatherBtn: {
    marginTop: spacing.sm,
    borderWidth: 2,
    borderColor: colors.emberDim,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  weatherBtnText: { color: colors.textPrimary, fontFamily: typography.fontFamily },
  cancel: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.lg },
  cancelText: { color: colors.textSecondary, fontFamily: typography.fontFamily },
});
