// LocalStorage utility functions for electoral dashboard state persistence

export const STORAGE_KEYS = {
  ACTIVE_CATEGORY: 'electoral_active_category',
  ACTIVE_SECTION: 'electoral_active_section',
  VOTE_LIMITS: 'electoral_vote_limits',
  VOTE_ENTRIES: 'electoral_vote_entries',
} as const;

// Generic localStorage functions
export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving to localStorage for key "${key}":`, error);
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing from localStorage for key "${key}":`, error);
  }
};

// Specific functions for electoral dashboard
export const getActiveCategory = (): string => {
  return getFromLocalStorage(STORAGE_KEYS.ACTIVE_CATEGORY, 'presidencial');
};

export const saveActiveCategory = (category: string): void => {
  saveToLocalStorage(STORAGE_KEYS.ACTIVE_CATEGORY, category);
};

export const getActiveSection = (): string => {
  return getFromLocalStorage(STORAGE_KEYS.ACTIVE_SECTION, 'recuento');
};

export const saveActiveSection = (section: string): void => {
  saveToLocalStorage(STORAGE_KEYS.ACTIVE_SECTION, section);
};

export const getVoteLimits = () => {
  return getFromLocalStorage(STORAGE_KEYS.VOTE_LIMITS, {
    preferential1: 1,
    preferential2: 1,
  });
};

export const saveVoteLimits = (limits: { preferential1: number; preferential2: number }): void => {
  saveToLocalStorage(STORAGE_KEYS.VOTE_LIMITS, limits);
};

export const getVoteEntries = (category: string) => {
  const allEntries: Record<string, any[]> = getFromLocalStorage(STORAGE_KEYS.VOTE_ENTRIES, {});
  return allEntries[category] || [];
};

export const saveVoteEntries = (category: string, entries: any[]): void => {
  const allEntries: Record<string, any[]> = getFromLocalStorage(STORAGE_KEYS.VOTE_ENTRIES, {});
  allEntries[category] = entries;
  saveToLocalStorage(STORAGE_KEYS.VOTE_ENTRIES, allEntries);
};

// Clear all electoral data (useful for development/testing)
export const clearElectoralData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromLocalStorage(key);
  });
  console.log('All electoral data cleared from localStorage');
};

// Debug function to view all localStorage data
export const debugElectoralData = (): void => {
  console.log('Electoral Dashboard localStorage data:');
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = localStorage.getItem(key);
    console.log(`${name}:`, value ? JSON.parse(value) : null);
  });
};