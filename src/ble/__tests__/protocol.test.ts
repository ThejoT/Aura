import { base64ToBytes, bytesToBase64, encodeControlCommand, STOP_COMMAND } from '../protocol';
import type { IntensityState, ModeState } from '../../types';

describe('base64 round-trip', () => {
  it('round-trips arbitrary byte lengths (0, 1, 2, 3 mod 3)', () => {
    const cases = [
      new Uint8Array([]),
      new Uint8Array([255]),
      new Uint8Array([1, 2]),
      new Uint8Array([1, 2, 3]),
      new Uint8Array([0, 0, 0, 0]),
      new Uint8Array([255, 254, 253, 252, 251]),
    ];
    for (const bytes of cases) {
      const encoded = bytesToBase64(bytes);
      const decoded = base64ToBytes(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(bytes));
    }
  });

  it('matches known base64 vectors', () => {
    expect(bytesToBase64(new Uint8Array([72, 101, 108, 108, 111]))).toBe('SGVsbG8=');
    expect(Array.from(base64ToBytes('SGVsbG8='))).toEqual([72, 101, 108, 108, 111]);
  });
});

describe('encodeControlCommand', () => {
  const baseIntensities: IntensityState = { paddles: 100, vibration: 100, rotation: 100 };

  it('zeroes PWM for any mode not enabled, regardless of its slider value', () => {
    const modes: ModeState = { paddles: true, vibration: false, rotation: false };
    const cmd = encodeControlCommand(modes, baseIntensities, false);
    expect(Array.from(cmd)).toEqual([255, 0, 0, 0b0001]);
  });

  it('sets the quiet-mode flag bit without touching PWM bytes', () => {
    const modes: ModeState = { paddles: true, vibration: true, rotation: true };
    const cmd = encodeControlCommand(modes, baseIntensities, true);
    expect(cmd[3]).toBe(0b1111); // paddles | vibration | rotation | quiet
  });

  it('maps 0-100% to a 0-255 PWM byte', () => {
    const modes: ModeState = { paddles: true, vibration: false, rotation: false };
    expect(encodeControlCommand(modes, { paddles: 0, vibration: 0, rotation: 0 }, false)[0]).toBe(0);
    expect(encodeControlCommand(modes, { paddles: 50, vibration: 0, rotation: 0 }, false)[0]).toBe(128);
    expect(encodeControlCommand(modes, { paddles: 100, vibration: 0, rotation: 0 }, false)[0]).toBe(255);
  });

  it('STOP_COMMAND is all-zero', () => {
    expect(Array.from(STOP_COMMAND)).toEqual([0, 0, 0, 0]);
  });
});
