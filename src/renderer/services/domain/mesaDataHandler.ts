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
  circunscripcionElectoral?: string; // Current circunscripcion electoral for partial recount check
  onLocationUpdate: (location: SelectedLocation) => void;
  onMesaFieldsLocked: (locked: boolean) => void;
  onMesaNumberUpdate: (mesa: number) => void;
  onTotalElectoresUpdate: (teh: number) => void;
  onTcvUpdate: (tcv: number | null) => void;
  onCedulasExcedentesUpdate: (cedulasExcedentes: number) => void;
  actaRepository?: any; // Repository to check for existing TCV and CedulasExcedentes values
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
      mesaElectoralData,
      circunscripcionData,
      selectedJee,
      circunscripcionElectoral,
      onLocationUpdate,
      onMesaFieldsLocked,
      onMesaNumberUpdate,
      onTotalElectoresUpdate,
      onTcvUpdate,
      onCedulasExcedentesUpdate,
      actaRepository
    } = params;

    console.log('[MesaDataHandler.loadMesaInfo] Called with mesa:', mesa);

    // Update mesa number in state (so the input field shows it)
    console.log('[MesaDataHandler.loadMesaInfo] Calling onMesaNumberUpdate with:', mesa);
    onMesaNumberUpdate(mesa);

    // Look up mesa electoral data from CSV
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

      // Check if TCV exists in repository for this mesa in another category
      // CSV is not bounded to entries size, but if mesa is not in repository, TCV will be null (bound to entries.length)
      if (actaRepository) {
        try {
          // Check if partial recount mode is enabled for this circunscripcion
          let isPartialRecount = false;
          if (circunscripcionElectoral) {
            isPartialRecount = await actaRepository.getIsPartialRecount(circunscripcionElectoral);
            console.log('[MesaDataHandler.loadMesaInfo] Partial recount mode:', isPartialRecount);
          }

          if (isPartialRecount) {
            // Force TCV to null for partial recounts
            console.log('[MesaDataHandler.loadMesaInfo] Partial recount mode - TCV forced to null');
            onTcvUpdate(null);
          } else {
            // Normal logic - load TCV from repository if exists
            const tcvFromRepository = await actaRepository.findTcvByMesa(mesa, activeCategory);
            console.log('[MesaDataHandler.loadMesaInfo] TCV from repository:', tcvFromRepository);

            if (tcvFromRepository !== null) {
              // Mesa found in another category - use that TCV value
              console.log('[MesaDataHandler.loadMesaInfo] Setting TCV from repository:', tcvFromRepository);
              onTcvUpdate(tcvFromRepository);
            } else {
              // Mesa not found in repository - TCV will remain null (bound to entries.length)
              console.log('[MesaDataHandler.loadMesaInfo] Mesa not found in repository, TCV will be bound to entries.length');
              onTcvUpdate(null);
            }
          }
        } catch (error) {
          console.error('[MesaDataHandler.loadMesaInfo] Error loading TCV from repository:', error);
          onTcvUpdate(null);
        }

        // Check if CedulasExcedentes exists in repository for this mesa in another category
        try {
          const cedulasExcedentesFromRepository = await actaRepository.findCedulasExcedentesByMesa(mesa, activeCategory);
          console.log('[MesaDataHandler.loadMesaInfo] CedulasExcedentes from repository:', cedulasExcedentesFromRepository);

          if (cedulasExcedentesFromRepository !== null) {
            // Mesa found in another category - use that CedulasExcedentes value
            console.log('[MesaDataHandler.loadMesaInfo] Setting CedulasExcedentes from repository:', cedulasExcedentesFromRepository);
            onCedulasExcedentesUpdate(cedulasExcedentesFromRepository);
          } else {
            // Mesa not found in repository - CedulasExcedentes defaults to 0
            console.log('[MesaDataHandler.loadMesaInfo] Mesa not found in repository, CedulasExcedentes defaults to 0');
            onCedulasExcedentesUpdate(0);
          }
        } catch (error) {
          console.error('[MesaDataHandler.loadMesaInfo] Error loading CedulasExcedentes from repository:', error);
          onCedulasExcedentesUpdate(0);
        }
      } else {
        // No repository provided - defaults
        onTcvUpdate(null);
        onCedulasExcedentesUpdate(0);
      }

      ToastService.success(`Datos de mesa ${mesa.toString().padStart(6, '0')} cargados`, '400px', 2000);
    } else {
      ToastService.mesaNotFound(mesa);
      // Mesa not found in CSV - defaults
      onTcvUpdate(null);
      onCedulasExcedentesUpdate(0);
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
      updateActaData
    } = params;

    console.log('[MesaDataHandler.handleMesaDataChange] Called with:', {
      mesa,
      acta,
      electores
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
