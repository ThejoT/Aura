import { runQuery, runExec } from './database';
import { newId } from '../utils/ids';
import type { FollowUp, ModeState, IntensityState, Placement, Session, StopReason, SymptomTag } from '../types';

interface SessionRow {
  id: string;
  started_at: number;
  ended_at: number | null;
  duration_sec: number | null;
  paddles_on: number;
  vibration_on: number;
  rotation_on: number;
  paddles_intensity: number;
  vibration_intensity: number;
  rotation_intensity: number;
  placement: Placement;
  quiet_mode: number;
  baseline_pain: number | null;
  stop_reason: StopReason | null;
}

interface FollowUpRow {
  id: string;
  session_id: string;
  at_minutes: 30 | 120;
  due_at: number;
  rating: number | null;
  tags: string;
  skipped: number;
  responded_at: number | null;
}

function rowToFollowUp(r: FollowUpRow): FollowUp {
  return {
    atMinutes: r.at_minutes,
    dueAt: r.due_at,
    rating: r.rating,
    tags: JSON.parse(r.tags) as SymptomTag[],
    skipped: !!r.skipped,
    respondedAt: r.responded_at,
  };
}

async function attachFollowUps(row: SessionRow): Promise<Session> {
  const followUpRows = await runQuery<FollowUpRow>(
    'SELECT * FROM follow_ups WHERE session_id = ? ORDER BY at_minutes ASC',
    [row.id],
  );
  return {
    id: row.id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSec: row.duration_sec,
    modes: {
      paddles: !!row.paddles_on,
      vibration: !!row.vibration_on,
      rotation: !!row.rotation_on,
    },
    intensities: {
      paddles: row.paddles_intensity,
      vibration: row.vibration_intensity,
      rotation: row.rotation_intensity,
    },
    placement: row.placement,
    quietMode: !!row.quiet_mode,
    baselinePain: row.baseline_pain,
    stopReason: row.stop_reason,
    followUps: followUpRows.map(rowToFollowUp),
  };
}

export async function createSession(args: {
  modes: ModeState;
  intensities: IntensityState;
  placement: Placement;
  quietMode: boolean;
}): Promise<Session> {
  const id = newId();
  const startedAt = Date.now();
  await runExec(
    `INSERT INTO sessions (id, started_at, ended_at, duration_sec, paddles_on, vibration_on, rotation_on,
      paddles_intensity, vibration_intensity, rotation_intensity, placement, quiet_mode, baseline_pain, stop_reason)
     VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
    [
      id,
      startedAt,
      args.modes.paddles ? 1 : 0,
      args.modes.vibration ? 1 : 0,
      args.modes.rotation ? 1 : 0,
      args.intensities.paddles,
      args.intensities.vibration,
      args.intensities.rotation,
      args.placement,
      args.quietMode ? 1 : 0,
    ],
  );
  return {
    id,
    startedAt,
    endedAt: null,
    durationSec: null,
    modes: args.modes,
    intensities: args.intensities,
    placement: args.placement,
    quietMode: args.quietMode,
    baselinePain: null,
    stopReason: null,
    followUps: [],
  };
}

export async function setBaselinePain(sessionId: string, pain: number | null): Promise<void> {
  await runExec('UPDATE sessions SET baseline_pain = ? WHERE id = ?', [pain, sessionId]);
}

export async function endSession(
  sessionId: string,
  reason: StopReason,
): Promise<{ endedAt: number; durationSec: number }> {
  const rows = await runQuery<SessionRow>('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!rows[0]) throw new Error('Session not found');
  const endedAt = Date.now();
  const durationSec = Math.round((endedAt - rows[0].started_at) / 1000);
  await runExec('UPDATE sessions SET ended_at = ?, duration_sec = ?, stop_reason = ? WHERE id = ?', [
    endedAt,
    durationSec,
    reason,
    sessionId,
  ]);

  const followUpPlan: { atMinutes: 30 | 120 }[] = [{ atMinutes: 30 }, { atMinutes: 120 }];
  for (const plan of followUpPlan) {
    await runExec(
      `INSERT INTO follow_ups (id, session_id, at_minutes, due_at, rating, tags, skipped, responded_at)
       VALUES (?, ?, ?, ?, NULL, '[]', 0, NULL)`,
      [newId(), sessionId, plan.atMinutes, endedAt + plan.atMinutes * 60_000],
    );
  }

  return { endedAt, durationSec };
}

export async function recordFollowUp(
  sessionId: string,
  atMinutes: 30 | 120,
  rating: number | null,
  tags: SymptomTag[],
  skipped: boolean,
): Promise<void> {
  await runExec(
    `UPDATE follow_ups SET rating = ?, tags = ?, skipped = ?, responded_at = ?
     WHERE session_id = ? AND at_minutes = ?`,
    [rating, JSON.stringify(tags), skipped ? 1 : 0, Date.now(), sessionId, atMinutes],
  );
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const rows = await runQuery<SessionRow>('SELECT * FROM sessions WHERE id = ?', [sessionId]);
  if (!rows[0]) return null;
  return attachFollowUps(rows[0]);
}

export async function getMostRecentSession(): Promise<Session | null> {
  const rows = await runQuery<SessionRow>('SELECT * FROM sessions ORDER BY started_at DESC LIMIT 1');
  if (!rows[0]) return null;
  return attachFollowUps(rows[0]);
}

export async function getAllSessions(): Promise<Session[]> {
  const rows = await runQuery<SessionRow>('SELECT * FROM sessions ORDER BY started_at DESC');
  return Promise.all(rows.map(attachFollowUps));
}

/** Any follow-up whose due time has passed, isn't answered/skipped yet, and is still within a reasonable response window. */
export async function getPendingFollowUps(graceHours = 6): Promise<{ session: Session; followUp: FollowUp }[]> {
  const now = Date.now();
  const rows = await runQuery<FollowUpRow>(
    `SELECT * FROM follow_ups
     WHERE responded_at IS NULL AND skipped = 0 AND due_at <= ? AND due_at >= ?
     ORDER BY due_at ASC`,
    [now, now - graceHours * 60 * 60_000],
  );
  const out: { session: Session; followUp: FollowUp }[] = [];
  for (const row of rows) {
    const session = await getSession(row.session_id);
    if (session) out.push({ session, followUp: rowToFollowUp(row) });
  }
  return out;
}

export async function countSessionsSince(sinceMs: number): Promise<number> {
  const rows = await runQuery<{ n: number }>('SELECT COUNT(*) as n FROM sessions WHERE started_at >= ?', [sinceMs]);
  return rows[0]?.n ?? 0;
}
