// useVoteEntries - Hook for managing vote entries
// Handles CRUD operations for vote entries

import { useState, useCallback } from 'react';
import type { VoteEntry } from '../types/acta.types';

export function useVoteEntries(initialEntries: VoteEntry[] = []) {
  const [entries, setEntries] = useState<VoteEntry[]>(initialEntries);

  const addEntry = useCallback((entry: VoteEntry) => {
    setEntries(prev => [...prev, entry]);
  }, []);

  const updateEntry = useCallback((tableNumber: number, updatedEntry: VoteEntry) => {
    setEntries(prev =>
      prev.map(entry =>
        entry.tableNumber === tableNumber ? updatedEntry : entry
      )
    );
  }, []);

  const deleteEntry = useCallback((tableNumber: number) => {
    setEntries(prev => prev.filter(entry => entry.tableNumber !== tableNumber));
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  const getNextTableNumber = useCallback(() => {
    if (entries.length === 0) return 1;
    const maxTableNumber = Math.max(...entries.map(entry => entry.tableNumber || 0));
    return maxTableNumber + 1;
  }, [entries]);

  return {
    entries,
    setEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    clearEntries,
    getNextTableNumber,
  };
}
