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
  type MesaElectoralInfo
} from "../types";
import { type PoliticalOrganization } from "../types";
import { useActaRepository } from "../hooks/useActaRepository";
import { getCategoryColors } from "../utils/categoryColors";
import { ToastService } from "../services/ui/toastService";
import { validateMesaData } from "../services/domain/mesaValidationService";
import { generatePresidencialPdf } from "../services/pdf/generators/presidencialPdfGenerator";
import { generateSenadoresNacionalPdf } from "../services/pdf/generators/senadoresNacionalPdfGenerator";

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
  onMesaDataChange: (mesa: number, acta: string, electores: number) => void;
  onJeeChange: (jee: string) => void;
  onDepartamentoChange: (value: string) => void;
  onProvinciaChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
  getDepartamentos: () => string[];
  getProvincias: (departamento: string) => string[];
  getDistritos: (departamento: string, provincia: string) => string[];
  isInternationalLocation: boolean;
  jeeOptions: string[];
  mesaElectoralInfo?: MesaElectoralInfo | null;
  isFormFinalized?: boolean;
  onFormFinalizedChange?: (isFinalized: boolean) => void;
  isMesaDataSaved?: boolean;
  onMesaDataSavedChange?: (isSaved: boolean) => void;
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
  isMesaAlreadyFinalized?: (mesaNumber: number) => Promise<boolean>;
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
    isFormFinalized: externalIsFormFinalized,
    onFormFinalizedChange,
    isMesaDataSaved: externalIsMesaDataSaved,
    onMesaDataSavedChange,
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
  const [selectedOrganizationKeys, setSelectedOrganizationKeys] = useState<string[]>([]);

  const isFormFinalized = externalIsFormFinalized !== undefined ? externalIsFormFinalized : localIsFormFinalized;
  const isMesaDataSaved = externalIsMesaDataSaved !== undefined ? externalIsMesaDataSaved : localIsMesaDataSaved;

  // Load selected organizations from repository
  useEffect(() => {
    const loadOrganizations = async () => {
      const orgKeys = circunscripcionElectoral
        ? await repository.getCircunscripcionOrganizations(circunscripcionElectoral)
        : await repository.getSelectedOrganizations();
      setSelectedOrganizationKeys(orgKeys);
    };
    loadOrganizations();
  }, [circunscripcionElectoral, repository]);

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
    onStartTimeChange(now);
    onCurrentTimeChange(now);

    // Update saved state
    if (onMesaDataSavedChange) {
      onMesaDataSavedChange(true);
    } else {
      setLocalIsMesaDataSaved(true);
    }

    // Save to repository
    if (onSaveActa) {
      await onSaveActa();
    }

    ToastService.success("Datos de mesa guardados exitosamente");
  };

  // Handle finalize form - disable all inputs permanently
  const handleFinalizeForm = async () => {
    console.log("Finalizando formulario...");
    const now = new Date();

    onEndTimeChange(now); // Capture end time

    // If TCV is null (linked to entries.length), save the actual value for auto-loading
    if (tcv === null) {
      onTcvChange(entries.length);
    }

    if (onFormFinalizedChange) {
      onFormFinalizedChange(true);
    } else {
      setLocalIsFormFinalized(true);
    }

    // Save to repository
    if (onSaveActa) {
      await onSaveActa();
    }

    ToastService.success("Formulario finalizado exitosamente", '400px', 3000);
  };

  // Handle PDF generation based on category
  const handleVerActa = async () => {
    const finalizationTime = endTime || new Date();

    const pdfData = {
      entries,
      politicalOrganizations,
      selectedOrganizationKeys,
      mesaNumber,
      actaNumber,
      totalElectores,
      cedulasExcedentes,
      selectedLocation,
      startTime,
      endTime: finalizationTime,
    };

    try {
      switch (category) {
        case "presidencial":
          await generatePresidencialPdf(pdfData);
          break;
        case "senadoresNacional":
          await generateSenadoresNacionalPdf(pdfData);
          break;
        case "senadoresRegional":
          console.log("Categoría es Senadores Regional - PDF generator not yet implemented");
          ToastService.info("Generador PDF para Senadores Regional en desarrollo", '500px');
          break;
        case "diputados":
          console.log("Categoría es Diputados - PDF generator not yet implemented");
          ToastService.info("Generador PDF para Diputados en desarrollo", '500px');
          break;
        case "parlamentoAndino":
          console.log("Categoría es Parlamento Andino - PDF generator not yet implemented");
          ToastService.info("Generador PDF para Parlamento Andino en desarrollo", '500px');
          break;
        default:
          console.log("Categoría desconocida:", category);
          ToastService.error("Categoría electoral desconocida");
          break;
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      ToastService.error("Error al generar el PDF");
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
                selectedLocation={selectedLocation}
                isInternationalLocation={isInternationalLocation}
                areMesaFieldsLocked={areMesaFieldsLocked}
                isMesaDataSaved={isMesaDataSaved}
                isFormFinalized={isFormFinalized}
                categoryActas={categoryActas}
                currentActaIndex={currentActaIndex}
                categoryColors={categoryColors}
                jeeOptions={jeeOptions}
                getDepartamentos={getDepartamentos}
                getProvincias={getProvincias}
                getDistritos={getDistritos}
                onMesaDataChange={onMesaDataChange}
                onJeeChange={onJeeChange}
                onDepartamentoChange={onDepartamentoChange}
                onProvinciaChange={onProvinciaChange}
                onDistritoChange={onDistritoChange}
                onSaveMesaData={handleSaveMesaData}
                onFinalizeForm={handleFinalizeForm}
                onVerActa={handleVerActa}
                onCreateNewActa={onCreateNewActa}
                onSwitchToActa={onSwitchToActa}
                isMesaAlreadyFinalized={isMesaAlreadyFinalized}
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
