import { useState, useEffect, useRef, useCallback } from "react";
import { useActaRepository } from "./useActaRepository";
import { getVoteLimitsForCategory } from "../utils/voteLimits";
import type { ActaData } from "../types/acta.types";

export function useCategoryManager() {
  const repository = useActaRepository();
  const [activeCategory, setActiveCategory] = useState<string>('presidencial');
  const [currentActaData, setCurrentActaData] = useState<ActaData | null>(null);
  const [categoryActas, setCategoryActas] = useState<ActaData[]>([]);
  const [currentActaIndex, setCurrentActaIndex] = useState<number>(0);
  // Load initial data from repository
  useEffect(() => {
    const loadInitialData = async () => {
      const category = await repository.getActiveCategory();
      setActiveCategory(category);
      const actaData = await repository.getActiveActa(category);
      setCurrentActaData(actaData);
      const allActas = await repository.getAllActas(category);
      setCategoryActas(allActas);
      const index = await repository.getActiveActaIndex(category);
      setCurrentActaIndex(index);
    };
    loadInitialData();
  }, [repository]);

  // Track last loaded category to prevent re-loading
  const lastLoadedCategoryRef = useRef<string | null>(null);

  // Save activeCategory to repository when it changes and load acta data
  useEffect(() => {
    if (!activeCategory) return;

    // Only load if category actually changed
    if (lastLoadedCategoryRef.current === activeCategory) {
      return;
    }

    const loadCategoryData = async () => {
      lastLoadedCategoryRef.current = activeCategory;
      await repository.saveActiveCategory(activeCategory);
      const actaData = await repository.getActiveActa(activeCategory);

      // Load vote limits for the category and circunscripcion electoral
      const circunscripcionElectoral = actaData?.selectedLocation?.circunscripcionElectoral;
      const limits = await getVoteLimitsForCategory(activeCategory, circunscripcionElectoral);

      // Set data with limits
      setCurrentActaData({ ...actaData, voteLimits: limits });

      const allActas = await repository.getAllActas(activeCategory);
      setCategoryActas(allActas);
      const index = await repository.getActiveActaIndex(activeCategory);
      setCurrentActaIndex(index);
    };
    loadCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Manual save function (no auto-save to prevent infinite loop)
  const saveCurrentActa = useCallback(async () => {
    if (!currentActaData || !activeCategory) return;
    await repository.saveActiveActa(activeCategory, currentActaData);
  }, [currentActaData, activeCategory, repository]);

  const updateCurrentActaData = useCallback((updates: Partial<ActaData>): void => {
    setCurrentActaData((prev) => ({
      ...(prev || {} as ActaData),
      ...updates,
    }));
  }, []);

  return {
    activeCategory,
    setActiveCategory,
    currentActaData,
    setCurrentActaData,
    categoryActas,
    setCategoryActas,
    currentActaIndex,
    setCurrentActaIndex,
    updateCurrentActaData,
    saveCurrentActa,
  };
}
