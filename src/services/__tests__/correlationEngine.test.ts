import { computeCorrelations, correlationStrengthLabel, MIN_DAYS_FOR_CORRELATION } from '../correlationEngine';
import type { DiaryEntry, HeadacheDay } from '../../types';

function emptyEntry(date: string, overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
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
    ...overrides,
  };
}

describe('computeCorrelations', () => {
  it('finds a strong positive correlation between stress and headache severity', () => {
    const entries: DiaryEntry[] = [
      emptyEntry('2026-01-01', { stress: 1 }),
      emptyEntry('2026-01-02', { stress: 2 }),
      emptyEntry('2026-01-03', { stress: 3 }),
      emptyEntry('2026-01-04', { stress: 4 }),
      emptyEntry('2026-01-05', { stress: 5 }),
    ];
    const headacheDays: HeadacheDay[] = [
      { date: '2026-01-01', severity: 1, durationHours: null, notes: null },
      { date: '2026-01-02', severity: 3, durationHours: null, notes: null },
      { date: '2026-01-03', severity: 5, durationHours: null, notes: null },
      { date: '2026-01-04', severity: 7, durationHours: null, notes: null },
      { date: '2026-01-05', severity: 9, durationHours: null, notes: null },
    ];
    const factors = computeCorrelations(entries, headacheDays);
    const stress = factors.find(f => f.key === 'stress')!;
    expect(stress.r).not.toBeNull();
    expect(stress.r as number).toBeGreaterThan(0.99);
  });

  it('treats a day with no logged headache as severity 0, not missing', () => {
    const entries: DiaryEntry[] = [
      emptyEntry('2026-01-01', { sleepHours: 4 }),
      emptyEntry('2026-01-02', { sleepHours: 8 }),
    ];
    // No headache_days rows at all — both days should be treated as severity 0.
    const factors = computeCorrelations(entries, []);
    const sleep = factors.find(f => f.key === 'sleepHours')!;
    expect(sleep.n).toBe(2);
  });

  it('returns null r for a factor with fewer than 3 paired data points', () => {
    const entries: DiaryEntry[] = [emptyEntry('2026-01-01', { sleepHours: 4 })];
    const factors = computeCorrelations(entries, []);
    expect(factors.find(f => f.key === 'sleepHours')!.r).toBeNull();
  });
});

describe('correlationStrengthLabel', () => {
  it('buckets by magnitude regardless of sign', () => {
    expect(correlationStrengthLabel(0.6)).toBe('Strong association');
    expect(correlationStrengthLabel(-0.6)).toBe('Strong association');
    expect(correlationStrengthLabel(0.35)).toBe('Moderate association');
    expect(correlationStrengthLabel(0.15)).toBe('Weak association');
    expect(correlationStrengthLabel(0.05)).toBe('No clear association');
  });
});

it('MIN_DAYS_FOR_CORRELATION matches the spec (60 days)', () => {
  expect(MIN_DAYS_FOR_CORRELATION).toBe(60);
});
