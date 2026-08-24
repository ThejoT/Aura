import {
  clampIntensitiesForQuietMode,
  clampModesForQuietMode,
  COOLDOWN_SECONDS,
  elapsedSecondsSince,
  MAX_SESSION_SECONDS,
  QUIET_MODE_PADDLE_CAP_PCT,
  remainingCooldownSeconds,
} from '../sessionEngine';

describe('quiet mode clamping', () => {
  it('forces rotation off in quiet mode, leaves other modes untouched', () => {
    const modes = { paddles: true, vibration: true, rotation: true };
    expect(clampModesForQuietMode(modes, true)).toEqual({ paddles: true, vibration: true, rotation: false });
    expect(clampModesForQuietMode(modes, false)).toEqual(modes);
  });

  it('caps paddle intensity at the quiet-mode ceiling but never raises it', () => {
    const low = { paddles: 20, vibration: 90, rotation: 90 };
    expect(clampIntensitiesForQuietMode(low, true)).toEqual({ paddles: 20, vibration: 90, rotation: 90 });

    const high = { paddles: 90, vibration: 90, rotation: 90 };
    expect(clampIntensitiesForQuietMode(high, true).paddles).toBe(QUIET_MODE_PADDLE_CAP_PCT);
    expect(clampIntensitiesForQuietMode(high, false).paddles).toBe(90);
  });
});

describe('elapsedSecondsSince', () => {
  it('computes whole seconds from wall-clock timestamps, never negative', () => {
    const start = 1_000_000;
    expect(elapsedSecondsSince(start, start)).toBe(0);
    expect(elapsedSecondsSince(start, start + 5_500)).toBe(5);
    expect(elapsedSecondsSince(start, start - 5_000)).toBe(0); // clock skew shouldn't go negative
  });

  it('flags the 20-minute auto-stop boundary correctly', () => {
    const start = 0;
    const justUnder = start + MAX_SESSION_SECONDS * 1000 - 1000;
    const atLimit = start + MAX_SESSION_SECONDS * 1000;
    expect(elapsedSecondsSince(start, justUnder)).toBeLessThan(MAX_SESSION_SECONDS);
    expect(elapsedSecondsSince(start, atLimit)).toBeGreaterThanOrEqual(MAX_SESSION_SECONDS);
  });
});

describe('remainingCooldownSeconds', () => {
  it('counts down to zero and never goes negative', () => {
    const now = 1_000_000;
    const until = now + COOLDOWN_SECONDS * 1000;
    expect(remainingCooldownSeconds(until, now)).toBe(COOLDOWN_SECONDS);
    expect(remainingCooldownSeconds(until, until)).toBe(0);
    expect(remainingCooldownSeconds(until, until + 60_000)).toBe(0);
  });

  it('returns 0 when there is no cooldown in effect', () => {
    expect(remainingCooldownSeconds(null)).toBe(0);
  });
});
