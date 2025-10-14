// PDF Template Selector - Dynamically selects the correct PDF template based on electoral parameters

import type { ElectionType } from '../types/pdfTypes';
import { ELECTORAL_CATEGORIES } from '../../../config/electoralCategories';

/**
 * Maps electoral category keys to their segment names in PDF filenames
 */
const CATEGORY_SEGMENT_MAP: Record<string, string> = {
  presidencial: 'PRESIDENCIAL',
  senadoresNacional: 'SENADORES_NACIONAL',
  senadoresRegional: 'SENADORES_DISTRITO_MULTIPLE',
  diputados: 'DIPUTADOS_DISTRITO_MULTIPLE',
  parlamentoAndino: 'PARLAMENTO_ANDINO',
};

/**
 * Interface for PDF template selection parameters
 */
export interface PdfTemplateParams {
  electionType: ElectionType;
  limiteVotoPreferencial?: number;
  isInternational?: boolean;
}

/**
 * Gets the category ID (A, B, C, D, E) for a given election type
 */
function getCategoryId(electionType: ElectionType): string {
  const category = ELECTORAL_CATEGORIES.find(cat => cat.key === electionType);
  if (!category) {
    throw new Error(`Unknown election type: ${electionType}`);
  }
  return category.id;
}

/**
 * Gets the category segment name for the PDF filename
 */
function getCategorySegment(electionType: ElectionType): string {
  const segment = CATEGORY_SEGMENT_MAP[electionType];
  if (!segment) {
    throw new Error(`No segment mapping found for election type: ${electionType}`);
  }
  return segment;
}

/**
 * Determines if an election type should include the preferential segment in filename
 * Presidencial and ParlamentoAndino PDF files don't include _PREFERENCIALES in their names
 */
function shouldIncludePreferentialSegment(electionType: ElectionType): boolean {
  return electionType !== 'presidencial' && electionType !== 'parlamentoAndino';
}

/**
 * Builds the PDF template path based on electoral parameters
 *
 * Format: ./actas/{ID}_{CATEGORY}[_{LIMITE}_PREFERENCIALES][_EXTRANJERO].pdf
 *
 * Examples:
 * - A_PRESIDENCIAL.pdf
 * - A_PRESIDENCIAL_EXTRANJERO.pdf
 * - B_SENADORES_NACIONAL_30_PREFERENCIALES.pdf
 * - C_SENADORES_DISTRITO_MULTIPLE_2_PREFERENCIALES.pdf
 * - D_DIPUTADOS_DISTRITO_MULTIPLE_32_PREFERENCIALES.pdf
 * - E_PARLAMENTO_ANDINO.pdf (no _PREFERENCIALES segment)
 *
 * @param params - Template selection parameters
 * @returns Path to the PDF template
 */
export function selectPdfTemplate(params: PdfTemplateParams): string {
  const { electionType, limiteVotoPreferencial, isInternational = false } = params;

  const categoryId = getCategoryId(electionType);
  const categorySegment = getCategorySegment(electionType);

  const parts: string[] = [categoryId, categorySegment];

  // Add preferential vote limit for categories that support it in the filename
  // Note: Presidencial and ParlamentoAndino don't include this segment in their PDF filenames
  if (limiteVotoPreferencial && limiteVotoPreferencial > 0 && shouldIncludePreferentialSegment(electionType)) {
    parts.push(`${limiteVotoPreferencial}_PREFERENCIALES`);
  }

  // Add EXTRANJERO suffix for international locations
  if (isInternational) {
    parts.push('EXTRANJERO');
  }

  const filename = parts.join('_') + '.pdf';
  const templatePath = `./actas/${filename}`;

  console.log('[selectPdfTemplate] Selected template:', templatePath);
  console.log('[selectPdfTemplate] Parameters:', params);

  return templatePath;
}

/**
 * Validates that a PDF template exists (can be extended to check file system)
 * For now, just validates the parameters make sense
 */
export function validateTemplateParams(params: PdfTemplateParams): boolean {
  try {
    getCategoryId(params.electionType);
    getCategorySegment(params.electionType);
    return true;
  } catch {
    return false;
  }
}
