// Electoral system types - DEPRECATED FILE
// This file will be removed. Import types from './acta.types' or './organization.types' instead

export interface PoliticalParty {
  code: string;
  name: string;
  votes?: number;
  preferentialVote1?: number;
  preferentialVote2?: number;
}

export interface ElectoralData {
  department: string;
  province: string;
  district: string;
  totalEligibleVoters: number;
  totalVotersTurnout: number;
  parties: PoliticalParty[];
  voteEntries: any[]; // Use VoteEntry from acta.types
  statistics: {
    participationRate: number;
    absenteeismRate: number;
    blankVotes: number;
    nullVotes: number;
  };
}
