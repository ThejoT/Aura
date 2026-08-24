import type { MedicationEvent } from '../types';

export const TRIPTAN_COMBO_THRESHOLD = 10;
export const SIMPLE_ANALGESIC_THRESHOLD = 15;
export const ROLLING_WINDOW_DAYS = 30;

export interface MedicationOveruseStatus {
  triptanComboDays: number;
  simpleAnalgesicDays: number;
  triptanComboOver: boolean;
  simpleAnalgesicOver: boolean;
  triptanComboApproaching: boolean; // within 1 day of the threshold — early nudge
  simpleAnalgesicApproaching: boolean;
  message: string | null;
}

/**
 * Clinical rule for medication overuse headache: triptans + combination
 * analgesics used on 10+ days/month, or simple analgesics (e.g. NSAIDs,
 * paracetamol alone) on 15+ days/month. Counts distinct calendar days, not
 * doses — taking a triptan twice in one day is still one "triptan day".
 */
export function computeMedicationOveruseStatus(
  events: MedicationEvent[],
  now: Date = new Date(),
): MedicationOveruseStatus {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - ROLLING_WINDOW_DAYS);
  const windowStartKey = windowStart.toISOString().slice(0, 10);

  const inWindow = events.filter(e => e.date >= windowStartKey);
  const triptanComboDays = new Set(
    inWindow.filter(e => e.category === 'triptan' || e.category === 'combination_analgesic').map(e => e.date),
  ).size;
  const simpleAnalgesicDays = new Set(
    inWindow.filter(e => e.category === 'simple_analgesic').map(e => e.date),
  ).size;

  const triptanComboOver = triptanComboDays > TRIPTAN_COMBO_THRESHOLD;
  const simpleAnalgesicOver = simpleAnalgesicDays > SIMPLE_ANALGESIC_THRESHOLD;
  const triptanComboApproaching = !triptanComboOver && triptanComboDays >= TRIPTAN_COMBO_THRESHOLD - 1;
  const simpleAnalgesicApproaching = !simpleAnalgesicOver && simpleAnalgesicDays >= SIMPLE_ANALGESIC_THRESHOLD - 1;

  let message: string | null = null;
  if (triptanComboOver) {
    message = `You're at ${triptanComboDays} of ${TRIPTAN_COMBO_THRESHOLD} triptan/combination-analgesic days this month. Frequent use on this many days can itself worsen headaches (medication overuse headache) — this is worth discussing with a clinician. The bandana is a non-medication option today.`;
  } else if (triptanComboApproaching) {
    message = `You're at ${triptanComboDays} of ${TRIPTAN_COMBO_THRESHOLD} triptan/combination-analgesic days this month. The bandana is a non-medication option today.`;
  } else if (simpleAnalgesicOver) {
    message = `You're at ${simpleAnalgesicDays} of ${SIMPLE_ANALGESIC_THRESHOLD} simple-analgesic days this month. This is worth discussing with a clinician. The bandana is a non-medication option today.`;
  } else if (simpleAnalgesicApproaching) {
    message = `You're at ${simpleAnalgesicDays} of ${SIMPLE_ANALGESIC_THRESHOLD} simple-analgesic days this month. The bandana is a non-medication option today.`;
  }

  return {
    triptanComboDays,
    simpleAnalgesicDays,
    triptanComboOver,
    simpleAnalgesicOver,
    triptanComboApproaching,
    simpleAnalgesicApproaching,
    message,
  };
}
