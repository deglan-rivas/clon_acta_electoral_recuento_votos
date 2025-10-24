/**
 * Servicio de Criptografía Simplificado - CryptoService
 *
 * Versión simplificada que complementa SQLCipher.
 * SQLCipher maneja la encriptación de la base de datos automáticamente.
 * Este servicio solo proporciona:
 * - Derivación de claves para SQLCipher
 * - Hashing para auditoría
 * - Generación de tokens/UUIDs
 *
 * Basado en SECURITY_IMPLEMENTATION_PLAN.md
 */

import * as crypto from 'crypto';

// ============================================================================
// Constantes
// ============================================================================

const KEY_LENGTH = 32;                   // 256 bits para AES-256
const HKDF_HASH = 'sha256';
const PBKDF2_ITERATIONS = 100000;

// ============================================================================
// Interfaces
// ============================================================================

export interface KeyDerivationParams {
  appSecret: string | Buffer;            // Secreto de aplicación
  machineId?: string;                    // ID de máquina para binding
  userSalt?: string;                     // Salt adicional
  info?: string;                         // Información contextual
}

// ============================================================================
// Servicio de Criptografía Simplificado
// ============================================================================

export class CryptoService {
  /**
   * Derivar clave maestra usando HKDF
   * K = HKDF(appSecret + machineId + userSalt)
   *
   * Esta clave se usa como password para SQLCipher
   */
  static deriveMasterKey(params: KeyDerivationParams): string {
    const { appSecret, machineId, userSalt, info } = params;

    // Preparar input key material (IKM)
    let ikm: Buffer;
    if (typeof appSecret === 'string') {
      ikm = Buffer.from(appSecret, 'utf8');
    } else {
      ikm = appSecret;
    }

    // Combinar con machine ID si está disponible
    if (machineId) {
      const machineIdBuffer = Buffer.from(machineId, 'utf8');
      ikm = Buffer.concat([ikm, machineIdBuffer]);
    }

    // Combinar con user salt si está disponible
    if (userSalt) {
      const userSaltBuffer = Buffer.from(userSalt, 'utf8');
      ikm = Buffer.concat([ikm, userSaltBuffer]);
    }

    // Salt para HKDF (puede ser fijo o derivado)
    const salt = crypto.createHash('sha256')
      .update('electoral-system-salt-2026')
      .digest();

    const infoBuffer = Buffer.from(info || 'electoral-db-encryption-key', 'utf8');

    // Derivar clave usando HKDF
    const key = crypto.hkdfSync(HKDF_HASH, ikm, salt, infoBuffer, KEY_LENGTH);

    // Retornar como hexadecimal para SQLCipher
    return key.toString('hex');
  }

  /**
   * Derivar clave desde contraseña usando PBKDF2
   * (Alternativa si no se usa HKDF)
   */
  static deriveKeyFromPassword(password: string, salt: string): string {
    const saltBuffer = Buffer.from(salt, 'utf8');
    const key = crypto.pbkdf2Sync(password, saltBuffer, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha256');
    return key.toString('hex');
  }

  // ==========================================================================
  // Hashing (para auditoría)
  // ==========================================================================

  /**
   * Calcular hash SHA-256
   */
  static hash(data: string | Buffer | object): string {
    let buffer: Buffer;

    if (typeof data === 'string') {
      buffer = Buffer.from(data, 'utf8');
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      buffer = Buffer.from(JSON.stringify(data), 'utf8');
    }

    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Calcular hash encadenado para auditoría blockchain-style
   * hash = SHA-256(currentData + previousHash)
   */
  static hashChain(data: string | object, previousHash: string | null): string {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const combined = previousHash ? dataStr + previousHash : dataStr;
    return this.hash(combined);
  }

  /**
   * Calcular hash con timestamp para registros de auditoría
   */
  static hashAuditRecord(record: {
    id: number;
    timestamp: string;
    action: string;
    userId?: number;
    details: any;
    previousHash: string | null;
  }): string {
    const dataToHash = {
      id: record.id,
      timestamp: record.timestamp,
      action: record.action,
      userId: record.userId,
      details: record.details,
      previousHash: record.previousHash
    };

    return this.hash(JSON.stringify(dataToHash));
  }

  // ==========================================================================
  // Utilidades
  // ==========================================================================

  /**
   * Generar salt aleatorio (hex)
   */
  static generateSalt(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generar token seguro (hex)
   */
  static generateToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }

  /**
   * Generar UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Generar secreto de aplicación (SOLO para inicialización)
   * IMPORTANTE: Este secreto debe guardarse de forma segura
   */
  static generateAppSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Comparación en tiempo constante (previene timing attacks)
   */
  static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    return crypto.timingSafeEqual(bufferA, bufferB);
  }

  /**
   * Validar que una clave tenga el formato correcto
   */
  static validateKey(key: string): boolean {
    // Debe ser hex de 64 caracteres (256 bits)
    return /^[0-9a-f]{64}$/i.test(key);
  }
}

export default CryptoService;
