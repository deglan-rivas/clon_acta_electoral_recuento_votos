/**
 * ═══════════════════════════════════════════════════════════════════════
 *                    TRIAL EXPIRATION CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════
 *
 * This file controls when the application will expire.
 *
 * IMPORTANT: Change only the EXPIRATION_DATE below before distributing.
 *
 * After changing the date:
 * 1. Save this file
 * 2. Build the application: npm run dist
 * 3. Distribute the generated installer from the dist/ folder
 */

// ┌─────────────────────────────────────────────────────────────────────┐
// │  CONFIGURE YOUR EXPIRATION DATE HERE (Format: YYYY-MM-DD)          │
// └─────────────────────────────────────────────────────────────────────┘

/**
 * Set the expiration date for this build
 *
 * Examples:
 * - '2026-02-28' for February training
 * - '2026-03-31' for March training
 * - '2026-05-31' for election period (April 12, 2026 + post-election)
 * - '2099-12-31' to disable expiration (production use)
 */
export const EXPIRATION_DATE = '2025-12-10';

// ┌─────────────────────────────────────────────────────────────────────┐
// │  ADVANCED SETTINGS (Optional - leave as default if unsure)         │
// └─────────────────────────────────────────────────────────────────────┘

/**
 * Days before expiration to start showing warnings
 * Default: 7 days
 */
export const WARNING_DAYS = 2;

/**
 * Enable/disable trial mode
 * Set to false to remove expiration entirely (production mode)
 * Default: true
 */
export const TRIAL_ENABLED = true;

// ═══════════════════════════════════════════════════════════════════════
//                    DO NOT MODIFY BELOW THIS LINE
// ═══════════════════════════════════════════════════════════════════════

export interface TrialConfig {
  expirationDate: string;
  warningDays: number;
  gracePeriodDays: number;
  trialEnabled: boolean;
  expiredMessage?: string;
  warningMessage?: string;
}

export const TRIAL_CONFIG: TrialConfig = {
  expirationDate: EXPIRATION_DATE,
  warningDays: WARNING_DAYS,
  gracePeriodDays: 0,
  trialEnabled: TRIAL_ENABLED,
  expiredMessage:
    'El período de prueba de esta aplicación ha expirado.\n\n' +
    'Esta versión estaba destinada para capacitación y pruebas del personal electoral.\n\n' +
    'Por favor, contacte al administrador del sistema para obtener una versión actualizada.',
  warningMessage:
    'AVISO: Esta aplicación de prueba expirará en {days} día(s).\n\n' +
    'Fecha de expiración: {date}\n\n' +
    'Por favor, coordine con el administrador del sistema para obtener una versión actualizada antes del vencimiento.'
};
