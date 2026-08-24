import type { IntensityState, ModeState } from '../types';

/**
 * GATT profile for the Aura ESP32 headband firmware.
 *
 * ASSUMPTION: these UUIDs are a placeholder profile — the actual firmware
 * repo is the source of truth. Update AURA_SERVICE_UUID / CONTROL_CHAR_UUID
 * to match the real firmware before shipping. Battery is read via the
 * standard Bluetooth SIG Battery Service, since a real ESP32 build would
 * reasonably expose that instead of reinventing it.
 */
export const AURA_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const CONTROL_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

export const BATTERY_SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
export const BATTERY_LEVEL_CHARACTERISTIC_UUID = '00002a19-0000-1000-8000-00805f9b34fb';

export const DEVICE_NAME_PREFIX = 'AURA-';

const FLAG_PADDLES = 1 << 0;
const FLAG_VIBRATION = 1 << 1;
const FLAG_ROTATION = 1 << 2;
const FLAG_QUIET_MODE = 1 << 3;

function pct255(pct: number): number {
  return Math.max(0, Math.min(255, Math.round((pct / 100) * 255)));
}

/**
 * Encodes a control command as 4 bytes: [paddlePwm, vibrationPwm, rotationPwm, flags].
 * PWM bytes map the 0-100% intensity sliders to an 8-bit duty cycle; a mode
 * with its flag off should be driven at 0 PWM regardless of slider value,
 * so the firmware never runs an actuator the user didn't enable.
 */
export function encodeControlCommand(modes: ModeState, intensities: IntensityState, quietMode: boolean): Uint8Array {
  let flags = 0;
  if (modes.paddles) flags |= FLAG_PADDLES;
  if (modes.vibration) flags |= FLAG_VIBRATION;
  if (modes.rotation) flags |= FLAG_ROTATION;
  if (quietMode) flags |= FLAG_QUIET_MODE;

  return new Uint8Array([
    modes.paddles ? pct255(intensities.paddles) : 0,
    modes.vibration ? pct255(intensities.vibration) : 0,
    modes.rotation ? pct255(intensities.rotation) : 0,
    flags,
  ]);
}

export const STOP_COMMAND = new Uint8Array([0, 0, 0, 0]);

// Hermes (React Native's default JS engine) provides neither `Buffer` nor
// `btoa`/`atob` globally, so BLE payloads (which react-native-ble-plx moves
// as base64 strings) are encoded/decoded with a small local implementation
// rather than assuming either is present.
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 0x03) << 4) | (b1 === undefined ? 0 : b1 >> 4)];
    out += b1 === undefined ? '=' : B64_CHARS[((b1 & 0x0f) << 2) | (b2 === undefined ? 0 : b2 >> 6)];
    out += b2 === undefined ? '=' : B64_CHARS[b2 & 0x3f];
  }
  return out;
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = B64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}
