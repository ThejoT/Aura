import { runQuery, runExec } from './database';
import { newId } from '../utils/ids';
import type { MedicationCategory, MedicationEvent } from '../types';

function rowToEvent(r: any): MedicationEvent {
  return { id: r.id, date: r.date, category: r.category, name: r.name, loggedAt: r.logged_at };
}

export async function logMedicationEvent(date: string, category: MedicationCategory, name: string | null = null): Promise<void> {
  await runExec('INSERT INTO medication_events (id, date, category, name, logged_at) VALUES (?, ?, ?, ?, ?)', [
    newId(),
    date,
    category,
    name,
    Date.now(),
  ]);
}

export async function deleteMedicationEvent(id: string): Promise<void> {
  await runExec('DELETE FROM medication_events WHERE id = ?', [id]);
}

export async function getMedicationEventsInRange(startDate: string, endDate: string): Promise<MedicationEvent[]> {
  const rows = await runQuery(
    'SELECT * FROM medication_events WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate],
  );
  return rows.map(rowToEvent);
}

export async function getAllMedicationEvents(): Promise<MedicationEvent[]> {
  const rows = await runQuery('SELECT * FROM medication_events ORDER BY date DESC');
  return rows.map(rowToEvent);
}
