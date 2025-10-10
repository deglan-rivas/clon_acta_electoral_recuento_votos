// Service for handling mesa data changes and auto-population logic
import type { ActaData, MesaElectoralRecord, SelectedLocation } from '../../types/acta.types';
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
  updateActaData: (updates: Partial<ActaData>) => void;
}

export interface LoadMesaInfoParams {
  mesa: number;
  activeCategory: string;
  mesaElectoralData: MesaElectoralRecord[];
  circunscripcionData: any[];
  selectedJee: string;
  onLocationUpdate: (location: SelectedLocation) => void;
  onMesaFieldsLocked: (locked: boolean) => void;
  onMesaNumberUpdate: (mesa: number) => void;
  onTotalElectoresUpdate: (teh: number) => void;
}

export class MesaDataHandler {
  /**
   * Load mesa info and auto-populate fields (no localStorage save)
   * Called when user enters a 6-digit mesa number
   */
  static async loadMesaInfo(params: LoadMesaInfoParams): Promise<void> {
    const {
      mesa,
      activeCategory,
      repository,
      mesaElectoralData,
      circunscripcionData,
      selectedJee,
      onLocationUpdate,
      onMesaFieldsLocked,
      onMesaNumberUpdate,
      onTotalElectoresUpdate
    } = params;

    console.log('[MesaDataHandler.loadMesaInfo] Called with mesa:', mesa);

    // Update mesa number in state (so the input field shows it)
    console.log('[MesaDataHandler.loadMesaInfo] Calling onMesaNumberUpdate with:', mesa);
    onMesaNumberUpdate(mesa);

    // Look up mesa electoral data
    const mesaInfo = GeographicDataService.getMesaElectoralInfo(mesa.toString(), mesaElectoralData);

    if (mesaInfo) {
      // Auto-populate location fields based on mesa data
      const departamento = mesaInfo.departamento;
      const provincia = mesaInfo.provincia;
      const distrito = mesaInfo.distrito;

      // Determine circunscripción electoral based on category
      let circunscripcionToSet = '';
      const availableOptions = CircunscripcionService.getCircunscripcionElectoralOptions(
        activeCategory,
        circunscripcionData
      );

      if (NATIONAL_CATEGORIES.includes(activeCategory)) {
        if (availableOptions.length === 1) {
          circunscripcionToSet = availableOptions[0];
        }
      } else {
        circunscripcionToSet = mesaInfo.circunscripcion_electoral || '';
      }

      // Update location state (not saved yet)
      console.log('[MesaDataHandler.loadMesaInfo] Calling onLocationUpdate with:', {
        departamento,
        provincia,
        distrito,
        circunscripcionElectoral: circunscripcionToSet,
        jee: selectedJee
      });
      onLocationUpdate({
        departamento,
        provincia,
        distrito,
        circunscripcionElectoral: circunscripcionToSet,
        jee: selectedJee
      });

      // Auto-fill TEH from mesa data
      const tehValue = parseInt(mesaInfo.teh) || 0;
      console.log('[MesaDataHandler.loadMesaInfo] Calling onTotalElectoresUpdate with:', tehValue);
      onTotalElectoresUpdate(tehValue);

      // Lock mesa-related fields since they were auto-filled
      console.log('[MesaDataHandler.loadMesaInfo] Calling onMesaFieldsLocked with: true');
      onMesaFieldsLocked(true);

      ToastService.success(`Datos de mesa ${mesa.toString().padStart(6, '0')} cargados`, '400px', 2000);
    } else {
      ToastService.mesaNotFound(mesa);
    }
  }

  /**
   * Save mesa data (updates are now synchronous with Zustand)
   * Called when "Iniciar" button is clicked
   * Note: Mesa info (location, TEH) should already be loaded via loadMesaInfo()
   */
  static async handleMesaDataChange(params: MesaDataChangeParams): Promise<void> {
    const {
      mesa,
      acta,
      electores,
      activeCategory,
      categoryLabel,
      updateActaData
    } = params;

    console.log('[MesaDataHandler.handleMesaDataChange] Called with:', {
      mesa,
      acta,
      electores,
      activeCategory
    });

    // Note: Mesa finalization check is now done in ActaHeaderPanel
    // before calling this function

    // Update mesa data - synchronous with Zustand!
    const updates: Partial<ActaData> = {
      mesaNumber: mesa,
      actaNumber: acta,
      totalElectores: electores
    };

    console.log('[MesaDataHandler.handleMesaDataChange] Updates to apply:', updates);
    console.log('[MesaDataHandler.handleMesaDataChange] Calling updateActaData (synchronous)');
    updateActaData(updates);
  }
}
