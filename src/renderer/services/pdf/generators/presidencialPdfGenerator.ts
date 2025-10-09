// Presidencial PDF Generator Service - Refactored

import type { PresidencialPdfData } from "../types/pdfTypes";
import { calculateVoteCount } from "../../calculations/voteCalculationService";
import { generateElectoralPdf } from "../basePdfGenerator";
import {
  PDF_TEMPLATES,
  PRESIDENCIAL_LAYOUT
} from "../../../config/pdfTemplateConstants";

/**
 * Generates PDF for Presidencial election category
 */
export async function generatePresidencialPdf(data: PresidencialPdfData): Promise<void> {
  // Vote calculation strategy for Presidencial (simple counting, no preferential)
  const voteCalculationFn = (pdfData: PresidencialPdfData) => {
    return calculateVoteCount(pdfData.entries);
  };

  // Generate PDF using base generator
  await generateElectoralPdf(
    data,
    {
      templatePath: PDF_TEMPLATES.presidencial,
      layoutConfig: PRESIDENCIAL_LAYOUT,
      electionType: 'presidencial',
      hasPreferentialVoting: false
    },
    voteCalculationFn
    // No custom renderer needed for Presidencial
  );
}
