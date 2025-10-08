// voteValidator - Validation rules for vote entries
// Validates vote limits, preferential votes, and entry constraints

import type { VoteEntry, VoteLimits, PreferentialConfig } from '../../types/acta.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class VoteValidator {
  /**
   * Check if party is BLANCO or NULO
   */
  static isBlankOrNull(party: string): boolean {
    return party === 'BLANCO' || party === 'NULO';
  }

  /**
   * Validate a new vote entry
   */
  static validateEntry(
    entry: Partial<VoteEntry>,
    voteLimits: VoteLimits,
    preferentialConfig: PreferentialConfig
  ): ValidationResult {
    const errors: string[] = [];

    // Validate party selection
    if (!entry.party || entry.party === '') {
      errors.push('Debe seleccionar una organización política');
    }

    // Validate preferential vote 1
    if (preferentialConfig.hasPreferential1) {
      const pref1 = entry.preferentialVote1 || 0;
      if (pref1 > voteLimits.preferential1) {
        errors.push(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`);
      }
    }

    // Validate preferential vote 2
    if (preferentialConfig.hasPreferential2) {
      const pref2 = entry.preferentialVote2 || 0;
      if (pref2 > voteLimits.preferential2) {
        errors.push(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`);
      }
    }

    // Validate no preferential votes with BLANCO/NULO
    if (entry.party && this.isBlankOrNull(entry.party)) {
      const pref1 = entry.preferentialVote1 || 0;
      const pref2 = entry.preferentialVote2 || 0;
      if (pref1 > 0 || pref2 > 0) {
        errors.push('No se pueden ingresar votos preferenciales con BLANCO o NULO');
      }
    }

    // Validate preferential votes are different
    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      const pref1 = entry.preferentialVote1 || 0;
      const pref2 = entry.preferentialVote2 || 0;
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        errors.push('Los votos preferenciales 1 y 2 deben tener valores diferentes');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate if more entries can be added
   */
  static canAddEntry(currentEntriesCount: number, totalElectores: number): ValidationResult {
    const errors: string[] = [];

    if (currentEntriesCount >= totalElectores) {
      errors.push(`No se pueden agregar más cédulas. Límite alcanzado: ${totalElectores} electores hábiles`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate mesa data before starting session
   */
  static validateMesaData(
    mesaNumber: string,
    actaNumber: string,
    location: { departamento: string; provincia: string; distrito: string; jee: string },
    totalElectores: number
  ): ValidationResult {
    const errors: string[] = [];

    if (!mesaNumber || mesaNumber.length !== 6) {
      errors.push('El número de mesa debe tener 6 dígitos');
    }

    if (!actaNumber) {
      errors.push('El número de acta es requerido');
    }

    if (!location.departamento || !location.provincia || !location.distrito) {
      errors.push('Debe seleccionar la ubicación completa (Departamento, Provincia, Distrito)');
    }

    if (!location.jee) {
      errors.push('Debe seleccionar el JEE');
    }

    if (totalElectores <= 0) {
      errors.push('El Total de Electores Hábiles debe ser mayor a 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate if form can be finalized
   */
  static canFinalizeForm(
    isMesaDataSaved: boolean,
    entriesCount: number
  ): ValidationResult {
    const errors: string[] = [];

    if (!isMesaDataSaved) {
      errors.push('Debe guardar los datos de la mesa antes de finalizar');
    }

    if (entriesCount === 0) {
      errors.push('Debe registrar al menos un voto antes de finalizar');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
