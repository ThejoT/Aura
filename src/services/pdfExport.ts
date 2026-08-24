import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Share } from 'react-native';
import { diaryRepo, medicationRepo, midasRepo, sessionsRepo } from '../db';
import { buildMonthlySummaries, describeMostUsed } from './exportStats';
import type { MonthlySummary } from './exportStats';
import type { MidasResult } from '../types';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function monthlySummaryRows(summaries: MonthlySummary[]): string {
  return summaries
    .map(
      m => `
      <tr>
        <td>${m.monthKey}</td>
        <td>${m.headacheDayCount}</td>
        <td>${m.meanSeverity !== null ? m.meanSeverity.toFixed(1) : '—'}</td>
        <td>${m.meanDurationHours !== null ? m.meanDurationHours.toFixed(1) + 'h' : '—'}</td>
        <td>${m.triptanComboDays}</td>
        <td>${m.simpleAnalgesicDays}</td>
        <td>${m.sessionCount} (${m.totalDeviceMinutes} min)</td>
      </tr>`,
    )
    .join('');
}

function midasSection(midas: MidasResult | null): string {
  if (!midas) {
    return '<p>No MIDAS assessment completed yet.</p>';
  }
  return `
    <table>
      <tr><td>Total score</td><td>${midas.totalScore}</td></tr>
      <tr><td>Grade</td><td>${midas.grade} of 4</td></tr>
      <tr><td>Completed</td><td>${new Date(midas.completedAt).toLocaleDateString()}</td></tr>
    </table>`;
}

/**
 * Builds a neurologist-facing headache diary PDF and hands it to the OS
 * share sheet so the user can send/print/save it wherever they choose.
 * Everything here reads from local SQLite only — no network call.
 */
export async function generateAndShareHeadacheDiaryPdf(): Promise<void> {
  const [headacheDays, medicationEvents, sessions, latestMidas] = await Promise.all([
    diaryRepo.getAllHeadacheDays(),
    medicationRepo.getAllMedicationEvents(),
    sessionsRepo.getAllSessions(),
    midasRepo.getLatestMidasResult(),
  ]);

  const summaries = buildMonthlySummaries(headacheDays, medicationEvents, sessions);
  const mostUsed = escapeHtml(describeMostUsed(sessions));
  const generatedAt = new Date().toLocaleString();

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          h2 { font-size: 15px; margin-top: 24px; }
          p.meta { color: #555; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background: #f2f2f2; }
          p.disclaimer { font-size: 10px; color: #777; margin-top: 32px; border-top: 1px solid #ccc; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Aura Headache Diary</h1>
        <p class="meta">Generated ${generatedAt} · Local-first data export, no cloud storage</p>

        <h2>Monthly summary</h2>
        <table>
          <tr>
            <th>Month</th><th>Headache days</th><th>Mean severity (0-10)</th><th>Mean duration</th>
            <th>Triptan/combo days</th><th>Simple analgesic days</th><th>Device sessions</th>
          </tr>
          ${monthlySummaryRows(summaries)}
        </table>

        <h2>Device usage</h2>
        <p>Most-used mode and placement: ${mostUsed}</p>

        <h2>MIDAS (Migraine Disability Assessment)</h2>
        ${midasSection(latestMidas)}

        <p class="disclaimer">
          Aura is a wellness device. It does not diagnose or treat migraine. This export reflects
          user-reported and device-logged data only and is not a substitute for clinical evaluation.
        </p>
      </body>
    </html>`;

  const result = await RNHTMLtoPDF.convert({
    html,
    fileName: `aura-headache-diary-${Date.now()}`,
    base64: false,
  });

  if (result.filePath) {
    await Share.share({ url: `file://${result.filePath}`, title: 'Aura Headache Diary' });
  }
}
