// Vote calculation and counting service for electoral actas

import type { VoteEntry, PoliticalOrganization } from "../../types";

export interface VoteCount {
  [partyKey: string]: number;
}

export interface PreferentialVoteMatrix {
  [partyKey: string]: {
    [candidateNumber: number]: number;
    total: number;
  };
}

export interface VoteCalculationResult {
  voteCount: VoteCount;
  matrix?: PreferentialVoteMatrix;
}

/**
 * Calculates total votes per party from vote entries
 */
export function calculateVoteCount(entries: VoteEntry[]): VoteCount {
  const voteCount: VoteCount = {};

  entries.forEach(entry => {
    if (entry.party) {
      voteCount[entry.party] = (voteCount[entry.party] || 0) + 1;
    }
  });

  return voteCount;
}

/**
 * Calculates preferential vote matrix for Senadores Nacional (30 candidates)
 * Counts preferential votes per candidate per party
 */
export function calculatePreferentialVoteMatrix(
  entries: VoteEntry[],
  organizations: PoliticalOrganization[],
  selectedOrganizationKeys: string[],
  maxCandidates: number = 30
): PreferentialVoteMatrix {
  const matrix: PreferentialVoteMatrix = {};

  // Initialize matrix for selected organizations
  organizations.forEach(org => {
    const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
    const isSelected = selectedOrganizationKeys.includes(org.key);

    if (isSelected) {
      matrix[partyKey] = { total: 0 };
      for (let i = 1; i <= maxCandidates; i++) {
        matrix[partyKey][i] = 0;
      }
    }
  });

  // Count preferential votes
  entries.forEach(entry => {
    if (entry.party && matrix[entry.party]) {
      // Count first preferential vote
      if (entry.preferentialVote1 !== undefined && entry.preferentialVote1 >= 1 && entry.preferentialVote1 <= maxCandidates) {
        matrix[entry.party][entry.preferentialVote1]++;
        matrix[entry.party].total++;
      }
      // Count second preferential vote
      if (entry.preferentialVote2 !== undefined && entry.preferentialVote2 >= 1 && entry.preferentialVote2 <= maxCandidates) {
        matrix[entry.party][entry.preferentialVote2]++;
        matrix[entry.party].total++;
      }
    }
  });

  return matrix;
}

/**
 * Complete vote calculation including party totals and preferential votes
 * Used for Senadores Nacional PDF generation
 */
export function calculateVoteDataWithPreferential(
  entries: VoteEntry[],
  organizations: PoliticalOrganization[],
  selectedOrganizationKeys: string[],
  maxCandidates: number = 30
): VoteCalculationResult {
  const voteCount = calculateVoteCount(entries);
  const matrix = calculatePreferentialVoteMatrix(
    entries,
    organizations,
    selectedOrganizationKeys,
    maxCandidates
  );

  return { voteCount, matrix };
}

/**
 * Gets vote count for a specific party, returns 0 if not found
 */
export function getPartyVoteCount(voteCount: VoteCount, partyKey: string): number {
  return voteCount[partyKey] || 0;
}

/**
 * Calculates total votes across all parties
 */
export function calculateTotalVotes(entries: VoteEntry[]): number {
  return entries.length;
}
