import { useState, useEffect, useCallback, useRef } from "react";
import type { SelectedLocation } from "../types/acta.types";
import type { ActaData } from "../types/acta.types";

interface UseLocationStateProps {
  currentActaData: ActaData | null;
  onLocationUpdate: (location: SelectedLocation) => void;
}

export function useLocationState({ currentActaData, onLocationUpdate }: UseLocationStateProps) {
  const currentLocationData = currentActaData?.selectedLocation || {
    departamento: '',
    provincia: '',
    distrito: '',
    circunscripcionElectoral: '',
    jee: ''
  };

  // Use repository data directly - no local state needed
  // Values come from currentActaData (repository is source of truth)
  const selectedDepartamento = currentLocationData.departamento;
  const selectedProvincia = currentLocationData.provincia;
  const selectedDistrito = currentLocationData.distrito;
  const selectedJee = currentLocationData.jee;
  const selectedCircunscripcionElectoral = currentLocationData.circunscripcionElectoral;

  // Use refs to track latest values without causing callback recreations
  const valuesRef = useRef({
    selectedDepartamento,
    selectedProvincia,
    selectedDistrito,
    selectedJee,
    selectedCircunscripcionElectoral
  });

  // Keep ref in sync with data
  useEffect(() => {
    valuesRef.current = {
      selectedDepartamento,
      selectedProvincia,
      selectedDistrito,
      selectedJee,
      selectedCircunscripcionElectoral
    };
  }, [selectedDepartamento, selectedProvincia, selectedDistrito, selectedJee, selectedCircunscripcionElectoral]);

  const handleDepartamentoChange = useCallback((value: string) => {
    onLocationUpdate({
      departamento: value,
      provincia: "",
      distrito: "",
      circunscripcionElectoral: valuesRef.current.selectedCircunscripcionElectoral,
      jee: ""
    });
  }, [onLocationUpdate]);

  const handleProvinciaChange = useCallback((value: string) => {
    onLocationUpdate({
      departamento: valuesRef.current.selectedDepartamento,
      provincia: value,
      distrito: "",
      circunscripcionElectoral: valuesRef.current.selectedCircunscripcionElectoral,
      jee: ""
    });
  }, [onLocationUpdate]);

  const handleDistritoChange = useCallback((value: string) => {
    onLocationUpdate({
      departamento: valuesRef.current.selectedDepartamento,
      provincia: valuesRef.current.selectedProvincia,
      distrito: value,
      circunscripcionElectoral: valuesRef.current.selectedCircunscripcionElectoral,
      jee: valuesRef.current.selectedJee
    });
  }, [onLocationUpdate]);

  const handleJeeChange = useCallback((value: string) => {
    onLocationUpdate({
      departamento: valuesRef.current.selectedDepartamento,
      provincia: valuesRef.current.selectedProvincia,
      distrito: valuesRef.current.selectedDistrito,
      circunscripcionElectoral: valuesRef.current.selectedCircunscripcionElectoral,
      jee: value
    });
  }, [onLocationUpdate]);

  const handleCircunscripcionElectoralChange = useCallback((value: string) => {
    const wasInternational = valuesRef.current.selectedCircunscripcionElectoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO';
    const isNowInternational = value === 'PERUANOS RESIDENTES EN EL EXTRANJERO';

    // Clear location fields if switching between national and international
    if (wasInternational !== isNowInternational) {
      onLocationUpdate({
        departamento: "",
        provincia: "",
        distrito: "",
        circunscripcionElectoral: value,
        jee: ""
      });
    } else {
      onLocationUpdate({
        departamento: valuesRef.current.selectedDepartamento,
        provincia: valuesRef.current.selectedProvincia,
        distrito: valuesRef.current.selectedDistrito,
        circunscripcionElectoral: value,
        jee: valuesRef.current.selectedJee
      });
    }
  }, [onLocationUpdate]);

  const setSelectedCircunscripcionElectoral = useCallback((value: string) => {
    onLocationUpdate({
      departamento: valuesRef.current.selectedDepartamento,
      provincia: valuesRef.current.selectedProvincia,
      distrito: valuesRef.current.selectedDistrito,
      circunscripcionElectoral: value,
      jee: valuesRef.current.selectedJee
    });
  }, [onLocationUpdate]);

  return {
    selectedDepartamento,
    selectedProvincia,
    selectedDistrito,
    selectedJee,
    selectedCircunscripcionElectoral,
    setSelectedCircunscripcionElectoral,
    handleDepartamentoChange,
    handleProvinciaChange,
    handleDistritoChange,
    handleJeeChange,
    handleCircunscripcionElectoralChange,
  };
}
