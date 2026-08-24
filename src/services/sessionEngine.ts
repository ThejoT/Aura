import type { IntensityState, ModeState } from '../types';

/** Skin-safety limits from the product spec — not configurable by the user. */
export const MAX_SESSION_SECONDS = 20 * 60;
export const COOLDOWN_SECONDS = 10 * 60;

/** Rotation (the 5V DC motor) is the loudest actuator on the device and is fully disabled in quiet mode. */
export const QUIET_MODE_DISABLED_MODE: keyof ModeState = 'rotation';
/** Paddle servo speed is capped rather than disabled, since paddles are still usable quietly at lower duty cycle. */
export const QUIET_MODE_PADDLE_CAP_PCT = 50;

export function clampModesForQuietMode(modes: ModeState, quietMode: boolean): ModeState {
  if (!quietMode) return modes;
  return { ...modes, [QUIET_MODE_DISABLED_MODE]: false };
}

export function clampIntensitiesForQuietMode(intensities: IntensityState, quietMode: boolean): IntensityState {
  if (!quietMode) return intensities;
  return { ...intensities, paddles: Math.min(intensities.paddles, QUIET_MODE_PADDLE_CAP_PCT) };
}

export function elapsedSecondsSince(startedAt: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

export function remainingCooldownSeconds(cooldownUntil: number | null, now: number = Date.now()): number {
  if (!cooldownUntil) return 0;
  return Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
}
