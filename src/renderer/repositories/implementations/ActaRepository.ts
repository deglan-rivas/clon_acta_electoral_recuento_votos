// ActaRepository - Business logic for Acta data operations
// Implements IActaRepository using any IStorageAdapter

import type { IActaRepository } from '../interfaces/IActaRepository';
import type { IStorageAdapter } from '../interfaces/IStorageAdapter';
import type { ActaData, CategoryData } from '../../types/acta.types';

const STORAGE_KEYS = {
  ACTIVE_CATEGORY: 'electoral_active_category',
  CATEGORY_DATA: 'electoral_category_data',
  ACTIVE_ACTA_INDEX: 'electoral_active_acta_index',
  SELECTED_ORGANIZATIONS: 'electoral_selected_organizations',
  CIRCUNSCRIPCION_ORGANIZATIONS: 'electoral_circunscripcion_organizations',
  PARTIAL_RECOUNT_ORGANIZATIONS: 'electoral_partial_recount_organizations',
  PARTIAL_RECOUNT_MODE: 'electoral_partial_recount_mode',
} as const;

export class ActaRepository implements IActaRepository {
  private adapter: IStorageAdapter;

  constructor(adapter: IStorageAdapter) {
    this.adapter = adapter;
  }

  async getActiveCategory(): Promise<string> {
    const category = await this.adapter.get<string>(STORAGE_KEYS.ACTIVE_CATEGORY);
    return category || 'presidencial';
  }

  async saveActiveCategory(category: string): Promise<void> {
    await this.adapter.set(STORAGE_KEYS.ACTIVE_CATEGORY, category);
  }

  async getCategoryData(category: string): Promise<CategoryData> {
    const allData = await this.getAllCategoryData();
    return allData[category] || this.getDefaultCategoryData();
  }

  async saveCategoryData(category: string, data: CategoryData): Promise<void> {
    const allData = await this.getAllCategoryData();
    allData[category] = data;
    await this.adapter.set(STORAGE_KEYS.CATEGORY_DATA, allData);
  }

  async getAllCategoryData(): Promise<Record<string, CategoryData>> {
    const data = await this.adapter.get<Record<string, CategoryData>>(
      STORAGE_KEYS.CATEGORY_DATA
    );
    return data || this.getInitialCategoryData();
  }

  async getActiveActaIndex(category: string): Promise<number> {
    const allIndices = await this.adapter.get<Record<string, number>>(
      STORAGE_KEYS.ACTIVE_ACTA_INDEX
    );
    return allIndices?.[category] ?? 0;
  }

  async saveActiveActaIndex(category: string, index: number): Promise<void> {
    const allIndices = (await this.adapter.get<Record<string, number>>(
      STORAGE_KEYS.ACTIVE_ACTA_INDEX
    )) || {};
    allIndices[category] = index;
    await this.adapter.set(STORAGE_KEYS.ACTIVE_ACTA_INDEX, allIndices);
  }

  async getActiveActa(category: string): Promise<ActaData> {
    const categoryData = await this.getCategoryData(category);
    const activeIndex = await this.getActiveActaIndex(category);

    if (categoryData.actas && categoryData.actas[activeIndex]) {
      return categoryData.actas[activeIndex];
    }

    return this.getDefaultActaData();
  }

  async saveActiveActa(category: string, actaData: ActaData): Promise<void> {
    const categoryData = await this.getCategoryData(category);
    const activeIndex = await this.getActiveActaIndex(category);

    if (!categoryData.actas) {
      categoryData.actas = [];
    }

    if (activeIndex >= 0 && activeIndex < categoryData.actas.length) {
      categoryData.actas[activeIndex] = actaData;
    } else {
      categoryData.actas.push(actaData);
      await this.saveActiveActaIndex(category, categoryData.actas.length - 1);
    }

    await this.saveCategoryData(category, categoryData);
  }

  async createNewActa(category: string): Promise<void> {
    const categoryData = await this.getCategoryData(category);
    const newActa = this.getDefaultActaData();

    categoryData.actas.push(newActa);
    const newIndex = categoryData.actas.length - 1;

    await this.saveCategoryData(category, categoryData);
    await this.saveActiveActaIndex(category, newIndex);
  }

  async getAllActas(category: string): Promise<ActaData[]> {
    const categoryData = await this.getCategoryData(category);
    return categoryData.actas || [this.getDefaultActaData()];
  }

