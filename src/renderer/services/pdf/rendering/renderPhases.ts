// Rendering Pipeline Pattern - Modular rendering phases for PDF generation

import type { PDFPage } from 'pdf-lib';
import type {
  BaseElectoralPdfData,
  LayoutConfig,
  VoteCountResult
} from '../types/pdfTypes';
import { PdfTextRenderer } from '../utils/pdfTextRenderer';
import { PdfFieldMapper } from '../utils/pdfFieldMapper';
import { PDF_COLORS } from '../pdfTemplateConstants';

/**
 * Base interface for rendering phases
 */
export interface RenderPhase {
  name: string;
  render(context: RenderContext): void;
}

/**
 * Context passed to each render phase
 */
export interface RenderContext {
  page: PDFPage;
  renderer: PdfTextRenderer;
  mapper: PdfFieldMapper;
  data: BaseElectoralPdfData;
  voteData: any;
  layoutConfig: LayoutConfig;
  pageHeight: number;
}

/**
 * Phase 1: Render common fields (mesa, location, times, etc.)
 */
export class CommonFieldsRenderer implements RenderPhase {
  name = 'CommonFields';

  render(context: RenderContext): void {
    const { renderer, mapper, data } = context;
    const commonFieldsItems = mapper.mapCommonFields(data);
    renderer.drawTextBatch(commonFieldsItems);
  }
}

/**
 * Phase 2: Render party vote counts
 */
export class PartyVotesRenderer implements RenderPhase {
  name = 'PartyVotes';

  render(context: RenderContext): void {
    const { renderer, mapper, data, voteData } = context;
    const voteCount: VoteCountResult = voteData.voteCount || voteData;
    const partyVoteItems = mapper.mapPartyVotes(
      data.politicalOrganizations,
      data.selectedOrganizationKeys,
      voteCount
    );
    renderer.drawTextBatch(partyVoteItems);
  }
}

/**
 * Phase 3: Render preferential voting table (for elections with preferential voting)
 */
export class PreferentialTableRenderer implements RenderPhase {
  name = 'PreferentialTable';
  private candidateCount: number;

  constructor(candidateCount: number) {
    this.candidateCount = candidateCount;
  }

  render(context: RenderContext): void {
    const { renderer, data, voteData, layoutConfig, pageHeight } = context;
    const { politicalOrganizations, selectedOrganizationKeys } = data;
    const { matrix } = voteData;
    const { preferentialTable } = layoutConfig;

    if (!preferentialTable) {
      console.warn('PreferentialTable renderer called but no preferentialTable config found');
      return;
    }

    let tableY = pageHeight - preferentialTable.startY;

    politicalOrganizations.forEach(org => {
      const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
      const isBlancoOrNulo = org.name === 'BLANCO' || org.name === 'NULO';
      const isSelected = selectedOrganizationKeys.includes(org.key);

      if (!isBlancoOrNulo) {
        if (tableY < 50) return; // Stop if we're at the bottom of the page

        const totalXPos = preferentialTable.startX + (this.candidateCount * preferentialTable.cellWidth) + 5;

        if (isSelected && matrix && matrix[partyKey]) {
          const partyMatrix = matrix[partyKey];
          let horizontalSum = 0;

          // Draw counts for each candidate
          for (let i = 1; i <= this.candidateCount; i++) {
            const count = partyMatrix[i] || 0;
            const countStr = `${count}`;
            // Calculate offset: 1 digit = 0, 2 digits = 3, 3+ digits = 6
            const xOffset = countStr.length >= 3 ? 6 : countStr.length === 2 ? 3 : 0;
            renderer.drawText({
              texto: countStr,
              x: preferentialTable.startX + ((i - 1) * preferentialTable.cellWidth) - xOffset,
              y: tableY,
              size: preferentialTable.fontSize
            }, PDF_COLORS.black);
            horizontalSum += count;
          }

          // Draw row total
          const horizontalSumStr = `${horizontalSum}`;
          // Calculate offset: 1 digit = 0, 2 digits = 3, 3+ digits = 6
          const xOffsetSum = horizontalSumStr.length >= 3 ? 6 : horizontalSumStr.length === 2 ? 3 : 0;
          renderer.drawText({
            texto: horizontalSumStr,
            x: totalXPos - xOffsetSum,
            y: tableY,
            size: preferentialTable.fontSize
          }, PDF_COLORS.black);
        } else {
          // For unselected organizations, show dashes
          for (let i = 1; i <= this.candidateCount; i++) {
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
}

/**
 * Phase 4: Render JEE members information (for elections that display JEE members)
 */
export class JeeMembersRenderer implements RenderPhase {
  name = 'JeeMembers';

  render(context: RenderContext): void {
    const { renderer, data, layoutConfig, pageHeight } = context;
    const { jeeMiembrosData, jeeId } = data;
    const { jeeMembers } = layoutConfig;

    if (!jeeMembers) {
      console.warn('JeeMembersRenderer called but no jeeMembers config found');
      return;
    }

    if (!jeeMiembrosData || jeeMiembrosData.length === 0) {
      console.warn('JeeMembersRenderer called but no jeeMiembrosData available');
      return;
    }

    const { labelOffsets, personas } = jeeMembers;

    // Iterate through each persona position configuration
    personas.forEach(personaConfig => {
      const { x, yOffset, size, lineHeight, cargo } = personaConfig;

      // Filter JEE members by jeeId and cargo
      const member = jeeMiembrosData.find(
        m => m.jee_id === jeeId && m.CARGO === cargo
      );

      if (!member) {
        console.warn(`No JEE member found for jeeId: ${jeeId}, cargo: ${cargo}`);
        return;
      }

      // Calculate Y position
      let currentY = pageHeight - yOffset;

      // Render NOMBRES
      renderer.drawText({
        texto: member.NOMBRES.toUpperCase(),
        x: x + labelOffsets.nombres,
        y: currentY,
        size: size
      }, PDF_COLORS.black);

      // Move to next line for APELLIDOS
      currentY -= lineHeight;
      const apellidos = `${member.APELLIDOPATERNO} ${member.APELLIDOMATERNO}`.toUpperCase();
      renderer.drawText({
        texto: apellidos,
        x: x + labelOffsets.apellidos,
        y: currentY,
        size: size
      }, PDF_COLORS.black);

      // Move to next line for DNI
      currentY -= lineHeight;
      renderer.drawText({
        texto: member.TXDOCUMENTOIDENTIDAD,
        x: x + labelOffsets.dni,
        y: currentY,
        size: size
      }, PDF_COLORS.black);
    });
  }
}

/**
 * Rendering Pipeline - Orchestrates multiple rendering phases
 */
export class PdfRenderingPipeline {
  private phases: RenderPhase[] = [];

  /**
   * Adds a rendering phase to the pipeline
   */
  addPhase(phase: RenderPhase): this {
    this.phases.push(phase);
    return this;
  }

  /**
   * Executes all rendering phases in order
   */
  execute(context: RenderContext): void {
    this.phases.forEach(phase => {
      try {
        phase.render(context);
      } catch (error) {
        console.error(`Error in rendering phase '${phase.name}':`, error);
        throw error;
      }
    });
  }

  /**
   * Returns the list of phase names for logging
   */
  getPhaseNames(): string[] {
    return this.phases.map(p => p.name);
  }
}
