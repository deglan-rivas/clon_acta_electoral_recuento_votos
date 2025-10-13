// PDF Field Mapping Utility

import type {
  TextItem,
  PartyLabels,
  LayoutConfig,
  BaseElectoralPdfData,
  VoteCountResult
} from '../types/pdfTypes';
import type { PoliticalOrganization } from '../../../types';
import { formatTime, formatDate } from '../../../utils/dateFormatters';
import { formatMesaNumber } from '../pdfTemplateConstants';

/**
 * Maps PDF fields to text items with coordinates
 */
export class PdfFieldMapper {
  private layout: LayoutConfig;
  private pageHeight: number;

  constructor(layout: LayoutConfig, pageHeight: number) {
    this.layout = layout;
    this.pageHeight = pageHeight;
  }

  /**
   * Maps common fields present in all electoral PDFs
   */
  mapCommonFields(data: BaseElectoralPdfData): TextItem[] {
    const {
      mesaNumber,
      actaNumber,
      selectedLocation,
      endTime,
      startTime,
      entries,
      totalElectores,
      cedulasExcedentes
    } = data;

    const mesaNumberPadded = formatMesaNumber(mesaNumber);
    const horaFin = formatTime(endTime);
    const fechaFin = formatDate(endTime);

    const entriesStr = `${entries.length}`;
    // Calculate offset: 1 digit = 0, 2 digits = 5, 3+ digits = 10
    const xOffsetEntries = entriesStr.length >= 3 ? 10 : entriesStr.length === 2 ? 5 : 0;

    const totalElectoresStr = `${totalElectores}`;
    // Calculate offset: 1 digit = 0, 2 digits = 5, 3+ digits = 10
    const xOffsetTotalElectores = totalElectoresStr.length >= 3 ? 10 : totalElectoresStr.length === 2 ? 5 : 0;

    const cedulasExcedentesStr = `${cedulasExcedentes}`;
    // Calculate offset: 1 digit = 0, 2 digits = 5, 3+ digits = 10
    const xOffsetCedulasExcedentes = cedulasExcedentesStr.length >= 3 ? 10 : cedulasExcedentesStr.length === 2 ? 5 : 0

    const textItems: TextItem[] = [
      {
        texto: mesaNumberPadded,
        x: this.layout.fields.mesaNumber.x,
        y: this.pageHeight - this.layout.fields.mesaNumber.yOffset,
        size: this.layout.fields.mesaNumber.size
      },
      {
        texto: actaNumber,
        x: this.layout.fields.actaNumber.x,
        y: this.pageHeight - this.layout.fields.actaNumber.yOffset,
        size: this.layout.fields.actaNumber.size
      },
      {
        texto: selectedLocation.jee.toUpperCase(),
        x: this.layout.fields.jee.x,
        y: this.pageHeight - this.layout.fields.jee.yOffset,
        size: this.layout.fields.jee.size
      },
      {
        texto: selectedLocation.departamento.toUpperCase(),
        x: this.layout.fields.departamento.x,
        y: this.pageHeight - this.layout.fields.departamento.yOffset,
        size: this.layout.fields.departamento.size
      },
      {
        texto: selectedLocation.provincia.toUpperCase(),
        x: this.layout.fields.provincia.x,
        y: this.pageHeight - this.layout.fields.provincia.yOffset,
        size: this.layout.fields.provincia.size
      },
      {
        texto: selectedLocation.distrito.toUpperCase(),
        x: this.layout.fields.distrito.x,
        y: this.pageHeight - this.layout.fields.distrito.yOffset,
        size: this.layout.fields.distrito.size
      },
      {
        texto: horaFin,
        x: this.layout.fields.endTime.x,
        y: this.pageHeight - this.layout.fields.endTime.yOffset,
        size: this.layout.fields.endTime.size
      },
      {
        texto: fechaFin,
        x: this.layout.fields.endDate.x,
        y: this.pageHeight - this.layout.fields.endDate.yOffset,
        size: this.layout.fields.endDate.size
      },
      {
        texto: entriesStr,
        x: this.layout.fields.tcvTopRight.x - xOffsetEntries,
        y: this.pageHeight - this.layout.fields.tcvTopRight.yOffset,
        size: this.layout.fields.tcvTopRight.size
      },
      {
        texto: totalElectoresStr,
        x: this.layout.fields.totalElectores.x - xOffsetTotalElectores,
        y: this.pageHeight - this.layout.fields.totalElectores.yOffset,
        size: this.layout.fields.totalElectores.size
      },
      {
        texto: cedulasExcedentesStr,
        x: this.layout.fields.cedulasExcedentes.x - xOffsetCedulasExcedentes,
        y: this.pageHeight - this.layout.fields.cedulasExcedentes.yOffset,
        size: this.layout.fields.cedulasExcedentes.size
      },
      {
        texto: entriesStr,
        x: this.layout.fields.tcvBottom.x - xOffsetEntries,
        y: this.pageHeight - this.layout.fields.tcvBottom.yOffset,
        size: this.layout.fields.tcvBottom.size
      }
    ];

    // Add start time if available
    if (startTime) {
      const horaInicio = formatTime(startTime);
      const fechaInicio = formatDate(startTime);

      textItems.push({
        texto: horaInicio,
        x: this.layout.fields.startTime.x,
        y: this.pageHeight - this.layout.fields.startTime.yOffset,
        size: this.layout.fields.startTime.size
      });

      textItems.push({
        texto: fechaInicio,
        x: this.layout.fields.startDate.x,
        y: this.pageHeight - this.layout.fields.startDate.yOffset,
        size: this.layout.fields.startDate.size
      });
    }

    return textItems;
  }

