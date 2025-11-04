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
 * @param category - Current electoral category
 * @param politicalOrganizations - Available political organizations
 * @returns Selected organizations state and setter
 */
export function useOrganizationLoader(
  open: boolean,
  circunscripcion: string,
  category: string,
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

      // Check if partial recount mode is enabled for this circunscripcion
      const isPartialRecount = await repository.getIsPartialRecount(circunscripcion);

      let orgKeys: string[] = [];

      if (isPartialRecount) {
        // Load selected organizations for partial recount from separate key
        orgKeys = await repository.getPartialRecountOrganizations(circunscripcion, category);
      } else {
        // Load all organizations from CSV (full recount mode) - filtered by category
        orgKeys = await repository.getCircunscripcionOrganizations(circunscripcion, category);
      }

      // Default to BLANCO and NULO if no organizations loaded
      if (orgKeys.length === 0) {
        const blancoNuloKeys = getBlancoNuloKeys(politicalOrganizations);
        setSelectedOrganizations(blancoNuloKeys);
      } else {
        setSelectedOrganizations(orgKeys);
      }

      console.log('[useOrganizationLoader] Loaded organizations:', {
        circunscripcion,
        category,
        isPartialRecount,
        orgCount: orgKeys.length,
        source: isPartialRecount ? 'PARTIAL_RECOUNT_ORGANIZATIONS' : 'CIRCUNSCRIPCION_ORGANIZATIONS'
      });
    };

    loadOrganizations();
  }, [open, circunscripcion, category, politicalOrganizations, repository]);

  return { selectedOrganizations, setSelectedOrganizations };
}
