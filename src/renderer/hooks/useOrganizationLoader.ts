// Hook for loading political organizations based on circumscription

import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { type PoliticalOrganization } from '../types';
import { useActaRepository } from './useActaRepository';
import { getBlancoNuloKeys } from '../utils/organizationUtils';

interface UseOrganizationLoaderResult {
  selectedOrganizations: string[];
  setSelectedOrganizations: Dispatch<SetStateAction<string[]>>;
}

/**
 * Manages loading and state of selected political organizations
 * @param open - Whether the modal is open
 * @param circunscripcion - Selected circumscription
 * @param politicalOrganizations - Available political organizations
 * @returns Selected organizations state and setter
 */
export function useOrganizationLoader(
  open: boolean,
  circunscripcion: string,
  politicalOrganizations: PoliticalOrganization[]
): UseOrganizationLoaderResult {
  const repository = useActaRepository();
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !politicalOrganizations || politicalOrganizations.length === 0) return;

    const loadOrganizations = async () => {
      // If no circunscripcion is selected, show only BLANCO and NULO
      if (!circunscripcion) {
        const blancoNuloKeys = getBlancoNuloKeys(politicalOrganizations);
        setSelectedOrganizations(blancoNuloKeys);
        return;
      }

      // Load organizations for the selected circunscripcion
      const orgKeys = await repository.getCircunscripcionOrganizations(circunscripcion);

      // Default to BLANCO and NULO if no organizations saved
      if (orgKeys.length === 0) {
        const blancoNuloKeys = getBlancoNuloKeys(politicalOrganizations);
        setSelectedOrganizations(blancoNuloKeys);
      } else {
        setSelectedOrganizations(orgKeys);
      }
    };

    loadOrganizations();
  }, [open, circunscripcion, politicalOrganizations, repository]);

  return { selectedOrganizations, setSelectedOrganizations };
}
