// useMesaValidation - Hook for mesa number validation
// Validates mesa numbers and checks for duplicates

import { useCallback } from 'react';

export function useMesaValidation() {
  const validateMesaNumber = useCallback((mesaNumber: string): boolean => {
    // Must be exactly 6 digits
    if (mesaNumber.length !== 6) {
      return false;
    }

    // Must be numeric
    const numericValue = parseInt(mesaNumber);
    if (isNaN(numericValue)) {
      return false;
    }

    // Must be positive
    if (numericValue <= 0) {
      return false;
    }

    return true;
  }, []);

  const formatMesaNumber = useCallback((mesaNumber: string): string => {
    // Remove non-digits
    const digits = mesaNumber.replace(/\D/g, '');

    // Limit to 6 digits
    return digits.slice(0, 6);
  }, []);

  const padMesaNumber = useCallback((mesaNumber: string | number): string => {
    return String(mesaNumber).padStart(6, '0');
  }, []);

  return {
    validateMesaNumber,
    formatMesaNumber,
    padMesaNumber,
  };
}
