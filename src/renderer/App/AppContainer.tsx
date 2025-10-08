import { useState, useEffect, useCallback, useRef } from "react";
import { VoteSummaryPage } from "../pages/VoteSummaryPage";
import { VoteEntryPage } from "../pages/VoteEntryPage";
import { mockElectoralData } from "../mocks/electoralData";
import { SettingsModal } from "../components/settings/SettingsModal";
import { AppHeader } from "./AppHeader";
import { AppDataProvider, useAppData } from "../providers/AppDataProvider";
import { useCategoryManager } from "../hooks/useCategoryManager";
import { useLocationState } from "../hooks/useLocationState";
import { useActaRepository } from "../hooks/useActaRepository";
import { Toaster } from "../components/ui/sonner";
import type { ActaData, SelectedLocation } from "../types/acta.types";
import { DEFAULT_ACTA_DATA } from "../types/acta.types";
import { ELECTORAL_CATEGORIES, PREFERENTIAL_VOTE_CONFIG } from "../config/electoralCategories";
import { GeographicDataService } from "../services/data/geographicDataService";
import { CircunscripcionService } from "../services/domain/circunscripcionService";
import { ToastService } from "../services/ui/toastService";
import { MesaDataHandler } from "../services/domain/mesaDataHandler";

function AppLayoutContent() {
  const repository = useActaRepository();
  const {
    ubigeoData,
    circunscripcionData,
    jeeData,
    mesaElectoralData,
    politicalOrganizations
  } = useAppData();

  const {
    activeCategory,
    setActiveCategory,
    currentActaData,
    categoryActas,
    currentActaIndex,
    updateCurrentActaData,
    saveCurrentActa,
  } = useCategoryManager();

  // Get location from current acta data with default fallback
  const getCurrentActaData = (): ActaData => {
    return currentActaData || DEFAULT_ACTA_DATA;
  };

  // Memoize the location update callback to prevent recreation
  const handleLocationUpdate = useCallback((location: SelectedLocation) => {
    updateCurrentActaData({ selectedLocation: location });
  }, [updateCurrentActaData]);

  const location = useLocationState({
    currentActaData,
    onLocationUpdate: handleLocationUpdate,
  });

  // Derive areMesaFieldsLocked directly from currentActaData instead of using state
  const areMesaFieldsLocked = getCurrentActaData()?.areMesaFieldsLocked || false;

  // Track which category we've auto-set circunscripción for to prevent loops
  const autoSetCircunscripcionRef = useRef<string | null>(null);

  // Current time state (not persisted per category)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Time tracking interval - update currentTime every second
  // Only depend on specific values, not the whole currentActaData object
  const startTimeStr = currentActaData?.startTime;
  const endTimeStr = currentActaData?.endTime;

  useEffect(() => {
    const startTime = startTimeStr ? new Date(startTimeStr) : null;
    const endTime = endTimeStr ? new Date(endTimeStr) : null;

    if (startTime && !endTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTimeStr, endTimeStr]);

  // Auto-set circunscripción electoral when category changes and data is available
  useEffect(() => {
    if (circunscripcionData.length === 0) return;

    const options = getCircunscripcionElectoralOptions();
    const currentLocationData = getCurrentActaData()?.selectedLocation;

    // For specific categories with only one option, auto-select it (only if not already set)
    if (options.length === 1 && (activeCategory === 'presidencial' || activeCategory === 'parlamentoAndino' || activeCategory === 'senadoresNacional')) {
      const autoSelectedCirc = options[0];
      // Only auto-select if there's no saved value AND we haven't already auto-set for this category
      if (!currentLocationData?.circunscripcionElectoral && autoSetCircunscripcionRef.current !== activeCategory) {
        autoSetCircunscripcionRef.current = activeCategory;
        // Directly update without calling location handler to avoid loop
        updateCurrentActaData({
          selectedLocation: {
            ...currentLocationData,
            circunscripcionElectoral: autoSelectedCirc
          }
        });
      }
    }
    // Reset ref when category changes
    if (autoSetCircunscripcionRef.current && autoSetCircunscripcionRef.current !== activeCategory) {
      autoSetCircunscripcionRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, circunscripcionData.length]);

  // Handler to create a new acta
  const handleCreateNewActa = async () => {
    const currentActa = getCurrentActaData();
    const isCurrentActaEmpty =
      currentActa.mesaNumber === 0 &&
      currentActa.actaNumber === '' &&
      (!currentActa.voteEntries || currentActa.voteEntries.length === 0);

    if (isCurrentActaEmpty) {
      ToastService.actaAlreadyEmpty();
      return;
    }

    await repository.createNewActa(activeCategory);
    const newActaData = await repository.getActiveActa(activeCategory);
    updateCurrentActaData(newActaData);

    location.setSelectedCircunscripcionElectoral('');
    updateCurrentActaData({ areMesaFieldsLocked: false });

    ToastService.newActaCreated();
  };

  // Handler to switch to a specific acta by index
  const handleSwitchToActa = async (index: number) => {
    await repository.saveActiveActaIndex(activeCategory, index);
    const actaData = await repository.getActiveActa(activeCategory);
    updateCurrentActaData(actaData);

    ToastService.actaSwitched(actaData.actaNumber);
  };

  // Get current values from acta data
  const currentCategoryData = getCurrentActaData();
  const activeSection = currentCategoryData?.activeSection || 'ingreso';
  const voteLimits = currentCategoryData?.voteLimits || { preferential1: 30, preferential2: 30 };
  const mesaNumber = currentCategoryData?.mesaNumber || 0;
  const actaNumber = currentCategoryData?.actaNumber || '';
  const totalElectores = currentCategoryData?.totalElectores || 0;
  const cedulasExcedentes = currentCategoryData?.cedulasExcedentes || 0;
  const tcv = currentCategoryData?.tcv;
  const isFormFinalized = currentCategoryData?.isFormFinalized || false;
  const isMesaDataSaved = currentCategoryData?.isMesaDataSaved || false;
  const startTime = currentCategoryData?.startTime ? new Date(currentCategoryData.startTime) : null;
  const endTime = currentCategoryData?.endTime ? new Date(currentCategoryData.endTime) : null;

  // Location and TEH fields should be disabled when auto-filled from mesa number, session is started, or finalized
  const areLocationFieldsDisabled = areMesaFieldsLocked || isMesaDataSaved || isFormFinalized;

  // Check if current selection is international
  const mesaInfo = mesaNumber > 0 ? GeographicDataService.getMesaElectoralInfo(mesaNumber.toString(), mesaElectoralData) : null;
  const isInternationalLocation = location.selectedCircunscripcionElectoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO' ||
    (mesaInfo?.tipo_ubicacion === 'INTERNACIONAL');

  // Geographic data functions using service
  const getDepartamentos = () => GeographicDataService.getDepartamentos(isInternationalLocation, ubigeoData, mesaElectoralData);
  const getProvincias = (departamento: string) => GeographicDataService.getProvincias(departamento, isInternationalLocation, ubigeoData, mesaElectoralData);
  const getDistritos = (departamento: string, provincia: string) => GeographicDataService.getDistritos(departamento, provincia, isInternationalLocation, ubigeoData, mesaElectoralData);
  const getMesaElectoralInfo = (mesa: string) => GeographicDataService.getMesaElectoralInfo(mesa, mesaElectoralData);

  // Circunscripción functions using service
  const getCircunscripcionElectoralOptions = () => CircunscripcionService.getCircunscripcionElectoralOptions(activeCategory, circunscripcionData);

  // Show location dropdowns to display auto-populated values from mesa number
  const showLocationDropdowns = activeSection === 'ingreso' || activeSection === 'recuento';

  const renderSection = () => {
    const data = mockElectoralData[activeCategory];
    const preferentialConfig = PREFERENTIAL_VOTE_CONFIG[activeCategory] || { hasPreferential1: false, hasPreferential2: false };
    const currentCategoryData = getCurrentActaData();

    if (activeSection === "recuento") {
      return <VoteSummaryPage
        data={data}
        category={activeCategory}
        selectedLocation={{
          departamento: location.selectedDepartamento,
          provincia: location.selectedProvincia,
          distrito: location.selectedDistrito,
          jee: location.selectedJee
        }}
        circunscripcionElectoral={location.selectedCircunscripcionElectoral}
        totalElectores={totalElectores}
        onBackToEntry={() => updateCurrentActaData({ activeSection: 'ingreso' })}
        politicalOrganizations={politicalOrganizations}
        voteLimits={voteLimits}
      />;
    }

    return <VoteEntryPage
      key={`${activeCategory}`}
      category={activeCategory}
      categoryLabel={ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory)?.label}
      existingEntries={currentCategoryData?.voteEntries || []}
      voteLimits={voteLimits}
      preferentialConfig={preferentialConfig}
      onEntriesChange={(entries) => updateCurrentActaData({ voteEntries: entries })}
      mesaNumber={mesaNumber}
      actaNumber={actaNumber}
      totalElectores={totalElectores}
      cedulasExcedentes={cedulasExcedentes}
      tcv={tcv}
      onCedulasExcedentesChange={(value) => updateCurrentActaData({ cedulasExcedentes: value })}
      onTcvChange={(value) => updateCurrentActaData({ tcv: value })}
      selectedLocation={{
        departamento: location.selectedDepartamento,
        provincia: location.selectedProvincia,
        distrito: location.selectedDistrito,
        circunscripcionElectoral: location.selectedCircunscripcionElectoral,
        jee: location.selectedJee
      }}
      circunscripcionElectoral={location.selectedCircunscripcionElectoral}
      mesaElectoralInfo={mesaNumber > 0 ? getMesaElectoralInfo(mesaNumber.toString()) : null}
      onJeeChange={location.handleJeeChange}
      onDepartamentoChange={location.handleDepartamentoChange}
      onProvinciaChange={location.handleProvinciaChange}
      onDistritoChange={location.handleDistritoChange}
      getDepartamentos={getDepartamentos}
      getProvincias={getProvincias}
      getDistritos={getDistritos}
      isInternationalLocation={isInternationalLocation}
      jeeOptions={jeeData}
      politicalOrganizations={politicalOrganizations}
      onMesaDataChange={async (mesa, acta, electores) => {
        const categoryLabel = ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory)?.label || 'este tipo de elección';

        await MesaDataHandler.handleMesaDataChange({
          mesa,
          acta,
          electores,
          activeCategory,
          categoryLabel,
          repository,
          mesaElectoralData,
          circunscripcionData,
          selectedJee: location.selectedJee,
          onLocationUpdate: (updatedLocation: SelectedLocation) => {
            location.handleDepartamentoChange(updatedLocation.departamento);
            location.handleProvinciaChange(updatedLocation.provincia);
            location.handleDistritoChange(updatedLocation.distrito);
            location.setSelectedCircunscripcionElectoral(updatedLocation.circunscripcionElectoral);
          },
          onMesaFieldsLocked: (locked: boolean) => updateCurrentActaData({ areMesaFieldsLocked: locked }),
          updateActaData: updateCurrentActaData
        });
      }}
      isFormFinalized={isFormFinalized}
      onFormFinalizedChange={(finalized) => updateCurrentActaData({ isFormFinalized: finalized })}
      isMesaDataSaved={isMesaDataSaved}
      onMesaDataSavedChange={(saved) => updateCurrentActaData({ isMesaDataSaved: saved })}
      areMesaFieldsLocked={areMesaFieldsLocked}
      startTime={startTime}
      endTime={endTime}
      currentTime={currentTime}
      onStartTimeChange={(time) => updateCurrentActaData({ startTime: time?.toISOString() || null })}
      onEndTimeChange={(time) => updateCurrentActaData({ endTime: time?.toISOString() || null })}
      onCurrentTimeChange={setCurrentTime}
      onViewSummary={() => updateCurrentActaData({ activeSection: 'recuento' })}
      onCreateNewActa={handleCreateNewActa}
      onSwitchToActa={handleSwitchToActa}
      categoryActas={categoryActas}
      currentActaIndex={currentActaIndex}
      isMesaAlreadyFinalized={(mesaNumber) => repository.isMesaFinalized(mesaNumber, activeCategory)}
      onSaveActa={saveCurrentActa}
    />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        activeCategory={activeCategory}
        activeSection={activeSection}
        selectedCircunscripcionElectoral={location.selectedCircunscripcionElectoral}
        circunscripcionOptions={getCircunscripcionElectoralOptions()}
        areLocationFieldsDisabled={areLocationFieldsDisabled}
        showLocationDropdowns={showLocationDropdowns}
        onCategoryChange={async (newCategory) => {
          setActiveCategory(newCategory);
          const newCategoryData = await repository.getActiveActa(newCategory);
          if (newCategoryData.activeSection !== 'recuento') {
            await repository.saveActiveActa(newCategory, { ...newCategoryData, activeSection: 'recuento' });
          }
        }}
        onSectionChange={(section) => updateCurrentActaData({ activeSection: section })}
        onCircunscripcionChange={location.handleCircunscripcionElectoralChange}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {renderSection()}
        </div>
      </main>

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        category={activeCategory}
        currentCircunscripcionElectoral={location.selectedCircunscripcionElectoral}
        politicalOrganizations={politicalOrganizations}
      />
    </div>
  );
}

export function AppContainer() {
  return (
    <AppDataProvider>
      <AppLayoutContent />
      <Toaster position="top-right" />
    </AppDataProvider>
  );
}
