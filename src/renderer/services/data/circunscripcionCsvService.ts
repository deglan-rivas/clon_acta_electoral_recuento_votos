// Service for loading and managing electoral circumscription CSV data

import { parseCircunscripcionCSV } from '../../utils/circunscripcionUtils';
import type { CircunscripcionRecord } from '../../utils/circunscripcionUtils';
import circunscripcionCsvFile from '/circunscripcion_electoral_por_categoria.csv?url';

/**
 * Loads circumscription electoral data from CSV file
 * @returns Promise with parsed CircunscripcionRecord array
 */
export async function loadCircunscripcionData(): Promise<CircunscripcionRecord[]> {
  try {
    const response = await fetch(circunscripcionCsvFile);
    const text = await response.text();
    return parseCircunscripcionCSV(text);
  } catch (error) {
    console.error('Error loading circunscripción electoral data:', error);
    return [];
  }
}
