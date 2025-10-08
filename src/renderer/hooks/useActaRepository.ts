// Hook to access ActaRepository with storage abstraction
// Provides a singleton instance of ActaRepository using configured storage adapter

import { useMemo } from 'react';
import { ActaRepository } from '../repositories/implementations/ActaRepository';
import { StorageFactory } from '../services/storage/StorageFactory';
import type { IActaRepository } from '../repositories/interfaces/IActaRepository';

export function useActaRepository(): IActaRepository {
  const repository = useMemo(() => {
    const adapter = StorageFactory.getAdapter('localStorage');
    return new ActaRepository(adapter);
  }, []);

  return repository;
}
