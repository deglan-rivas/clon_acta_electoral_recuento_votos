// Senadores Nacional PDF Generator Service

import { PDFDocument, StandardFonts } from 'pdf-lib';
import type { VoteEntry, PoliticalOrganization } from "../../../types";
import { calculateVoteDataWithPreferential } from "../../calculations/voteCalculationService";
import { formatTime, formatDate } from "../../../utils/dateFormatters";
import { savePdfWithFallback } from "../pdfSaveService";
import {
  PDF_TEMPLATES,
  SENADORES_NACIONAL_LAYOUT,
  PDF_COLORS,
  SENATORS_COUNT,
  formatMesaNumber
} from "../../../config/pdfTemplateConstants";

interface SelectedLocation {
  departamento: string;
  provincia: string;
  distrito: string;
  jee: string;
}

interface SenadoresNacionalPdfData {
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
 * Generates PDF for Senadores Nacional election category
 */
export async function generateSenadoresNacionalPdf(data: SenadoresNacionalPdfData): Promise<void> {
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
    const existingPdfBytes = await fetch(PDF_TEMPLATES.senadoresNacional).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Calculate vote counts including preferential votes
    const { voteCount, matrix } = calculateVoteDataWithPreferential(
      entries,
      politicalOrganizations,
      selectedOrganizationKeys,
      SENATORS_COUNT
    );

    // Build labels object with coordinates for each party
    const labels: { [key: string]: { votes: number | string; x: number; y: number } } = {};
    let y_pos = height - SENADORES_NACIONAL_LAYOUT.votesStartY;

    politicalOrganizations.forEach(org => {
      const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
      const isSelected = selectedOrganizationKeys.includes(org.key);

      if (org.name === "BLANCO") {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: SENADORES_NACIONAL_LAYOUT.specialVotes.blanco.x,
          y: height - SENADORES_NACIONAL_LAYOUT.specialVotes.blanco.yOffset
        };
      } else if (org.name === "NULO") {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: SENADORES_NACIONAL_LAYOUT.specialVotes.nulo.x,
          y: height - SENADORES_NACIONAL_LAYOUT.specialVotes.nulo.yOffset
        };
      } else {
        labels[partyName] = {
          votes: isSelected ? 0 : "-",
          x: SENADORES_NACIONAL_LAYOUT.partyVotes.x,
          y: y_pos
        };
        y_pos -= SENADORES_NACIONAL_LAYOUT.lineHeight;
      }
    });

    // Fill in actual vote counts
    for (const party in voteCount) {
      if (labels.hasOwnProperty(party) && labels[party].votes !== "-") {
        labels[party].votes = voteCount[party];
      }
    }

    console.log("Diccionario de etiquetas de votos con coordenadas (Senadores Nacional):", labels);

    // Prepare all text data to draw
    const mesaNumberPadded = formatMesaNumber(mesaNumber);
    const horaFin = formatTime(endTime);
    const fechaFin = formatDate(endTime);

    const textData: Array<{ texto: string; x: number; y: number; size: number }> = [
      { texto: mesaNumberPadded, x: SENADORES_NACIONAL_LAYOUT.fields.mesaNumber.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.mesaNumber.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.mesaNumber.size },
      { texto: actaNumber, x: SENADORES_NACIONAL_LAYOUT.fields.actaNumber.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.actaNumber.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.actaNumber.size },
      { texto: selectedLocation.jee.toUpperCase(), x: SENADORES_NACIONAL_LAYOUT.fields.jee.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.jee.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.jee.size },
      { texto: selectedLocation.departamento.toUpperCase(), x: SENADORES_NACIONAL_LAYOUT.fields.departamento.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.departamento.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.departamento.size },
      { texto: selectedLocation.provincia.toUpperCase(), x: SENADORES_NACIONAL_LAYOUT.fields.provincia.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.provincia.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.provincia.size },
      { texto: selectedLocation.distrito.toUpperCase(), x: SENADORES_NACIONAL_LAYOUT.fields.distrito.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.distrito.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.distrito.size },
      { texto: horaFin, x: SENADORES_NACIONAL_LAYOUT.fields.endTime.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.endTime.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.endTime.size },
      { texto: fechaFin, x: SENADORES_NACIONAL_LAYOUT.fields.endDate.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.endDate.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.endDate.size },
      { texto: `${entries.length}`, x: SENADORES_NACIONAL_LAYOUT.fields.tcvTopRight.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.tcvTopRight.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.tcvTopRight.size },
      { texto: `${totalElectores}`, x: SENADORES_NACIONAL_LAYOUT.fields.totalElectores.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.totalElectores.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.totalElectores.size },
      { texto: `${cedulasExcedentes}`, x: SENADORES_NACIONAL_LAYOUT.fields.cedulasExcedentes.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.cedulasExcedentes.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.cedulasExcedentes.size },
      { texto: `${entries.length}`, x: SENADORES_NACIONAL_LAYOUT.fields.tcvBottom.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.tcvBottom.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.tcvBottom.size },
    ];

    // Add start time if available
    if (startTime) {
      const horaInicio = formatTime(startTime);
      const fechaInicio = formatDate(startTime);
      textData.push({ texto: horaInicio, x: SENADORES_NACIONAL_LAYOUT.fields.startTime.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.startTime.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.startTime.size });
      textData.push({ texto: fechaInicio, x: SENADORES_NACIONAL_LAYOUT.fields.startDate.x, y: height - SENADORES_NACIONAL_LAYOUT.fields.startDate.yOffset, size: SENADORES_NACIONAL_LAYOUT.fields.startDate.size });
    }

    // Add party vote counts
    for (const partyName in labels) {
      if (labels.hasOwnProperty(partyName)) {
        const label = labels[partyName];
        textData.push({ texto: `${label.votes}`, x: label.x, y: label.y, size: SENADORES_NACIONAL_LAYOUT.partyVotes.size });
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

    // Draw preferential vote cross-table
    const { preferentialTable } = SENADORES_NACIONAL_LAYOUT;
    let tableY = height - preferentialTable.startY;

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
            firstPage.drawText(`${count}`, {
              x: preferentialTable.startX + ((i - 1) * preferentialTable.cellWidth),
              y: tableY,
              font: helveticaBoldFont,
              size: preferentialTable.fontSize,
              color: PDF_COLORS.black
            });
            horizontalSum += count;
          }

          // Draw row total
          firstPage.drawText(`${horizontalSum}`, {
            x: totalXPos,
            y: tableY,
            font: helveticaBoldFont,
            size: preferentialTable.fontSize,
            color: PDF_COLORS.black
          });
        } else {
          // For unselected organizations, show dashes
          for (let i = 1; i <= SENATORS_COUNT; i++) {
            firstPage.drawText("-", {
              x: preferentialTable.startX + ((i - 1) * preferentialTable.cellWidth),
              y: tableY,
              font: helveticaBoldFont,
              size: preferentialTable.fontSize,
              color: PDF_COLORS.black
            });
          }
          firstPage.drawText("-", {
            x: totalXPos,
            y: tableY,
            font: helveticaBoldFont,
            size: preferentialTable.fontSize,
            color: PDF_COLORS.black
          });
        }

        tableY -= preferentialTable.lineHeight;
      }
    });

    // Save and open PDF
    const pdfBytes = await pdfDoc.save();
    const filename = `acta_senadores_nacional_${mesaNumberPadded}.pdf`;
    await savePdfWithFallback(pdfBytes, filename);

  } catch (error) {
    console.error("Error al generar el PDF de Senadores Nacional:", error);
    throw error;
  }
}
