import type { ModeKey, Placement, Session } from '../types';

export const MIN_SESSIONS_FOR_CONFIDENCE = 10;
export const MEANINGFUL_RELIEF_POINTS = 3;

export const MODE_LABELS: Record<ModeKey, string> = {
  paddles: 'Paddles',
  vibration: 'Vibration',
  rotation: 'Rotation',
};

export const PLACEMENT_LABELS: Record<Placement, string> = {
  temples: 'your temples',
  occipital: 'the back of your head',
  neck: 'your neck',
  wrist: 'your wrist',
};

export interface EfficacyRow {
  mode: ModeKey;
  placement: Placement;
  n: number; // sessions with a valid baseline -> 2h-rating pair
  totalSessions: number; // all single-mode sessions logged for this combo, regardless of data completeness
  meanDrop: number | null;
  confident: boolean;
}

function isSingleMode(session: Session): ModeKey | null {
  const active = (Object.keys(session.modes) as ModeKey[]).filter(k => session.modes[k]);
  return active.length === 1 ? active[0] : null;
}

function get2hRating(session: Session): number | null {
  const fu = session.followUps.find(f => f.atMinutes === 120);
  if (!fu || fu.skipped || fu.rating === null) return null;
  return fu.rating;
}

function get30MinRating(session: Session): number | null {
  const fu = session.followUps.find(f => f.atMinutes === 30);
  if (!fu || fu.skipped || fu.rating === null) return null;
  return fu.rating;
}

export function computePerModalityEfficacy(sessions: Session[]): EfficacyRow[] {
  const groups = new Map<string, Session[]>();
  for (const session of sessions) {
    const mode = isSingleMode(session);
    if (!mode) continue;
    const key = `${mode}::${session.placement}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(session);
  }

  const rows: EfficacyRow[] = [];
  for (const [key, groupSessions] of groups) {
    const [mode, placement] = key.split('::') as [ModeKey, Placement];
    const drops: number[] = [];
    for (const s of groupSessions) {
      if (s.baselinePain === null) continue;
      const rating2h = get2hRating(s);
      if (rating2h === null) continue;
      drops.push(s.baselinePain - rating2h);
    }
    const meanDrop = drops.length > 0 ? drops.reduce((a, b) => a + b, 0) / drops.length : null;
    rows.push({
      mode,
      placement,
      n: drops.length,
      totalSessions: groupSessions.length,
      meanDrop,
      confident: drops.length >= MIN_SESSIONS_FOR_CONFIDENCE,
    });
  }

  return rows.sort((a, b) => (b.meanDrop ?? -Infinity) - (a.meanDrop ?? -Infinity));
}

/**
 * Only ever produces a sentence once at least one mode/placement pair has
 * n >= MIN_SESSIONS_FOR_CONFIDENCE valid baseline->2h pairs — this is the
 * app's one hard "honest uncertainty" rule for Insights.
 */
export function generateRecommendationText(rows: EfficacyRow[]): string | null {
  const confidentSorted = rows
    .filter(r => r.confident && r.meanDrop !== null)
    .sort((a, b) => (b.meanDrop as number) - (a.meanDrop as number));

  if (confidentSorted.length === 0) return null;

  const best = confidentSorted[0];
  const contrast = confidentSorted.find(r => r.mode !== best.mode);

  let sentence = `${MODE_LABELS[best.mode]} at ${PLACEMENT_LABELS[best.placement]} averages a ${(best.meanDrop as number).toFixed(1)}-point drop.`;
  if (contrast) {
    sentence += ` ${MODE_LABELS[contrast.mode]} averages ${(contrast.meanDrop as number).toFixed(1)}.`;
  }
  sentence += ` Try ${MODE_LABELS[best.mode]} first.`;
  return sentence;
}

export type ReliefBucket = 'relief_by_30min' | 'relief_by_2h' | 'no_relief' | 'unknown';

export interface TimeToReliefDistribution {
  bucket: ReliefBucket;
  count: number;
  pct: number;
}

/** Buckets by the two sample points we actually have (30 min, 2 h) — not a continuous curve. */
export function computeTimeToReliefDistribution(sessions: Session[]): TimeToReliefDistribution[] {
  const withBaseline = sessions.filter(s => s.baselinePain !== null);
  const counts: Record<ReliefBucket, number> = {
    relief_by_30min: 0,
    relief_by_2h: 0,
    no_relief: 0,
    unknown: 0,
  };

  for (const s of withBaseline) {
    const baseline = s.baselinePain as number;
    const r30 = get30MinRating(s);
    const r120 = get2hRating(s);

    if (r30 !== null && baseline - r30 >= MEANINGFUL_RELIEF_POINTS) {
      counts.relief_by_30min++;
    } else if (r120 !== null && baseline - r120 >= MEANINGFUL_RELIEF_POINTS) {
      counts.relief_by_2h++;
    } else if (r30 !== null && r120 !== null) {
      counts.no_relief++;
    } else {
      counts.unknown++;
    }
  }

  const total = withBaseline.length || 1;
  return (Object.keys(counts) as ReliefBucket[]).map(bucket => ({
    bucket,
    count: counts[bucket],
    pct: Math.round((counts[bucket] / total) * 100),
  }));
}
