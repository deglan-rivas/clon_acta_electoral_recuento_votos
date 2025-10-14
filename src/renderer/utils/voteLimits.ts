// Utility to load preferential vote limits from CSV
import limiteCsvFile from '/limite_voto_preferencial_por_categoria.csv?url';

export interface VoteLimits {
  preferential1: number;
  preferential2: number;
}

interface VoteLimitEntry {
  category: string;
  circunscripcionElectoral: string;
  limit: number;
}

let voteLimitsCache: VoteLimitEntry[] | null = null;

/**
 * Load vote limits from CSV file
 */
export async function loadVoteLimits(): Promise<VoteLimitEntry[]> {
  if (voteLimitsCache) {
    return voteLimitsCache;
  }

  try {
    const response = await fetch(limiteCsvFile);
    const text = await response.text();
    const lines = text.split('\n').slice(1); // Skip header

    const limitsArray: VoteLimitEntry[] = [];

    lines
      .filter(line => line.trim())
      .forEach(line => {
        const [category, circunscripcionElectoral, limit] = line.split(';');
        if (category && circunscripcionElectoral && limit) {
          limitsArray.push({
            category: category.trim(),
            circunscripcionElectoral: circunscripcionElectoral.trim(),
            limit: parseInt(limit.trim()) || 0
          });
        }
      });

    voteLimitsCache = limitsArray;
    return limitsArray;
  } catch (error) {
    console.error('Error loading vote limits:', error);
    // Return empty array if loading fails
    return [];
  }
}

/**
 * Get vote limits for a specific category and circunscripcion electoral
 * @param category - Electoral category (e.g., 'senadoresNacional', 'diputados')
 * @param circunscripcionElectoral - Electoral district (e.g., 'LIMA METROPOLITANA', 'UNICO NACIONAL')
 */
export async function getVoteLimitsForCategory(
  category: string,
  circunscripcionElectoral?: string
): Promise<VoteLimits> {
  const limitsArray = await loadVoteLimits();

  // Find the entry matching both category and circunscripcion electoral
  const entry = limitsArray.find(
    item => item.category === category &&
    (!circunscripcionElectoral || item.circunscripcionElectoral === circunscripcionElectoral)
  );

  const limit = entry?.limit || 0;

  // For categories that support preferential voting
  switch (category) {
    case 'senadoresNacional':
      return {
        preferential1: limit || 30,
        preferential2: limit || 30
      };

    case 'senadoresRegional':
      return {
        preferential1: limit || 2,
        preferential2: 0 // No preferential 2 for regional senators
      };

    case 'diputados':
      return {
        preferential1: limit || 4,
        preferential2: limit || 4
      };

    case 'parlamentoAndino':
      return {
        preferential1: limit || 16,
        preferential2: limit || 16
      };

    case 'presidencial':
    default:
      return {
        preferential1: 0,
        preferential2: 0
      };
  }
}
