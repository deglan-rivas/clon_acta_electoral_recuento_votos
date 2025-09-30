// LocalStorage utility functions for electoral dashboard state persistence

export const STORAGE_KEYS = {
  ACTIVE_CATEGORY: 'electoral_active_category',
  CATEGORY_DATA: 'electoral_category_data',
  ACTIVE_ACTA_INDEX: 'electoral_active_acta_index',
  SELECTED_ORGANIZATIONS: 'electoral_selected_organizations',
} as const;

// Generic localStorage functions
export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    console.log(`[localStorage] Reading key "${key}":`, item ? 'exists' : 'not found');
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`[localStorage] Error reading from localStorage for key "${key}":`, error);
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

// Define the structure for a single acta
export interface ActaData {
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
    jee: string;
  };
}

// Define the structure for category-specific data (now supports multiple actas)
export interface CategoryData {
  actas: ActaData[];
}

// Get default data for a single acta
export const getDefaultActaData = (): ActaData => ({
  voteLimits: {
    preferential1: 30,
    preferential2: 30,
  },
  voteEntries: [],
  activeSection: 'ingreso',
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
    jee: '',
  },
});

// Get default data for a category (with one empty acta)
const getDefaultCategoryData = (): CategoryData => ({
  actas: [getDefaultActaData()],
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
  const data = getFromLocalStorage(STORAGE_KEYS.CATEGORY_DATA, getInitialCategoryData());

  console.log('[localStorage] getAllCategoryData:', data);

  // Validate and fix data structure if needed
  Object.keys(data).forEach(category => {
    if (!data[category].actas || !Array.isArray(data[category].actas)) {
      console.warn(`[localStorage] Fixing invalid data structure for category: ${category}`);
      data[category] = getDefaultCategoryData();
    }
  });

  return data;
};

// Get data for a specific category
export const getCategoryData = (category: string): CategoryData => {
  const allData = getAllCategoryData();
  const categoryData = allData[category] || getDefaultCategoryData();

  console.log('[localStorage] getCategoryData:', { category, categoryData });

  // Ensure the data has the correct structure
  if (!categoryData.actas || !Array.isArray(categoryData.actas)) {
    console.warn('[localStorage] Invalid category data structure, returning default');
    return getDefaultCategoryData();
  }

  return categoryData;
};

// Save data for a specific category
export const saveCategoryData = (category: string, data: CategoryData): void => {
  const allData = getAllCategoryData();
  allData[category] = data;
  saveToLocalStorage(STORAGE_KEYS.CATEGORY_DATA, allData);
};

// Active acta index management
export const getActiveActaIndex = (category: string): number => {
  const allIndices = getFromLocalStorage<Record<string, number>>(STORAGE_KEYS.ACTIVE_ACTA_INDEX, {});
  return allIndices[category] ?? 0;
};

export const saveActiveActaIndex = (category: string, index: number): void => {
  const allIndices = getFromLocalStorage<Record<string, number>>(STORAGE_KEYS.ACTIVE_ACTA_INDEX, {});
  allIndices[category] = index;
  saveToLocalStorage(STORAGE_KEYS.ACTIVE_ACTA_INDEX, allIndices);
};

// Get the currently active acta for a category
export const getActiveActaData = (category: string): ActaData => {
  const categoryData = getCategoryData(category);
  const activeIndex = getActiveActaIndex(category);

  console.log('[localStorage] getActiveActaData:', { category, activeIndex, categoryData });

  // Ensure actas array exists
  if (!categoryData.actas || !Array.isArray(categoryData.actas)) {
    console.warn('[localStorage] actas array is missing or invalid, creating default');
    return getDefaultActaData();
  }

  // Ensure the index is valid
  if (activeIndex >= 0 && activeIndex < categoryData.actas.length) {
    return categoryData.actas[activeIndex];
  }

  // Fallback to first acta or create a new one
  if (categoryData.actas.length > 0) {
    return categoryData.actas[0];
  }

  console.warn('[localStorage] No actas found, returning default');
  return getDefaultActaData();
};

// Save the currently active acta
export const saveActiveActaData = (category: string, actaData: ActaData): void => {
  const categoryData = getCategoryData(category);
  const activeIndex = getActiveActaIndex(category);

  // Ensure actas array exists
  if (!categoryData.actas) {
    categoryData.actas = [];
  }

  // Update or add the acta
  if (activeIndex >= 0 && activeIndex < categoryData.actas.length) {
    categoryData.actas[activeIndex] = actaData;
  } else {
    categoryData.actas.push(actaData);
    saveActiveActaIndex(category, categoryData.actas.length - 1);
  }

  saveCategoryData(category, categoryData);
};

// Create a new acta and set it as active
export const createNewActa = (category: string): void => {
  const categoryData = getCategoryData(category);
  const newActa = getDefaultActaData();

  categoryData.actas.push(newActa);
  const newIndex = categoryData.actas.length - 1;

  saveCategoryData(category, categoryData);
  saveActiveActaIndex(category, newIndex);
};

// Get all actas for a category
export const getAllActas = (category: string): ActaData[] => {
  const categoryData = getCategoryData(category);
  return categoryData.actas || [getDefaultActaData()];
};

// Legacy compatibility functions (deprecated - use getActiveActaData/saveActiveActaData instead)
export const getVoteLimits = (category: string) => {
  return getActiveActaData(category).voteLimits;
};

export const saveVoteLimits = (category: string, limits: { preferential1: number; preferential2: number }): void => {
  const actaData = getActiveActaData(category);
  actaData.voteLimits = limits;
  saveActiveActaData(category, actaData);
};

export const getVoteEntries = (category: string) => {
  return getActiveActaData(category).voteEntries;
};

export const saveVoteEntries = (category: string, entries: any[]): void => {
  const actaData = getActiveActaData(category);
  actaData.voteEntries = entries;
  saveActiveActaData(category, actaData);
};

export const getActiveSection = (category: string): string => {
  return getActiveActaData(category).activeSection;
};

export const saveActiveSection = (category: string, section: string): void => {
  const actaData = getActiveActaData(category);
  actaData.activeSection = section;
  saveActiveActaData(category, actaData);
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