import { Share } from 'react-native';
import { researchRepo } from '../db';

/**
 * Anonymized by construction: ResearchResponse never stores a name, email,
 * or device identifier (see the schema), so this export is just the raw
 * response rows as CSV, handed to the OS share sheet.
 */
export async function shareAnonymizedResearchExport(): Promise<void> {
  const responses = await researchRepo.getAllResearchResponses();
  const header = 'created_at,ease_of_donning,comfort,perceived_pressure,perceived_soothing,discreteness,free_text';
  const rows = responses.map(r => {
    const safeFreeText = `"${r.freeText.replace(/"/g, '""')}"`;
    return [
      new Date(r.createdAt).toISOString(),
      r.easeOfDonning,
      r.comfort,
      r.perceivedPressure,
      r.perceivedSoothing,
      r.discreteness,
      safeFreeText,
    ].join(',');
  });
  const csv = [header, ...rows].join('\n');
  await Share.share({ message: csv, title: 'Aura anonymized research export' });
}
