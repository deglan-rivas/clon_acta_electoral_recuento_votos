// PDF Configuration Validation

import type { LayoutConfig, PdfGeneratorConfig } from '../types/pdfTypes';

/**
 * Validation error class
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validates that required field configuration exists
 */
function validateFieldConfig(
  fieldName: string,
  config: any,
  layoutName: string
): void {
  if (!config) {
    throw new ConfigValidationError(
      `Missing field config for '${fieldName}' in ${layoutName}`
    );
  }
  if (typeof config.x !== 'number') {
    throw new ConfigValidationError(
      `Invalid or missing 'x' coordinate for field '${fieldName}' in ${layoutName}`
    );
  }
  if (typeof config.yOffset !== 'number') {
    throw new ConfigValidationError(
      `Invalid or missing 'yOffset' for field '${fieldName}' in ${layoutName}`
    );
  }
  if (typeof config.size !== 'number') {
    throw new ConfigValidationError(
      `Invalid or missing 'size' for field '${fieldName}' in ${layoutName}`
    );
  }
}

/**
 * Validates coordinate ranges
 */
function validateCoordinateRanges(layout: LayoutConfig, layoutName: string): void {
  const MAX_X = 2000; // Reasonable max for PDF width
  const MAX_Y = 2000; // Reasonable max for PDF height offset
  const MIN_SIZE = 6;
  const MAX_SIZE = 72;

  const checkCoordinate = (value: number, name: string, max: number) => {
    if (value < 0 || value > max) {
      throw new ConfigValidationError(
        `${name} value ${value} is out of valid range [0, ${max}] in ${layoutName}`
      );
    }
  };

  const checkSize = (value: number, fieldName: string) => {
    if (value < MIN_SIZE || value > MAX_SIZE) {
      throw new ConfigValidationError(
        `Font size ${value} for '${fieldName}' is out of valid range [${MIN_SIZE}, ${MAX_SIZE}] in ${layoutName}`
      );
    }
  };

  // Validate all field configs
  Object.entries(layout.fields).forEach(([fieldName, config]) => {
    checkCoordinate(config.x, `${fieldName}.x`, MAX_X);
    checkCoordinate(config.yOffset, `${fieldName}.yOffset`, MAX_Y);
    checkSize(config.size, fieldName);
  });

  // Validate party votes config
  checkCoordinate(layout.partyVotes.x, 'partyVotes.x', MAX_X);
  checkSize(layout.partyVotes.size, 'partyVotes');

  // Validate special votes config
  checkCoordinate(layout.specialVotes.blanco.x, 'specialVotes.blanco.x', MAX_X);
  checkCoordinate(layout.specialVotes.blanco.yOffset, 'specialVotes.blanco.yOffset', MAX_Y);
  checkCoordinate(layout.specialVotes.nulo.x, 'specialVotes.nulo.x', MAX_X);
  checkCoordinate(layout.specialVotes.nulo.yOffset, 'specialVotes.nulo.yOffset', MAX_Y);

  // Validate preferential table if present
  if (layout.preferentialTable) {
    checkCoordinate(layout.preferentialTable.startX, 'preferentialTable.startX', MAX_X);
    checkCoordinate(layout.preferentialTable.startY, 'preferentialTable.startY', MAX_Y);
    checkSize(layout.preferentialTable.fontSize, 'preferentialTable');

    if (layout.preferentialTable.cellWidth <= 0 || layout.preferentialTable.cellWidth > 100) {
      throw new ConfigValidationError(
        `preferentialTable.cellWidth ${layout.preferentialTable.cellWidth} is invalid in ${layoutName}`
      );
    }
    if (layout.preferentialTable.lineHeight <= 0 || layout.preferentialTable.lineHeight > 100) {
      throw new ConfigValidationError(
        `preferentialTable.lineHeight ${layout.preferentialTable.lineHeight} is invalid in ${layoutName}`
      );
    }
  }
}

/**
 * Validates layout configuration structure and values
 */
export function validateLayoutConfig(layout: LayoutConfig, layoutName: string = 'LayoutConfig'): void {
  // Check top-level properties
  if (typeof layout.lineHeight !== 'number' || layout.lineHeight <= 0) {
    throw new ConfigValidationError(
      `Invalid lineHeight in ${layoutName}: must be a positive number`
    );
  }
  if (typeof layout.votesStartY !== 'number' || layout.votesStartY < 0) {
    throw new ConfigValidationError(
      `Invalid votesStartY in ${layoutName}: must be a non-negative number`
    );
  }

  // Check required sections exist
  if (!layout.fields) {
    throw new ConfigValidationError(`Missing 'fields' section in ${layoutName}`);
  }
  if (!layout.partyVotes) {
    throw new ConfigValidationError(`Missing 'partyVotes' section in ${layoutName}`);
  }
  if (!layout.specialVotes) {
    throw new ConfigValidationError(`Missing 'specialVotes' section in ${layoutName}`);
  }

  // Validate required fields
  const requiredFields = [
    'mesaNumber', 'actaNumber', 'jee',
    'departamento', 'provincia', 'distrito',
    'startTime', 'startDate', 'endTime', 'endDate',
    'tcvTopRight', 'totalElectores', 'cedulasExcedentes', 'tcvBottom'
  ];

  requiredFields.forEach(fieldName => {
    validateFieldConfig(fieldName, layout.fields[fieldName as keyof typeof layout.fields], layoutName);
  });

  // Validate coordinate ranges
  validateCoordinateRanges(layout, layoutName);
}

/**
 * Validates PDF generator configuration
 */
export function validatePdfGeneratorConfig(config: PdfGeneratorConfig): void {
  if (!config.templatePath || typeof config.templatePath !== 'string') {
    throw new ConfigValidationError('Invalid or missing templatePath');
  }
  if (!config.electionType || typeof config.electionType !== 'string') {
    throw new ConfigValidationError('Invalid or missing electionType');
  }
  if (typeof config.hasPreferentialVoting !== 'boolean') {
    throw new ConfigValidationError('Invalid or missing hasPreferentialVoting');
  }
  if (config.hasPreferentialVoting) {
    if (typeof config.preferentialCount !== 'number' || config.preferentialCount <= 0) {
      throw new ConfigValidationError(
        'preferentialCount must be a positive number when hasPreferentialVoting is true'
      );
    }
    if (!config.layoutConfig.preferentialTable) {
      throw new ConfigValidationError(
        'layoutConfig must include preferentialTable when hasPreferentialVoting is true'
      );
    }
  }

  // Validate layout config
  validateLayoutConfig(config.layoutConfig, `${config.electionType} layout`);
}

/**
 * Safe wrapper that validates and throws descriptive errors
 */
export function withValidation<T extends any[], R>(
  fn: (...args: T) => R,
  configValidator: () => void
): (...args: T) => R {
  return (...args: T): R => {
    configValidator();
    return fn(...args);
  };
}
