// LocalStorage utility functions for electoral dashboard state persistence

export const STORAGE_KEYS = {
  ACTIVE_CATEGORY: 'electoral_active_category',
  CATEGORY_DATA: 'electoral_category_data',
  SELECTED_ORGANIZATIONS: 'electoral_selected_organizations',
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

// Define the structure for category-specific data
export interface CategoryData {
  voteLimits: {
    preferential1: number;
    preferential2: number;
  };
  voteEntries: any[];
  activeSection: string;
  mesaNumber: number;
  actaNumber: string;
  totalElectores: number;
  isFormFinalized: boolean;
  isMesaDataSaved: boolean;
  startTime: string | null; // Store as ISO string
  endTime: string | null; // Store as ISO string
  selectedLocation: {
    departamento: string;
    provincia: string;
    distrito: string;
    circunscripcionElectoral: string;
  };
}

// Get default data for a category
const getDefaultCategoryData = (): CategoryData => ({
  voteLimits: {
    preferential1: 30,
    preferential2: 30,
  },
  voteEntries: [],
  activeSection: 'recuento',
  mesaNumber: 0,
  actaNumber: '',
  totalElectores: 0,
  isFormFinalized: false,
  isMesaDataSaved: false,
  startTime: null,
  endTime: null,
  selectedLocation: {
    departamento: '',
    provincia: '',
    distrito: '',
    circunscripcionElectoral: '',
  },
});

// Initialize with default data for all categories
const getInitialCategoryData = (): Record<string, CategoryData> => ({
  "presidencial": getDefaultCategoryData(),
  "senadoresNacional": getDefaultCategoryData(),
  "senadoresRegional": getDefaultCategoryData(),
  "diputados": getDefaultCategoryData(),
  "parlamentoAndino": getDefaultCategoryData()
});

// Get all category data
export const getAllCategoryData = (): Record<string, CategoryData> => {
  return getFromLocalStorage(STORAGE_KEYS.CATEGORY_DATA, getInitialCategoryData());
};

// Get data for a specific category
export const getCategoryData = (category: string): CategoryData => {
  const allData = getAllCategoryData();
  return allData[category] || getDefaultCategoryData();
};

// Save data for a specific category
export const saveCategoryData = (category: string, data: CategoryData): void => {
  const allData = getAllCategoryData();
  allData[category] = data;
  saveToLocalStorage(STORAGE_KEYS.CATEGORY_DATA, allData);
};

// Convenience functions for specific data types
export const getVoteLimits = (category: string) => {
  return getCategoryData(category).voteLimits;
};

export const saveVoteLimits = (category: string, limits: { preferential1: number; preferential2: number }): void => {
  const categoryData = getCategoryData(category);
  categoryData.voteLimits = limits;
  saveCategoryData(category, categoryData);
};

export const getVoteEntries = (category: string) => {
  return getCategoryData(category).voteEntries;
};

export const saveVoteEntries = (category: string, entries: any[]): void => {
  const categoryData = getCategoryData(category);
  categoryData.voteEntries = entries;
  saveCategoryData(category, categoryData);
};

export const getActiveSection = (category: string): string => {
  return getCategoryData(category).activeSection;
};

export const saveActiveSection = (category: string, section: string): void => {
  const categoryData = getCategoryData(category);
  categoryData.activeSection = section;
  saveCategoryData(category, categoryData);
};

// Clear all electoral data (useful for development/testing)
export const clearElectoralData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromLocalStorage(key);
  });
  console.log('All electoral data cleared from localStorage');
};

// Global selected organizations functions (legacy - will be deprecated)
export const getSelectedOrganizations = (): string[] => {
  return getFromLocalStorage(STORAGE_KEYS.SELECTED_ORGANIZATIONS, []);
};

export const saveSelectedOrganizations = (organizationKeys: string[]): void => {
  saveToLocalStorage(STORAGE_KEYS.SELECTED_ORGANIZATIONS, organizationKeys);
};

// Per-circunscripción organization functions
export const CIRCUNSCRIPCION_ORGANIZATIONS_KEY = 'electoral_circunscripcion_organizations';

export const getCircunscripcionOrganizations = (circunscripcion: string): string[] => {
  const allCircunscripciones = getFromLocalStorage(CIRCUNSCRIPCION_ORGANIZATIONS_KEY, {});
  return allCircunscripciones[circunscripcion] || [];
};

export const saveCircunscripcionOrganizations = (circunscripcion: string, organizationKeys: string[]): void => {
  const allCircunscripciones = getFromLocalStorage(CIRCUNSCRIPCION_ORGANIZATIONS_KEY, {});
  allCircunscripciones[circunscripcion] = organizationKeys;
  saveToLocalStorage(CIRCUNSCRIPCION_ORGANIZATIONS_KEY, allCircunscripciones);
};

export const getAllCircunscripcionOrganizations = (): Record<string, string[]> => {
  return getFromLocalStorage(CIRCUNSCRIPCION_ORGANIZATIONS_KEY, {});
};

// Debug function to view all localStorage data
export const debugElectoralData = (): void => {
  console.log('Electoral Dashboard localStorage data:');
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = localStorage.getItem(key);
    console.log(`${name}:`, value ? JSON.parse(value) : null);
  });
};