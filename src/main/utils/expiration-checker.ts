/**
 * Trial Expiration Checker Utility
 *
 * Provides functions to check trial expiration status with multiple layers of validation
 */

import { TRIAL_CONFIG, type TrialConfig } from '../config/trial-config';
import log from 'electron-log';

export const ExpirationStatus = {
  VALID: 'valid',
  WARNING: 'warning',
  EXPIRED: 'expired',
  DISABLED: 'disabled'
} as const;

export type ExpirationStatus = typeof ExpirationStatus[keyof typeof ExpirationStatus];

export interface ExpirationCheckResult {
  status: ExpirationStatus;
  daysRemaining: number;
  expirationDate: Date;
  message: string;
  allowAccess: boolean;
}

/**
 * Performs multiple validation checks to determine trial status
 * Layer 1: Config-based validation
 * Layer 2: Date arithmetic validation
 * Layer 3: Timestamp validation (anti-tampering)
 */
export class ExpirationChecker {
  private config: TrialConfig;
  private lastCheckTimestamp: number = 0;

  constructor(config: TrialConfig = TRIAL_CONFIG) {
    this.config = config;
    this.lastCheckTimestamp = Date.now();
  }

  /**
   * Main expiration check method
   * Returns detailed status about trial expiration
   */
  public checkExpiration(): ExpirationCheckResult {
    // If trial is disabled, always return valid
    if (!this.config.trialEnabled) {
      log.info('Trial mode disabled - full access granted');
      return {
        status: ExpirationStatus.DISABLED,
        daysRemaining: Infinity,
        expirationDate: new Date('2099-12-31'),
        message: 'Versión completa activada',
        allowAccess: true
      };
    }

    // Layer 1: Basic date validation
    const now = new Date();
    const expirationDate = this.parseExpirationDate();
    const gracePeriodEnd = new Date(expirationDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + this.config.gracePeriodDays);

    // Layer 2: Calculate days remaining
    const daysRemaining = this.calculateDaysRemaining(now, expirationDate);

    // Layer 3: Anti-tampering check
    const tamperDetected = this.detectTampering(now);
    if (tamperDetected) {
      log.warn('Potential system clock tampering detected');
      return this.createExpiredResult(expirationDate, 'Sistema de fechas no válido');
    }

    // Check if expired (including grace period)
    if (now > gracePeriodEnd) {
      log.warn(`Application expired. Expiration date: ${expirationDate.toLocaleDateString()}`);
      return this.createExpiredResult(expirationDate);
    }

    // Check if in grace period
    if (now > expirationDate && now <= gracePeriodEnd) {
      const graceDaysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      log.warn(`In grace period. ${graceDaysRemaining} days remaining`);
      return {
        status: ExpirationStatus.WARNING,
        daysRemaining: graceDaysRemaining,
        expirationDate,
        message: this.formatWarningMessage(graceDaysRemaining, expirationDate, true),
        allowAccess: true
      };
    }

    // Check if in warning period
    if (daysRemaining <= this.config.warningDays && daysRemaining >= 0) {
      log.info(`Warning period active. ${daysRemaining} days until expiration`);
      return {
        status: ExpirationStatus.WARNING,
        daysRemaining,
        expirationDate,
        message: this.formatWarningMessage(daysRemaining, expirationDate),
        allowAccess: true
      };
    }

    // Valid trial period
    log.info(`Trial valid. ${daysRemaining} days remaining`);
    return {
      status: ExpirationStatus.VALID,
      daysRemaining,
      expirationDate,
      message: `Aplicación válida hasta ${expirationDate.toLocaleDateString('es-PE')}`,
      allowAccess: true
    };
  }

  /**
   * Validates the expiration date format and returns Date object
   */
  private parseExpirationDate(): Date {
    try {
      const date = new Date(this.config.expirationDate + 'T23:59:59');
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date;
    } catch (error) {
      log.error('Invalid expiration date format:', this.config.expirationDate);
      // Fallback to a safe expired date
      return new Date('2000-01-01');
    }
  }

  /**
   * Calculates days remaining until expiration
   */
  private calculateDaysRemaining(now: Date, expirationDate: Date): number {
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Detects potential system clock tampering
   * Checks if system time is moving backwards
   */
  private detectTampering(now: Date): boolean {
    const currentTimestamp = now.getTime();

    // Check if time went backwards significantly (more than 1 hour)
    const timeJumpBackwards = this.lastCheckTimestamp - currentTimestamp;
    if (timeJumpBackwards > 3600000) { // 1 hour in milliseconds
      log.error(`Time jump backwards detected: ${timeJumpBackwards}ms`);
      return true;
    }

    // Check if date is suspiciously old (before 2025)
    if (now.getFullYear() < 2025) {
      log.error(`Suspicious system date detected: ${now.toISOString()}`);
      return true;
    }

    this.lastCheckTimestamp = currentTimestamp;
    return false;
  }

  /**
   * Creates expired result object
   */
  private createExpiredResult(expirationDate: Date, customMessage?: string): ExpirationCheckResult {
    return {
      status: ExpirationStatus.EXPIRED,
      daysRemaining: 0,
      expirationDate,
      message: customMessage || this.config.expiredMessage || 'El período de prueba ha expirado',
      allowAccess: false
    };
  }

  /**
   * Formats warning message with dynamic values
   */
  private formatWarningMessage(days: number, date: Date, isGracePeriod: boolean = false): string {
    const baseMessage = this.config.warningMessage ||
      'Esta aplicación expirará en {days} día(s). Fecha: {date}';

    const message = baseMessage
      .replace('{days}', days.toString())
      .replace('{date}', date.toLocaleDateString('es-PE'));

    if (isGracePeriod) {
      return `PERÍODO DE GRACIA: ${message}`;
    }

    return message;
  }

  /**
   * Quick check if application should be allowed to run
   */
  public isValid(): boolean {
    const result = this.checkExpiration();
    return result.allowAccess;
  }

  /**
   * Get formatted status message for display
   */
  public getStatusMessage(): string {
    const result = this.checkExpiration();
    return result.message;
  }

  /**
   * Update configuration (useful for testing)
   */
  public updateConfig(config: TrialConfig): void {
    this.config = config;
    log.info('Trial configuration updated');
  }
}

// Singleton instance for application-wide use
let checkerInstance: ExpirationChecker | null = null;

/**
 * Get the singleton expiration checker instance
 */
export function getExpirationChecker(): ExpirationChecker {
  if (!checkerInstance) {
    checkerInstance = new ExpirationChecker();
  }
  return checkerInstance;
}

/**
 * Quick validation function for use in main process
 */
export function validateTrialAccess(): boolean {
  const checker = getExpirationChecker();
  return checker.isValid();
}

/**
 * Get current expiration status
 */
export function getExpirationStatus(): ExpirationCheckResult {
  const checker = getExpirationChecker();
  return checker.checkExpiration();
}
