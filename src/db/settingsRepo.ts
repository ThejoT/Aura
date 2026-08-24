import { runQuery, runExec } from './database';

export const SETTINGS_KEYS = {
  firstLaunchAcked: 'first_launch_acked',
  quietModeDefault: 'quiet_mode_default',
  researchModeEnabled: 'research_mode_enabled',
  researchSurveyCompleted: 'research_survey_completed',
  trackMenstrualCycle: 'track_menstrual_cycle',
  notificationsEnabled: 'notifications_enabled',
  lastMidasCompletedAt: 'last_midas_completed_at',
  cooldownUntil: 'cooldown_until',
} as const;

export async function getSetting(key: string): Promise<string | null> {
  const rows = await runQuery<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await runExec('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', [
    key,
    value,
    value,
  ]);
}

export async function getBoolSetting(key: string, fallback = false): Promise<boolean> {
  const v = await getSetting(key);
  if (v === null) return fallback;
  return v === '1';
}

export async function setBoolSetting(key: string, value: boolean): Promise<void> {
  await setSetting(key, value ? '1' : '0');
}
