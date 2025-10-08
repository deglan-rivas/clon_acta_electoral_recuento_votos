import { useState, useEffect } from 'react';
import { useActaRepository } from './useActaRepository';
import type { VoteEntry } from '../types';

interface UseVoteSummaryDataParams {
  category: string;
  circunscripcionElectoral?: string;
}

interface UseVoteSummaryDataReturn {
  voteEntries: VoteEntry[];
  selectedOrganizationKeys: string[];
  isLoading: boolean;
}

/**
 * Custom hook for loading vote summary data from repository
 */
export function useVoteSummaryData({
  category,
  circunscripcionElectoral
}: UseVoteSummaryDataParams): UseVoteSummaryDataReturn {
  const repository = useActaRepository();
  const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([]);
  const [selectedOrganizationKeys, setSelectedOrganizationKeys] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get vote entries for the currently active acta
        const actaData = await repository.getActiveActa(category);
        setVoteEntries(actaData.voteEntries || []);

        // Get selected organizations (try circunscripción-specific first, fallback to global)
        const orgKeys = circunscripcionElectoral
          ? await repository.getCircunscripcionOrganizations(circunscripcionElectoral)
          : await repository.getSelectedOrganizations();
        setSelectedOrganizationKeys(orgKeys);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [category, circunscripcionElectoral, repository]);

  return {
    voteEntries,
    selectedOrganizationKeys,
    isLoading
  };
}
