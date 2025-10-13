// Base PDF Generator - Core reusable logic for electoral PDFs

import { PDFDocument, StandardFonts } from 'pdf-lib';
import type {
  BaseElectoralPdfData,
  PdfGeneratorConfig
} from './types/pdfTypes';
import { PdfFieldMapper } from './utils/pdfFieldMapper';
import { PdfTextRenderer } from './utils/pdfTextRenderer';
import { PdfRenderingPipeline } from './rendering/renderPhases';
import type { RenderContext } from './rendering/renderPhases';
import { savePdfWithFallback } from './pdfSaveService';
import { formatMesaNumber } from './pdfTemplateConstants';

/**
 * Core PDF generation logic shared by all electoral types
 * Uses the pipeline rendering approach for modular, reusable rendering
 */
export async function generateElectoralPdf(
  data: BaseElectoralPdfData,
  config: PdfGeneratorConfig,
  voteCalculationFn: (data: BaseElectoralPdfData, config: PdfGeneratorConfig) => any,
  pipeline: PdfRenderingPipeline
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

    // Execute rendering pipeline
    const context: RenderContext = {
      page: firstPage,
      renderer,
      mapper,
      data,
      voteData,
      layoutConfig: config.layoutConfig,
      pageHeight: height
    };
    pipeline.execute(context);

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
