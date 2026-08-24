import type { DiaryEntry, HeadacheDay } from '../types';

export const MIN_DAYS_FOR_CORRELATION = 60;

export interface CorrelationFactor {
  key: string;
  label: string;
  r: number | null; // Pearson correlation coefficient, -1..1
  n: number;
}

function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  if (denom === 0) return null;
  return num / denom;
}

/**
 * Correlates each numeric diary factor against that day's headache severity
 * (0 for a headache-free day). Framed explicitly as association, not
 * causation, by every caller — this function only computes the number.
 */
export function computeCorrelations(diaryEntries: DiaryEntry[], headacheDays: HeadacheDay[]): CorrelationFactor[] {
  const severityByDate = new Map(headacheDays.map(h => [h.date, h.severity]));

  const sortedEntries = [...diaryEntries].sort((a, b) => (a.date < b.date ? -1 : 1));
  const pressureByDate = new Map(sortedEntries.filter(e => e.pressureHpa !== null).map(e => [e.date, e.pressureHpa as number]));

  const factorExtractors: { key: string; label: string; extract: (e: DiaryEntry) => number | null }[] = [
    { key: 'sleepHours', label: 'Sleep hours', extract: e => e.sleepHours },
    { key: 'caffeineServings', label: 'Caffeine servings', extract: e => e.caffeineServings },
    { key: 'screenTimeHours', label: 'Screen time', extract: e => e.screenTimeHours },
    { key: 'stress', label: 'Stress level', extract: e => e.stress },
    { key: 'skippedMeals', label: 'Skipped meals', extract: e => (e.skippedMeals ? 1 : 0) },
    {
      key: 'pressureChange',
      label: 'Day-over-day pressure change',
      extract: e => {
        const prevDate = new Date(e.date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevKey = prevDate.toISOString().slice(0, 10);
        const prev = pressureByDate.get(prevKey);
        return e.pressureHpa !== null && prev !== undefined ? e.pressureHpa - prev : null;
      },
    },
  ];

  return factorExtractors.map(({ key, label, extract }) => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const entry of diaryEntries) {
      const x = extract(entry);
      if (x === null || x === undefined) continue;
      const y = severityByDate.get(entry.date) ?? 0;
      xs.push(x);
      ys.push(y);
    }
    return { key, label, r: pearson(xs, ys), n: xs.length };
  });
}

export function correlationStrengthLabel(r: number): string {
  const abs = Math.abs(r);
  if (abs >= 0.5) return 'Strong association';
  if (abs >= 0.3) return 'Moderate association';
  if (abs >= 0.1) return 'Weak association';
  return 'No clear association';
}
