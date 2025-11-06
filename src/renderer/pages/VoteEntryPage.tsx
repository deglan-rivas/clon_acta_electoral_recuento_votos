// VoteEntryPage - Refactored version with clean separation of concerns
// Main page orchestrator for vote entry workflow

import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { ActaHeaderPanel } from "../components/electoral/ActaHeaderPanel";
import { ActaTimerDisplay } from "../components/electoral/ActaTimerDisplay";
import { ActaRankingPanel } from "../components/electoral/ActaRankingPanel";
import { VoteEntryTable } from "../components/electoral/VoteEntryTable";
import {
  type VoteEntry,
  type VoteLimits,
  type PreferentialConfig,
  type SelectedLocation,
  type MesaElectoralInfo,
  type JeeRecord,
  type JeeMiembroRecord
} from "../types";
import { type PoliticalOrganization } from "../types";
import { useActaRepository } from "../hooks/useActaRepository";
import { getCategoryColors } from "../utils/categoryColors";
import { ToastService } from "../services/ui/toastService";
import { validateMesaData } from "../services/domain/mesaValidationService";
import { generatePdfByElectionType } from "../services/pdf/pdfGeneratorFactory";
import type { ElectionType } from "../services/pdf/types/pdfTypes";
import { PREFERENTIAL_VOTE_CONFIG } from "../config/electoralCategories";

// Component Props Interfaces
interface VoteEntryPageProps {
  category: string;
  categoryLabel?: string;
  existingEntries?: VoteEntry[];
  voteLimits: VoteLimits;
  preferentialConfig: PreferentialConfig;
  onEntriesChange: (entries: VoteEntry[]) => void;
  mesaNumber: number;
  actaNumber: string;
  totalElectores: number;
  cedulasExcedentes: number;
  tcv: number | null;
  counterMesa: number | null;
  onCedulasExcedentesChange: (value: number) => void;
  onTcvChange: (value: number | null) => void;
  onCounterMesaChange?: (value: number | null) => void;
  onAreMesaFieldsLockedChange?: (value: boolean) => void;
  selectedLocation: SelectedLocation;
  circunscripcionElectoral: string;
  onLoadMesaInfo: (mesa: number) => void; // Load mesa data from CSV (no save)
  onMesaDataChange: (mesa: number, acta: string, electores: number) => void; // Save to localStorage
  onJeeChange: (jee: string) => void;
  onDepartamentoChange: (value: string) => void;
  onProvinciaChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
  onCircunscripcionElectoralChange?: (value: string) => void;
  onSelectedLocationChange?: (location: SelectedLocation) => void;
  getDepartamentos: () => string[];
  getProvincias: (departamento: string) => string[];
  getDistritos: (departamento: string, provincia: string) => string[];
  isInternationalLocation: boolean;
  jeeOptions: JeeRecord[];
  jeeMiembrosData: JeeMiembroRecord[];
  mesaElectoralInfo?: MesaElectoralInfo | null;
  isFormFinalized?: boolean;
  onFormFinalizedChange?: (isFinalized: boolean) => void;
  isMesaDataSaved?: boolean;
  onMesaDataSavedChange?: (isSaved: boolean) => void;
  isConformidadDownloaded?: boolean;
  onConformidadDownloadedChange?: (isDownloaded: boolean) => void;
  areMesaFieldsLocked?: boolean;
  startTime: Date | null;
  endTime: Date | null;
  currentTime: Date;
  isPaused?: boolean;
  pausedDuration?: number;
  lastPauseTime?: Date | null;
  onStartTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  onCurrentTimeChange: (time: Date) => void;
  onPausedChange?: (isPaused: boolean) => void;
  onPausedDurationChange?: (duration: number) => void;
  onLastPauseTimeChange?: (time: Date | null) => void;
  onViewSummary: () => void;
  onCreateNewActa?: () => void;
  onSwitchToActa?: (index: number) => void;
  categoryActas?: any[];
  currentActaIndex?: number;
  politicalOrganizations: PoliticalOrganization[];
  settingsReloadTrigger?: number;
  onSettingsReloadTrigger?: () => void;
  isMesaAlreadyFinalized?: (mesaNumber: number) => boolean;
  onSaveActa?: () => Promise<void>;
}

