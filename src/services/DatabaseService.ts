/**
 * Servicio de Base de Datos con SQLCipher - DatabaseService
 *
 * Proporciona acceso a la base de datos SQLite (encriptada o no encriptada).
 * Maneja:
 * - Inicialización de base de datos
 * - Gestión de conexiones
 * - Migraciones de esquema
 *
 * MODO ACTUAL: NO ENCRIPTADO (Temporal - para desarrollo)
 * Para activar encriptación: Descomentar secciones marcadas con [ENCRYPTION]
 */

// [ENCRYPTION] - Importar better-sqlite3-multiple-ciphers para encriptación
// import Database from 'better-sqlite3-multiple-ciphers';
// [NO-ENCRYPTION] - Importar better-sqlite3 regular (sin encriptación)
import Database from 'better-sqlite3';

import * as fs from 'fs';
import * as path from 'path';

// [ENCRYPTION] - Descomentar para usar encriptación
// import { CryptoService } from './CryptoService';
// import { MachineIdService } from './MachineIdService';

// ============================================================================
// Interfaces
// ============================================================================

export interface DatabaseConfig {
  dbPath: string;                        // Ruta al archivo de base de datos
  // [ENCRYPTION] - Descomentar para usar encriptación
  // appSecret?: string;                 // Secreto de aplicación (hex 64 chars)
  // useMachineBinding?: boolean;        // Usar machine binding para derivar clave
  readOnly?: boolean;                    // Abrir en modo solo lectura
}

export interface DatabaseInfo {
  path: string;
  exists: boolean;
  encrypted: boolean;
  size: number;
  // [ENCRYPTION] - Descomentar para mostrar machineId
  // machineId?: string;
}

// ============================================================================
// Servicio de Base de Datos
// ============================================================================

export class DatabaseService {
  private db: Database.Database | null = null;
  private config: DatabaseConfig;
  // [ENCRYPTION] - Descomentar para usar encriptación
  // private machineIdService: MachineIdService;
  // private encryptionKey: string | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;

