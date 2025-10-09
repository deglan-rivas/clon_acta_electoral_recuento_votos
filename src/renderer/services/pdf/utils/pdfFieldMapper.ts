// PDF Field Mapping Utility

import type {
  TextItem,
  PartyLabel,
  PartyLabels,
  LayoutConfig,
  BaseElectoralPdfData,
  VoteCountResult
} from '../types/pdfTypes';
import type { PoliticalOrganization } from '../../../types';
import { formatTime, formatDate } from '../../../utils/dateFormatters';
import { formatMesaNumber } from '../../../config/pdfTemplateConstants';

/**
 * Maps PDF fields to text items with coordinates
 */
export class PdfFieldMapper {
  constructor(
    private layout: LayoutConfig,
    private pageHeight: number
  ) {}

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
        texto: `${entries.length}`,
        x: this.layout.fields.tcvTopRight.x,
        y: this.pageHeight - this.layout.fields.tcvTopRight.yOffset,
        size: this.layout.fields.tcvTopRight.size
      },
      {
        texto: `${totalElectores}`,
        x: this.layout.fields.totalElectores.x,
        y: this.pageHeight - this.layout.fields.totalElectores.yOffset,
        size: this.layout.fields.totalElectores.size
      },
      {
        texto: `${cedulasExcedentes}`,
        x: this.layout.fields.cedulasExcedentes.x,
        y: this.pageHeight - this.layout.fields.cedulasExcedentes.yOffset,
        size: this.layout.fields.cedulasExcedentes.size
      },
      {
        texto: `${entries.length}`,
        x: this.layout.fields.tcvBottom.x,
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
        textItems.push({
          texto: `${label.votes}`,
          x: label.x,
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
