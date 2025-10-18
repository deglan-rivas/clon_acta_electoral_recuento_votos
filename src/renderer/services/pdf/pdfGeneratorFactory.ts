// PDF Generator Factory - Centralized creation of PDF generators

import type {
  ElectionType,
  BaseElectoralPdfData,
  PdfGeneratorConfig
} from './types/pdfTypes';
import {
  PRESIDENCIAL_LAYOUT,
  SENADORES_NACIONAL_LAYOUT,
  SENADORES_REGIONAL_2_PREFERENCIALES_LAYOUT,
  SENADORES_REGIONAL_4_PREFERENCIALES_LAYOUT,
  DIPUTADOS_4_PREFERENCIALES_LAYOUT,
  DIPUTADOS_6_PREFERENCIALES_LAYOUT,
  DIPUTADOS_8_PREFERENCIALES_LAYOUT,
  DIPUTADOS_32_PREFERENCIALES_LAYOUT,
  PARLAMENTO_ANDINO_LAYOUT,
} from './pdfTemplateConstants';
import { selectPdfTemplate } from './utils/pdfTemplateSelector';
import { getVoteLimitsForCategory } from '../../utils/voteLimits';
import { validatePdfGeneratorConfig } from './validation/configValidator';
import { generateElectoralPdf } from './basePdfGenerator';
import { calculateVoteCount, calculateVoteDataWithPreferential } from '../calculations/voteCalculationService';
import {
  PdfRenderingPipeline,
  CommonFieldsRenderer,
  PartyVotesRenderer,
  PreferentialTableRenderer,
  JeeMembersRenderer
} from './rendering/renderPhases';

/**
 * Gets the appropriate layout configuration based on election type and limite_voto_preferencial
 */
async function getLayoutConfig(
  electionType: ElectionType,
  circunscripcionElectoral?: string
): Promise<any> {
  switch (electionType) {
    case 'presidencial':
      return PRESIDENCIAL_LAYOUT;

    case 'senadoresNacional':
      return SENADORES_NACIONAL_LAYOUT;

    case 'senadoresRegional': {
      // Get limite from CSV based on circunscripcion
      const voteLimits = await getVoteLimitsForCategory('senadoresRegional', circunscripcionElectoral);
      const limite = voteLimits.preferential1;

      switch (limite) {
        case 2:
          return SENADORES_REGIONAL_2_PREFERENCIALES_LAYOUT;
        case 4:
          return SENADORES_REGIONAL_4_PREFERENCIALES_LAYOUT;
        default:
          console.warn(`[getLayoutConfig] Unknown limite ${limite} for senadoresRegional, defaulting to 2`);
          return SENADORES_REGIONAL_2_PREFERENCIALES_LAYOUT;
      }
    }

    case 'diputados': {
      // Get limite from CSV based on circunscripcion
      const voteLimits = await getVoteLimitsForCategory('diputados', circunscripcionElectoral);
      const limite = voteLimits.preferential1;

      switch (limite) {
        case 4:
          return DIPUTADOS_4_PREFERENCIALES_LAYOUT;
        case 6:
          return DIPUTADOS_6_PREFERENCIALES_LAYOUT;
        case 8:
          return DIPUTADOS_8_PREFERENCIALES_LAYOUT;
        case 32:
          return DIPUTADOS_32_PREFERENCIALES_LAYOUT;
        default:
          console.warn(`[getLayoutConfig] Unknown limite ${limite} for diputados, defaulting to 4`);
          return DIPUTADOS_4_PREFERENCIALES_LAYOUT;
      }
    }

    case 'parlamentoAndino':
      return PARLAMENTO_ANDINO_LAYOUT;

    default:
      throw new Error(`Unknown election type: ${electionType}`);
  }
}

/**
 * Determines if an election type has preferential voting
 */
function hasPreferentialVoting(electionType: ElectionType): boolean {
  switch (electionType) {
    case 'presidencial':
      return false;
    case 'senadoresNacional':
    case 'senadoresRegional':
    case 'diputados':
    case 'parlamentoAndino':
      return true;
    default:
      return false;
  }
}

