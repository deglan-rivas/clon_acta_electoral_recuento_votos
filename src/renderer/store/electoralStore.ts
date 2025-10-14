// Zustand Store for Electoral Application
// Centralized state management to solve React useState async issues
// Uses repository layer for persistence instead of direct localStorage access

import { create } from 'zustand';
import type { ActaData, SelectedLocation } from '../types/acta.types';
import { DEFAULT_ACTA_DATA } from '../types/acta.types';
import { getVoteLimitsForCategory } from '../utils/voteLimits';
import { ActaRepository } from '../repositories/implementations/ActaRepository';
import { LocalStorageAdapter } from '../repositories/adapters/LocalStorageAdapter';

// Initialize repository with localStorage adapter
const storageAdapter = new LocalStorageAdapter();
const actaRepository = new ActaRepository(storageAdapter);

// Store State Interface
interface ElectoralState {
  // Active Category
  activeCategory: string;

  // Acta Data per Category (persisted)
  categoryActas: Record<string, ActaData[]>;

  // Current Acta Index per Category
  currentActaIndex: Record<string, number>;

  // UI State
  currentTime: Date;
  isSettingsOpen: boolean;

  // Computed/Derived values
  getCurrentActa: () => ActaData;
  getAllActasForCategory: (category: string) => ActaData[];
  getCurrentActaIndex: () => number;

  // Actions - Category Management
  setActiveCategory: (category: string) => Promise<void>;

  // Actions - Acta Data Updates (synchronous, immediate)
  updateActaData: (updates: Partial<ActaData>) => void;

  // Actions - Acta Navigation
  createNewActa: () => void;
  switchToActa: (index: number) => void;

  // Actions - Location Updates
  updateLocation: (location: Partial<SelectedLocation>) => void;
  updateVoteLimits: () => Promise<void>;

  // Actions - Mesa Data
  setMesaNumber: (mesaNumber: number) => void;
  setActaNumber: (actaNumber: string) => void;
  setTotalElectores: (total: number) => void;
  setCedulasExcedentes: (value: number) => void;
  setTcv: (value: number | null) => void;

  // Actions - Session State
  setMesaDataSaved: (saved: boolean) => void;
  setFormFinalized: (finalized: boolean) => void;
  setMesaFieldsLocked: (locked: boolean) => void;

  // Actions - Time Management
  setStartTime: (time: Date | null) => void;
  setEndTime: (time: Date | null) => void;
  setCurrentTime: (time: Date) => void;

  // Actions - UI
  setSettingsOpen: (open: boolean) => void;

  // Utility - Check if mesa is finalized
  isMesaFinalized: (mesaNumber: number, category: string) => boolean;
}

// Helper function to initialize store from repository
const initializeStoreFromRepository = async (set: any) => {
  try {
    // Load active category
    const activeCategory = await actaRepository.getActiveCategory();

    // Load all category data
    const allCategoryData = await actaRepository.getAllCategoryData();

    // Convert repository format to store format
    const categoryActas: Record<string, ActaData[]> = {};
    const currentActaIndex: Record<string, number> = {};

    for (const [category, data] of Object.entries(allCategoryData)) {
      // Ensure each acta has all required fields with defaults
      const actas = (data.actas || [DEFAULT_ACTA_DATA]).map(acta => ({
        ...DEFAULT_ACTA_DATA,
        ...acta,
      }));

      categoryActas[category] = actas;
      currentActaIndex[category] = await actaRepository.getActiveActaIndex(category);
    }

    // Only update store if we have valid data
    if (Object.keys(categoryActas).length > 0) {
      set({
        activeCategory,
        categoryActas,
        currentActaIndex,
      });

      console.log('[ElectoralStore] Initialized from repository:', {
        activeCategory,
        categoriesLoaded: Object.keys(categoryActas),
      });
    }
  } catch (error) {
    console.error('[ElectoralStore] Error initializing from repository:', error);
  }
};

