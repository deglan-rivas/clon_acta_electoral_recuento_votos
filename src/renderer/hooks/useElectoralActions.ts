// Hook to provide electoral actions with Zustand store
// This replaces the updateActaData pattern with synchronous store updates

import { useElectoralStore } from '../store/electoralStore';
import type { ActaData, SelectedLocation } from '../types/acta.types';

export function useElectoralActions() {
  const store = useElectoralStore();

  return {
    // Direct store access for reading
    currentActa: store.getCurrentActa(),
    activeCategory: store.activeCategory,
    categoryActas: store.getAllActasForCategory(store.activeCategory),
    currentActaIndex: store.getCurrentActaIndex(),
    currentTime: store.currentTime,
    isSettingsOpen: store.isSettingsOpen,

    // Synchronous update actions (solves async state issues)
    updateActaData: store.updateActaData,

    // Category actions
    setActiveCategory: store.setActiveCategory,

    // Navigation
    createNewActa: store.createNewActa,
    switchToActa: store.switchToActa,

    // Location
    updateLocation: store.updateLocation,

    // Mesa data
    setMesaNumber: store.setMesaNumber,
    setActaNumber: store.setActaNumber,
    setTotalElectores: store.setTotalElectores,
    setCedulasExcedentes: store.setCedulasExcedentes,
    setTcv: store.setTcv,

    // Session
    setMesaDataSaved: store.setMesaDataSaved,
    setFormFinalized: store.setFormFinalized,
    setMesaFieldsLocked: store.setMesaFieldsLocked,

    // Time
    setStartTime: store.setStartTime,
    setEndTime: store.setEndTime,
    setCurrentTime: store.setCurrentTime,

    // UI
    setSettingsOpen: store.setSettingsOpen,

    // Utilities
    isMesaFinalized: store.isMesaFinalized,
  };
}