  async findActasByMesa(mesaNumber: number): Promise<ActaData[]> {
    const allData = await this.getAllCategoryData();
    const result: ActaData[] = [];

    Object.values(allData).forEach((categoryData) => {
      if (categoryData.actas) {
        categoryData.actas.forEach((acta) => {
          if (acta.mesaNumber === mesaNumber) {
            result.push(acta);
          }
        });
      }
    });

    return result;
  }

  async isMesaFinalized(
    mesaNumber: number,
    category: string,
    excludeActaIndex?: number
  ): Promise<boolean> {
    if (!mesaNumber || mesaNumber <= 0) return false;

    const categoryData = await this.getCategoryData(category);
    if (!categoryData || !categoryData.actas) return false;

    for (let i = 0; i < categoryData.actas.length; i++) {
      const acta = categoryData.actas[i];

      if (excludeActaIndex !== undefined && i === excludeActaIndex) {
        continue;
      }

      if (acta.mesaNumber === mesaNumber && acta.isFormFinalized) {
        return true;
      }
    }

    return false;
  }

  async findCedulasExcedentesByMesa(
    mesaNumber: number,
    excludeCategory?: string,
    excludeActaIndex?: number
  ): Promise<number | null> {
    if (!mesaNumber || mesaNumber <= 0) return null;

    const allData = await this.getAllCategoryData();
    const categories = [
      'presidencial',
      'senadoresNacional',
      'senadoresRegional',
      'diputados',
      'parlamentoAndino',
    ];

    for (const category of categories) {
      const categoryData = allData[category];
      if (categoryData && categoryData.actas) {
        for (let i = 0; i < categoryData.actas.length; i++) {
          const acta = categoryData.actas[i];

          if (
            excludeCategory &&
            excludeActaIndex !== undefined &&
            category === excludeCategory &&
            i === excludeActaIndex
          ) {
            continue;
          }

          if (
            acta.mesaNumber === mesaNumber &&
            acta.cedulasExcedentes !== undefined
          ) {
            return acta.cedulasExcedentes;
          }
        }
      }
    }

    return null;
  }

  async findTcvByMesa(
    mesaNumber: number,
    excludeCategory?: string,
    excludeActaIndex?: number
  ): Promise<number | null> {
    if (!mesaNumber || mesaNumber <= 0) return null;

    const allData = await this.getAllCategoryData();
    const categories = [
      'presidencial',
      'senadoresNacional',
      'senadoresRegional',
      'diputados',
      'parlamentoAndino',
    ];

    for (const category of categories) {
      const categoryData = allData[category];
      if (categoryData && categoryData.actas) {
        for (let i = 0; i < categoryData.actas.length; i++) {
          const acta = categoryData.actas[i];

          if (
            excludeCategory &&
            excludeActaIndex !== undefined &&
            category === excludeCategory &&
            i === excludeActaIndex
          ) {
            continue;
          }

          if (
            acta.mesaNumber === mesaNumber &&
            acta.tcv !== null &&
            acta.tcv !== undefined
          ) {
            return acta.tcv;
          }
        }
      }
    }

    return null;
  }

  async countSavedActasByMesa(
    mesaNumber: number,
    excludeCategory?: string,
    excludeActaIndex?: number
  ): Promise<number> {
    if (!mesaNumber || mesaNumber <= 0) return 0;

    const allData = await this.getAllCategoryData();
    const categories = [
      'presidencial',
      'senadoresNacional',
      'senadoresRegional',
      'diputados',
      'parlamentoAndino',
    ];

    let count = 0;

    for (const category of categories) {
      const categoryData = allData[category];
      if (categoryData && categoryData.actas) {
        for (let i = 0; i < categoryData.actas.length; i++) {
          const acta = categoryData.actas[i];

          // Skip the current acta if specified
          if (
            excludeCategory &&
            excludeActaIndex !== undefined &&
            category === excludeCategory &&
            i === excludeActaIndex
          ) {
            continue;
          }

          // Count actas where this mesa has been saved (Iniciar clicked)
          // EXCLUDE partial recounts from the count
          if (
            acta.mesaNumber === mesaNumber &&
            acta.isMesaDataSaved === true &&
            acta.isPartialRecount !== true
          ) {
            count++;
          }
        }
      }
    }

    return count;
  }

  // Organization management methods
  async getSelectedOrganizations(): Promise<string[]> {
    const organizations = await this.adapter.get<string[]>(STORAGE_KEYS.SELECTED_ORGANIZATIONS);
    return organizations || [];
  }

  async saveSelectedOrganizations(organizationKeys: string[]): Promise<void> {
    await this.adapter.set(STORAGE_KEYS.SELECTED_ORGANIZATIONS, organizationKeys);
  }

