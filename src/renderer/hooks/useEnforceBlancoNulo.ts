// Hook to ensure BLANCO and NULO are always selected

import { useEffect } from 'react';
import { type PoliticalOrganization } from '../types';
import { getBlancoNuloKeys } from '../utils/organizationUtils';

/**
 * Enforces that BLANCO and NULO organizations are always in the selected list
 * @param selectedOrganizations - Currently selected organization keys
 * @param setSelectedOrganizations - Setter for selected organizations
 * @param politicalOrganizations - Available political organizations
 */
export function useEnforceBlancoNulo(
  selectedOrganizations: string[],
  setSelectedOrganizations: (orgs: string[]) => void,
  politicalOrganizations: PoliticalOrganization[]
): void {
  useEffect(() => {
    if (!politicalOrganizations || politicalOrganizations.length === 0) {
      return;
    }

    const blancoNuloKeys = getBlancoNuloKeys(politicalOrganizations);
    const missingBlancoNulo = blancoNuloKeys.filter(key => !selectedOrganizations.includes(key));

    if (missingBlancoNulo.length > 0) {
      setSelectedOrganizations([...new Set([...selectedOrganizations, ...missingBlancoNulo])]);
    }
  }, [selectedOrganizations, politicalOrganizations, setSelectedOrganizations]);
}
