// Mesa data validation service with structured error handling

import type { PoliticalOrganization } from "../../types";

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  errorWidth?: string;
}

interface SelectedLocation {
  departamento: string;
  provincia: string;
  distrito: string;
  jee: string;
}

export interface MesaValidationData {
  selectedLocation: SelectedLocation;
  circunscripcionElectoral: string;
  selectedOrganizationKeys: string[];
  availableOrganizations: PoliticalOrganization[];
}

/**
 * Validates that all location fields are properly selected
 */
export function validateLocation(selectedLocation: SelectedLocation): ValidationResult {
  if (!selectedLocation.departamento) {
    return {
      isValid: false,
      errorMessage: "Debe seleccionar un Departamento",
      errorWidth: '400px'
    };
  }

  if (!selectedLocation.provincia) {
    return {
      isValid: false,
      errorMessage: "Debe seleccionar una Provincia",
      errorWidth: '400px'
    };
  }

  if (!selectedLocation.distrito) {
    return {
      isValid: false,
      errorMessage: "Debe seleccionar un Distrito",
      errorWidth: '400px'
    };
  }

  if (!selectedLocation.jee) {
    return {
      isValid: false,
      errorMessage: "Debe seleccionar un JEE",
      errorWidth: '400px'
    };
  }

  return { isValid: true };
}

/**
 * Validates that a circunscripción electoral is selected
 */
export function validateCircunscripcion(circunscripcionElectoral: string): ValidationResult {
  if (!circunscripcionElectoral) {
    return {
      isValid: false,
      errorMessage: "Debe seleccionar una Circunscripción Electoral",
      errorWidth: '400px'
    };
  }

  return { isValid: true };
}

/**
 * Validates that political organizations are properly configured
 */
export function validateOrganizations(
  selectedOrganizationKeys: string[],
  availableOrganizations: PoliticalOrganization[],
  circunscripcionElectoral: string
): ValidationResult {
  // Check if any organizations are enabled
  if (selectedOrganizationKeys.length === 0) {
    return {
      isValid: false,
      errorMessage: "Debe activar al menos una Organización Política en Configuración",
      errorWidth: '450px'
    };
  }

  // Check if only NULO and BLANCO are enabled
  const nonBlankNullOrgs = availableOrganizations.filter(org =>
    !org.name.includes("BLANCO") && !org.name.includes("NULO")
  );

  if (nonBlankNullOrgs.length === 0) {
    return {
      isValid: false,
      errorMessage: `No hay Organizaciones Políticas registradas para la Circunscripción electoral: ${circunscripcionElectoral}`,
      errorWidth: '500px'
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive mesa data validation
 * Returns the first validation error encountered
 */
export function validateMesaData(data: MesaValidationData): ValidationResult {
  // Validate location
  const locationResult = validateLocation(data.selectedLocation);
  if (!locationResult.isValid) {
    return locationResult;
  }

  // Validate circunscripción
  const circunscripcionResult = validateCircunscripcion(data.circunscripcionElectoral);
  if (!circunscripcionResult.isValid) {
    return circunscripcionResult;
  }

  // Validate organizations
  const orgResult = validateOrganizations(
    data.selectedOrganizationKeys,
    data.availableOrganizations,
    data.circunscripcionElectoral
  );
  if (!orgResult.isValid) {
    return orgResult;
  }

  return { isValid: true };
}
