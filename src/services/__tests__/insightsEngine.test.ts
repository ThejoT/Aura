import {
  computePerModalityEfficacy,
  computeTimeToReliefDistribution,
  generateRecommendationText,
  MIN_SESSIONS_FOR_CONFIDENCE,
} from '../insightsEngine';
import type { FollowUp, ModeState, Session } from '../../types';

let idCounter = 0;

function makeFollowUp(atMinutes: 30 | 120, rating: number | null, skipped = false): FollowUp {
  return { atMinutes, dueAt: 0, rating, tags: [], skipped, respondedAt: rating !== null ? 1 : null };
}

function makeSession(opts: {
  modes: Partial<ModeState>;
  placement?: Session['placement'];
  baselinePain?: number | null;
  rating30?: number | null;
  rating120?: number | null;
}): Session {
  idCounter += 1;
  const modes: ModeState = { paddles: false, vibration: false, rotation: false, ...opts.modes };
  const followUps: FollowUp[] = [];
  if (opts.rating30 !== undefined) followUps.push(makeFollowUp(30, opts.rating30));
  if (opts.rating120 !== undefined) followUps.push(makeFollowUp(120, opts.rating120));

  return {
    id: `s${idCounter}`,
    startedAt: 0,
    endedAt: 1000,
    durationSec: 1000,
    modes,
    intensities: { paddles: 60, vibration: 60, rotation: 60 },
    placement: opts.placement ?? 'temples',
    quietMode: false,
    baselinePain: opts.baselinePain ?? null,
    stopReason: 'completed',
    followUps,
  };
}

describe('computePerModalityEfficacy', () => {
  it('ignores combined-mode sessions entirely', () => {
    const combined = makeSession({ modes: { paddles: true, vibration: true }, baselinePain: 8, rating120: 2 });
    const rows = computePerModalityEfficacy([combined]);
    expect(rows).toHaveLength(0);
  });

  it('excludes sessions missing a baseline or a 2h rating from the mean, but still counts them as sessions', () => {
    const missingBaseline = makeSession({ modes: { rotation: true }, baselinePain: null, rating120: 2 });
    const missing2h = makeSession({ modes: { rotation: true }, baselinePain: 8, rating120: null });
    const complete = makeSession({ modes: { rotation: true }, baselinePain: 8, rating120: 3 });

    const rows = computePerModalityEfficacy([missingBaseline, missing2h, complete]);
    expect(rows).toHaveLength(1);
    expect(rows[0].totalSessions).toBe(3);
    expect(rows[0].n).toBe(1);
    expect(rows[0].meanDrop).toBe(5); // 8 - 3
  });

  it('a skipped 2h follow-up does not count as a valid rating', () => {
    const skipped: Session = {
      ...makeSession({ modes: { rotation: true }, baselinePain: 8 }),
      followUps: [makeFollowUp(120, null, true)],
    };
    const rows = computePerModalityEfficacy([skipped]);
    expect(rows[0].n).toBe(0);
    expect(rows[0].meanDrop).toBeNull();
  });

  it('is confident only once n reaches the threshold', () => {
    const sessions = Array.from({ length: MIN_SESSIONS_FOR_CONFIDENCE - 1 }, () =>
      makeSession({ modes: { paddles: true }, baselinePain: 8, rating120: 4 }),
    );
    expect(computePerModalityEfficacy(sessions)[0].confident).toBe(false);

    sessions.push(makeSession({ modes: { paddles: true }, baselinePain: 8, rating120: 4 }));
    expect(computePerModalityEfficacy(sessions)[0].confident).toBe(true);
  });
});

describe('generateRecommendationText', () => {
  it('returns null when nothing has reached the confidence threshold', () => {
    const rows = computePerModalityEfficacy([
      makeSession({ modes: { rotation: true }, baselinePain: 9, rating120: 1 }),
    ]);
    expect(generateRecommendationText(rows)).toBeNull();
  });

  it('names the best mode and contrasts against a different modality once confident', () => {
    const rotationSessions = Array.from({ length: MIN_SESSIONS_FOR_CONFIDENCE }, () =>
      makeSession({ modes: { rotation: true }, placement: 'temples', baselinePain: 9, rating120: 1 }),
    ); // drop = 8 (average)
    const vibrationSessions = Array.from({ length: MIN_SESSIONS_FOR_CONFIDENCE }, () =>
      makeSession({ modes: { vibration: true }, placement: 'temples', baselinePain: 5, rating120: 4.5 }),
    ); // drop = 0.5 (average)

    const rows = computePerModalityEfficacy([...rotationSessions, ...vibrationSessions]);
    const text = generateRecommendationText(rows);
    expect(text).toContain('Rotation');
    expect(text).toContain('8.0-point drop');
    expect(text).toContain('Vibration averages 0.5');
    expect(text).toContain('Try Rotation first.');
  });
});

describe('computeTimeToReliefDistribution', () => {
  it('classifies relief by 30 minutes over relief that only shows at 2h', () => {
    const relief30 = makeSession({ modes: { paddles: true }, baselinePain: 8, rating30: 4, rating120: 3 });
    const relief2h = makeSession({ modes: { paddles: true }, baselinePain: 8, rating30: 7, rating120: 4 });
    const noRelief = makeSession({ modes: { paddles: true }, baselinePain: 8, rating30: 7, rating120: 7 });
    const unknown = makeSession({ modes: { paddles: true }, baselinePain: 8 });

    const dist = computeTimeToReliefDistribution([relief30, relief2h, noRelief, unknown]);
    const byBucket = Object.fromEntries(dist.map(d => [d.bucket, d.count]));
    expect(byBucket.relief_by_30min).toBe(1);
    expect(byBucket.relief_by_2h).toBe(1);
    expect(byBucket.no_relief).toBe(1);
    expect(byBucket.unknown).toBe(1);
  });

  it('excludes sessions with no baseline entirely', () => {
    const noBaseline = makeSession({ modes: { paddles: true }, baselinePain: null, rating120: 2 });
    const dist = computeTimeToReliefDistribution([noBaseline]);
    expect(dist.every(d => d.count === 0)).toBe(true);
  });
});