  /**
   * Builds party vote labels with coordinates
   */
  buildPartyLabels(
    politicalOrganizations: PoliticalOrganization[],
    selectedOrganizationKeys: string[]
  ): PartyLabels {
    const labels: PartyLabels = {};
    let y_pos = this.pageHeight - this.layout.votesStartY;

    politicalOrganizations.forEach(org => {
      const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
      const isSelected = selectedOrganizationKeys.includes(org.key);

      if (org.name === "BLANCO") {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: this.layout.specialVotes.blanco.x,
          y: this.pageHeight - this.layout.specialVotes.blanco.yOffset
        };
      } else if (org.name === "NULO") {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: this.layout.specialVotes.nulo.x,
          y: this.pageHeight - this.layout.specialVotes.nulo.yOffset
        };
      } else {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: this.layout.partyVotes.x,
          y: y_pos
        };
        y_pos -= this.layout.lineHeight;
      }
    });

    return labels;
  }

  /**
   * Fills party labels with actual vote counts
   */
  fillVoteCounts(labels: PartyLabels, voteCount: VoteCountResult): void {
    for (const party in voteCount) {
      if (labels.hasOwnProperty(party) && labels[party].votes !== "-") {
        labels[party].votes = voteCount[party];
      }
    }
  }

  /**
   * Converts party labels to text items
   */
  partyLabelsToTextItems(labels: PartyLabels): TextItem[] {
    const textItems: TextItem[] = [];

    for (const partyName in labels) {
      if (labels.hasOwnProperty(partyName)) {
        const label = labels[partyName];
        const votesStr = `${label.votes}`;
        // Calculate offset: 1 digit = 0, 2 digits = 5, 3+ digits = 10
        const xOffset = votesStr.length >= 3 ? 10 : votesStr.length === 2 ? 5 : 0;
        textItems.push({
          texto: votesStr,
          x: label.x - xOffset,
          y: label.y,
          size: this.layout.partyVotes.size
        });
      }
    }

    return textItems;
  }

  /**
   * Complete mapping: builds labels, fills counts, and returns text items
   */
  mapPartyVotes(
    politicalOrganizations: PoliticalOrganization[],
    selectedOrganizationKeys: string[],
    voteCount: VoteCountResult
  ): TextItem[] {
    const labels = this.buildPartyLabels(politicalOrganizations, selectedOrganizationKeys);
    this.fillVoteCounts(labels, voteCount);
    return this.partyLabelsToTextItems(labels);
  }
}
