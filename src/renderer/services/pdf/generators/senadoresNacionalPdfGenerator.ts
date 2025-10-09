// Senadores Nacional PDF Generator Service - Refactored

import type { PDFPage } from 'pdf-lib';
import type { SenadoresNacionalPdfData, BaseElectoralPdfData } from "../types/pdfTypes";
import { calculateVoteDataWithPreferential } from "../../calculations/voteCalculationService";
import { generateElectoralPdf } from "../basePdfGenerator";
import type { PdfTextRenderer } from "../utils/pdfTextRenderer";
import type { PdfFieldMapper } from "../utils/pdfFieldMapper";
import {
  PDF_TEMPLATES,
  SENADORES_NACIONAL_LAYOUT,
  SENATORS_COUNT,
  PDF_COLORS
} from "../../../config/pdfTemplateConstants";

/**
 * Custom renderer for Senadores Nacional preferential voting table
 */
function renderPreferentialTable(
  _page: PDFPage,
  renderer: PdfTextRenderer,
  _mapper: PdfFieldMapper,
  data: BaseElectoralPdfData,
  voteData: any,
  pageHeight: number
): void {
  const { politicalOrganizations, selectedOrganizationKeys } = data;
  const { matrix } = voteData;
  const { preferentialTable } = SENADORES_NACIONAL_LAYOUT;

  if (!preferentialTable) return;

  let tableY = pageHeight - preferentialTable.startY;

  politicalOrganizations.forEach(org => {
    const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
    const isBlancoOrNulo = org.name === 'BLANCO' || org.name === 'NULO';
    const isSelected = selectedOrganizationKeys.includes(org.key);

    if (!isBlancoOrNulo) {
      if (tableY < 50) return; // Stop if we're at the bottom of the page

      const totalXPos = preferentialTable.startX + (SENATORS_COUNT * preferentialTable.cellWidth);

      if (isSelected && matrix && matrix[partyKey]) {
        const partyMatrix = matrix[partyKey];
        let horizontalSum = 0;

        // Draw counts for each candidate (1-30)
        for (let i = 1; i <= SENATORS_COUNT; i++) {
          const count = partyMatrix[i] || 0;
          renderer.drawText({
            texto: `${count}`,
            x: preferentialTable.startX + ((i - 1) * preferentialTable.cellWidth),
            y: tableY,
            size: preferentialTable.fontSize
          }, PDF_COLORS.black);
          horizontalSum += count;
        }

        // Draw row total
        renderer.drawText({
          texto: `${horizontalSum}`,
          x: totalXPos,
          y: tableY,
          size: preferentialTable.fontSize
        }, PDF_COLORS.black);
      } else {
        // For unselected organizations, show dashes
        for (let i = 1; i <= SENATORS_COUNT; i++) {
          renderer.drawText({
            texto: "-",
            x: preferentialTable.startX + ((i - 1) * preferentialTable.cellWidth),
            y: tableY,
            size: preferentialTable.fontSize
          }, PDF_COLORS.black);
        }
        renderer.drawText({
          texto: "-",
          x: totalXPos,
          y: tableY,
          size: preferentialTable.fontSize
        }, PDF_COLORS.black);
      }

      tableY -= preferentialTable.lineHeight;
    }
  });
}

/**
 * Generates PDF for Senadores Nacional election category
 */
export async function generateSenadoresNacionalPdf(data: SenadoresNacionalPdfData): Promise<void> {
  // Vote calculation strategy for Senadores Nacional (with preferential voting)
  const voteCalculationFn = (pdfData: SenadoresNacionalPdfData) => {
    return calculateVoteDataWithPreferential(
      pdfData.entries,
      pdfData.politicalOrganizations,
      pdfData.selectedOrganizationKeys,
      SENATORS_COUNT
    );
  };

  // Generate PDF using base generator with custom preferential table renderer
  await generateElectoralPdf(
    data,
    {
      templatePath: PDF_TEMPLATES.senadoresNacional,
      layoutConfig: SENADORES_NACIONAL_LAYOUT,
      electionType: 'senadoresNacional',
      hasPreferentialVoting: true,
      preferentialCount: SENATORS_COUNT
    },
    voteCalculationFn,
    renderPreferentialTable
  );
}
