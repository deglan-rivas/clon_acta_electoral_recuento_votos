// PDF template configuration constants for electoral actas

import { rgb } from 'pdf-lib';

// Common constants
export const SENATORS_COUNT = 30;
export const DEPUTIES_COUNT = 130;

// Font sizes
export const FONT_SIZES = {
  small: 9,
  medium: 10,
  large: 13,
  xlarge: 14,
  xxlarge: 15,
} as const;

// Colors
export const PDF_COLORS = {
  black: rgb(0, 0, 0),
  white: rgb(1, 1, 1),
} as const;

// PDF Templates paths - National versions
export const PDF_TEMPLATES = {
  presidencial: './actas/ACTA_RECUENTO_PRESIDENCIAL.pdf',
  senadoresNacional: './actas/ACTA_RECUENTO_SENADORES_DISTRITO_UNICO.pdf',
  senadoresRegional: './actas/ACTA_RECUENTO_SENADORES_REGIONAL.pdf',
  diputados: './actas/ACTA_RECUENTO_DIPUTADOS.pdf',
  parlamentoAndino: './actas/ACTA_RECUENTO_PARLAMENTO_ANDINO.pdf',
} as const;

// PDF Templates paths - International versions (EXTRANJERO)
export const PDF_TEMPLATES_EXTRANJERO = {
  presidencial: './actas/EXTRANJERO_ACTA_RECUENTO_PRESIDENCIAL.pdf',
  senadoresNacional: './actas/EXTRANJERO_ACTA_RECUENTO_SENADORES_DISTRITO_UNICO.pdf',
  senadoresRegional: './actas/EXTRANJERO_ACTA_RECUENTO_SENADORES_DISTRITO_MULTIPLE.pdf',
  diputados: './actas/EXTRANJERO_ACTA_RECUENTO_DIPUTADOS.pdf',
  parlamentoAndino: './actas/EXTRANJERO_ACTA_RECUENTO_REPRESENTANTES.pdf',
} as const;

// Presidencial Template Configuration
export const PRESIDENCIAL_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 248.5, // Offset from top
  fields: {
    mesaNumber: { x: 45, yOffset: 132, size: FONT_SIZES.xlarge },
    actaNumber: { x: 137, yOffset: 132, size: FONT_SIZES.xlarge },
    jee: { x: 230, yOffset: 132, size: FONT_SIZES.xlarge },
    departamento: { x: 45, yOffset: 175, size: FONT_SIZES.xlarge },
    provincia: { x: 230, yOffset: 175, size: FONT_SIZES.xlarge },
    distrito: { x: 410, yOffset: 175, size: FONT_SIZES.xlarge },
    startTime: { x: 112, yOffset: 198, size: FONT_SIZES.large },
    startDate: { x: 232, yOffset: 198, size: FONT_SIZES.large },
    endTime: { x: 112, yOffset: 1166, size: FONT_SIZES.large },
    endDate: { x: 232, yOffset: 1166, size: FONT_SIZES.large },
    tcvTopRight: { x: 763, yOffset: 147, size: FONT_SIZES.xxlarge },
    totalElectores: { x: 755, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 446,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
} as const;

// Senadores Nacional Template Configuration
export const SENADORES_NACIONAL_LAYOUT = {
  lineHeight: 15.132,
  votesStartY: 150, // Offset from top
  fields: {
    mesaNumber: { x: 44, yOffset: 102, size: FONT_SIZES.small },
    actaNumber: { x: 106, yOffset: 102, size: FONT_SIZES.small },
    jee: { x: 168, yOffset: 102, size: FONT_SIZES.small },
    departamento: { x: 423, yOffset: 102, size: FONT_SIZES.small },
    provincia: { x: 581, yOffset: 102, size: FONT_SIZES.small },
    distrito: { x: 739, yOffset: 102, size: FONT_SIZES.small },
    startTime: { x: 95, yOffset: 118, size: FONT_SIZES.medium },
    startDate: { x: 205, yOffset: 118, size: FONT_SIZES.medium },
    endTime: { x: 95, yOffset: 816, size: FONT_SIZES.medium },
    endDate: { x: 205, yOffset: 816, size: FONT_SIZES.medium },
    tcvTopRight: { x: 1120, yOffset: 114, size: FONT_SIZES.xxlarge },
    totalElectores: { x: 1120, yOffset: 91, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 525.6, yOffset: 753.8, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 245.6, yOffset: 793.4, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 230,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 245.6, yOffset: 753.8, size: FONT_SIZES.xxlarge },
    nulo: { x: 245.6, yOffset: 773.4, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 149, // Offset from top
    startX: 268.8,
    cellWidth: 22.95,
    fontSize: 11.5,
    lineHeight: 15.132,
  },
} as const;

// Helper function to pad mesa number
export function formatMesaNumber(mesaNumber: number): string {
  return mesaNumber.toString().padStart(6, '0');
}
