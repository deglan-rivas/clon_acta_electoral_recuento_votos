/**
 * Provisioning Checker Service
 *
 * READ-ONLY service for main application
 * Can only CHECK if system is provisioned, CANNOT provision
 *
 * Security: This is the only provisioning-related code in main app
 * The actual provisioning logic is ONLY in provision tool (separate executable)
 */

import path from 'node:path';
import fs from 'node:fs';
import { SecureStorageService, AppSecretManager } from './SecureStorageService';
import { MachineIdService } from './MachineIdService';

export interface SystemStatus {
  isProvisioned: boolean;
  dbExists: boolean;
  dbEncrypted: boolean;
  dbSize?: number;
  jeeNombre?: string;
  provisionedAt?: string;
  hasValidLicense?: boolean;
  machineId?: string;
}

export interface SystemConfig {
  jeeId: number;
  jeeNombre: string;
  provisionedAt: string;
  version: string;
}

/**
 * ProvisioningChecker - READ-ONLY verification service
 *
 * This service can ONLY:
 * - Check if system is provisioned
 * - Read system configuration
 * - Verify license exists
 * - Get machine ID
 *
 * It CANNOT:
 * - Create databases
 * - Generate secrets
 * - Write configuration
 * - Provision systems
 */
export class ProvisioningChecker {
  private dataDir: string;
  private dbPath: string;
  private machineIdPath: string;
  private licensePath: string;
  private configPath: string;
  private secureStorage: SecureStorageService;
  private appSecretManager: AppSecretManager;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || this.getDefaultDataDir();

    // File paths
    this.dbPath = path.join(this.dataDir, 'data', 'electoral.db');
    this.machineIdPath = path.join(this.dataDir, 'data', '.machine-id');
    this.licensePath = path.join(this.dataDir, 'data', 'license.sig');
    this.configPath = path.join(this.dataDir, 'config', 'system-config.json');

    // Initialize secure storage (read-only access)
    this.secureStorage = new SecureStorageService({
      storageDir: path.join(this.dataDir, 'secure')
    });
    this.appSecretManager = new AppSecretManager(this.secureStorage);
  }

  /**
   * Get default data directory based on platform
   */
  private getDefaultDataDir(): string {
    switch (process.platform) {
      case 'win32':
        return path.join(process.env.ProgramData || 'C:\\ProgramData', 'ActaElectoral');
      case 'darwin':
        return path.join('/Library/Application Support/ActaElectoral');
      case 'linux':
        return path.join('/var/lib/acta-electoral');
      default:
        return path.join(process.cwd(), 'data');
    }
  }

  /**
   * Check if system is provisioned (READ-ONLY)
   */
  async checkStatus(): Promise<SystemStatus> {
    const status: SystemStatus = {
      isProvisioned: false,
      dbExists: fs.existsSync(this.dbPath),
      dbEncrypted: false
    };

    // Check if secret exists (in secure storage)
    const hasSecret = this.appSecretManager.hasAppSecret();
    const hasLicense = fs.existsSync(this.licensePath);
    const hasConfig = fs.existsSync(this.configPath);

    status.isProvisioned = hasSecret && status.dbExists && hasConfig;

    if (status.isProvisioned) {
      // Load system information (READ-ONLY)
      try {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        status.jeeNombre = config.jeeNombre;
        status.provisionedAt = config.provisionedAt;
        status.hasValidLicense = hasLicense;

        const dbStats = fs.statSync(this.dbPath);
        status.dbSize = dbStats.size;
        status.dbEncrypted = true; // Always encrypted with SQLCipher

        const machineIdService = new MachineIdService(this.machineIdPath);
        status.machineId = await machineIdService.getMachineId();
      } catch (error) {
        console.warn('Error loading system information:', error);
      }
    }

    return status;
  }

  /**
   * Get system configuration (READ-ONLY)
   */
  getConfig(): SystemConfig | null {
    if (!fs.existsSync(this.configPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } catch (error) {
      console.error('Error reading system config:', error);
      return null;
    }
  }

  /**
   * Get machine ID (READ-ONLY)
   */
  async getMachineId(): Promise<string> {
    const machineIdService = new MachineIdService(this.machineIdPath);
    return await machineIdService.getMachineId();
  }

  /**
   * Get database path (READ-ONLY)
   */
  getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Get app secret for database access (READ-ONLY)
   * This is needed to derive the database key
   */
  async getAppSecret(): Promise<Buffer> {
    if (!this.appSecretManager.hasAppSecret()) {
      throw new Error('Sistema no aprovisionado - no se encontró el secreto');
    }

    return await this.appSecretManager.getAppSecret();
  }
}
