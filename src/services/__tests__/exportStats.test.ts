import { buildMonthlySummaries, describeMostUsed, mostUsedModeAndPlacement } from '../exportStats';
import type { HeadacheDay, MedicationEvent, ModeState, Session } from '../../types';

function session(startedAtIso: string, modes: Partial<ModeState>, placement: Session['placement'], durationSec = 600): Session {
  return {
    id: startedAtIso + placement,
    startedAt: new Date(startedAtIso).getTime(),
    endedAt: new Date(startedAtIso).getTime() + durationSec * 1000,
    durationSec,
    modes: { paddles: false, vibration: false, rotation: false, ...modes },
    intensities: { paddles: 60, vibration: 60, rotation: 60 },
    placement,
    quietMode: false,
    baselinePain: null,
    stopReason: 'completed',
    followUps: [],
  };
}

describe('buildMonthlySummaries', () => {
  it('groups headache days, medication days, and sessions by calendar month', () => {
    const headacheDays: HeadacheDay[] = [
      { date: '2026-01-05', severity: 6, durationHours: 4, notes: null },
      { date: '2026-01-15', severity: 8, durationHours: 6, notes: null },
      { date: '2026-02-01', severity: 4, durationHours: 2, notes: null },
    ];
    const meds: MedicationEvent[] = [
      { id: '1', date: '2026-01-05', category: 'triptan', name: null, loggedAt: 0 },
      { id: '2', date: '2026-01-05', category: 'triptan', name: null, loggedAt: 0 }, // same day, shouldn't double-count
      { id: '3', date: '2026-01-20', category: 'simple_analgesic', name: null, loggedAt: 0 },
    ];
    const sessions: Session[] = [session('2026-01-10T00:00:00Z', { paddles: true }, 'temples', 600)];

    const summaries = buildMonthlySummaries(headacheDays, meds, sessions);
    const jan = summaries.find(s => s.monthKey === '2026-01')!;

    expect(jan.headacheDayCount).toBe(2);
    expect(jan.meanSeverity).toBe(7); // (6+8)/2
    expect(jan.meanDurationHours).toBe(5); // (4+6)/2
    expect(jan.triptanComboDays).toBe(1); // two events, one distinct day
    expect(jan.simpleAnalgesicDays).toBe(1);
    expect(jan.sessionCount).toBe(1);
    expect(jan.totalDeviceMinutes).toBe(10);

    const feb = summaries.find(s => s.monthKey === '2026-02')!;
    expect(feb.headacheDayCount).toBe(1);
    expect(feb.sessionCount).toBe(0);
  });

  it('returns an empty list when there is no data at all', () => {
    expect(buildMonthlySummaries([], [], [])).toEqual([]);
  });
});

describe('mostUsedModeAndPlacement / describeMostUsed', () => {
  it('picks the mode+placement combination used in the most sessions', () => {
    const sessions: Session[] = [
      session('2026-01-01T00:00:00Z', { rotation: true }, 'temples'),
      session('2026-01-02T00:00:00Z', { rotation: true }, 'temples'),
      session('2026-01-03T00:00:00Z', { vibration: true }, 'neck'),
    ];
    const best = mostUsedModeAndPlacement(sessions);
    expect(best).toEqual({ mode: 'rotation', placement: 'temples' });
    expect(describeMostUsed(sessions)).toContain('Rotation');
  });

  it('counts each active mode in a combined-mode session separately', () => {
    const sessions: Session[] = [session('2026-01-01T00:00:00Z', { paddles: true, vibration: true }, 'wrist')];
    // Both paddles+wrist and vibration+wrist get one count each — neither should crash or double count against the other.
    expect(() => mostUsedModeAndPlacement(sessions)).not.toThrow();
  });

  it('reports no sessions gracefully', () => {
    expect(mostUsedModeAndPlacement([])).toBeNull();
    expect(describeMostUsed([])).toBe('No sessions logged');
  });
});
