// Service for handling mesa data changes and auto-population logic
import type { ActaData, MesaElectoralRecord, SelectedLocation } from '../../types/acta.types';
import type { IActaRepository } from '../../repositories/interfaces/IActaRepository';
import { ToastService } from '../ui/toastService';
import { GeographicDataService } from '../data/geographicDataService';
import { CircunscripcionService } from './circunscripcionService';
import { NATIONAL_CATEGORIES } from '../../config/electoralCategories';

export interface MesaDataChangeParams {
  mesa: number;
  acta: string;
  electores: number;
  activeCategory: string;
  categoryLabel: string;
  repository: IActaRepository;
  mesaElectoralData: MesaElectoralRecord[];
  circunscripcionData: any[];
  selectedJee: string;
  onLocationUpdate: (location: SelectedLocation) => void;
  onMesaFieldsLocked: (locked: boolean) => void;
  updateActaData: (updates: Partial<ActaData>) => void;
}

export class MesaDataHandler {
  /**
   * Handle mesa data change - auto-populate location and validate
   */
  static async handleMesaDataChange(params: MesaDataChangeParams): Promise<void> {
    const {
      mesa,
      acta,
      electores,
      activeCategory,
      categoryLabel,
      repository,
      mesaElectoralData,
      circunscripcionData,
      selectedJee,
      onLocationUpdate,
      onMesaFieldsLocked,
      updateActaData
    } = params;

    // Check if this mesa number has already been finalized in the current category
    const isFinalized = await repository.isMesaFinalized(mesa, activeCategory);
    if (isFinalized) {
      ToastService.mesaAlreadyFinalized(mesa, categoryLabel);
      return; // Stop processing this mesa number
    }

    // Look up mesa electoral data to auto-populate location fields
    const mesaInfo = GeographicDataService.getMesaElectoralInfo(mesa.toString(), mesaElectoralData);

    // Check if this mesa number exists in any category to get cédulas excedentes and TCV
    const existingCedulasExcedentes = await repository.findCedulasExcedentesByMesa(mesa);
    const existingTcv = await repository.findTcvByMesa(mesa);

    if (mesaInfo) {
      // Auto-populate location fields based on mesa data
      const departamento = mesaInfo.departamento;
      const provincia = mesaInfo.provincia;
      const distrito = mesaInfo.distrito;

      // Determine circunscripción electoral based on category precedence
      let circunscripcionToSet = '';
      const availableOptions = CircunscripcionService.getCircunscripcionElectoralOptions(
        activeCategory,
        circunscripcionData
      );

      // Categories with fixed circunscripción (presidencial, senadoresNacional, parlamentoAndino)
      // take precedence from circunscripcion_electoral_por_categoria.csv
      if (NATIONAL_CATEGORIES.includes(activeCategory)) {
        // Use category-specific circunscripción (e.g., "UNICO NACIONAL")
        if (availableOptions.length === 1) {
          circunscripcionToSet = availableOptions[0];
        }
      } else {
        // For other categories (senadoresRegional, diputados), use mesa data's circunscripción
        circunscripcionToSet = mesaInfo.circunscripcion_electoral || '';
      }

      // Update location state
      onLocationUpdate({
        departamento,
        provincia,
        distrito,
        circunscripcionElectoral: circunscripcionToSet,
        jee: selectedJee
      });

      // Auto-fill TEH from mesa data
      const tehValue = parseInt(mesaInfo.teh) || electores;

      // Lock mesa-related fields (location + TEH) since they were auto-filled
      onMesaFieldsLocked(true);

      // Update category data with mesa info and auto-populated location
      const updates: Partial<ActaData> = {
        mesaNumber: mesa,
        actaNumber: acta,
        totalElectores: tehValue,
        areMesaFieldsLocked: true,
        selectedLocation: {
          departamento,
          provincia,
          distrito,
          jee: selectedJee,
          circunscripcionElectoral: circunscripcionToSet
        }
      };

      // If cédulas excedentes found for this mesa, auto-populate it
      if (existingCedulasExcedentes !== null) {
        updates.cedulasExcedentes = existingCedulasExcedentes;
      }

      // If TCV found for this mesa, auto-populate it
      if (existingTcv !== null) {
        updates.tcv = existingTcv;
      }

      // Show toast notification for auto-completed values
      ToastService.autoCompleted(existingCedulasExcedentes, existingTcv);

      updateActaData(updates);
    } else {
      // Mesa number not found in data - show error message
      ToastService.mesaNotFound(mesa);

      // Still update the mesa data but without auto-populating location
      const updates: Partial<ActaData> = {
        mesaNumber: mesa,
        actaNumber: acta,
        totalElectores: electores
      };

      // If cédulas excedentes found for this mesa, auto-populate it even if mesa not in data
      if (existingCedulasExcedentes !== null) {
        updates.cedulasExcedentes = existingCedulasExcedentes;
      }

      // If TCV found for this mesa, auto-populate it even if mesa not in data
      if (existingTcv !== null) {
        updates.tcv = existingTcv;
      }

      // Show toast notification for auto-completed values
      ToastService.autoCompleted(existingCedulasExcedentes, existingTcv);

      updateActaData(updates);
    }
  }
}
