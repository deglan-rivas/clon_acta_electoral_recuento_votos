/**
 * Servicio de Almacenamiento Seguro - SecureStorageService
 *
 * Utiliza Electron's safeStorage API que a su vez usa:
 * - Windows: DPAPI (Data Protection API)
 * - macOS: Keychain
 * - Linux: libsecret
 *
 * Los datos se encriptan con la cuenta de usuario del sistema operativo.
 * Solo el usuario que guardó los datos puede desencriptarlos.
 *
 * IMPORTANTE: Esto es mucho más seguro que guardar en archivos de texto plano.
 */

import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Interfaces
// ============================================================================

export interface SecureStorageConfig {
  storageDir?: string;                   // Directorio para archivos encriptados
  serviceName?: string;                  // Nombre del servicio (para logging)
}

export interface SecureItem {
  key: string;
  encryptedData: Buffer;
  createdAt: string;
  modifiedAt: string;
}

// ============================================================================
// Servicio de Almacenamiento Seguro
// ============================================================================

export class SecureStorageService {
  private storageDir: string;
  private serviceName: string;
  private indexPath: string;

  constructor(config: SecureStorageConfig = {}) {
    // Directorio por defecto: C:\ProgramData\ActaElectoral\secure
    this.storageDir = config.storageDir || this.getDefaultStorageDir();
    this.serviceName = config.serviceName || 'ActaElectoral';
    this.indexPath = path.join(this.storageDir, '.index.json');

    // Crear directorio si no existe
    this.ensureStorageDir();
  }

  /**
   * Obtener directorio de almacenamiento por defecto
   */
  private getDefaultStorageDir(): string {
    switch (process.platform) {
      case 'win32':
        return path.join(process.env.ProgramData || 'C:\\ProgramData', 'ActaElectoral', 'secure');
      case 'darwin':
        return path.join('/Library/Application Support/ActaElectoral/secure');
      case 'linux':
        return path.join('/var/lib/acta-electoral/secure');
      default:
        return path.join(process.cwd(), 'data', 'secure');
    }
  }

