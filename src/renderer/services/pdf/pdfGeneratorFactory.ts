// PDF Generator Factory - Centralized creation of PDF generators

import type {
  ElectionType,
  BaseElectoralPdfData,
  PdfGeneratorConfig
} from './types/pdfTypes';
import {
  PDF_TEMPLATES,
  PRESIDENCIAL_LAYOUT,
  SENADORES_NACIONAL_LAYOUT,
  SENATORS_COUNT,
  DEPUTIES_COUNT
} from '../../config/pdfTemplateConstants';
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
 *
 * @param electionType - Type of election
 * @param data - Electoral data
 * @param usePipeline - Whether to use pipeline pattern (default: true)
 */
export async function generatePdfByElectionType(
  electionType: ElectionType,
  data: BaseElectoralPdfData,
  usePipeline: boolean = true
): Promise<void> {
  const baseConfig = ELECTION_CONFIGS[electionType];

  if (!baseConfig.layoutConfig) {
    throw new Error(
      `Layout configuration not yet implemented for election type: ${electionType}. ` +
      `Please add the layout configuration in pdfTemplateConstants.ts`
    );
  }

  const config: PdfGeneratorConfig = baseConfig as PdfGeneratorConfig;

  // Validate configuration (throws if invalid)
  validatePdfGeneratorConfig(config);

  const voteCalculationFn = createVoteCalculationFn(electionType);

  if (usePipeline) {
    const pipeline = createRenderingPipeline(electionType);
    await generateElectoralPdf(data, config, voteCalculationFn, pipeline);
  } else {
    // Legacy mode without pipeline
    await generateElectoralPdf(data, config, voteCalculationFn);
  }
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
