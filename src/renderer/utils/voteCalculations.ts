import type { VoteEntry, PoliticalOrganization } from '../types';

export interface VoteCount {
  [partyKey: string]: number;
}

export interface PreferentialMatrix {
  [partyKey: string]: {
    [prefNumber: number]: number;
    total: number;
  };
}

export interface VoteStatistics {
  totalVotesEmitted: number;
  totalVotersWhoVoted: number;
  blankAndNullVotes: number;
  participationRate: number;
  absenteeismRate: number;
}

/**
 * Formats a party key combining order and name
 */
export function formatPartyKey(organization: PoliticalOrganization): string {
  return organization.order ? `${organization.order} | ${organization.name}` : organization.name;
}

/**
 * Calculates vote counts and preferential vote matrix for political organizations
 */
export function calculateVoteData(
  voteEntries: VoteEntry[],
  availableOrganizations: PoliticalOrganization[],
  maxPreferentialNumber: number
): { voteCount: VoteCount; matrix: PreferentialMatrix } {
  const voteCount: VoteCount = {};
  const matrix: PreferentialMatrix = {};

  // Initialize for selected political organizations
  availableOrganizations.forEach(org => {
    const partyKey = formatPartyKey(org);
    voteCount[partyKey] = 0;
    matrix[partyKey] = { total: 0 };
    for (let i = 1; i <= maxPreferentialNumber; i++) {
      matrix[partyKey][i] = 0;
    }
  });

  // Process vote entries
  voteEntries.forEach(entry => {
    if (entry.party) {
      // Count total votes for this party
      voteCount[entry.party] = (voteCount[entry.party] || 0) + 1;

      // Handle preferential votes
      if (matrix[entry.party]) {
        [entry.preferentialVote1, entry.preferentialVote2].forEach(vote => {
          if (vote && vote >= 1 && vote <= maxPreferentialNumber) {
            matrix[entry.party][vote]++;
            matrix[entry.party].total++;
          }
        });
      }
    }
  });

  return { voteCount, matrix };
}

/**
 * Calculates electoral statistics from vote counts
 */
export function calculateStatistics(
  voteCount: VoteCount,
  totalElectores: number
): VoteStatistics {
  const blancoVotes = voteCount['BLANCO'] || 0;
  const nuloVotes = voteCount['NULO'] || 0;
  const blankAndNullVotes = blancoVotes + nuloVotes;

  // Total votes emitted excludes BLANCO and NULO
  const totalValidVotes = Object.entries(voteCount)
    .filter(([party]) => party !== 'BLANCO' && party !== 'NULO')
    .reduce((sum, [, count]) => sum + count, 0);

  const totalVotesEmitted = totalValidVotes;
  const totalVotersWhoVoted = totalValidVotes + blankAndNullVotes;

  // Calculate participation and absenteeism percentages using actual totalElectores
  const participationRate = totalElectores > 0
    ? (totalVotersWhoVoted / totalElectores * 100)
    : 0;
  const absenteeismRate = 100 - participationRate;

  return {
    totalVotesEmitted,
    totalVotersWhoVoted,
    blankAndNullVotes,
    participationRate,
    absenteeismRate
  };
}
