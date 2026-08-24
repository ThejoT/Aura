import type { HeadacheDay, MedicationEvent, ModeKey, Placement, Session } from '../types';
import { MODE_LABELS, PLACEMENT_LABELS } from './insightsEngine';

export interface MonthlySummary {
  monthKey: string; // YYYY-MM
  headacheDayCount: number;
  meanSeverity: number | null;
  meanDurationHours: number | null;
  triptanComboDays: number;
  simpleAnalgesicDays: number;
  sessionCount: number;
  totalDeviceMinutes: number;
}

function monthKeyOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function buildMonthlySummaries(
  headacheDays: HeadacheDay[],
  medicationEvents: MedicationEvent[],
  sessions: Session[],
): MonthlySummary[] {
  const months = new Set<string>();
  headacheDays.forEach(d => months.add(monthKeyOf(d.date)));
  medicationEvents.forEach(e => months.add(monthKeyOf(e.date)));
  sessions.forEach(s => months.add(monthKeyOf(new Date(s.startedAt).toISOString())));

  return Array.from(months)
    .sort()
    .map(monthKey => {
      const daysInMonth = headacheDays.filter(d => monthKeyOf(d.date) === monthKey);
      const medsInMonth = medicationEvents.filter(e => monthKeyOf(e.date) === monthKey);
      const sessionsInMonth = sessions.filter(s => monthKeyOf(new Date(s.startedAt).toISOString()) === monthKey);

      const severities = daysInMonth.map(d => d.severity);
      const durations = daysInMonth.filter(d => d.durationHours !== null).map(d => d.durationHours as number);

      const triptanComboDays = new Set(
        medsInMonth.filter(e => e.category === 'triptan' || e.category === 'combination_analgesic').map(e => e.date),
      ).size;
      const simpleAnalgesicDays = new Set(
        medsInMonth.filter(e => e.category === 'simple_analgesic').map(e => e.date),
      ).size;

      const totalDeviceMinutes = sessionsInMonth.reduce((sum, s) => sum + (s.durationSec ?? 0) / 60, 0);

      return {
        monthKey,
        headacheDayCount: daysInMonth.length,
        meanSeverity: severities.length ? severities.reduce((a, b) => a + b, 0) / severities.length : null,
        meanDurationHours: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
        triptanComboDays,
        simpleAnalgesicDays,
        sessionCount: sessionsInMonth.length,
        totalDeviceMinutes: Math.round(totalDeviceMinutes),
      };
    });
}

export function mostUsedModeAndPlacement(sessions: Session[]): { mode: ModeKey; placement: Placement } | null {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    (Object.keys(s.modes) as ModeKey[])
      .filter(k => s.modes[k])
      .forEach(mode => {
        const key = `${mode}::${s.placement}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
  }
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  if (!best) return null;
  const [mode, placement] = best.key.split('::') as [ModeKey, Placement];
  return { mode, placement };
}

export function describeMostUsed(sessions: Session[]): string {
  const best = mostUsedModeAndPlacement(sessions);
  if (!best) return 'No sessions logged';
  return `${MODE_LABELS[best.mode]} at ${PLACEMENT_LABELS[best.placement]}`;
}
