import { runQuery, runExec } from './database';
import { newId } from '../utils/ids';
import type { MidasResult } from '../types';

function rowToResult(r: any): MidasResult {
  return {
    id: r.id,
    completedAt: r.completed_at,
    q1MissedWork: r.q1,
    q2ReducedWork: r.q2,
    q3MissedHousehold: r.q3,
    q4ReducedHousehold: r.q4,
    q5MissedSocial: r.q5,
    headacheDaysLast3Months: r.headache_days_3mo,
    avgPainLast3Months: r.avg_pain_3mo,
    totalScore: r.total_score,
    grade: r.grade,
  };
}

export async function saveMidasResult(input: Omit<MidasResult, 'id' | 'completedAt'>): Promise<void> {
  await runExec(
    `INSERT INTO midas_results
      (id, completed_at, q1, q2, q3, q4, q5, headache_days_3mo, avg_pain_3mo, total_score, grade)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      Date.now(),
      input.q1MissedWork,
      input.q2ReducedWork,
      input.q3MissedHousehold,
      input.q4ReducedHousehold,
      input.q5MissedSocial,
      input.headacheDaysLast3Months,
      input.avgPainLast3Months,
      input.totalScore,
      input.grade,
    ],
  );
}

export async function getLatestMidasResult(): Promise<MidasResult | null> {
  const rows = await runQuery('SELECT * FROM midas_results ORDER BY completed_at DESC LIMIT 1');
  return rows[0] ? rowToResult(rows[0]) : null;
}

export async function getAllMidasResults(): Promise<MidasResult[]> {
  const rows = await runQuery('SELECT * FROM midas_results ORDER BY completed_at DESC');
  return rows.map(rowToResult);
}
