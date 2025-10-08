import { useMemo } from 'react';
import type { VoteEntry, PoliticalOrganization } from '../types';
import { calculateVoteData, calculateStatistics, type VoteCount, type PreferentialMatrix, type VoteStatistics } from '../utils/voteCalculations';

interface UseVoteStatisticsParams {
  voteEntries: VoteEntry[];
  availableOrganizations: PoliticalOrganization[];
  maxPreferentialNumber: number;
  totalElectores: number;
}

interface UseVoteStatisticsReturn {
  voteCount: VoteCount;
  preferentialMatrix: PreferentialMatrix;
  statistics: VoteStatistics;
}

/**
 * Custom hook for calculating vote statistics and preferential vote matrix
 */
export function useVoteStatistics({
  voteEntries,
  availableOrganizations,
  maxPreferentialNumber,
  totalElectores
}: UseVoteStatisticsParams): UseVoteStatisticsReturn {
  const { voteCount, matrix: preferentialMatrix } = useMemo(
    () => calculateVoteData(voteEntries, availableOrganizations, maxPreferentialNumber),
    [voteEntries, availableOrganizations, maxPreferentialNumber]
  );

  const statistics = useMemo(
    () => calculateStatistics(voteCount, totalElectores),
    [voteCount, totalElectores]
  );

  return {
    voteCount,
    preferentialMatrix,
    statistics
  };
}
