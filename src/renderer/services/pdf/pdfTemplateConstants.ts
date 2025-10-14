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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
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

// Senadores Nacional Template Configuration (also used for Diputados 32)
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
    x: 225,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 245.6, yOffset: 753.8, size: FONT_SIZES.xxlarge },
    nulo: { x: 245.6, yOffset: 773.4, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 149, // Offset from top
    startX: 263.8,
    cellWidth: 22.95,
    fontSize: 11.5,
    lineHeight: 15.132,
  },
} as const;

// Senadores Regional Template Configurations
// Separate constants for each limite_voto_preferencial variant (2, 4)

export const SENADORES_REGIONAL_2_PREFERENCIALES_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 254.5,
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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 301,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 254.5,
    startX: 348,
    cellWidth: 44.95,
    fontSize: FONT_SIZES.xxlarge,
    lineHeight: 21.1,
  },
} as const;

export const SENADORES_REGIONAL_4_PREFERENCIALES_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 254.5,
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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 268,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 254.5,
    startX: 308,
    cellWidth: 31.55,
    fontSize: 11.5,
    lineHeight: 21.1,
  },
} as const;

// Diputados Template Configurations
// Separate constants for each limite_voto_preferencial variant (4, 6, 8, 32)

export const DIPUTADOS_4_PREFERENCIALES_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 254.5,
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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 266,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 254.5,
    startX: 308,
    cellWidth: 31.65,
    fontSize: 11.5,
    lineHeight: 21.1,
  },
} as const;

export const DIPUTADOS_6_PREFERENCIALES_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 254.5,
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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 321,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 254.5,
    startX: 358,
    cellWidth: 31.75,
    fontSize: 11.5,
    lineHeight: 21.1,
  },
} as const;

export const DIPUTADOS_8_PREFERENCIALES_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 254.5,
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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 268,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 254.5,
    startX: 308,
    cellWidth: 31.85,
    fontSize: 11.5,
    lineHeight: 21.1,
  },
} as const;

export const DIPUTADOS_32_PREFERENCIALES_LAYOUT = {
  lineHeight: 15.132,
  votesStartY: 150,
  fields: {
    mesaNumber: { x: 44, yOffset: 92, size: FONT_SIZES.small },
    actaNumber: { x: 106, yOffset: 92, size: FONT_SIZES.small },
    jee: { x: 168, yOffset: 92, size: FONT_SIZES.small },
    departamento: { x: 423, yOffset: 92, size: FONT_SIZES.small },
    provincia: { x: 581, yOffset: 92, size: FONT_SIZES.small },
    distrito: { x: 739, yOffset: 92, size: FONT_SIZES.small },
    startTime: { x: 95, yOffset: 108, size: FONT_SIZES.medium },
    startDate: { x: 205, yOffset: 108, size: FONT_SIZES.medium },
    endTime: { x: 75, yOffset: 816, size: FONT_SIZES.medium },
    endDate: { x: 185, yOffset: 816, size: FONT_SIZES.medium },
    tcvTopRight: { x: 1120, yOffset: 104, size: FONT_SIZES.xxlarge },
    totalElectores: { x: 1120, yOffset: 81, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 505.6, yOffset: 753.8, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 225.6, yOffset: 793.4, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 203,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 225.6, yOffset: 753.8, size: FONT_SIZES.xxlarge },
    nulo: { x: 225.6, yOffset: 773.4, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 149,
    startX: 238.8,
    cellWidth: 22.90,
    fontSize: 11.5,
    lineHeight: 15.132,
  },
} as const;

// Parlamento Andino Template Configuration (uses PRESIDENCIAL header/footer)
export const PARLAMENTO_ANDINO_LAYOUT = {
  lineHeight: 21.1,
  votesStartY: 254.5, // Offset from top (same as PRESIDENCIAL)
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
    totalElectores: { x: 763, yOffset: 121, size: FONT_SIZES.xxlarge },
    cedulasExcedentes: { x: 475, yOffset: 1092, size: FONT_SIZES.xxlarge },
    tcvBottom: { x: 234.6, yOffset: 1138, size: FONT_SIZES.xxlarge },
  },
  partyVotes: {
    x: 261,
    size: FONT_SIZES.xxlarge,
  },
  specialVotes: {
    blanco: { x: 234.6, yOffset: 1092, size: FONT_SIZES.xxlarge },
    nulo: { x: 234.6, yOffset: 1115, size: FONT_SIZES.xxlarge },
  },
  preferentialTable: {
    startY: 254.5, // Same as votesStartY
    startX: 289, // Adjusted for preferential columns
    cellWidth: 19.55,
    fontSize: 11.5,
    lineHeight: 21.1,
  },
} as const;

// Helper function to pad mesa number
export function formatMesaNumber(mesaNumber: number): string {
  return mesaNumber.toString().padStart(6, '0');
}
