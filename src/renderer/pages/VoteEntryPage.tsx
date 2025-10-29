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
  onCedulasExcedentesChange: (value: number) => void;
  onTcvChange: (value: number | null) => void;
  selectedLocation: SelectedLocation;
  circunscripcionElectoral: string;
  onLoadMesaInfo: (mesa: number) => void; // Load mesa data from CSV (no save)
  onMesaDataChange: (mesa: number, acta: string, electores: number) => void; // Save to localStorage
  onJeeChange: (jee: string) => void;
  onDepartamentoChange: (value: string) => void;
  onProvinciaChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
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
  onStartTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  onCurrentTimeChange: (time: Date) => void;
  onViewSummary: () => void;
  onCreateNewActa?: () => void;
  onSwitchToActa?: (index: number) => void;
  categoryActas?: any[];
  currentActaIndex?: number;
  politicalOrganizations: PoliticalOrganization[];
  settingsReloadTrigger?: number;
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
    onCedulasExcedentesChange,
    onTcvChange,
    selectedLocation,
    circunscripcionElectoral,
    onLoadMesaInfo,
    onMesaDataChange,
    onJeeChange,
    onDepartamentoChange,
    onProvinciaChange,
    onDistritoChange,
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
    onStartTimeChange,
    onEndTimeChange,
    onCurrentTimeChange,
    onCreateNewActa,
    onSwitchToActa,
    categoryActas = [],
    currentActaIndex = 0,
    politicalOrganizations,
    settingsReloadTrigger = 0,
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
  const [selectedOrganizationKeys, setSelectedOrganizationKeys] = useState<string[]>([]);
  const [isPartialRecount, setIsPartialRecount] = useState<boolean>(false);

  const isFormFinalized = externalIsFormFinalized !== undefined ? externalIsFormFinalized : localIsFormFinalized;
  const isMesaDataSaved = externalIsMesaDataSaved !== undefined ? externalIsMesaDataSaved : localIsMesaDataSaved;
  const isConformidadDownloaded = externalIsConformidadDownloaded !== undefined ? externalIsConformidadDownloaded : localIsConformidadDownloaded;

  // Load selected organizations from repository
  useEffect(() => {
    const loadOrganizations = async () => {
      let orgKeys: string[] = [];

      if (circunscripcionElectoral) {
        // Check if partial recount mode is enabled
        const isPartial = await repository.getIsPartialRecount(circunscripcionElectoral);

        if (isPartial) {
          // Load from partial recount organizations key
          orgKeys = await repository.getPartialRecountOrganizations(circunscripcionElectoral);
        } else {
          // Load from full circunscripcion organizations key (CSV data)
          orgKeys = await repository.getCircunscripcionOrganizations(circunscripcionElectoral);
        }
      } else {
        orgKeys = await repository.getSelectedOrganizations();
      }

      setSelectedOrganizationKeys(orgKeys);
    };
    loadOrganizations();
  }, [circunscripcionElectoral, repository, settingsReloadTrigger]);

  // Load partial recount mode from repository and reset TCV if needed
  useEffect(() => {
    const loadPartialRecountMode = async () => {
      if (circunscripcionElectoral) {
        const isPartial = await repository.getIsPartialRecount(circunscripcionElectoral);
        setIsPartialRecount(isPartial);

        // Reset TCV to null when partial recount is enabled
        if (isPartial && tcv !== null) {
          console.log('[VoteEntryPage] Partial recount enabled - resetting TCV to null');
          onTcvChange(null);
        }
      } else {
        setIsPartialRecount(false);
      }
    };
    loadPartialRecountMode();
  }, [circunscripcionElectoral, repository, settingsReloadTrigger, tcv, onTcvChange]);

  const availableOrganizations = (politicalOrganizations || []).filter(org =>
    selectedOrganizationKeys.includes(org.key)
  );

  // Update local entries when existingEntries change (category switch)
  useEffect(() => {
    setEntries(existingEntries);
  }, [existingEntries]);

  // Report entries changes to parent component
  const updateEntries = (newEntries: VoteEntry[]) => {
    setEntries(newEntries);
    onEntriesChange(newEntries);
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

  // Handle reinicializar - clear all vote entries while keeping mesa data
  const handleReinicializar = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `¿Está seguro que desea reinicializar el recuento?\n\n` +
      `Esta acción eliminará todos los ${entries.length} votos ingresados y reiniciará el temporizador.\n` +
      `Los datos de la mesa (N° Mesa, N° Acta, JEE, TEH, TCV, Ubicación) se mantendrán.\n\n` +
      `Esta operación NO se puede deshacer.`
    );

    if (!confirmed) {
      return;
    }

    console.log("Reinicializando formulario...");
    const now = new Date();

    // Clear all vote entries
    updateEntries([]);

    // Reset start time and restart timer
    console.log('[VoteEntryPage.handleReinicializar] Resetting start time to:', now);
    onStartTimeChange(now);
    onCurrentTimeChange(now);

    // Clear end time (since we're restarting)
    console.log('[VoteEntryPage.handleReinicializar] Clearing end time');
    onEndTimeChange(null);

    // Save the cleared state
    if (onSaveActa) {
      await onSaveActa();
    }

    ToastService.success("Recuento reinicializado exitosamente. Puede ingresar votos nuevamente.", '550px', 3000);
  };

  // Handle finalize form - disable all inputs permanently
  const handleFinalizeForm = async () => {
    // Validate that there are entries
    if (entries.length === 0) {
      ToastService.error("No se puede finalizar el recuento sin votos registrados. Ingrese al menos un voto.", '500px', 4000);
      return;
    }

    // Validate TCV matches entries when TCV is loaded from repository
    // Skip validation for partial recounts (isPartialRecount = true)
    // If TCV is null, it's bound to entries.length (no validation needed)
    // If TCV has a value, it was loaded from another category, so entries must match
    if (!isPartialRecount && tcv !== null && entries.length !== tcv) {
      ToastService.error(
        `El número de votos ingresados ${entries.length} no coincide con el TCV esperado ${tcv}.`,
        '550px',
        5000
      );
      return;
    }

    // Show confirmation dialog
    // const confirmed = window.confirm(
    //   `¿Está seguro que desea finalizar el recuento de votos?\n\n` +
    //   `Mesa: ${mesaNumber.toString().padStart(6, '0')}\n` +
    //   `Acta: ${actaNumber}\n` +
    //   `Total de votos: ${entries.length}\n` +
    //   `Una vez finalizada, no podrá realizar más cambios.`
    // );

    // if (!confirmed) {
    //   return;
    // }

    console.log("Finalizando formulario...");
    const now = new Date();

    // With Zustand, all updates are SYNCHRONOUS - no delay needed! ✅
    onEndTimeChange(now); // Capture end time (instant with Zustand)

    // If TCV is null (linked to entries.length), save the actual value for auto-loading
    // EXCEPT for partial recounts - TCV must remain null
    if (tcv === null && !isPartialRecount) {
      onTcvChange(entries.length); // Instant with Zustand
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

    ToastService.success("Formulario finalizado exitosamente", '400px', 3000);
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
          isFormFinalized={isFormFinalized}
          isMesaDataSaved={isMesaDataSaved}
          categoryColors={categoryColors}
          onEntriesChange={updateEntries}
          onCedulasExcedentesChange={onCedulasExcedentesChange}
          onSaveActa={onSaveActa}
        />
      </div>
    </div>
  );
}
