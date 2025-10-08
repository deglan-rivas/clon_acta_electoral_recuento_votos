// Hook for managing electoral circumscription data

import { useState, useEffect } from 'react';
import { loadCircunscripcionData } from '../services/data/circunscripcionCsvService';
import { type CircunscripcionRecord } from '../utils/circunscripcionUtils';

/**
 * Loads circumscription electoral data from CSV when modal opens
 * @param open - Whether the modal is open
 * @returns Array of CircunscripcionRecord
 */
export function useCircunscripcionData(open: boolean): CircunscripcionRecord[] {
  const [circunscripcionData, setCircunscripcionData] = useState<CircunscripcionRecord[]>([]);

  useEffect(() => {
    if (open) {
      loadCircunscripcionData().then(setCircunscripcionData);
    }
  }, [open]);

  return circunscripcionData;
}
