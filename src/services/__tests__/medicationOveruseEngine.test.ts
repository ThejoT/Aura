import {
  computeMedicationOveruseStatus,
  SIMPLE_ANALGESIC_THRESHOLD,
  TRIPTAN_COMBO_THRESHOLD,
} from '../medicationOveruseEngine';
import type { MedicationCategory, MedicationEvent } from '../../types';

function event(date: string, category: MedicationCategory): MedicationEvent {
  return { id: date + category, date, category, name: null, loggedAt: 0 };
}

const NOW = new Date('2026-08-24T12:00:00Z');

function dateNDaysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

describe('computeMedicationOveruseStatus', () => {
  it('counts distinct days, not doses — two triptans in one day is one triptan day', () => {
    const events = [event(dateNDaysAgo(1), 'triptan'), event(dateNDaysAgo(1), 'triptan')];
    const status = computeMedicationOveruseStatus(events, NOW);
    expect(status.triptanComboDays).toBe(1);
  });

  it('pools triptan and combination-analgesic days into one threshold', () => {
    const events = [
      event(dateNDaysAgo(1), 'triptan'),
      event(dateNDaysAgo(2), 'combination_analgesic'),
    ];
    const status = computeMedicationOveruseStatus(events, NOW);
    expect(status.triptanComboDays).toBe(2);
  });

  it('flags overuse strictly above the threshold, not at it', () => {
    const atThreshold = Array.from({ length: TRIPTAN_COMBO_THRESHOLD }, (_, i) => event(dateNDaysAgo(i), 'triptan'));
    expect(computeMedicationOveruseStatus(atThreshold, NOW).triptanComboOver).toBe(false);

    const overThreshold = [...atThreshold, event(dateNDaysAgo(TRIPTAN_COMBO_THRESHOLD), 'triptan')];
    expect(computeMedicationOveruseStatus(overThreshold, NOW).triptanComboOver).toBe(true);
  });

  it('uses the higher simple-analgesic threshold independently', () => {
    const events = Array.from({ length: SIMPLE_ANALGESIC_THRESHOLD + 1 }, (_, i) =>
      event(dateNDaysAgo(i), 'simple_analgesic'),
    );
    const status = computeMedicationOveruseStatus(events, NOW);
    expect(status.simpleAnalgesicOver).toBe(true);
    expect(status.triptanComboOver).toBe(false);
  });

  it('ignores events outside the rolling 30-day window', () => {
    const events = [event(dateNDaysAgo(31), 'triptan')];
    const status = computeMedicationOveruseStatus(events, NOW);
    expect(status.triptanComboDays).toBe(0);
  });

  it('produces no message when nothing is close to threshold', () => {
    const status = computeMedicationOveruseStatus([event(dateNDaysAgo(1), 'triptan')], NOW);
    expect(status.message).toBeNull();
  });

  it('produces an early nudge message approaching the threshold, and a stronger one once over', () => {
    const approaching = Array.from({ length: TRIPTAN_COMBO_THRESHOLD - 1 }, (_, i) => event(dateNDaysAgo(i), 'triptan'));
    const approachingStatus = computeMedicationOveruseStatus(approaching, NOW);
    expect(approachingStatus.message).toContain(`${TRIPTAN_COMBO_THRESHOLD - 1} of ${TRIPTAN_COMBO_THRESHOLD}`);

    const over = Array.from({ length: TRIPTAN_COMBO_THRESHOLD + 1 }, (_, i) => event(dateNDaysAgo(i), 'triptan'));
    const overStatus = computeMedicationOveruseStatus(over, NOW);
    expect(overStatus.message).toContain('non-medication option');
  });
});