  async getCircunscripcionOrganizations(circunscripcion: string): Promise<string[]> {
    const allCircOrgs = await this.adapter.get<Record<string, string[]>>(STORAGE_KEYS.CIRCUNSCRIPCION_ORGANIZATIONS);
    return allCircOrgs?.[circunscripcion] || [];
  }

  async saveCircunscripcionOrganizations(circunscripcion: string, organizationKeys: string[]): Promise<void> {
    const allCircOrgs = await this.adapter.get<Record<string, string[]>>(STORAGE_KEYS.CIRCUNSCRIPCION_ORGANIZATIONS) || {};
    allCircOrgs[circunscripcion] = organizationKeys;
    await this.adapter.set(STORAGE_KEYS.CIRCUNSCRIPCION_ORGANIZATIONS, allCircOrgs);
  }

  async getAllCircunscripcionOrganizations(): Promise<Record<string, string[]>> {
    const allCircOrgs = await this.adapter.get<Record<string, string[]>>(STORAGE_KEYS.CIRCUNSCRIPCION_ORGANIZATIONS);
    return allCircOrgs || {};
  }

  async getIsPartialRecount(circunscripcion: string): Promise<boolean> {
    const allPartialRecounts = await this.adapter.get<Record<string, boolean>>(STORAGE_KEYS.PARTIAL_RECOUNT_MODE);
    return allPartialRecounts?.[circunscripcion] || false;
  }

  async saveIsPartialRecount(circunscripcion: string, isPartial: boolean): Promise<void> {
    const allPartialRecounts = await this.adapter.get<Record<string, boolean>>(STORAGE_KEYS.PARTIAL_RECOUNT_MODE) || {};
    allPartialRecounts[circunscripcion] = isPartial;
    await this.adapter.set(STORAGE_KEYS.PARTIAL_RECOUNT_MODE, allPartialRecounts);
  }

  async getPartialRecountOrganizations(circunscripcion: string): Promise<string[]> {
    const allPartialRecountOrgs = await this.adapter.get<Record<string, string[]>>(STORAGE_KEYS.PARTIAL_RECOUNT_ORGANIZATIONS);
    return allPartialRecountOrgs?.[circunscripcion] || [];
  }

  async savePartialRecountOrganizations(circunscripcion: string, organizationKeys: string[]): Promise<void> {
    const allPartialRecountOrgs = await this.adapter.get<Record<string, string[]>>(STORAGE_KEYS.PARTIAL_RECOUNT_ORGANIZATIONS) || {};
    allPartialRecountOrgs[circunscripcion] = organizationKeys;
    await this.adapter.set(STORAGE_KEYS.PARTIAL_RECOUNT_ORGANIZATIONS, allPartialRecountOrgs);
  }

  async clearAll(): Promise<void> {
    await this.adapter.remove(STORAGE_KEYS.ACTIVE_CATEGORY);
    await this.adapter.remove(STORAGE_KEYS.CATEGORY_DATA);
    await this.adapter.remove(STORAGE_KEYS.ACTIVE_ACTA_INDEX);
    await this.adapter.remove(STORAGE_KEYS.SELECTED_ORGANIZATIONS);
    await this.adapter.remove(STORAGE_KEYS.CIRCUNSCRIPCION_ORGANIZATIONS);
    await this.adapter.remove(STORAGE_KEYS.PARTIAL_RECOUNT_ORGANIZATIONS);
    await this.adapter.remove(STORAGE_KEYS.PARTIAL_RECOUNT_MODE);
  }

  // Private helper methods
  private getDefaultActaData(): ActaData {
    return {
      voteLimits: { preferential1: 30, preferential2: 30 },
      voteEntries: [],
      activeSection: 'ingreso',
      mesaNumber: 0,
      actaNumber: '',
      totalElectores: 0,
      cedulasExcedentes: 0,
      tcv: null,
      isFormFinalized: false,
      isMesaDataSaved: false,
      areMesaFieldsLocked: false,
      startTime: null,
      endTime: null,
      selectedLocation: {
        departamento: '',
        provincia: '',
        distrito: '',
        circunscripcionElectoral: '',
        jee: '',
      },
    };
  }

  private getDefaultCategoryData(): CategoryData {
    return {
      actas: [this.getDefaultActaData()],
    };
  }

  private getInitialCategoryData(): Record<string, CategoryData> {
    return {
      presidencial: this.getDefaultCategoryData(),
      senadoresNacional: this.getDefaultCategoryData(),
      senadoresRegional: this.getDefaultCategoryData(),
      diputados: this.getDefaultCategoryData(),
      parlamentoAndino: this.getDefaultCategoryData(),
    };
  }
}
