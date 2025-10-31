import { useEffect, useCallback, useRef, useState } from "react";
import { VoteSummaryPage } from "../pages/VoteSummaryPage";
import { VoteEntryPage } from "../pages/VoteEntryPage";
import { mockElectoralData } from "../mocks/electoralData";
import { SettingsModal } from "../components/settings/SettingsModal";
import { AppHeader } from "./AppHeader";
import { AppDataProvider, useAppData } from "../providers/AppDataProvider";
import { useLocationState } from "../hooks/useLocationState";
import { useElectoralActions } from "../hooks/useElectoralActions";
import { useActaRepository } from "../hooks/useActaRepository";
import { Toaster } from "../components/ui/sonner";
import type { SelectedLocation } from "../types/acta.types";
import { ELECTORAL_CATEGORIES, PREFERENTIAL_VOTE_CONFIG } from "../config/electoralCategories";
import { GeographicDataService } from "../services/data/geographicDataService";
import { CircunscripcionService } from "../services/domain/circunscripcionService";
import { ToastService } from "../services/ui/toastService";
import { MesaDataHandler } from "../services/domain/mesaDataHandler";

function AppLayoutContent() {
  const {
    ubigeoData,
    circunscripcionData,
    jeeData,
    mesaElectoralData,
    politicalOrganizations,
    jeeMiembrosData
  } = useAppData();

  // Repository for accessing stored actas
  const actaRepository = useActaRepository();

  // Zustand store actions and state
  const {
    activeCategory,
    currentActa,
    categoryActas,
    currentActaIndex,
    currentTime,
    isSettingsOpen,
    setActiveCategory,
    updateActaData,
    createNewActa: createNewActaAction,
    switchToActa,
    setMesaNumber,
    setTotalElectores,
    setTcv,
    setCedulasExcedentes,
    setMesaDataSaved,
    setFormFinalized,
    setPaused,
    setMesaFieldsLocked,
    setConformidadDownloaded,
    setStartTime,
    setEndTime,
    setCurrentTime,
    setPausedDuration,
    setLastPauseTime,
    setSettingsOpen,
    isMesaFinalized,
    updateVoteLimits,
  } = useElectoralActions();

  // Memoize the location update callback to prevent recreation
  const handleLocationUpdate = useCallback((location: SelectedLocation) => {
    updateActaData({ selectedLocation: location });
  }, [updateActaData]);

  const location = useLocationState({
    currentActaData: currentActa,
    onLocationUpdate: handleLocationUpdate,
  });

  // Derive areMesaFieldsLocked directly from currentActa
  const areMesaFieldsLocked = currentActa?.areMesaFieldsLocked || false;

  // Track which category we've auto-set circunscripción for to prevent loops
  const autoSetCircunscripcionRef = useRef<string | null>(null);

  // Reload trigger to force re-loading organizations when settings modal closes
  const [settingsReloadTrigger, setSettingsReloadTrigger] = useState(0);

  // Filtered organizations for Settings modal based on current circunscripción
  const [filteredOrganizations, setFilteredOrganizations] = useState(politicalOrganizations);

  // Load partial recount mode from repository for current circunscripción
  const [isPartialRecountFromRepo, setIsPartialRecountFromRepo] = useState(false);

  // Load partial recount mode when circunscripción or category changes
  useEffect(() => {
    const loadPartialRecountMode = async () => {
      const circunscripcionElectoral = location.selectedCircunscripcionElectoral;

      if (circunscripcionElectoral) {
        // Check if current category supports preferential voting
        const hasPreferentialVotes = PREFERENTIAL_VOTE_CONFIG[activeCategory]?.hasPreferential1 ||
                                      PREFERENTIAL_VOTE_CONFIG[activeCategory]?.hasPreferential2;

        if (hasPreferentialVotes) {
          const isPartial = await actaRepository.getIsPartialRecount(circunscripcionElectoral);
          console.log('[AppContainer] Loaded partial recount mode from repository:', {
            circunscripcionElectoral,
            activeCategory,
            hasPreferentialVotes,
            isPartial
          });
          setIsPartialRecountFromRepo(isPartial);
        } else {
          setIsPartialRecountFromRepo(false);
        }
      } else {
        setIsPartialRecountFromRepo(false);
      }
    };

    loadPartialRecountMode();
  }, [location.selectedCircunscripcionElectoral, activeCategory, settingsReloadTrigger, actaRepository]);

  // Time tracking interval - update currentTime every second
  // Only depend on specific values, not the whole currentActa object
  const startTimeStr = currentActa?.startTime;
  const endTimeStr = currentActa?.endTime;
  const isPausedValue = currentActa?.isPaused || false;

  useEffect(() => {
    const startTime = startTimeStr ? new Date(startTimeStr) : null;
    const endTime = endTimeStr ? new Date(endTimeStr) : null;

    // Only update timer if session is active and not paused
    if (startTime && !endTime && !isPausedValue) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTimeStr, endTimeStr, isPausedValue, setCurrentTime]);

  // Update vote limits when circunscripcion electoral changes
  const circunscripcionElectoral = currentActa?.selectedLocation?.circunscripcionElectoral;
  useEffect(() => {
    if (circunscripcionElectoral) {
      updateVoteLimits();
    }
  }, [circunscripcionElectoral, activeCategory, updateVoteLimits]);

  // Filter organizations based on current circunscripción electoral
  useEffect(() => {
    const filterOrganizations = async () => {
      const circunscripcion = location.selectedCircunscripcionElectoral;

      if (!circunscripcion) {
        setFilteredOrganizations(politicalOrganizations);
        return;
      }

      try {
        const validKeys = await actaRepository.getCircunscripcionOrganizations(circunscripcion);

        if (validKeys.length === 0) {
          setFilteredOrganizations(politicalOrganizations);
          return;
        }

        const filtered = politicalOrganizations.filter(org =>
          validKeys.includes(org.key)
        );

        setFilteredOrganizations(filtered);
      } catch (error) {
        console.error('[AppContainer] Error filtering organizations:', error);
        setFilteredOrganizations(politicalOrganizations);
      }
    };

    filterOrganizations();
  }, [location.selectedCircunscripcionElectoral, politicalOrganizations, actaRepository]);

  // Auto-set circunscripción electoral when category changes and data is available
  useEffect(() => {
    if (circunscripcionData.length === 0) return;

    const options = getCircunscripcionElectoralOptions();
    const currentLocationData = currentActa?.selectedLocation;

    // For specific categories with only one option, auto-select it (only if not already set)
    if (options.length === 1 && (activeCategory === 'presidencial' || activeCategory === 'parlamentoAndino' || activeCategory === 'senadoresNacional')) {
      const autoSelectedCirc = options[0];
      // Only auto-select if there's no saved value AND we haven't already auto-set for this category
      if (!currentLocationData?.circunscripcionElectoral && autoSetCircunscripcionRef.current !== activeCategory) {
        autoSetCircunscripcionRef.current = activeCategory;
        // Directly update without calling location handler to avoid loop
        updateActaData({
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
    const isCurrentActaEmpty =
      currentActa.mesaNumber === 0 &&
      currentActa.actaNumber === '' &&
      (!currentActa.voteEntries || currentActa.voteEntries.length === 0);

    if (isCurrentActaEmpty) {
      ToastService.actaAlreadyEmpty();
      return;
    }

    // categoryActas is already the array for the active category (from useElectoralActions)
    const actas = categoryActas || [];

    const emptyActaIndex = actas.findIndex(acta =>
      acta.mesaNumber === 0 &&
      acta.actaNumber === '' &&
      (!acta.voteEntries || acta.voteEntries.length === 0)
    );

    // If there's already an empty acta, switch to it instead of creating a new one
    if (emptyActaIndex !== -1) {
      switchToActa(emptyActaIndex);
      // Don't modify the empty acta - it should already be in the correct empty state
      ToastService.info('Cambiado a acta vacía existente');
      return;
    }

    // Otherwise, create a new acta
    await createNewActaAction();
    location.setSelectedCircunscripcionElectoral('');
    updateActaData({ areMesaFieldsLocked: false });

    ToastService.newActaCreated();
  };

  // Handler to switch to a specific acta by index
  const handleSwitchToActa = async (index: number) => {
    switchToActa(index);
    // categoryActas is already the array for the active category
    const newActa = categoryActas?.[index];
    ToastService.actaSwitched(newActa?.actaNumber || '');
  };

  // Get current values from acta data
  const activeSection = currentActa?.activeSection || 'ingreso';
  const voteLimits = currentActa?.voteLimits || { preferential1: 30, preferential2: 30 };
  const mesaNumber = currentActa?.mesaNumber || 0;
  const actaNumber = currentActa?.actaNumber || '';
  const totalElectores = currentActa?.totalElectores || 0;
  const cedulasExcedentes = currentActa?.cedulasExcedentes || 0;
  const tcv = currentActa?.tcv;
  const counterMesa = currentActa?.counterMesa ?? null;
  const isFormFinalized = currentActa?.isFormFinalized || false;
  const isMesaDataSaved = currentActa?.isMesaDataSaved || false;
  const isPaused = currentActa?.isPaused || false;
  const isConformidadDownloaded = currentActa?.isConformidadDownloaded || false;
  const startTime = currentActa?.startTime ? new Date(currentActa.startTime) : null;
  const endTime = currentActa?.endTime ? new Date(currentActa.endTime) : null;
  const pausedDuration = currentActa?.pausedDuration || 0;
  const lastPauseTime = currentActa?.lastPauseTime ? new Date(currentActa.lastPauseTime) : null;

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
        politicalOrganizations={politicalOrganizations}
        voteLimits={voteLimits}
      />;
    }

    return <VoteEntryPage
      key={`${activeCategory}`}
      category={activeCategory}
      categoryLabel={ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory)?.label}
      existingEntries={currentActa?.voteEntries || []}
      voteLimits={voteLimits}
      preferentialConfig={preferentialConfig}
      onEntriesChange={(entries) => updateActaData({ voteEntries: entries })}
      mesaNumber={mesaNumber}
      actaNumber={actaNumber}
      totalElectores={totalElectores}
      cedulasExcedentes={cedulasExcedentes}
      tcv={tcv}
      counterMesa={counterMesa}
      onCedulasExcedentesChange={(value) => updateActaData({ cedulasExcedentes: value })}
      onTcvChange={(value) => updateActaData({ tcv: value })}
      onCounterMesaChange={(value) => updateActaData({ counterMesa: value })}
      onAreMesaFieldsLockedChange={(value) => updateActaData({ areMesaFieldsLocked: value })}
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
      onCircunscripcionElectoralChange={location.handleCircunscripcionElectoralChange}
      onSelectedLocationChange={(location) => updateActaData({ selectedLocation: location })}
      getDepartamentos={getDepartamentos}
      getProvincias={getProvincias}
      getDistritos={getDistritos}
      isInternationalLocation={isInternationalLocation}
      jeeOptions={jeeData}
      jeeMiembrosData={jeeMiembrosData}
      politicalOrganizations={politicalOrganizations}
      settingsReloadTrigger={settingsReloadTrigger}
      onLoadMesaInfo={async (mesa) => {
        await MesaDataHandler.loadMesaInfo({
          mesa,
          activeCategory,
          mesaElectoralData,
          circunscripcionData,
          selectedJee: location.selectedJee,
          circunscripcionElectoral: location.circunscripcionElectoral,
          onLocationUpdate: (updatedLocation: SelectedLocation) => {
            // Update all location fields at once to avoid cascading resets - SYNCHRONOUS with Zustand!
            updateActaData({ selectedLocation: updatedLocation });
          },
          onMesaFieldsLocked: setMesaFieldsLocked,
          onMesaNumberUpdate: setMesaNumber,
          onTotalElectoresUpdate: setTotalElectores,
          onTcvUpdate: setTcv,
          onCedulasExcedentesUpdate: setCedulasExcedentes,
          onCounterMesaUpdate: (counterMesa: number) => {
            updateActaData({ counterMesa });
          },
          actaRepository: actaRepository
        });
      }}
      onMesaDataChange={async (mesa, acta, electores) => {
        const categoryLabel = ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory)?.label || 'este tipo de elección';

        await MesaDataHandler.handleMesaDataChange({
          mesa,
          acta,
          electores,
          activeCategory,
          categoryLabel,
          updateActaData: updateActaData
        });
      }}
      isFormFinalized={isFormFinalized}
      onFormFinalizedChange={setFormFinalized}
      isMesaDataSaved={isMesaDataSaved}
      onMesaDataSavedChange={setMesaDataSaved}
      isConformidadDownloaded={isConformidadDownloaded}
      onConformidadDownloadedChange={setConformidadDownloaded}
      areMesaFieldsLocked={areMesaFieldsLocked}
      startTime={startTime}
      endTime={endTime}
      currentTime={currentTime}
      isPaused={isPaused}
      pausedDuration={pausedDuration}
      lastPauseTime={lastPauseTime}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      onCurrentTimeChange={setCurrentTime}
      onPausedChange={setPaused}
      onPausedDurationChange={setPausedDuration}
      onLastPauseTimeChange={setLastPauseTime}
      onViewSummary={() => updateActaData({ activeSection: 'recuento' })}
      onCreateNewActa={handleCreateNewActa}
      onSwitchToActa={handleSwitchToActa}
      categoryActas={categoryActas}
      currentActaIndex={currentActaIndex}
      isMesaAlreadyFinalized={(mesaNumber) => isMesaFinalized(mesaNumber, activeCategory)}
      onSaveActa={async () => {
        // With Zustand, state is already saved synchronously, no need for explicit save
        console.log('[AppContainer] onSaveActa called - state already persisted');
      }}
    />;
  };

  // Debug logging for partial recount
  console.log('[AppContainer] Render - isPartialRecountFromRepo:', isPartialRecountFromRepo);
  console.log('[AppContainer] Render - currentActa.isPartialRecount:', currentActa?.isPartialRecount);
  console.log('[AppContainer] Render - selectedCircunscripcionElectoral:', location.selectedCircunscripcionElectoral);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        activeCategory={activeCategory}
        activeSection={activeSection}
        selectedCircunscripcionElectoral={location.selectedCircunscripcionElectoral}
        circunscripcionOptions={getCircunscripcionElectoralOptions()}
        areLocationFieldsDisabled={areLocationFieldsDisabled}
        showLocationDropdowns={showLocationDropdowns}
        isPartialRecount={isPartialRecountFromRepo}
        onCategoryChange={async (newCategory) => {
          await setActiveCategory(newCategory);
        }}
        onSectionChange={(section) => updateActaData({ activeSection: section })}
        onCircunscripcionChange={location.handleCircunscripcionElectoralChange}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {renderSection()}
        </div>
      </main>

      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          // When settings modal closes, trigger a reload of organizations
          if (!open) {
            setSettingsReloadTrigger(prev => prev + 1);
          }
        }}
        category={activeCategory}
        currentCircunscripcionElectoral={location.selectedCircunscripcionElectoral}
        politicalOrganizations={filteredOrganizations}
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
