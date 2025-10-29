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
  tcv: number | null;
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
  const [tcv, setTcv] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get vote entries for the currently active acta
        const actaData = await repository.getActiveActa(category);
        setVoteEntries(actaData.voteEntries || []);
        setTcv(actaData.tcv ?? null);

        // Get selected organizations based on partial recount mode
        let orgKeys: string[] = [];
        if (circunscripcionElectoral) {
          // Check if partial recount mode is enabled
          const isPartialRecount = await repository.getIsPartialRecount(circunscripcionElectoral);

          if (isPartialRecount) {
            // Load selected organizations for partial recount
            orgKeys = await repository.getPartialRecountOrganizations(circunscripcionElectoral);
          } else {
            // Load all organizations from CSV (full recount)
            orgKeys = await repository.getCircunscripcionOrganizations(circunscripcionElectoral);
          }
        } else {
          // Fallback to global organizations
          orgKeys = await repository.getSelectedOrganizations();
        }

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
    tcv,
    isLoading
  };
}
