import { useCallback, useEffect, useState } from 'react';
import { medicationRepo } from '../db';
import { computeMedicationOveruseStatus, MedicationOveruseStatus } from '../services/medicationOveruseEngine';
import { toDateKey, daysAgo } from '../utils/date';

export function useMedicationOveruseStatus() {
  const [status, setStatus] = useState<MedicationOveruseStatus | null>(null);

  const refresh = useCallback(async () => {
    const events = await medicationRepo.getMedicationEventsInRange(toDateKey(daysAgo(35)), toDateKey());
    setStatus(computeMedicationOveruseStatus(events));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, refresh };
}