/**
 * Creates a vote calculation function based on election type and preferential count
 */
function createVoteCalculationFn(
  electionType: ElectionType,
  preferentialCount: number
) {
  if (hasPreferentialVoting(electionType) && preferentialCount > 0) {
    return (data: BaseElectoralPdfData) => {
      return calculateVoteDataWithPreferential(
        data.entries,
        data.politicalOrganizations,
        data.selectedOrganizationKeys,
        preferentialCount
      );
    };
  } else {
    return (data: BaseElectoralPdfData) => {
      return calculateVoteCount(data.entries);
    };
  }
}

/**
 * Creates a rendering pipeline based on election type and preferential count
 */
function createRenderingPipeline(
  electionType: ElectionType,
  preferentialCount: number,
  layoutConfig: any
): PdfRenderingPipeline {
  const pipeline = new PdfRenderingPipeline()
    .addPhase(new CommonFieldsRenderer())
    .addPhase(new PartyVotesRenderer());

  // Add preferential table renderer if election has preferential voting
  if (hasPreferentialVoting(electionType) && preferentialCount > 0) {
    pipeline.addPhase(new PreferentialTableRenderer(preferentialCount));
  }

  // Add JEE members renderer if layout config has jeeMembers section
  if (layoutConfig.jeeMembers) {
    pipeline.addPhase(new JeeMembersRenderer());
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
  console.log('[generatePdfByElectionType] isInternationalLocation:', data.isInternationalLocation);
  console.log('[generatePdfByElectionType] circunscripcionElectoral:', data.selectedLocation?.circunscripcionElectoral);

  // Extract circunscripcion electoral from data
  const circunscripcionElectoral = data.selectedLocation?.circunscripcionElectoral;

  // Get vote limits to determine preferential count and template
  const voteLimits = await getVoteLimitsForCategory(electionType, circunscripcionElectoral);
  const limiteVotoPreferencial = voteLimits.preferential1;

  console.log('[generatePdfByElectionType] limiteVotoPreferencial:', limiteVotoPreferencial);

  // Select template path based on election type, limite, and location
  const isInternational = data.isInternationalLocation || false;
  const templatePath = selectPdfTemplate({
    electionType,
    limiteVotoPreferencial,
    isInternational,
  });

  console.log('[generatePdfByElectionType] Selected template:', templatePath);

  // Get layout configuration
  const layoutConfig = await getLayoutConfig(electionType, circunscripcionElectoral);

  console.log('[generatePdfByElectionType] Layout config obtained');

  // Create full configuration
  const config: PdfGeneratorConfig = {
    templatePath,
    layoutConfig,
    electionType,
    hasPreferentialVoting: hasPreferentialVoting(electionType),
    preferentialCount: limiteVotoPreferencial,
  };

  // Validate configuration (throws if invalid)
  validatePdfGeneratorConfig(config);

  const voteCalculationFn = createVoteCalculationFn(electionType, limiteVotoPreferencial);
  const pipeline = createRenderingPipeline(electionType, limiteVotoPreferencial, layoutConfig);

  await generateElectoralPdf(data, config, voteCalculationFn, pipeline);
}

/**
 * Helper function to check if an election type is supported
 */
export function isElectionTypeSupported(electionType: ElectionType): boolean {
  // All election types are now supported
  return ['presidencial', 'senadoresNacional', 'senadoresRegional', 'diputados', 'parlamentoAndino'].includes(electionType);
}

/**
 * Gets list of all supported election types
 */
export function getSupportedElectionTypes(): ElectionType[] {
  return ['presidencial', 'senadoresNacional', 'senadoresRegional', 'diputados', 'parlamentoAndino'];
}

/**
 * Gets list of election types pending implementation
 */
export function getPendingElectionTypes(): ElectionType[] {
  return []; // All types are now supported
}
