// Utility functions for electoral circumscription operations

export type CircunscripcionRecord = {
  category: string;
  departamento: string;
  provincia: string;
  circunscripcion_electoral: string;
};

/**
 * Parses CSV text into CircunscripcionRecord array
 */
export function parseCircunscripcionCSV(csvText: string): CircunscripcionRecord[] {
  const lines = csvText.split('\n').slice(1); // Skip header

  return lines
    .filter(line => line.trim())
    .map(line => {
      const [category, circunscripcion_electoral] = line.split(';');
      return {
        category: category?.trim() || '',
        departamento: '', // Not used in this CSV
        provincia: '', // Not used in this CSV
        circunscripcion_electoral: circunscripcion_electoral?.trim() || ''
      };
    });
}

/**
 * Gets unique circumscriptions filtered by category
 * If category exists in data, returns records for that category only
 * If category doesn't exist, returns records with empty category (regional)
 */
export function getUniqueCircunscripcionesByCategory(
  data: CircunscripcionRecord[],
  category: string
): string[] {
  // Check if current category exists in CSV
  const categoryExists = data.some(record => record.category === category);

  let filteredRecords: CircunscripcionRecord[];

  if (categoryExists) {
    // Category found - show only records for this category
    filteredRecords = data.filter(record => record.category === category);
  } else {
    // Category not found - show all records with empty category (regional)
    filteredRecords = data.filter(record => record.category === '');
  }

  const unique = Array.from(new Set(
    filteredRecords
      .map(record => record.circunscripcion_electoral)
      .filter(circunscripcion => circunscripcion !== '')
  ));

  return unique.sort();
}
