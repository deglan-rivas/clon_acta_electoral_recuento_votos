/**
 * Servicio de Autenticación - SIMPLIFICADO
 *
 * Versión simplificada para aplicación de un solo operador (SECRETARIO)
 * Mantiene seguridad básica con hash Argon2 y gestión de sesiones
 * Diseñado para uso offline con auditoría forense
 */

import Database from 'better-sqlite3-multiple-ciphers';
import * as argon2 from '@node-rs/argon2';
import * as crypto from 'crypto';

// ============================================================================
// Interfaces
// ============================================================================

export interface Usuario {
  id: number;
  nombreUsuario: string;
  nombreCompleto: string | null;
  cargo: string;
  jeeId: number;
  jeeNombre: string | null; // Joined from jee table
  estaActivo: boolean;
}

export interface Sesion {
  id: number;
  uuid: string;
  usuarioId: number;
  token: string;
  idMaquina: string | null;
  fechaExpiracion: string;
  estaActiva: boolean;
}

export interface LoginCredentials {
  nombreUsuario: string;  // Típicamente el DNI
  contrasena: string;
  idMaquina?: string;
}

export interface LoginResult {
  success: boolean;
  usuario?: Usuario;
  sesion?: Sesion;
  token?: string;
  error?: string;
}

export interface ChangePasswordParams {
  usuarioId: number;
  contrasenaActual: string;
  contrasenaNueva: string;
}

// ============================================================================
// Configuración
// ============================================================================

const SESSION_DURATION_HOURS = 12;      // Duración de sesión: 12 horas
const PASSWORD_MIN_LENGTH = 6;          // Longitud mínima de contraseña

// ============================================================================
// Servicio de Autenticación
// ============================================================================

export class AuthService {
  constructor(private db: Database) {
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Autenticar usuario
   */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { nombreUsuario, contrasena, idMaquina } = credentials;

    try {
      // 1. Buscar usuario
      const usuario = this.db.prepare(`
        SELECT
          id,
          nombre_usuario,
          hash_contrasena,
          sal,
          nombre_completo,
          cargo,
          jee_nombre,
          esta_activo
        FROM usuarios
        WHERE nombre_usuario = ?
      `).get(nombreUsuario) as any;

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario o contraseña incorrectos'
        };
      }

      // 2. Verificar que el usuario esté activo
      if (!usuario.esta_activo) {
        return {
          success: false,
          error: 'Usuario inactivo. Contacte al administrador.'
        };
      }

