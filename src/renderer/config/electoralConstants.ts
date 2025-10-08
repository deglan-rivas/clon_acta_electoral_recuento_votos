/**
 * Categories that support preferential voting
 */
export const PREFERENTIAL_CATEGORIES = [
  'senadoresNacional',
  'senadoresRegional',
  'diputados',
  'parlamentoAndino'
] as const;

/**
 * Default maximum preferential vote number
 */
export const DEFAULT_MAX_PREFERENTIAL = 30;

/**
 * Special vote categories (non-party votes)
 */
export const SPECIAL_VOTE_CATEGORIES = ['BLANCO', 'NULO'] as const;

/**
 * Checks if a category supports preferential voting
 */
export function hasPreferentialVoting(category: string): boolean {
  return PREFERENTIAL_CATEGORIES.includes(category as any);
}
