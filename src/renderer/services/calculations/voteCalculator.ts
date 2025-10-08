// voteCalculator - Utility functions for vote calculations
// Handles vote totals, TCV calculations, and statistics

import type { VoteEntry } from '../../types/acta.types';

export class VoteCalculator {
  /**
   * Calculate total votes by party
   */
  static getVotesByParty(entries: VoteEntry[]): Record<string, number> {
    return entries.reduce((acc, entry) => {
      const party = entry.party;
      acc[party] = (acc[party] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Calculate total preferential votes for a specific preferential number
   */
  static getPreferentialVotesByParty(
    entries: VoteEntry[],
    preferentialNumber: 1 | 2
  ): Record<string, Record<number, number>> {
    const result: Record<string, Record<number, number>> = {};

    entries.forEach(entry => {
      const party = entry.party;
      if (!result[party]) {
        result[party] = {};
      }

      const prefValue = preferentialNumber === 1 ? entry.preferentialVote1 : entry.preferentialVote2;
      if (prefValue && prefValue > 0) {
        result[party][prefValue] = (result[party][prefValue] || 0) + 1;
      }
    });

    return result;
  }

  /**
   * Calculate total valid votes (excluding BLANCO and NULO)
   */
  static getValidVotes(entries: VoteEntry[]): number {
    return entries.filter(entry =>
      entry.party !== 'BLANCO' && entry.party !== 'NULO'
    ).length;
  }

  /**
   * Calculate BLANCO votes
   */
  static getBlancoVotes(entries: VoteEntry[]): number {
    return entries.filter(entry => entry.party === 'BLANCO').length;
  }

  /**
   * Calculate NULO votes
   */
  static getNuloVotes(entries: VoteEntry[]): number {
    return entries.filter(entry => entry.party === 'NULO').length;
  }

  /**
   * Calculate Total de Ciudadanos que Votaron (TCV)
   * TCV = total entries count
   */
  static getTCV(entries: VoteEntry[]): number {
    return entries.length;
  }

  /**
   * Validate if TCV matches expected count
   */
  static validateTCV(entries: VoteEntry[], expectedTCV: number): boolean {
    return entries.length === expectedTCV;
  }

  /**
   * Calculate if cédulas excedentes can be set
   * (only when entries.length equals totalElectores)
   */
  static canSetCedulasExcedentes(entriesLength: number, totalElectores: number): boolean {
    return entriesLength === totalElectores;
  }

  /**
   * Get vote percentage for a party
   */
  static getVotePercentage(partyVotes: number, totalVotes: number): number {
    if (totalVotes === 0) return 0;
    return (partyVotes / totalVotes) * 100;
  }

  /**
   * Get ranking of parties by votes
   */
  static getRanking(entries: VoteEntry[]): Array<{ party: string; votes: number }> {
    const votesByParty = this.getVotesByParty(entries);

    return Object.entries(votesByParty)
      .map(([party, votes]) => ({ party, votes }))
      .sort((a, b) => b.votes - a.votes);
  }
}
