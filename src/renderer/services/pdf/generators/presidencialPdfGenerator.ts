// Presidencial PDF Generator Service

import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { VoteEntry, PoliticalOrganization } from "../../../types";
import { calculateVoteCount } from "../../calculations/voteCalculationService";
import { formatTime, formatDate } from "../../../utils/dateFormatters";
import { savePdfWithFallback } from "../pdfSaveService";
import {
  PDF_TEMPLATES,
  PRESIDENCIAL_LAYOUT,
  PDF_COLORS,
  formatMesaNumber
} from "../../../config/pdfTemplateConstants";

interface SelectedLocation {
  departamento: string;
  provincia: string;
  distrito: string;
  jee: string;
}

interface PresidencialPdfData {
  entries: VoteEntry[];
  politicalOrganizations: PoliticalOrganization[];
  selectedOrganizationKeys: string[];
  mesaNumber: number;
  actaNumber: string;
  totalElectores: number;
  cedulasExcedentes: number;
  selectedLocation: SelectedLocation;
  startTime: Date | null;
  endTime: Date;
}

/**
 * Generates PDF for Presidencial election category
 */
export async function generatePresidencialPdf(data: PresidencialPdfData): Promise<void> {
  try {
    const {
      entries,
      politicalOrganizations,
      selectedOrganizationKeys,
      mesaNumber,
      actaNumber,
      totalElectores,
      cedulasExcedentes,
      selectedLocation,
      startTime,
      endTime
    } = data;

    // Load PDF template
    const existingPdfBytes = await fetch(PDF_TEMPLATES.presidencial).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Calculate vote counts
    const voteCount = calculateVoteCount(entries);

    // Build labels object with coordinates for each party
    const labels: { [key: string]: { votes: number | string; x: number; y: number } } = {};
    let y_pos = height - PRESIDENCIAL_LAYOUT.votesStartY;

    politicalOrganizations.forEach(org => {
      const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
      const isSelected = selectedOrganizationKeys.includes(org.key);

      if (org.name === "BLANCO") {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: PRESIDENCIAL_LAYOUT.specialVotes.blanco.x,
          y: height - PRESIDENCIAL_LAYOUT.specialVotes.blanco.yOffset
        };
      } else if (org.name === "NULO") {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: PRESIDENCIAL_LAYOUT.specialVotes.nulo.x,
          y: height - PRESIDENCIAL_LAYOUT.specialVotes.nulo.yOffset
        };
      } else {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: PRESIDENCIAL_LAYOUT.partyVotes.x,
          y: y_pos
        };
        y_pos -= PRESIDENCIAL_LAYOUT.lineHeight;
      }
    });

    // Fill in actual vote counts
    for (const party in voteCount) {
      if (labels.hasOwnProperty(party) && labels[party].votes !== "-") {
        labels[party].votes = voteCount[party];
      }
    }

    console.log("Diccionario de etiquetas de votos con coordenadas:", labels);

    // Prepare all text data to draw
    const mesaNumberPadded = formatMesaNumber(mesaNumber);
    const horaFin = formatTime(endTime);
    const fechaFin = formatDate(endTime);

    const textData: Array<{ texto: string; x: number; y: number; size: number }> = [
      { texto: mesaNumberPadded, x: PRESIDENCIAL_LAYOUT.fields.mesaNumber.x, y: height - PRESIDENCIAL_LAYOUT.fields.mesaNumber.yOffset, size: PRESIDENCIAL_LAYOUT.fields.mesaNumber.size },
      { texto: actaNumber, x: PRESIDENCIAL_LAYOUT.fields.actaNumber.x, y: height - PRESIDENCIAL_LAYOUT.fields.actaNumber.yOffset, size: PRESIDENCIAL_LAYOUT.fields.actaNumber.size },
      { texto: selectedLocation.jee.toUpperCase(), x: PRESIDENCIAL_LAYOUT.fields.jee.x, y: height - PRESIDENCIAL_LAYOUT.fields.jee.yOffset, size: PRESIDENCIAL_LAYOUT.fields.jee.size },
      { texto: selectedLocation.departamento.toUpperCase(), x: PRESIDENCIAL_LAYOUT.fields.departamento.x, y: height - PRESIDENCIAL_LAYOUT.fields.departamento.yOffset, size: PRESIDENCIAL_LAYOUT.fields.departamento.size },
      { texto: selectedLocation.provincia.toUpperCase(), x: PRESIDENCIAL_LAYOUT.fields.provincia.x, y: height - PRESIDENCIAL_LAYOUT.fields.provincia.yOffset, size: PRESIDENCIAL_LAYOUT.fields.provincia.size },
      { texto: selectedLocation.distrito.toUpperCase(), x: PRESIDENCIAL_LAYOUT.fields.distrito.x, y: height - PRESIDENCIAL_LAYOUT.fields.distrito.yOffset, size: PRESIDENCIAL_LAYOUT.fields.distrito.size },
      { texto: horaFin, x: PRESIDENCIAL_LAYOUT.fields.endTime.x, y: height - PRESIDENCIAL_LAYOUT.fields.endTime.yOffset, size: PRESIDENCIAL_LAYOUT.fields.endTime.size },
      { texto: fechaFin, x: PRESIDENCIAL_LAYOUT.fields.endDate.x, y: height - PRESIDENCIAL_LAYOUT.fields.endDate.yOffset, size: PRESIDENCIAL_LAYOUT.fields.endDate.size },
      { texto: `${entries.length}`, x: PRESIDENCIAL_LAYOUT.fields.tcvTopRight.x, y: height - PRESIDENCIAL_LAYOUT.fields.tcvTopRight.yOffset, size: PRESIDENCIAL_LAYOUT.fields.tcvTopRight.size },
      { texto: `${totalElectores}`, x: PRESIDENCIAL_LAYOUT.fields.totalElectores.x, y: height - PRESIDENCIAL_LAYOUT.fields.totalElectores.yOffset, size: PRESIDENCIAL_LAYOUT.fields.totalElectores.size },
      { texto: `${cedulasExcedentes}`, x: PRESIDENCIAL_LAYOUT.fields.cedulasExcedentes.x, y: height - PRESIDENCIAL_LAYOUT.fields.cedulasExcedentes.yOffset, size: PRESIDENCIAL_LAYOUT.fields.cedulasExcedentes.size },
      { texto: `${entries.length}`, x: PRESIDENCIAL_LAYOUT.fields.tcvBottom.x, y: height - PRESIDENCIAL_LAYOUT.fields.tcvBottom.yOffset, size: PRESIDENCIAL_LAYOUT.fields.tcvBottom.size },
    ];

    // Add start time if available
    if (startTime) {
      const horaInicio = formatTime(startTime);
      const fechaInicio = formatDate(startTime);
      textData.push({ texto: horaInicio, x: PRESIDENCIAL_LAYOUT.fields.startTime.x, y: height - PRESIDENCIAL_LAYOUT.fields.startTime.yOffset, size: PRESIDENCIAL_LAYOUT.fields.startTime.size });
      textData.push({ texto: fechaInicio, x: PRESIDENCIAL_LAYOUT.fields.startDate.x, y: height - PRESIDENCIAL_LAYOUT.fields.startDate.yOffset, size: PRESIDENCIAL_LAYOUT.fields.startDate.size });
    }

    // Add party vote counts
    for (const partyName in labels) {
      if (labels.hasOwnProperty(partyName)) {
        const label = labels[partyName];
        textData.push({ texto: `${label.votes}`, x: label.x, y: label.y, size: PRESIDENCIAL_LAYOUT.partyVotes.size });
      }
    }

    // Draw all text on PDF
    textData.forEach(item => {
      firstPage.drawText(item.texto, {
        x: item.x,
        y: item.y,
        font: helveticaBoldFont,
        size: item.size,
        color: PDF_COLORS.black,
      });
    });

    // Save and open PDF
    const pdfBytes = await pdfDoc.save();
    const filename = `acta_presidencial_${mesaNumberPadded}.pdf`;
    await savePdfWithFallback(pdfBytes, filename);

  } catch (error) {
    console.error("Error al generar el PDF Presidencial:", error);
    throw error;
  }
}
