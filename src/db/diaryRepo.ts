import { runQuery, runExec } from './database';
import type { DiaryEntry, HeadacheDay } from '../types';

interface DiaryRow {
  date: string;
  sleep_hours: number | null;
  caffeine_servings: number | null;
  screen_time_hours: number | null;
  stress: number | null;
  cycle_day: number | null;
  skipped_meals: number;
  pressure_hpa: number | null;
  temperature_c: number | null;
  weather_fetched_at: number | null;
}

function rowToEntry(r: DiaryRow): DiaryEntry {
  return {
    date: r.date,
    sleepHours: r.sleep_hours,
    caffeineServings: r.caffeine_servings,
    screenTimeHours: r.screen_time_hours,
    stress: r.stress,
    cycleDay: r.cycle_day,
    skippedMeals: !!r.skipped_meals,
    pressureHpa: r.pressure_hpa,
    temperatureC: r.temperature_c,
    weatherFetchedAt: r.weather_fetched_at,
  };
}

export async function upsertDiaryEntry(entry: DiaryEntry): Promise<void> {
  await runExec(
    `INSERT INTO diary_entries
      (date, sleep_hours, caffeine_servings, screen_time_hours, stress, cycle_day, skipped_meals,
       pressure_hpa, temperature_c, weather_fetched_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       sleep_hours = excluded.sleep_hours,
       caffeine_servings = excluded.caffeine_servings,
       screen_time_hours = excluded.screen_time_hours,
       stress = excluded.stress,
       cycle_day = excluded.cycle_day,
       skipped_meals = excluded.skipped_meals,
       pressure_hpa = COALESCE(excluded.pressure_hpa, diary_entries.pressure_hpa),
       temperature_c = COALESCE(excluded.temperature_c, diary_entries.temperature_c),
       weather_fetched_at = COALESCE(excluded.weather_fetched_at, diary_entries.weather_fetched_at)`,
    [
      entry.date,
      entry.sleepHours,
      entry.caffeineServings,
      entry.screenTimeHours,
      entry.stress,
      entry.cycleDay,
      entry.skippedMeals ? 1 : 0,
      entry.pressureHpa,
      entry.temperatureC,
      entry.weatherFetchedAt,
    ],
  );
}

export async function getDiaryEntry(date: string): Promise<DiaryEntry | null> {
  const rows = await runQuery<DiaryRow>('SELECT * FROM diary_entries WHERE date = ?', [date]);
  return rows[0] ? rowToEntry(rows[0]) : null;
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const rows = await runQuery<DiaryRow>('SELECT * FROM diary_entries ORDER BY date ASC');
  return rows.map(rowToEntry);
}

export async function countDiaryEntries(): Promise<number> {
  const rows = await runQuery<{ n: number }>('SELECT COUNT(*) as n FROM diary_entries');
  return rows[0]?.n ?? 0;
}

// --- Headache days ---

function rowToHeadacheDay(r: any): HeadacheDay {
  return { date: r.date, severity: r.severity, durationHours: r.duration_hours, notes: r.notes };
}

export async function upsertHeadacheDay(day: HeadacheDay): Promise<void> {
  await runExec(
    `INSERT INTO headache_days (date, severity, duration_hours, notes) VALUES (?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET severity = excluded.severity, duration_hours = excluded.duration_hours, notes = excluded.notes`,
    [day.date, day.severity, day.durationHours, day.notes],
  );
}

export async function deleteHeadacheDay(date: string): Promise<void> {
  await runExec('DELETE FROM headache_days WHERE date = ?', [date]);
}

export async function getHeadacheDaysInRange(startDate: string, endDate: string): Promise<HeadacheDay[]> {
  const rows = await runQuery('SELECT * FROM headache_days WHERE date >= ? AND date <= ? ORDER BY date ASC', [
    startDate,
    endDate,
  ]);
  return rows.map(rowToHeadacheDay);
}

export async function getAllHeadacheDays(): Promise<HeadacheDay[]> {
  const rows = await runQuery('SELECT * FROM headache_days ORDER BY date ASC');
  return rows.map(rowToHeadacheDay);
}