    // [ENCRYPTION] - Descomentar para validar appSecret
    // this.machineIdService = new MachineIdService();
    // if (config.appSecret && !CryptoService.validateKey(config.appSecret)) {
    //   throw new Error('appSecret debe ser un string hexadecimal de 64 caracteres (256 bits)');
    // }
  }

  /**
   * Inicializar y abrir base de datos
   */
  async initialize(): Promise<void> {
    // [ENCRYPTION] - Descomentar para derivar clave de encriptación
    // if (this.config.appSecret) {
    //   this.encryptionKey = await this.deriveEncryptionKey();
    // }

    // Verificar si la base de datos existe
    const dbExists = fs.existsSync(this.config.dbPath);

    // Crear directorio si no existe
    if (!dbExists) {
      const dir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Abrir base de datos
    try {
      this.db = new Database(this.config.dbPath, {
        readonly: this.config.readOnly || false,
        fileMustExist: false
      });

      // ====================================================================
      // [ENCRYPTION] - SECCIÓN DE ENCRIPTACIÓN (COMENTADA)
      // Descomentar para activar encriptación con SQLCipher
      // ====================================================================
      /*
      // Configurar cipher explícitamente (SQLCipher para compatibilidad con DB Browser)
      this.db.pragma("cipher='sqlcipher'");
      this.db.pragma('legacy = 4');  // SQLCipher 4 compatibility mode

      // Configurar SQLCipher con la clave de encriptación
      if (this.encryptionKey) {
        this.db.pragma(`key='${this.encryptionKey}'`);
      }

      // Configurar parámetros de SQLCipher para mejor seguridad
      this.db.pragma('cipher_page_size = 4096');
      this.db.pragma('kdf_iter = 256000');          // Iterations para PBKDF2 (high security)
      this.db.pragma('cipher_hmac_algorithm = HMAC_SHA512');
      this.db.pragma('cipher_kdf_algorithm = PBKDF2_HMAC_SHA512');
      */
      // ====================================================================

      // Habilitar foreign keys y WAL mode
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('journal_mode = WAL');

      // Verificar que la base de datos se puede leer
      if (dbExists) {
        try {
          this.db.prepare('SELECT count(*) FROM sqlite_master').get();
        } catch (error) {
          throw new Error('Error al abrir base de datos: archivo corrupto o inaccesible');
          // [ENCRYPTION] - Mensaje con encriptación
          // throw new Error('Error al abrir base de datos: clave de encriptación incorrecta o archivo corrupto');
        }
      }

      // Si es nueva, inicializar esquema
      if (!dbExists) {
        await this.initializeSchema();
      }

      console.log('✓ Base de datos inicializada correctamente (modo NO ENCRIPTADO)');
      // [ENCRYPTION] - Mensaje con encriptación
      // console.log('✓ Base de datos encriptada inicializada correctamente');
    } catch (error: any) {
      console.error('Error al inicializar base de datos:', error);
      throw error;
    }
  }

  // ====================================================================
  // [ENCRYPTION] - MÉTODO DE DERIVACIÓN DE CLAVE (COMENTADO)
  // ====================================================================
  /*
  /**
   * Derivar clave de encriptación
   * K = HKDF(appSecret + machineId)
   *\/
  private async deriveEncryptionKey(): Promise<string> {
    const params: any = {
      appSecret: this.config.appSecret,
      info: 'electoral-database-encryption'
    };

    // Incluir machine ID si está habilitado
    if (this.config.useMachineBinding !== false) {
      const machineId = await this.machineIdService.getMachineId();
      params.machineId = machineId;
      console.log(`Machine ID: ${machineId.substring(0, 16)}...`);
    }

    const key = CryptoService.deriveMasterKey(params);
    return key;
  }
  */
  // ====================================================================

  /**
   * Inicializar esquema de base de datos desde archivo SQL
   */
  private async initializeSchema(): Promise<void> {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    console.log('Inicializando esquema de base de datos...');

    // Leer archivo schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');

    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Archivo de esquema no encontrado: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Ejecutar esquema
    try {
      this.db.exec(schemaSql);
      console.log('✓ Esquema de base de datos creado');

      // [ENCRYPTION] - Registrar machineId en configuración
      /*
      const machineId = await this.machineIdService.getMachineId();
      this.db.prepare(`
        INSERT OR REPLACE INTO configuracion_sistema (clave, valor, descripcion)
        VALUES (?, ?, ?)
      `).run('id_maquina', machineId, 'ID único de la máquina donde se inicializó la base de datos');
      */

    } catch (error: any) {
      console.error('Error al crear esquema:', error);
      throw error;
    }
  }

  /**
   * Obtener instancia de base de datos
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Base de datos no inicializada. Llamar a initialize() primero.');
    }
    return this.db;
  }

  /**
   * Obtener información de la base de datos
   */
  async getDatabaseInfo(): Promise<DatabaseInfo> {
    const exists = fs.existsSync(this.config.dbPath);
    let size = 0;

    if (exists) {
      const stats = fs.statSync(this.config.dbPath);
      size = stats.size;
    }

    // [ENCRYPTION] - Obtener machineId
    // let machineId: string | undefined;
    // if (this.config.useMachineBinding !== false) {
    //   machineId = await this.machineIdService.getMachineId();
    // }

    return {
      path: this.config.dbPath,
      exists,
      encrypted: false,  // [ENCRYPTION] Cambiar a true cuando se active encriptación
      size,
      // [ENCRYPTION] - Descomentar para incluir machineId
      // machineId
    };
  }

  // ====================================================================
  // [ENCRYPTION] - MÉTODOS DE ENCRIPTACIÓN (COMENTADOS)
  // ====================================================================
  /*
  /**
   * Cambiar clave de encriptación (rekey)
   * ADVERTENCIA: Operación costosa, requiere reescribir toda la DB
   *\/
  async rekeyDatabase(newAppSecret: string): Promise<void> {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    // Validar nuevo secreto
    if (!CryptoService.validateKey(newAppSecret)) {
      throw new Error('Nuevo appSecret debe ser un string hexadecimal de 64 caracteres');
    }

    // Derivar nueva clave
    const params: any = {
      appSecret: newAppSecret,
      info: 'electoral-database-encryption'
    };

    if (this.config.useMachineBinding !== false) {
      const machineId = await this.machineIdService.getMachineId();
      params.machineId = machineId;
    }

    const newKey = CryptoService.deriveMasterKey(params);

    // Ejecutar rekey
    try {
      this.db.pragma(`rekey='${newKey}'`);
      this.encryptionKey = newKey;
      this.config.appSecret = newAppSecret;
      console.log('✓ Clave de encriptación cambiada exitosamente');
    } catch (error: any) {
      console.error('Error al cambiar clave de encriptación:', error);
      throw error;
    }
  }

  /**
   * Exportar base de datos a formato no encriptado (para backup)
   * ADVERTENCIA: El archivo resultante NO estará encriptado
   *\/
  async exportUnencrypted(outputPath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    try {
      this.db.pragma(`rekey=''`);  // Remover encriptación temporalmente

      // Hacer backup
      const backup = this.db.backup(outputPath);
      backup.step(-1);  // -1 = copiar todo
      backup.finish();

      // Re-aplicar encriptación
      if (this.encryptionKey) {
        this.db.pragma(`rekey='${this.encryptionKey}'`);
      }

      console.log(`✓ Base de datos exportada sin encriptación a: ${outputPath}`);
      console.warn('⚠️  ADVERTENCIA: El archivo exportado NO está encriptado. Protegerlo adecuadamente.');
    } catch (error: any) {
      console.error('Error al exportar base de datos:', error);
      throw error;
    }
  }
  */
  // ====================================================================

  /**
   * Hacer backup de la base de datos
   */
  async backup(backupPath: string): Promise<void> {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    try {
      const backup = this.db.backup(backupPath);
      backup.step(-1);  // -1 = copiar todo
      backup.finish();

      console.log(`✓ Backup creado: ${backupPath}`);
      // [ENCRYPTION] - Mensaje con encriptación
      // console.log(`✓ Backup encriptado creado: ${backupPath}`);
    } catch (error: any) {
      console.error('Error al crear backup:', error);
      throw error;
    }
  }

  /**
   * Verificar integridad de la base de datos
   */
  checkIntegrity(): boolean {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    try {
      const result = this.db.pragma('integrity_check');
      return Array.isArray(result) && result.length === 1 && result[0].integrity_check === 'ok';
    } catch (error: any) {
      console.error('Error al verificar integridad:', error);
      return false;
    }
  }

  /**
   * Optimizar base de datos (VACUUM)
   */
  async optimize(): Promise<void> {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    try {
      this.db.pragma('optimize');
      console.log('✓ Base de datos optimizada');
    } catch (error: any) {
      console.error('Error al optimizar base de datos:', error);
      throw error;
    }
  }

  /**
   * Cerrar base de datos
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
        // [ENCRYPTION] - Limpiar clave de encriptación
        // this.encryptionKey = null;
        console.log('✓ Base de datos cerrada');
      } catch (error: any) {
        console.error('Error al cerrar base de datos:', error);
        throw error;
      }
    }
  }

  /**
   * Obtener estadísticas de la base de datos
   */
  getStats(): any {
    if (!this.db) {
      throw new Error('Base de datos no inicializada');
    }

    const stats: any = {
      pageCount: this.db.pragma('page_count', { simple: true }),
      pageSize: this.db.pragma('page_size', { simple: true }),
      encoding: this.db.pragma('encoding', { simple: true }),
      journalMode: this.db.pragma('journal_mode', { simple: true }),
    };

    // [ENCRYPTION] - Agregar versión del cipher
    // stats.cipherVersion = this.db.pragma('cipher_version', { simple: true });

    return stats;
  }
}

export default DatabaseService;