      // 3. Verificar contraseña
      const isPasswordValid = await argon2.verify(
        usuario.hash_contrasena,
        contrasena,
        {
          salt: Buffer.from(usuario.sal, 'hex')
        }
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Usuario o contraseña incorrectos'
        };
      }

      // 4. Login exitoso - Crear sesión
      const sesion = this.crearSesion(usuario.id, idMaquina);

      // 5. Actualizar último login
      this.db.prepare(`
        UPDATE usuarios
        SET fecha_ultimo_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(usuario.id);

      // 6. Mapear usuario
      const usuarioMapeado: Usuario = {
        id: usuario.id,
        nombreUsuario: usuario.nombre_usuario,
        nombreCompleto: usuario.nombre_completo,
        cargo: usuario.cargo,
        jeeNombre: usuario.jee_nombre,
        estaActivo: Boolean(usuario.esta_activo)
      };

      return {
        success: true,
        usuario: usuarioMapeado,
        sesion: sesion,
        token: sesion.token
      };

    } catch (error: any) {
      console.error('Error durante login:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Crear nueva sesión para usuario
   */
  private crearSesion(usuarioId: number, idMaquina?: string): Sesion {
    const uuid = crypto.randomUUID();
    const token = this.generarTokenSesion();
    const fechaExpiracion = new Date(Date.now() + SESSION_DURATION_HOURS * 3600000);

    const result = this.db.prepare(`
      INSERT INTO sesiones (
        uuid,
        usuario_id,
        token,
        id_maquina,
        fecha_expiracion,
        esta_activa
      ) VALUES (?, ?, ?, ?, ?, 1)
    `).run(
      uuid,
      usuarioId,
      token,
      idMaquina || null,
      fechaExpiracion.toISOString()
    );

    return {
      id: result.lastInsertRowid as number,
      uuid,
      usuarioId,
      token,
      idMaquina: idMaquina || null,
      fechaExpiracion: fechaExpiracion.toISOString(),
      estaActiva: true
    };
  }

  /**
   * Generar token de sesión seguro
   */
  private generarTokenSesion(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validar token de sesión
   */
  async validateSession(token: string): Promise<Usuario | null> {
    const sesion = this.db.prepare(`
      SELECT
        s.*,
        u.id as usuario_id,
        u.nombre_usuario,
        u.nombre_completo,
        u.cargo,
        u.jee_nombre,
        u.esta_activo
      FROM sesiones s
      JOIN usuarios u ON s.usuario_id = u.id
      WHERE s.token = ? AND s.esta_activa = 1
    `).get(token) as any;

    if (!sesion) {
      return null;
    }

    // Verificar expiración
    if (new Date(sesion.fecha_expiracion) < new Date()) {
      // Marcar sesión como inactiva
      this.db.prepare(`
        UPDATE sesiones
        SET esta_activa = 0
        WHERE token = ?
      `).run(token);
      return null;
    }

    // Verificar que usuario esté activo
    if (!sesion.esta_activo) {
      return null;
    }

    return {
      id: sesion.usuario_id,
      nombreUsuario: sesion.nombre_usuario,
      nombreCompleto: sesion.nombre_completo,
      cargo: sesion.cargo,
      jeeNombre: sesion.jee_nombre,
      estaActivo: Boolean(sesion.esta_activo)
    };
  }

  /**
   * Cerrar sesión
   */
  logout(token: string): void {
    this.db.prepare(`
      UPDATE sesiones
      SET
        esta_activa = 0,
        fecha_cierre = CURRENT_TIMESTAMP
      WHERE token = ?
    `).run(token);
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(params: ChangePasswordParams): Promise<{ success: boolean; error?: string }> {
    const { usuarioId, contrasenaActual, contrasenaNueva } = params;

    try {
      // 1. Validar longitud mínima
      if (contrasenaNueva.length < PASSWORD_MIN_LENGTH) {
        return {
          success: false,
          error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
        };
      }

      // 2. Obtener usuario
      const usuario = this.db.prepare(`
        SELECT hash_contrasena, sal
        FROM usuarios
        WHERE id = ?
      `).get(usuarioId) as any;

      if (!usuario) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // 3. Verificar contraseña actual
      const isCurrentPasswordValid = await argon2.verify(
        usuario.hash_contrasena,
        contrasenaActual,
        {
          salt: Buffer.from(usuario.sal, 'hex')
        }
      );

      if (!isCurrentPasswordValid) {
        return {
          success: false,
          error: 'Contraseña actual incorrecta'
        };
      }

      // 4. Generar nuevo hash
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = await argon2.hash(contrasenaNueva, {
        salt: Buffer.from(salt, 'hex'),
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4
      });

      // 5. Actualizar contraseña
      this.db.prepare(`
        UPDATE usuarios
        SET
          hash_contrasena = ?,
          sal = ?
        WHERE id = ?
      `).run(hash, salt, usuarioId);

      return { success: true };

    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Crear nuevo usuario (solo para inicialización)
   */
  async createUser(params: {
    nombreUsuario: string;
    contrasena: string;
    nombreCompleto?: string;
    cargo?: string;
    jeeId: number;
  }): Promise<{ success: boolean; usuario?: Usuario; error?: string }> {
    const { nombreUsuario, contrasena, nombreCompleto, cargo, jeeId } = params;

    try {
      // Validar longitud mínima
      if (contrasena.length < PASSWORD_MIN_LENGTH) {
        return {
          success: false,
          error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`
        };
      }

      // Verificar si ya existe
      const existente = this.db.prepare(`
        SELECT id FROM usuarios WHERE nombre_usuario = ?
      `).get(nombreUsuario);

      if (existente) {
        return {
          success: false,
          error: 'El nombre de usuario ya existe'
        };
      }

      // Generar hash de contraseña
      const salt = crypto.randomBytes(32).toString('hex');
      const hash = await argon2.hash(contrasena, {
        salt: Buffer.from(salt, 'hex'),
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4
      });

      // Crear usuario
      const result = this.db.prepare(`
        INSERT INTO usuarios (
          nombre_usuario,
          hash_contrasena,
          sal,
          nombre_completo,
          cargo,
          jee_id,
          esta_activo
        ) VALUES (?, ?, ?, ?, ?, ?, 1)
      `).run(
        nombreUsuario,
        hash,
        salt,
        nombreCompleto || null,
        cargo || 'SECRETARIO',
        jeeId
      );

      // Get JEE name for response
      const jeeData = this.db.prepare('SELECT jee FROM jee WHERE id = ?').get(jeeId) as { jee: string } | undefined;

      const usuario: Usuario = {
        id: result.lastInsertRowid as number,
        nombreUsuario,
        nombreCompleto: nombreCompleto || null,
        cargo: cargo || 'SECRETARIO',
        jeeId,
        jeeNombre: jeeData?.jee || null,
        estaActivo: true
      };

      return {
        success: true,
        usuario
      };

    } catch (error: any) {
      console.error('Error al crear usuario:', error);
      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }

  /**
   * Obtener usuario por nombre de usuario
   */
  getUserByUsername(nombreUsuario: string): Usuario | null {
    const usuario = this.db.prepare(`
      SELECT
        u.id,
        u.nombre_usuario,
        u.nombre_completo,
        u.cargo,
        u.jee_id,
        j.jee as jee_nombre,
        u.esta_activo
      FROM usuarios u
      LEFT JOIN jee j ON u.jee_id = j.id
      WHERE u.nombre_usuario = ?
    `).get(nombreUsuario) as any;

    if (!usuario) {
      return null;
    }

    return {
      id: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      nombreCompleto: usuario.nombre_completo,
      cargo: usuario.cargo,
      jeeId: usuario.jee_id,
      jeeNombre: usuario.jee_nombre,
      estaActivo: Boolean(usuario.esta_activo)
    };
  }

  /**
   * Listar sesiones activas de un usuario
   */
  getActiveSessions(usuarioId: number): Sesion[] {
    const sesiones = this.db.prepare(`
      SELECT
        id,
        uuid,
        usuario_id,
        token,
        id_maquina,
        fecha_expiracion,
        esta_activa
      FROM sesiones
      WHERE usuario_id = ? AND esta_activa = 1
      ORDER BY fecha_creacion DESC
    `).all(usuarioId) as any[];

    return sesiones.map(s => ({
      id: s.id,
      uuid: s.uuid,
      usuarioId: s.usuario_id,
      token: s.token,
      idMaquina: s.id_maquina,
      fechaExpiracion: s.fecha_expiracion,
      estaActiva: Boolean(s.esta_activa)
    }));
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  logoutAll(usuarioId: number): void {
    this.db.prepare(`
      UPDATE sesiones
      SET
        esta_activa = 0,
        fecha_cierre = CURRENT_TIMESTAMP
      WHERE usuario_id = ? AND esta_activa = 1
    `).run(usuarioId);
  }
}