  /**
   * Asegurar que el directorio existe
   */
  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      console.log(`✓ Directorio de almacenamiento seguro creado: ${this.storageDir}`);
    }
  }

  /**
   * Verificar si safeStorage está disponible
   */
  isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }

  /**
   * Guardar dato de forma segura
   *
   * @param key - Identificador del secreto (ej: 'app-secret', 'db-password')
   * @param value - Valor a guardar (string o Buffer)
   */
  async setItem(key: string, value: string | Buffer): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Almacenamiento seguro no disponible en este sistema');
    }

    // Convertir a Buffer si es string
    const plainData = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;

    // Encriptar usando DPAPI/Keychain/libsecret
    const encryptedData = safeStorage.encryptString(plainData.toString('utf8'));

    // Guardar en archivo
    const itemPath = this.getItemPath(key);
    const item: SecureItem = {
      key,
      encryptedData,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString()
    };

    // Escribir datos encriptados
    fs.writeFileSync(itemPath, encryptedData);

    // Actualizar índice
    this.updateIndex(key, item);

    console.log(`✓ Secreto guardado de forma segura: ${key}`);
  }

  /**
   * Recuperar dato seguro
   *
   * @param key - Identificador del secreto
   * @returns Valor desencriptado o null si no existe
   */
  async getItem(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      throw new Error('Almacenamiento seguro no disponible en este sistema');
    }

    const itemPath = this.getItemPath(key);

    if (!fs.existsSync(itemPath)) {
      return null;
    }

    try {
      // Leer datos encriptados
      const encryptedData = fs.readFileSync(itemPath);

      // Desencriptar usando DPAPI/Keychain/libsecret
      // IMPORTANTE: Solo el usuario que encriptó puede desencriptar
      const plainData = safeStorage.decryptString(encryptedData);

      return plainData;
    } catch (error: any) {
      console.error(`Error al recuperar secreto ${key}:`, error.message);
      throw new Error(`No se pudo desencriptar el secreto: ${key}. Asegúrese de estar usando la misma cuenta de usuario.`);
    }
  }

  /**
   * Verificar si existe un secreto
   */
  hasItem(key: string): boolean {
    return fs.existsSync(this.getItemPath(key));
  }

  /**
   * Eliminar secreto
   */
  async deleteItem(key: string): Promise<void> {
    const itemPath = this.getItemPath(key);

    if (fs.existsSync(itemPath)) {
      fs.unlinkSync(itemPath);
      this.removeFromIndex(key);
      console.log(`✓ Secreto eliminado: ${key}`);
    }
  }

  /**
   * Listar todas las claves almacenadas
   */
  listKeys(): string[] {
    const index = this.loadIndex();
    return Object.keys(index);
  }

  /**
   * Obtener ruta del archivo para una clave
   */
  private getItemPath(key: string): string {
    // Sanitizar nombre de archivo
    const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, '-');
    return path.join(this.storageDir, `${sanitizedKey}.secure`);
  }

  /**
   * Cargar índice de secretos
   */
  private loadIndex(): Record<string, Partial<SecureItem>> {
    if (!fs.existsSync(this.indexPath)) {
      return {};
    }

    try {
      return JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
    } catch (error) {
      console.warn('Error al cargar índice, creando nuevo');
      return {};
    }
  }

  /**
   * Guardar índice
   */
  private saveIndex(index: Record<string, Partial<SecureItem>>): void {
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
  }

  /**
   * Actualizar índice con nuevo item
   */
  private updateIndex(key: string, item: SecureItem): void {
    const index = this.loadIndex();

    // No guardar encryptedData en el índice (solo metadata)
    index[key] = {
      key: item.key,
      createdAt: item.createdAt,
      modifiedAt: item.modifiedAt
    };

    this.saveIndex(index);
  }

  /**
   * Remover del índice
   */
  private removeFromIndex(key: string): void {
    const index = this.loadIndex();
    delete index[key];
    this.saveIndex(index);
  }

  /**
   * Obtener información del sistema de encriptación
   */
  getEncryptionInfo(): {
    available: boolean;
    platform: string;
    backend: string;
    storageDir: string;
  } {
    let backend = 'unknown';

    switch (process.platform) {
      case 'win32':
        backend = 'Windows DPAPI (Data Protection API)';
        break;
      case 'darwin':
        backend = 'macOS Keychain';
        break;
      case 'linux':
        backend = 'libsecret';
        break;
    }

    return {
      available: this.isAvailable(),
      platform: process.platform,
      backend,
      storageDir: this.storageDir
    };
  }

  /**
   * Exportar secretos (para migración/backup)
   * ADVERTENCIA: Esto exporta los datos encriptados, no los desencripta
   */
  async exportEncrypted(outputPath: string): Promise<void> {
    const index = this.loadIndex();
    const exportData: Record<string, string> = {};

    for (const key of Object.keys(index)) {
      const itemPath = this.getItemPath(key);
      if (fs.existsSync(itemPath)) {
        const encryptedData = fs.readFileSync(itemPath);
        exportData[key] = encryptedData.toString('base64');
      }
    }

    fs.writeFileSync(outputPath, JSON.stringify({
      version: '1.0',
      platform: process.platform,
      exportedAt: new Date().toISOString(),
      data: exportData
    }, null, 2), 'utf8');

    console.log(`✓ Secretos encriptados exportados a: ${outputPath}`);
    console.warn('⚠️  IMPORTANTE: Los datos exportados están encriptados con DPAPI/Keychain.');
    console.warn('⚠️  Solo se pueden desencriptar en la misma máquina y con el mismo usuario.');
  }

  /**
   * Limpiar todos los secretos (PELIGROSO)
   */
  async clearAll(): Promise<void> {
    const index = this.loadIndex();

    for (const key of Object.keys(index)) {
      await this.deleteItem(key);
    }

    console.log('✓ Todos los secretos han sido eliminados');
  }
}

// ============================================================================
// Helpers específicos para la aplicación
// ============================================================================

/**
 * Gestión específica para app-secret
 */
export class AppSecretManager {
  private storage: SecureStorageService;
  private static readonly SECRET_KEY = 'electoral-app-secret';

  constructor(storage?: SecureStorageService) {
    this.storage = storage || new SecureStorageService();
  }

  /**
   * Guardar app secret de forma segura
   */
  async saveAppSecret(secret: string): Promise<void> {
    await this.storage.setItem(AppSecretManager.SECRET_KEY, secret);
  }

  /**
   * Recuperar app secret
   */
  async getAppSecret(): Promise<string | null> {
    return await this.storage.getItem(AppSecretManager.SECRET_KEY);
  }

  /**
   * Verificar si existe app secret
   */
  hasAppSecret(): boolean {
    return this.storage.hasItem(AppSecretManager.SECRET_KEY);
  }

  /**
   * Eliminar app secret
   */
  async deleteAppSecret(): Promise<void> {
    await this.storage.deleteItem(AppSecretManager.SECRET_KEY);
  }
}

export default SecureStorageService;
