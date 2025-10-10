// Shared PDF generation types

import type { VoteEntry, PoliticalOrganization } from "../../../types";

/**
 * Geographic location information for electoral mesa
 */
export interface SelectedLocation {
  departamento: string;
  provincia: string;
  distrito: string;
  jee: string;
}

/**
 * Base data required for all electoral PDF generation
 */
export interface BaseElectoralPdfData {
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
  isInternationalLocation?: boolean; // Flag to determine if using EXTRANJERO templates
}

/**
 * Presidencial-specific PDF data
 */
export interface PresidencialPdfData extends BaseElectoralPdfData {}

/**
 * Senadores Nacional-specific PDF data
 */
export interface SenadoresNacionalPdfData extends BaseElectoralPdfData {}

/**
 * Text item with positioning information
 */
export interface TextItem {
  texto: string;
  x: number;
  y: number;
  size: number;
}

/**
 * Party vote label with coordinates
 */
export interface PartyLabel {
  votes: number | string;
  x: number;
  y: number;
}

/**
 * Dictionary of party labels keyed by party name
 */
export interface PartyLabels {
  [partyName: string]: PartyLabel;
}

/**
 * Layout configuration for PDF fields
 */
export interface FieldConfig {
  x: number;
  yOffset: number;
  size: number;
}

/**
 * Layout configuration for special votes (BLANCO, NULO)
 */
export interface SpecialVotesConfig {
  blanco: { x: number; yOffset: number; size?: number };
  nulo: { x: number; yOffset: number; size?: number };
}

/**
 * Layout configuration for party votes
 */
export interface PartyVotesConfig {
  x: number;
  size: number;
}

/**
 * Layout configuration for preferential voting table
 */
export interface PreferentialTableConfig {
  startY: number;
  startX: number;
  cellWidth: number;
  fontSize: number;
  lineHeight: number;
}

/**
 * Complete layout configuration for a PDF template
 */
export interface LayoutConfig {
  lineHeight: number;
  votesStartY: number;
  fields: {
    mesaNumber: FieldConfig;
    actaNumber: FieldConfig;
    jee: FieldConfig;
    departamento: FieldConfig;
    provincia: FieldConfig;
    distrito: FieldConfig;
    startTime: FieldConfig;
    startDate: FieldConfig;
    endTime: FieldConfig;
    endDate: FieldConfig;
    tcvTopRight: FieldConfig;
    totalElectores: FieldConfig;
    cedulasExcedentes: FieldConfig;
    tcvBottom: FieldConfig;
  };
  partyVotes: PartyVotesConfig;
  specialVotes: SpecialVotesConfig;
  preferentialTable?: PreferentialTableConfig;
}

/**
 * Election type identifier
 */
export type ElectionType =
  | 'presidencial'
  | 'senadoresNacional'
  | 'senadoresRegional'
  | 'diputados'
  | 'parlamentoAndino';

/**
 * Configuration for PDF generator
 */
export interface PdfGeneratorConfig {
  templatePath: string;
  layoutConfig: LayoutConfig;
  electionType: ElectionType;
  hasPreferentialVoting: boolean;
  preferentialCount?: number;
}

/**
 * Vote count result
 */
export interface VoteCountResult {
  [partyName: string]: number;
}

/**
 * Vote data with preferential voting
 */
export interface VoteDataWithPreferential {
  voteCount: VoteCountResult;
  matrix?: {
    [partyKey: string]: {
      [candidateNumber: number]: number;
    };
  };
}