export const useElectoralStore = create<ElectoralState>()((set, get) => {
  // Initialize from repository on store creation
  initializeStoreFromRepository(set);

  return {
    // Initial State (will be overwritten by repository data)
    activeCategory: 'presidencial',
    categoryActas: {
      presidencial: [DEFAULT_ACTA_DATA],
    },
    currentActaIndex: {
      presidencial: 0,
    },
    currentTime: new Date(),
    isSettingsOpen: false,

    // Computed Values
    getCurrentActa: () => {
      const { activeCategory, categoryActas, currentActaIndex } = get();
      const index = currentActaIndex[activeCategory] || 0;
      const actas = categoryActas[activeCategory] || [DEFAULT_ACTA_DATA];
      const acta = actas[index] || DEFAULT_ACTA_DATA;

      // Ensure all required fields are present
      return {
        ...DEFAULT_ACTA_DATA,
        ...acta,
      };
    },

    getAllActasForCategory: (category: string) => {
      const { categoryActas } = get();
      return categoryActas[category] || [DEFAULT_ACTA_DATA];
    },

    getCurrentActaIndex: () => {
      const { activeCategory, currentActaIndex } = get();
      return currentActaIndex[activeCategory] || 0;
    },

    // Category Management
    setActiveCategory: async (category: string) => {
      set({ activeCategory: category });

      // Save to repository
      await actaRepository.saveActiveCategory(category);

      // Initialize category if it doesn't exist
      const { categoryActas, currentActaIndex } = get();

      if (!categoryActas[category]) {
        // Get circunscripcionElectoral from current acta if available
        const currentActa = get().getCurrentActa();
        const circunscripcionElectoral = currentActa?.selectedLocation?.circunscripcionElectoral;

        const limits = await getVoteLimitsForCategory(category, circunscripcionElectoral);
        const newCategoryActas = {
          ...categoryActas,
          [category]: [{ ...DEFAULT_ACTA_DATA, voteLimits: limits }],
        };
        const newCurrentActaIndex = {
          ...currentActaIndex,
          [category]: 0,
        };

        set({
          categoryActas: newCategoryActas,
          currentActaIndex: newCurrentActaIndex,
        });

        // Save to repository
        await actaRepository.saveCategoryData(category, { actas: newCategoryActas[category] });
        await actaRepository.saveActiveActaIndex(category, 0);
      }
    },

    // Acta Data Updates - SYNCHRONOUS for UI, async persist to repository
    updateActaData: (updates: Partial<ActaData>) => {
      const { activeCategory, categoryActas, currentActaIndex } = get();
      const index = currentActaIndex[activeCategory] || 0;
      const actas = [...(categoryActas[activeCategory] || [])];

      actas[index] = {
        ...actas[index],
        ...updates,
      };

      const newCategoryActas = {
        ...categoryActas,
        [activeCategory]: actas,
      };

      set({
        categoryActas: newCategoryActas,
      });

      // Persist to repository (async, non-blocking)
      actaRepository.saveCategoryData(activeCategory, { actas }).catch((error) => {
        console.error('[ElectoralStore] Error saving acta data:', error);
      });
    },

    // Acta Navigation
    createNewActa: async () => {
      const { activeCategory, categoryActas, currentActaIndex } = get();
      const actas = [...(categoryActas[activeCategory] || [])];

      // Get circunscripcionElectoral from current acta if available
      const currentActa = get().getCurrentActa();
      const circunscripcionElectoral = currentActa?.selectedLocation?.circunscripcionElectoral;

      const limits = await getVoteLimitsForCategory(activeCategory, circunscripcionElectoral);
      const newActa = { ...DEFAULT_ACTA_DATA, voteLimits: limits };

      actas.push(newActa);
      const newIndex = actas.length - 1;

      const newCategoryActas = {
        ...categoryActas,
        [activeCategory]: actas,
      };
      const newCurrentActaIndex = {
        ...currentActaIndex,
        [activeCategory]: newIndex,
      };

      set({
        categoryActas: newCategoryActas,
        currentActaIndex: newCurrentActaIndex,
      });

      // Persist to repository
      await actaRepository.saveCategoryData(activeCategory, { actas });
      await actaRepository.saveActiveActaIndex(activeCategory, newIndex);
    },

    switchToActa: (index: number) => {
      const { activeCategory, currentActaIndex } = get();
      const newCurrentActaIndex = {
        ...currentActaIndex,
        [activeCategory]: index,
      };

      set({
        currentActaIndex: newCurrentActaIndex,
      });

      // Persist to repository (async, non-blocking)
      actaRepository.saveActiveActaIndex(activeCategory, index).catch((error) => {
        console.error('[ElectoralStore] Error saving acta index:', error);
      });
    },

    // Location Updates
    updateLocation: (location: Partial<SelectedLocation>) => {
      const currentActa = get().getCurrentActa();
      get().updateActaData({
        selectedLocation: {
          ...currentActa.selectedLocation,
          ...location,
        },
      });
    },

    // Update vote limits based on current category and circunscripcion electoral
    updateVoteLimits: async () => {
      const { activeCategory } = get();
      const currentActa = get().getCurrentActa();
      const circunscripcionElectoral = currentActa?.selectedLocation?.circunscripcionElectoral;

      if (circunscripcionElectoral) {
        const limits = await getVoteLimitsForCategory(activeCategory, circunscripcionElectoral);
        get().updateActaData({ voteLimits: limits });
      }
    },

    // Mesa Data
    setMesaNumber: (mesaNumber: number) => {
      get().updateActaData({ mesaNumber });
    },

    setActaNumber: (actaNumber: string) => {
      get().updateActaData({ actaNumber });
    },

    setTotalElectores: (total: number) => {
      get().updateActaData({ totalElectores: total });
    },

    setCedulasExcedentes: (value: number) => {
      get().updateActaData({ cedulasExcedentes: value });
    },

    setTcv: (value: number | null) => {
      get().updateActaData({ tcv: value });
    },

    // Session State
    setMesaDataSaved: (saved: boolean) => {
      get().updateActaData({ isMesaDataSaved: saved });
    },

    setFormFinalized: (finalized: boolean) => {
      get().updateActaData({ isFormFinalized: finalized });
    },

    setMesaFieldsLocked: (locked: boolean) => {
      get().updateActaData({ areMesaFieldsLocked: locked });
    },

    // Time Management
    setStartTime: (time: Date | null) => {
      get().updateActaData({ startTime: time?.toISOString() || null });
    },

    setEndTime: (time: Date | null) => {
      get().updateActaData({ endTime: time?.toISOString() || null });
    },

    setCurrentTime: (time: Date) => {
      set({ currentTime: time });
    },

    // UI
    setSettingsOpen: (open: boolean) => {
      set({ isSettingsOpen: open });
    },

    // Utilities
    isMesaFinalized: (mesaNumber: number, category: string) => {
      const actas = get().getAllActasForCategory(category);
      return actas.some(
        (acta) => acta.mesaNumber === mesaNumber && acta.isFormFinalized
      );
    },
  };
});
