import { runQuery, runExec } from './database';
import { newId } from '../utils/ids';
import type { ResearchResponse } from '../types';

function rowToResponse(r: any): ResearchResponse {
  return {
    id: r.id,
    createdAt: r.created_at,
    easeOfDonning: r.ease_of_donning,
    comfort: r.comfort,
    perceivedPressure: r.perceived_pressure,
    perceivedSoothing: r.perceived_soothing,
    discreteness: r.discreteness,
    freeText: r.free_text,
  };
}

export async function saveResearchResponse(
  input: Omit<ResearchResponse, 'id' | 'createdAt'>,
): Promise<void> {
  await runExec(
    `INSERT INTO research_responses
      (id, created_at, ease_of_donning, comfort, perceived_pressure, perceived_soothing, discreteness, free_text)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId(),
      Date.now(),
      input.easeOfDonning,
      input.comfort,
      input.perceivedPressure,
      input.perceivedSoothing,
      input.discreteness,
      input.freeText,
    ],
  );
}

export async function getAllResearchResponses(): Promise<ResearchResponse[]> {
  const rows = await runQuery('SELECT * FROM research_responses ORDER BY created_at ASC');
  return rows.map(rowToResponse);
}
