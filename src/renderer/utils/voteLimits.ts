// Utility to load preferential vote limits from CSV
import limiteCsvFile from '/limite_voto_preferencial_por_categoria.csv?url';

export interface VoteLimits {
  preferential1: number;
  preferential2: number;
}

let voteLimitsCache: Map<string, number> | null = null;

/**
 * Load vote limits from CSV file
 */
export async function loadVoteLimits(): Promise<Map<string, number>> {
  if (voteLimitsCache) {
    return voteLimitsCache;
  }

  try {
    const response = await fetch(limiteCsvFile);
    const text = await response.text();
    const lines = text.split('\n').slice(1); // Skip header

    const limitsMap = new Map<string, number>();

    lines
      .filter(line => line.trim())
      .forEach(line => {
        const [category, limit] = line.split(';');
        if (category && limit) {
          limitsMap.set(category.trim(), parseInt(limit.trim()) || 0);
        }
      });

    voteLimitsCache = limitsMap;
    return limitsMap;
  } catch (error) {
    console.error('Error loading vote limits:', error);
    // Return default limits if loading fails
    return new Map([
      ['senadoresNacional', 30],
      ['senadoresRegional', 4],
      ['diputados', 32],
      ['parlamentoAndino', 16]
    ]);
  }
}

/**
 * Get vote limits for a specific category
 */
export async function getVoteLimitsForCategory(category: string): Promise<VoteLimits> {
  const limitsMap = await loadVoteLimits();

  // For categories that support preferential voting
  switch (category) {
    case 'senadoresNacional':
      return {
        preferential1: limitsMap.get('senadoresNacional') || 30,
        preferential2: limitsMap.get('senadoresNacional') || 30
      };

    case 'senadoresRegional':
      return {
        preferential1: limitsMap.get('senadoresRegional') || 4,
        preferential2: 0 // No preferential 2 for regional senators
      };

    case 'diputados':
      return {
        preferential1: limitsMap.get('diputados') || 32,
        preferential2: limitsMap.get('diputados') || 32
      };

    case 'parlamentoAndino':
      return {
        preferential1: limitsMap.get('parlamentoAndino') || 16,
        preferential2: limitsMap.get('parlamentoAndino') || 16
      };

    case 'presidencial':
    default:
      return {
        preferential1: 0,
        preferential2: 0
      };
  }
}
