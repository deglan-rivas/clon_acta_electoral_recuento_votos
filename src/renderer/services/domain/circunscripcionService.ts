// Service for Circunscripción Electoral logic
import type { CircunscripcionRecord } from '../../types/acta.types';
import { NATIONAL_CATEGORIES } from '../../config/electoralCategories';

export class CircunscripcionService {
  /**
   * Get available circunscripciones for a given category
   */
  static getCircunscripcionElectoralOptions(
    activeCategory: string,
    circunscripcionData: CircunscripcionRecord[]
  ): string[] {
    // For specific categories (presidencial, parlamentoAndino, senadoresNacional),
    // show only their specific circunscripción
    if (NATIONAL_CATEGORIES.includes(activeCategory)) {
      const categorySpecific = circunscripcionData.find(record => record.category === activeCategory);
      if (categorySpecific && categorySpecific.circunscripcion_electoral && categorySpecific.circunscripcion_electoral.trim() !== '') {
        return [categorySpecific.circunscripcion_electoral];
      }
      // Fallback in case the specific category isn't found
      return [];
    }

    // For all other categories (senadoresRegional, diputados, etc.),
    // show all circunscripciones where category is empty (departmental ones)
    const departmental = circunscripcionData
      .filter(record => !record.category || record.category.trim() === "")
      .map(record => record.circunscripcion_electoral)
      .filter(circ => circ && circ.trim() !== ''); // Filter out empty strings

    return [...new Set(departmental)].sort();
  }

  /**
   * Determine circunscripción electoral based on category, departamento and provincia
   */
  static getCircunscripcionElectoral(
    category: string,
    departamento: string,
    provincia: string,
    circunscripcionData: CircunscripcionRecord[]
  ): string {
    if (circunscripcionData.length === 0) return "";

    // First check if category exists in CSV
    const categoryExists = circunscripcionData.some(record => record.category === category);

    if (categoryExists) {
      // Category found in CSV - use category-specific logic
      const categoryMatch = circunscripcionData.find(record =>
        record.category === category
      );
      if (categoryMatch) return categoryMatch.circunscripcion_electoral;
    }

    // Category not found in CSV or fallback - use regional logic with empty category
    if (!departamento) return "";

    // For Lima, provincia selection is required
    if (departamento.toUpperCase() === "LIMA") {
      if (!provincia) {
        return ""; // Return empty if Lima is selected but no provincia yet
      }

      if (provincia.toUpperCase() === "LIMA") {
        // Find LIMA METROPOLITANA record
        const match = circunscripcionData.find(record =>
          record.category === "" && // Regional records have empty category
          record.departamento.toUpperCase() === "LIMA" &&
          record.provincia.toUpperCase() === "LIMA"
        );
        return match ? match.circunscripcion_electoral : "LIMA METROPOLITANA";
      } else {
        // Find LIMA PROVINCIAS record (provincia is empty for this case)
        const match = circunscripcionData.find(record =>
          record.category === "" && // Regional records have empty category
          record.departamento.toUpperCase() === "LIMA" &&
          record.provincia === ""
        );
        return match ? match.circunscripcion_electoral : "LIMA PROVINCIAS";
      }
    }

    // For other departamentos, match where provincia is empty and category is empty (regional)
    const match = circunscripcionData.find(record =>
      record.category === "" && // Regional records have empty category
      record.departamento.toUpperCase() === departamento.toUpperCase() &&
      record.provincia === ""
    );

    return match ? match.circunscripcion_electoral : departamento.toUpperCase();
  }
}
