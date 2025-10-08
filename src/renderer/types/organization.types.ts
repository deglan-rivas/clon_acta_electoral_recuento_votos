// Type definitions for Political Organizations

export interface PoliticalOrganization {
  key: string;
  name: string;
  order?: number;
  circunscripcion?: string;
  category?: string;
  logo?: string;
}

export interface PoliticalParty {
  code: string;
  name: string;
  votes?: number;
  preferentialVote1?: number;
  preferentialVote2?: number;
}
