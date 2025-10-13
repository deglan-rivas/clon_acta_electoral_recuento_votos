// PDF Generator Factory - Centralized creation of PDF generators

import type {
  ElectionType,
  BaseElectoralPdfData,
  PdfGeneratorConfig
} from './types/pdfTypes';
import {
  PDF_TEMPLATES,
  PDF_TEMPLATES_EXTRANJERO,
  PRESIDENCIAL_LAYOUT,
  SENADORES_NACIONAL_LAYOUT,
  SENATORS_COUNT,
  DEPUTIES_COUNT
} from './pdfTemplateConstants';
import { validatePdfGeneratorConfig } from './validation/configValidator';
import { generateElectoralPdf } from './basePdfGenerator';
import { calculateVoteCount, calculateVoteDataWithPreferential } from '../calculations/voteCalculationService';
import {
  PdfRenderingPipeline,
  CommonFieldsRenderer,
  PartyVotesRenderer,
  PreferentialTableRenderer
} from './rendering/renderPhases';

/**
 * Gets the appropriate PDF template path based on election type and location
 *
 * @param electionType - Type of election
 * @param isInternational - Whether the acta is for international (EXTRANJERO) location
 * @returns Template path for the PDF
 */
function getTemplatePath(electionType: ElectionType, isInternational: boolean = false): string {
  const templates = isInternational ? PDF_TEMPLATES_EXTRANJERO : PDF_TEMPLATES;
  const templatePath = templates[electionType];

  console.log('[getTemplatePath] Election Type:', electionType);
  console.log('[getTemplatePath] Is International:', isInternational);
  console.log('[getTemplatePath] Selected Template:', templatePath);

  return templatePath;
}

/**
 * Registry of election type configurations
 */
const ELECTION_CONFIGS: Record<ElectionType, Omit<PdfGeneratorConfig, 'layoutConfig'> & { layoutConfig?: any }> = {
  presidencial: {
    templatePath: PDF_TEMPLATES.presidencial,
    layoutConfig: PRESIDENCIAL_LAYOUT,
    electionType: 'presidencial',
    hasPreferentialVoting: false
  },
  senadoresNacional: {
    templatePath: PDF_TEMPLATES.senadoresNacional,
    layoutConfig: SENADORES_NACIONAL_LAYOUT,
    electionType: 'senadoresNacional',
    hasPreferentialVoting: true,
    preferentialCount: SENATORS_COUNT
  },
  senadoresRegional: {
    templatePath: PDF_TEMPLATES.senadoresRegional,
    layoutConfig: undefined, // TODO: Add layout config when available
    electionType: 'senadoresRegional',
    hasPreferentialVoting: true,
    preferentialCount: SENATORS_COUNT
  },
  diputados: {
    templatePath: PDF_TEMPLATES.diputados,
    layoutConfig: undefined, // TODO: Add layout config when available
    electionType: 'diputados',
    hasPreferentialVoting: true,
    preferentialCount: DEPUTIES_COUNT
  },
  parlamentoAndino: {
    templatePath: PDF_TEMPLATES.parlamentoAndino,
    layoutConfig: undefined, // TODO: Add layout config when available
    electionType: 'parlamentoAndino',
    hasPreferentialVoting: false
  }
};

/**
 * Creates a vote calculation function based on election type
 */
function createVoteCalculationFn(electionType: ElectionType) {
  const config = ELECTION_CONFIGS[electionType];

  if (config.hasPreferentialVoting && config.preferentialCount) {
    return (data: BaseElectoralPdfData) => {
      return calculateVoteDataWithPreferential(
        data.entries,
        data.politicalOrganizations,
        data.selectedOrganizationKeys,
        config.preferentialCount!
      );
    };
  } else {
    return (data: BaseElectoralPdfData) => {
      return calculateVoteCount(data.entries);
    };
  }
}

/**
 * Creates a rendering pipeline based on election type
 */
function createRenderingPipeline(electionType: ElectionType): PdfRenderingPipeline {
  const config = ELECTION_CONFIGS[electionType];
  const pipeline = new PdfRenderingPipeline()
    .addPhase(new CommonFieldsRenderer())
    .addPhase(new PartyVotesRenderer());

  // Add preferential table renderer if election has preferential voting
  if (config.hasPreferentialVoting && config.preferentialCount) {
    pipeline.addPhase(new PreferentialTableRenderer(config.preferentialCount));
  }

  return pipeline;
}

/**
 * Generates a PDF for any election type using the factory pattern
 * Uses the pipeline rendering approach for modular, reusable rendering
 *
 * @param electionType - Type of election
 * @param data - Electoral data
 */
export async function generatePdfByElectionType(
  electionType: ElectionType,
  data: BaseElectoralPdfData
): Promise<void> {
  console.log('[generatePdfByElectionType] Starting PDF generation');
  console.log('[generatePdfByElectionType] Election Type:', electionType);
  console.log('[generatePdfByElectionType] isInternationalLocation from data:', data.isInternationalLocation);

  const baseConfig = ELECTION_CONFIGS[electionType];

  if (!baseConfig.layoutConfig) {
    throw new Error(
      `Layout configuration not yet implemented for election type: ${electionType}. ` +
      `Please add the layout configuration in pdfTemplateConstants.ts`
    );
  }

  // Determine which template to use based on location type
  const isInternational = data.isInternationalLocation || false;
  console.log('[generatePdfByElectionType] isInternational (after default):', isInternational);

  const templatePath = getTemplatePath(electionType, isInternational);

  // Create config with appropriate template path
  const config: PdfGeneratorConfig = {
    ...baseConfig,
    templatePath,
  } as PdfGeneratorConfig;

  console.log('[generatePdfByElectionType] Final config templatePath:', config.templatePath);

  // Validate configuration (throws if invalid)
  validatePdfGeneratorConfig(config);

  const voteCalculationFn = createVoteCalculationFn(electionType);
  const pipeline = createRenderingPipeline(electionType);

  await generateElectoralPdf(data, config, voteCalculationFn, pipeline);
}

/**
 * Helper function to check if an election type is supported
 */
export function isElectionTypeSupported(electionType: ElectionType): boolean {
  const config = ELECTION_CONFIGS[electionType];
  return config !== undefined && config.layoutConfig !== undefined;
}

/**
 * Gets list of all supported election types
 */
export function getSupportedElectionTypes(): ElectionType[] {
  return Object.entries(ELECTION_CONFIGS)
    .filter(([_, config]) => config.layoutConfig !== undefined)
    .map(([type, _]) => type as ElectionType);
}

/**
 * Gets list of election types pending implementation
 */
export function getPendingElectionTypes(): ElectionType[] {
  return Object.entries(ELECTION_CONFIGS)
    .filter(([_, config]) => config.layoutConfig === undefined)
    .map(([type, _]) => type as ElectionType);
}
