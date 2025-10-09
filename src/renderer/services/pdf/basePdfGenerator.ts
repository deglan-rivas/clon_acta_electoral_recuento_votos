// Base PDF Generator - Core reusable logic for electoral PDFs

import { PDFDocument, StandardFonts, PDFPage } from 'pdf-lib';
import type {
  BaseElectoralPdfData,
  PdfGeneratorConfig,
  TextItem,
  VoteCountResult
} from './types/pdfTypes';
import { PdfFieldMapper } from './utils/pdfFieldMapper';
import { PdfTextRenderer } from './utils/pdfTextRenderer';
import { PdfRenderingPipeline } from './rendering/renderPhases';
import type { RenderContext } from './rendering/renderPhases';
import { savePdfWithFallback } from './pdfSaveService';
import { formatMesaNumber } from '../../config/pdfTemplateConstants';

/**
 * Custom renderer function type for election-specific rendering
 */
export type CustomRendererFn = (
  page: PDFPage,
  renderer: PdfTextRenderer,
  mapper: PdfFieldMapper,
  data: BaseElectoralPdfData,
  voteData: any,
  pageHeight: number
) => void;

/**
 * Core PDF generation logic shared by all electoral types
 * Supports both custom renderer function and rendering pipeline approaches
 */
export async function generateElectoralPdf(
  data: BaseElectoralPdfData,
  config: PdfGeneratorConfig,
  voteCalculationFn: (data: BaseElectoralPdfData, config: PdfGeneratorConfig) => any,
  customRenderer?: CustomRendererFn | PdfRenderingPipeline
): Promise<void> {
  try {
    // Load PDF template
    const existingPdfBytes = await fetch(config.templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Initialize utilities
    const mapper = new PdfFieldMapper(config.layoutConfig, height);
    const renderer = new PdfTextRenderer(firstPage, helveticaBoldFont);

    // Calculate votes using provided strategy
    const voteData = voteCalculationFn(data, config);

    // Check if using rendering pipeline pattern
    if (customRenderer instanceof PdfRenderingPipeline) {
      // Use pipeline approach
      const context: RenderContext = {
        page: firstPage,
        renderer,
        mapper,
        data,
        voteData,
        layoutConfig: config.layoutConfig,
        pageHeight: height
      };
      customRenderer.execute(context);
    } else {
      // Use legacy approach (backwards compatible)
      // Extract vote count (handle both simple and preferential)
      const voteCount: VoteCountResult = voteData.voteCount || voteData;

      // Map common fields
      const commonFieldsItems = mapper.mapCommonFields(data);

      // Map party votes
      const partyVoteItems = mapper.mapPartyVotes(
        data.politicalOrganizations,
        data.selectedOrganizationKeys,
        voteCount
      );

      // Combine all text items
      const allTextItems: TextItem[] = [...commonFieldsItems, ...partyVoteItems];

      // Draw all standard text
      renderer.drawTextBatch(allTextItems);

      // Execute custom rendering if provided (e.g., preferential table)
      if (customRenderer) {
        customRenderer(firstPage, renderer, mapper, data, voteData, height);
      }
    }

    // Save and open PDF
    const pdfBytes = await pdfDoc.save();
    const mesaNumberPadded = formatMesaNumber(data.mesaNumber);
    const filename = `acta_${config.electionType}_${mesaNumberPadded}.pdf`;
    await savePdfWithFallback(pdfBytes, filename);

  } catch (error) {
    console.error(`Error al generar el PDF ${config.electionType}:`, error);
    throw error;
  }
}

/**
 * Helper function to log vote labels for debugging
 */
export function logVoteLabels(electionType: string, labels: any): void {
  console.log(`Diccionario de etiquetas de votos con coordenadas (${electionType}):`, labels);
}
