// Repository interface for Acta operations
// Defines contract for data access operations

import type { ActaData, CategoryData } from '../../types/acta.types';

export interface IActaRepository {
  // Category operations
  getCategoryData(category: string): Promise<CategoryData>;
  saveCategoryData(category: string, data: CategoryData): Promise<void>;
  getAllCategoryData(): Promise<Record<string, CategoryData>>;

  // Acta operations
  getActiveActaIndex(category: string): Promise<number>;
  saveActiveActaIndex(category: string, index: number): Promise<void>;
  getActiveActa(category: string): Promise<ActaData>;
  saveActiveActa(category: string, actaData: ActaData): Promise<void>;
  createNewActa(category: string): Promise<void>;
  getAllActas(category: string): Promise<ActaData[]>;

  // Query operations
  findActasByMesa(mesaNumber: number): Promise<ActaData[]>;
  isMesaFinalized(mesaNumber: number, category: string, excludeActaIndex?: number): Promise<boolean>;
  findCedulasExcedentesByMesa(mesaNumber: number, excludeCategory?: string, excludeActaIndex?: number): Promise<number | null>;
  findTcvByMesa(mesaNumber: number, excludeCategory?: string, excludeActaIndex?: number): Promise<number | null>;

  // Active category
  getActiveCategory(): Promise<string>;
  saveActiveCategory(category: string): Promise<void>;

  // Organization management
  getSelectedOrganizations(): Promise<string[]>;
  saveSelectedOrganizations(organizationKeys: string[]): Promise<void>;
  getCircunscripcionOrganizations(circunscripcion: string): Promise<string[]>;
  saveCircunscripcionOrganizations(circunscripcion: string, organizationKeys: string[]): Promise<void>;
  getAllCircunscripcionOrganizations(): Promise<Record<string, string[]>>;

  // Partial recount management
  getIsPartialRecount(circunscripcion: string): Promise<boolean>;
  saveIsPartialRecount(circunscripcion: string, isPartial: boolean): Promise<void>;
  getPartialRecountOrganizations(circunscripcion: string): Promise<string[]>;
  savePartialRecountOrganizations(circunscripcion: string, organizationKeys: string[]): Promise<void>;

  // Utility
  clearAll(): Promise<void>;
}