export function VoteEntryPage(props: VoteEntryPageProps) {
  const {
    category,
    categoryLabel,
    existingEntries = [],
    voteLimits,
    preferentialConfig,
    onEntriesChange,
    mesaNumber,
    actaNumber,
    totalElectores,
    cedulasExcedentes,
    tcv,
    counterMesa,
    onCedulasExcedentesChange,
    onTcvChange,
    onCounterMesaChange,
    onAreMesaFieldsLockedChange,
    selectedLocation,
    circunscripcionElectoral,
    onLoadMesaInfo,
    onMesaDataChange,
    onJeeChange,
    onDepartamentoChange,
    onProvinciaChange,
    onDistritoChange,
    onCircunscripcionElectoralChange,
    onSelectedLocationChange,
    getDepartamentos,
    getProvincias,
    getDistritos,
    isInternationalLocation,
    jeeOptions,
    jeeMiembrosData,
    isFormFinalized: externalIsFormFinalized,
    onFormFinalizedChange,
    isMesaDataSaved: externalIsMesaDataSaved,
    onMesaDataSavedChange,
    isConformidadDownloaded: externalIsConformidadDownloaded,
    onConformidadDownloadedChange,
    areMesaFieldsLocked = false,
    startTime,
    endTime,
    currentTime,
    isPaused: externalIsPaused,
    pausedDuration = 0,
    lastPauseTime,
    onStartTimeChange,
    onEndTimeChange,
    onCurrentTimeChange,
    onPausedChange,
    onPausedDurationChange,
    onLastPauseTimeChange,
    onCreateNewActa,
    onSwitchToActa,
    categoryActas = [],
    currentActaIndex = 0,
    politicalOrganizations,
    settingsReloadTrigger = 0,
    onSettingsReloadTrigger,
    isMesaAlreadyFinalized,
    onSaveActa,
  } = props;

  const repository = useActaRepository();

  // Get category-specific color theme
  const categoryColors = getCategoryColors(category);

  // State management
  const [entries, setEntries] = useState<VoteEntry[]>(existingEntries);
  const [localIsFormFinalized, setLocalIsFormFinalized] = useState<boolean>(false);
  const [localIsMesaDataSaved, setLocalIsMesaDataSaved] = useState<boolean>(false);
  const [localIsConformidadDownloaded, setLocalIsConformidadDownloaded] = useState<boolean>(false);
  const [localIsPaused, setLocalIsPaused] = useState<boolean>(false);
  const [selectedOrganizationKeys, setSelectedOrganizationKeys] = useState<string[]>([]);
  const [isPartialRecount, setIsPartialRecount] = useState<boolean>(false);

  const isFormFinalized = externalIsFormFinalized !== undefined ? externalIsFormFinalized : localIsFormFinalized;
  const isMesaDataSaved = externalIsMesaDataSaved !== undefined ? externalIsMesaDataSaved : localIsMesaDataSaved;
  const isConformidadDownloaded = externalIsConformidadDownloaded !== undefined ? externalIsConformidadDownloaded : localIsConformidadDownloaded;
  const isPaused = externalIsPaused !== undefined ? externalIsPaused : localIsPaused;

  // Load selected organizations from repository (filtered by category)
  useEffect(() => {
    const loadOrganizations = async () => {
      let orgKeys: string[] = [];

      if (circunscripcionElectoral) {
        // Check if current category supports preferential voting
        const hasPreferentialVotes = PREFERENTIAL_VOTE_CONFIG[category]?.hasPreferential1 || PREFERENTIAL_VOTE_CONFIG[category]?.hasPreferential2;

        // Check if partial recount mode is enabled
        const isPartial = await repository.getIsPartialRecount(circunscripcionElectoral);

        // Only apply partial recount if category supports preferential voting
        if (isPartial && hasPreferentialVotes) {
          // Load from partial recount organizations key (filtered by category)
          orgKeys = await repository.getPartialRecountOrganizations(circunscripcionElectoral, category);
        } else {
          // Load from full circunscripcion organizations key (CSV data, filtered by category)
          orgKeys = await repository.getCircunscripcionOrganizations(circunscripcionElectoral, category);
        }
      } else {
        orgKeys = await repository.getSelectedOrganizations();
      }

      setSelectedOrganizationKeys(orgKeys);
    };
    loadOrganizations();
  }, [circunscripcionElectoral, repository, settingsReloadTrigger, category]);

  // Load partial recount mode from repository and reset TCV if needed
  useEffect(() => {
    const loadPartialRecountMode = async () => {
      if (circunscripcionElectoral) {
        // Check if current category supports preferential voting
        const hasPreferentialVotes = PREFERENTIAL_VOTE_CONFIG[category]?.hasPreferential1 || PREFERENTIAL_VOTE_CONFIG[category]?.hasPreferential2;

        const isPartial = await repository.getIsPartialRecount(circunscripcionElectoral);

        // Only set partial recount if category supports preferential voting
        const effectiveIsPartial = isPartial && hasPreferentialVotes;

        console.log('[VoteEntryPage.loadPartialRecountMode] ========== PARTIAL RECOUNT LOADING ==========');
        console.log('[VoteEntryPage.loadPartialRecountMode] circunscripcionElectoral:', circunscripcionElectoral);
        console.log('[VoteEntryPage.loadPartialRecountMode] category:', category);
        console.log('[VoteEntryPage.loadPartialRecountMode] hasPreferentialVotes:', hasPreferentialVotes);
        console.log('[VoteEntryPage.loadPartialRecountMode] isPartial from repository:', isPartial);
        console.log('[VoteEntryPage.loadPartialRecountMode] effectiveIsPartial:', effectiveIsPartial);
        console.log('[VoteEntryPage.loadPartialRecountMode] ===================================================');

        setIsPartialRecount(effectiveIsPartial);

        // Reset TCV to null when partial recount is enabled
        if (effectiveIsPartial && tcv !== null) {
          console.log('[VoteEntryPage] Partial recount enabled - resetting TCV to null');
          onTcvChange(null);
        }
      } else {
        setIsPartialRecount(false);
      }
    };
    loadPartialRecountMode();
  }, [circunscripcionElectoral, repository, settingsReloadTrigger, tcv, onTcvChange, category]);

  const availableOrganizations = (politicalOrganizations || []).filter(org =>
    selectedOrganizationKeys.includes(org.key)
  );

  // Update local entries when existingEntries change (category switch)
  useEffect(() => {
    setEntries(existingEntries);
  }, [existingEntries]);

  // Report entries changes to parent component
  const updateEntries = (newEntries: VoteEntry[]) => {
    console.log('[VoteEntryPage.updateEntries] ========== TCV UPDATE DEBUG ==========');
    console.log('[VoteEntryPage.updateEntries] Category:', category);
    console.log('[VoteEntryPage.updateEntries] New entries length:', newEntries.length);
    console.log('[VoteEntryPage.updateEntries] Current TCV:', tcv);
    console.log('[VoteEntryPage.updateEntries] isMesaDataSaved:', isMesaDataSaved);
    console.log('[VoteEntryPage.updateEntries] counterMesa:', counterMesa);
    console.log('[VoteEntryPage.updateEntries] isPartialRecount:', isPartialRecount);

    setEntries(newEntries);
    onEntriesChange(newEntries);

    // Auto-update TCV in localStorage when entries change
    // ONLY when this is the FIRST time counting this mesa (counterMesa === 1)
    // EXCEPT for partial recounts where TCV must remain null
    // When counterMesa > 1, TCV is loaded from previous election type and should NOT update
    // For first-time counting, always keep TCV in sync with entries count (no need to check if tcv === null)
    const shouldUpdateTcv = isMesaDataSaved && counterMesa !== null && counterMesa === 1 && !isPartialRecount;
    console.log('[VoteEntryPage.updateEntries] Should update TCV?', shouldUpdateTcv);
    console.log('[VoteEntryPage.updateEntries] Condition breakdown:');
    console.log('[VoteEntryPage.updateEntries]   - isMesaDataSaved:', isMesaDataSaved);
    console.log('[VoteEntryPage.updateEntries]   - counterMesa !== null:', counterMesa !== null);
    console.log('[VoteEntryPage.updateEntries]   - counterMesa === 1:', counterMesa === 1);
    console.log('[VoteEntryPage.updateEntries]   - !isPartialRecount:', !isPartialRecount);

    if (shouldUpdateTcv) {
      console.log('[VoteEntryPage.updateEntries] ✅ Auto-updating TCV to:', newEntries.length, '(counterMesa:', counterMesa, ')');
      onTcvChange(newEntries.length);
    } else {
      console.log('[VoteEntryPage.updateEntries] ❌ NOT updating TCV - conditions not met');
    }
    console.log('[VoteEntryPage.updateEntries] ==========================================');
  };

  // Handle save mesa data with validations
  const handleSaveMesaData = async () => {
    console.log('[VoteEntryPage.handleSaveMesaData] Called');

    const validationResult = validateMesaData({
      selectedLocation,
      circunscripcionElectoral,
      selectedOrganizationKeys,
      availableOrganizations,
    });

    if (!validationResult.isValid) {
      ToastService.error(
        validationResult.errorMessage || 'Error de validación',
        validationResult.errorWidth || '450px',
        4000
      );
      return;
    }

    // Capture start time
    const now = new Date();
    console.log('[VoteEntryPage.handleSaveMesaData] Setting start time:', now);
    onStartTimeChange(now);
    onCurrentTimeChange(now);

    // Initialize TCV to 0 for first-time counting (counterMesa === 1)
    // For reused mesas (counterMesa > 1), TCV is already loaded from previous count
    // For partial recounts, TCV remains null
    console.log('[VoteEntryPage.handleSaveMesaData] ========== TCV INITIALIZATION DEBUG ==========');
    console.log('[VoteEntryPage.handleSaveMesaData] Category:', category);
    console.log('[VoteEntryPage.handleSaveMesaData] Current TCV:', tcv);
    console.log('[VoteEntryPage.handleSaveMesaData] counterMesa:', counterMesa);
    console.log('[VoteEntryPage.handleSaveMesaData] isPartialRecount:', isPartialRecount);

    // Only initialize if it's null (not already initialized). This prevents overwriting TCV=0 with entries.
    const shouldInitializeTcv = counterMesa !== null && counterMesa === 1 && !isPartialRecount && tcv === null;
    console.log('[VoteEntryPage.handleSaveMesaData] Should initialize TCV?', shouldInitializeTcv);
    console.log('[VoteEntryPage.handleSaveMesaData] Condition breakdown:');
    console.log('[VoteEntryPage.handleSaveMesaData]   - counterMesa !== null:', counterMesa !== null);
    console.log('[VoteEntryPage.handleSaveMesaData]   - counterMesa === 1:', counterMesa === 1);
    console.log('[VoteEntryPage.handleSaveMesaData]   - !isPartialRecount:', !isPartialRecount);
    console.log('[VoteEntryPage.handleSaveMesaData]   - tcv === null:', tcv === null);

    if (shouldInitializeTcv) {
      console.log('[VoteEntryPage.handleSaveMesaData] ✅ Initializing TCV to 0 for first-time counting');
      onTcvChange(0);
    } else {
      console.log('[VoteEntryPage.handleSaveMesaData] ❌ NOT initializing TCV - already set or not applicable');
    }
    console.log('[VoteEntryPage.handleSaveMesaData] ================================================');

    // Update saved state
    console.log('[VoteEntryPage.handleSaveMesaData] Setting isMesaDataSaved to true');
    if (onMesaDataSavedChange) {
      onMesaDataSavedChange(true);
    } else {
      setLocalIsMesaDataSaved(true);
    }

    // Save to repository
    console.log('[VoteEntryPage.handleSaveMesaData] Calling onSaveActa');
    if (onSaveActa) {
      await onSaveActa();
    }

    ToastService.success("Datos de mesa guardados exitosamente");
  };

  // Handle reinicializar - clear ALL acta data to start from scratch
  const handleReinicializar = async () => {
    // Show confirmation dialog using Electron dialog API
    const result = await window.api.showConfirmDialog(
      'Acta Electoral Recuento Votos',
      '¿Está seguro que desea reiniciar completamente el acta?',
      `Esta acción eliminará TODOS los datos del acta actual:\n` +
      `- ${entries.length} votos ingresados\n` +
      `- Datos de mesa (N° Mesa, N° Acta, JEE, Ubicación)\n` +
      `El acta volverá a estado inicial completamente limpio.\n` +
      `Esta operación NO se puede deshacer.`
    );

    if (!result.confirmed) {
      return;
    }

    console.log("Reiniciando acta completamente...");

    // Clear all vote entries
    updateEntries([]);

    // Clear timer data
    console.log('[VoteEntryPage.handleReinicializar] Clearing all timer data');
    onStartTimeChange(null);
    onEndTimeChange(null);
    onCurrentTimeChange(new Date());

    // Clear pause-related data
    console.log('[VoteEntryPage.handleReinicializar] Clearing pause data');
    if (onPausedChange) {
      onPausedChange(false);
    } else {
      setLocalIsPaused(false);
    }

    if (onPausedDurationChange) {
      onPausedDurationChange(0);
    }

    if (onLastPauseTimeChange) {
      onLastPauseTimeChange(null);
    }

    // Clear acta-related data (TCV, Cédulas Excedentes)
    console.log('[VoteEntryPage.handleReinicializar] Clearing acta data');
    onTcvChange(null);
    onCedulasExcedentesChange(0);

    // Clear form states
    console.log('[VoteEntryPage.handleReinicializar] Clearing form states');
    if (onFormFinalizedChange) {
      onFormFinalizedChange(false);
    } else {
      setLocalIsFormFinalized(false);
    }

    if (onMesaDataSavedChange) {
      onMesaDataSavedChange(false);
    } else {
      setLocalIsMesaDataSaved(false);
    }

    if (onConformidadDownloadedChange) {
      onConformidadDownloadedChange(false);
    } else {
      setLocalIsConformidadDownloaded(false);
    }

    // Clear location data (both individual handlers AND selectedLocation object)
    console.log('[VoteEntryPage.handleReinicializar] Clearing location data');
    onJeeChange('');
    onDepartamentoChange('');
    onProvinciaChange('');
    onDistritoChange('');
    if (onCircunscripcionElectoralChange) {
      onCircunscripcionElectoralChange('');
    }

    // Directly clear selectedLocation in acta data to ensure it's persisted
    if (onSelectedLocationChange) {
      onSelectedLocationChange({
        jee: '',
        departamento: '',
        provincia: '',
        distrito: '',
        circunscripcionElectoral: ''
      });
    }

    // Reset mesa data (this will trigger unlock of mesa fields)
    console.log('[VoteEntryPage.handleReinicializar] Clearing mesa data');
    onMesaDataChange(0, '', 0);

    // Clear counterMesa
    if (onCounterMesaChange) {
      console.log('[VoteEntryPage.handleReinicializar] Clearing counterMesa');
      onCounterMesaChange(null);
    }

    // Unlock mesa fields
    if (onAreMesaFieldsLockedChange) {
      console.log('[VoteEntryPage.handleReinicializar] Unlocking mesa fields');
      onAreMesaFieldsLockedChange(false);
    }

    // Save the cleared state
    if (onSaveActa) {
      await onSaveActa();
    }

    ToastService.success("Recuento reiniciado correctamente. Puede comenzar un nuevo recuento desde cero.", '600px', 3000);
  };

  // Handle finalize form - disable all inputs permanently
  const handleFinalizeForm = async () => {
    // Validate that there are entries
    if (entries.length === 0) {
      ToastService.error("No se puede finalizar el recuento sin votos registrados. Ingrese al menos un voto.", '500px', 4000);
      return;
    }

    // Validate TCV matches entries when mesa is reused (counterMesa > 1)
    // Skip validation for partial recounts (isPartialRecount = true)
    // Skip validation for first-time counting (counterMesa === 1) - TCV auto-updates
    // If counterMesa > 1, TCV was loaded from previous count, so entries must match
    if (!isPartialRecount && counterMesa !== null && counterMesa > 1 && tcv !== null && entries.length !== tcv) {
      ToastService.error(
        `El número de votos ingresados ${entries.length} no coincide con el TCV esperado ${tcv}.`,
        '550px',
        5000
      );
      return;
    }

    // Show confirmation dialog using Electron dialog API
    const result = await window.api.showConfirmDialog(
      'Acta Electoral Recuento Votos',
      '¿Está seguro que desea finalizar el recuento de votos?',
      `Mesa: ${mesaNumber.toString().padStart(6, '0')}\n` +
      `Acta: ${actaNumber}\n` +
      `Total de votos: ${entries.length}\n\n` +
      `Una vez finalizada, no podrá realizar más cambios.\n` +
      `Esta operación NO se puede deshacer.`
    );

    if (!result.confirmed) {
      return;
    }

    console.log("Finalizando formulario...");
    const now = new Date();

    // With Zustand, all updates are SYNCHRONOUS - no delay needed! ✅
    onEndTimeChange(now); // Capture end time (instant with Zustand)

    // TCV is already being auto-updated in updateEntries() for first-time counting (counterMesa === 1)
    // For reused mesas (counterMesa > 1), TCV was preloaded and should not change
    // For partial recounts, TCV must remain null
    // No need to update TCV here anymore - it's handled automatically!

    // If partial recount mode is enabled, disable it when finalizing
    if (isPartialRecount && circunscripcionElectoral) {
      console.log('[VoteEntryPage.handleFinalizeForm] Disabling partial recount mode for:', circunscripcionElectoral);
      await repository.saveIsPartialRecount(circunscripcionElectoral, false);
      // Update local state to hide the badge immediately
      setIsPartialRecount(false);
      // Trigger reload in AppContainer to update the badge in AppHeader
      if (onSettingsReloadTrigger) {
        onSettingsReloadTrigger();
      }
    }

    // Update isFormFinalized in parent state
    if (onFormFinalizedChange) {
      onFormFinalizedChange(true); // Instant with Zustand
    } else {
      setLocalIsFormFinalized(true);
    }

    // NO DELAY NEEDED! Zustand updates are synchronous ✅
    // State is already updated and persisted automatically

    // Save hook (now a no-op with Zustand, kept for compatibility)
    if (onSaveActa) {
      await onSaveActa();
    }

    ToastService.success("Recuento finalizado correctamente", '400px', 3000);
  };

  // Handle pause counting
  const handlePauseCounting = () => {
    console.log('[VoteEntryPage.handlePauseCounting] Pausing session');

    // Record the pause start time
    const now = new Date();
    if (onLastPauseTimeChange) {
      onLastPauseTimeChange(now);
    }

    if (onPausedChange) {
      onPausedChange(true);
    } else {
      setLocalIsPaused(true);
    }

    // Save the paused state
    if (onSaveActa) {
      onSaveActa();
    }

    ToastService.info("Sesión pausada. El temporizador y la entrada de votos están detenidos.", '500px', 3000);
  };

  // Handle resume counting
  const handleResumeCounting = () => {
    console.log('[VoteEntryPage.handleResumeCounting] Resuming session');

    // Calculate how long we were paused and add to cumulative paused duration
    const now = new Date();

    if (lastPauseTime) {
      const pauseDuration = now.getTime() - lastPauseTime.getTime();
      const newPausedDuration = pausedDuration + pauseDuration;

      console.log('[VoteEntryPage.handleResumeCounting] Pause duration:', pauseDuration, 'ms');
      console.log('[VoteEntryPage.handleResumeCounting] New cumulative paused duration:', newPausedDuration, 'ms');

      if (onPausedDurationChange) {
        onPausedDurationChange(newPausedDuration);
      }

      // Clear the pause start time
      if (onLastPauseTimeChange) {
        onLastPauseTimeChange(null);
      }
    }

    if (onPausedChange) {
      onPausedChange(false);
    } else {
      setLocalIsPaused(false);
    }

    // Save the resumed state
    if (onSaveActa) {
      onSaveActa();
    }

    ToastService.success("Sesión reanudada. Puede continuar ingresando votos.", '450px', 3000);
  };

  // Handle PDF generation based on category
  const handleVerActa = async () => {
    const finalizationTime = endTime || new Date();

    // Get JEE ID from jeeOptions by matching the JEE name
    const jeeRecord = jeeOptions.find(jee => jee.jee === selectedLocation.jee);
    const jeeId = jeeRecord?.id || '';

    const pdfData = {
      entries,
      politicalOrganizations,
      selectedOrganizationKeys,
      mesaNumber,
      actaNumber,
      totalElectores,
      tcv,
      cedulasExcedentes,
      selectedLocation,
      startTime,
      endTime: finalizationTime,
      isInternationalLocation, // Pass international location flag to PDF generator
      isPartialRecount, // Pass partial recount flag to PDF generator
      jeeMiembrosData, // Pass JEE members data
      jeeId, // Pass JEE ID for filtering members
    };

    console.log('[VoteEntryPage] PDF Generation - isInternationalLocation:', isInternationalLocation);
    console.log('[VoteEntryPage] PDF Generation - Category:', category);
    console.log('[VoteEntryPage] PDF Generation - JEE ID:', jeeId);
    console.log('[VoteEntryPage] PDF Data:', pdfData);

    try {
      // Use factory method for all PDF generation
      await generatePdfByElectionType(category as ElectionType, pdfData);
      ToastService.success("PDF generado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);

      // Check if it's a "not implemented" error
      if (error instanceof Error && error.message.includes('not yet implemented')) {
        ToastService.info(error.message, '500px');
      } else {
        ToastService.error("Error al generar el PDF");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Mesa Data Entry Section */}
      <Card>
        <CardContent className="p-4 [&:last-child]:pb-4">
          <div className="space-y-4">
            {/* Header Panel with Mesa Info and Action Buttons */}
            <div className="flex justify-between items-center">
              <ActaHeaderPanel
                mesaNumber={mesaNumber}
                actaNumber={actaNumber}
                totalElectores={totalElectores}
                tcv={tcv}
                entriesLength={entries.length}
                isPartialRecount={isPartialRecount}
                selectedLocation={selectedLocation}
                isInternationalLocation={isInternationalLocation}
                areMesaFieldsLocked={areMesaFieldsLocked}
                isMesaDataSaved={isMesaDataSaved}
                isFormFinalized={isFormFinalized}
                isPaused={isPaused}
                isConformidadDownloaded={isConformidadDownloaded}
                categoryActas={categoryActas}
                currentActaIndex={currentActaIndex}
                activeCategory={category}
                categoryColors={categoryColors}
                jeeOptions={jeeOptions}
                jeeMiembrosData={jeeMiembrosData}
                getDepartamentos={getDepartamentos}
                getProvincias={getProvincias}
                getDistritos={getDistritos}
                onLoadMesaInfo={onLoadMesaInfo}
                onMesaDataChange={onMesaDataChange}
                onJeeChange={onJeeChange}
                onDepartamentoChange={onDepartamentoChange}
                onProvinciaChange={onProvinciaChange}
                onDistritoChange={onDistritoChange}
                onSaveMesaData={handleSaveMesaData}
                onFinalizeForm={handleFinalizeForm}
                onPauseCounting={handlePauseCounting}
                onResumeCounting={handleResumeCounting}
                onReinicializar={handleReinicializar}
                onVerActa={handleVerActa}
                onCreateNewActa={onCreateNewActa}
                onSwitchToActa={onSwitchToActa}
                isMesaAlreadyFinalized={isMesaAlreadyFinalized}
                onConformidadDownloaded={() => {
                  if (onConformidadDownloadedChange) {
                    onConformidadDownloadedChange(true);
                  } else {
                    setLocalIsConformidadDownloaded(true);
                  }
                }}
              />

              {/* Timer Display */}
              <ActaTimerDisplay
                startTime={startTime}
                endTime={endTime}
                currentTime={currentTime}
                isPaused={isPaused}
                pausedDuration={pausedDuration}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side layout: Ranking on left (4/12), Table on right (8/12) */}
      <div className="grid grid-cols-12 gap-6 w-full">
        {/* Ranking Panel - Left Side (4/12 width) */}
        <div className="col-span-4">
          <ActaRankingPanel
            entries={entries}
            organizations={politicalOrganizations}
            categoryColors={categoryColors}
            categoryLabel={categoryLabel}
          />
        </div>

        {/* Vote Entry Table - Right Side (8/12 width) */}
        <VoteEntryTable
          entries={entries}
          availableOrganizations={availableOrganizations}
          voteLimits={voteLimits}
          preferentialConfig={preferentialConfig}
          totalElectores={totalElectores}
          cedulasExcedentes={cedulasExcedentes}
          tcv={tcv}
          counterMesa={counterMesa}
          mesaNumber={mesaNumber}
          activeCategory={category}
          isFormFinalized={isFormFinalized}
          isMesaDataSaved={isMesaDataSaved}
          isPaused={isPaused}
          categoryColors={categoryColors}
          onEntriesChange={updateEntries}
          onCedulasExcedentesChange={onCedulasExcedentesChange}
          onSaveActa={onSaveActa}
        />
      </div>
    </div>
  );
}
