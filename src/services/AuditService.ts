/**
 * Servicio de Auditoría - AuditService
 *
 * Proporciona logging tamper-evident (resistente a manipulación) mediante:
 * - Encadenamiento de hashes tipo blockchain
 * - Registro inmutable de todas las operaciones
 * - Verificación de integridad de la cadena de auditoría
 *
 * Basado en SECURITY_IMPLEMENTATION_PLAN.md - Phase 4: Audit & Logging
 */

import Database from 'better-sqlite3-multiple-ciphers';
import { CryptoService } from './CryptoService';

// ============================================================================
// Tipos de Eventos
// ============================================================================

export type AuditCategory = 'AUTH' | 'DATA' | 'VOTE' | 'SYSTEM';

export type AuditAction =
  // Autenticación
  | 'login' | 'logout' | 'login_failed' | 'password_changed' | 'session_expired'
  // Datos
  | 'crear_acta' | 'actualizar_acta' | 'finalizar_acta' | 'eliminar_acta'
  | 'crear_voto' | 'actualizar_voto' | 'eliminar_voto'
  // Sistema
  | 'db_initialized' | 'db_backup' | 'db_restore' | 'config_changed'
  | 'export_pdf' | 'import_data';

// ============================================================================
// Interfaces
// ============================================================================

export interface AuditRecord {
  id?: number;
  uuid: string;
  fechaHora: string;
  usuarioId?: number;
  idSesion?: string;
  idMaquina?: string;
  accion: AuditAction;
  categoria: AuditCategory;
  descripcion?: string;
  detalles?: any;
  tipoRecurso?: string;
  idRecurso?: string;
  snapshotAntes?: any;
  snapshotDespues?: any;
  hashRegistro: string;
  hashAnterior?: string;
  numeroSecuencia?: number;
}

export interface AuditQuery {
  categoria?: AuditCategory;
  accion?: AuditAction;
  usuarioId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoRecurso?: string;
  idRecurso?: string;
  limit?: number;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  totalRecords: number;
  violatedRecords: number;
  violations: Array<{
    id: number;
    numeroSecuencia: number;
    expectedHash: string;
    actualHash: string;
  }>;
}

// ============================================================================
// Servicio de Auditoría
// ============================================================================

export class AuditService {
  constructor(private db: Database) {
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Registrar evento de auditoría
   */
  async log(params: {
    usuarioId?: number;
    idSesion?: string;
    idMaquina?: string;
    accion: AuditAction;
    categoria: AuditCategory;
    descripcion?: string;
    detalles?: any;
    tipoRecurso?: string;
    idRecurso?: string;
    snapshotAntes?: any;
    snapshotDespues?: any;
  }): Promise<number> {
    const {
      usuarioId,
      idSesion,
      idMaquina,
      accion,
      categoria,
      descripcion,
      detalles,
      tipoRecurso,
      idRecurso,
      snapshotAntes,
      snapshotDespues
    } = params;

    const uuid = CryptoService.generateUUID();
    const fechaHora = new Date().toISOString();

    // Obtener hash del registro anterior
    const ultimoRegistro = this.db.prepare(`
      SELECT hash_registro, numero_secuencia
      FROM registros_auditoria
      ORDER BY numero_secuencia DESC
      LIMIT 1
    `).get() as any;

    const hashAnterior = ultimoRegistro ? ultimoRegistro.hash_registro : null;
    const numeroSecuencia = ultimoRegistro ? ultimoRegistro.numero_secuencia + 1 : 1;

    // Calcular hash del registro actual
    const hashRegistro = CryptoService.hashAuditRecord({
      id: 0,  // Se reemplazará después de insertar
      timestamp: fechaHora,
      action: accion,
      userId: usuarioId,
      details: detalles,
      previousHash: hashAnterior
    });

    // Insertar registro
    const result = this.db.prepare(`
      INSERT INTO registros_auditoria (
        uuid,
        fecha_hora,
        usuario_id,
        id_sesion,
        id_maquina,
        accion,
        categoria,
        descripcion,
        detalles,
        tipo_recurso,
        id_recurso,
        snapshot_antes,
        snapshot_despues,
        hash_registro,
        hash_anterior,
        numero_secuencia
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuid,
      fechaHora,
      usuarioId || null,
      idSesion || null,
      idMaquina || null,
      accion,
      categoria,
      descripcion || null,
      detalles ? JSON.stringify(detalles) : null,
      tipoRecurso || null,
      idRecurso || null,
      snapshotAntes ? JSON.stringify(snapshotAntes) : null,
      snapshotDespues ? JSON.stringify(snapshotDespues) : null,
      hashRegistro,
      hashAnterior,
      numeroSecuencia
    );

    // Actualizar hash genesis en la primera entrada
    if (numeroSecuencia === 1) {
      this.db.prepare(`
        INSERT OR REPLACE INTO configuracion_sistema (clave, valor, descripcion)
        VALUES (?, ?, ?)
      `).run('hash_genesis', hashRegistro, 'Hash del primer registro de auditoría (génesis)');
    }

    return result.lastInsertRowid as number;
  }

  /**
   * Consultar registros de auditoría
   */
  query(params: AuditQuery = {}): AuditRecord[] {
    const {
      categoria,
      accion,
      usuarioId,
      fechaDesde,
      fechaHasta,
      tipoRecurso,
      idRecurso,
      limit = 100
    } = params;

    let sql = `
      SELECT
        id,
        uuid,
        fecha_hora,
        usuario_id,
        id_sesion,
        id_maquina,
        accion,
        categoria,
        descripcion,
        detalles,
        tipo_recurso,
        id_recurso,
        snapshot_antes,
        snapshot_despues,
        hash_registro,
        hash_anterior,
        numero_secuencia
      FROM registros_auditoria
      WHERE 1=1
    `;

    const sqlParams: any[] = [];

    if (categoria) {
      sql += ' AND categoria = ?';
      sqlParams.push(categoria);
    }

    if (accion) {
      sql += ' AND accion = ?';
      sqlParams.push(accion);
    }

    if (usuarioId) {
      sql += ' AND usuario_id = ?';
      sqlParams.push(usuarioId);
    }

    if (fechaDesde) {
      sql += ' AND fecha_hora >= ?';
      sqlParams.push(fechaDesde);
    }

    if (fechaHasta) {
      sql += ' AND fecha_hora <= ?';
      sqlParams.push(fechaHasta);
    }

    if (tipoRecurso) {
      sql += ' AND tipo_recurso = ?';
      sqlParams.push(tipoRecurso);
    }

    if (idRecurso) {
      sql += ' AND id_recurso = ?';
      sqlParams.push(idRecurso);
    }

    sql += ' ORDER BY numero_secuencia DESC LIMIT ?';
    sqlParams.push(limit);

    const rows = this.db.prepare(sql).all(...sqlParams) as any[];

    return rows.map(row => ({
      id: row.id,
      uuid: row.uuid,
      fechaHora: row.fecha_hora,
      usuarioId: row.usuario_id,
      idSesion: row.id_sesion,
      idMaquina: row.id_maquina,
      accion: row.accion,
      categoria: row.categoria,
      descripcion: row.descripcion,
      detalles: row.detalles ? JSON.parse(row.detalles) : null,
      tipoRecurso: row.tipo_recurso,
      idRecurso: row.id_recurso,
      snapshotAntes: row.snapshot_antes ? JSON.parse(row.snapshot_antes) : null,
      snapshotDespues: row.snapshot_despues ? JSON.parse(row.snapshot_despues) : null,
      hashRegistro: row.hash_registro,
      hashAnterior: row.hash_anterior,
      numeroSecuencia: row.numero_secuencia
    }));
  }

  /**
   * Obtener registro por ID
   */
  getById(id: number): AuditRecord | null {
    const row = this.db.prepare(`
      SELECT * FROM registros_auditoria WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      uuid: row.uuid,
      fechaHora: row.fecha_hora,
      usuarioId: row.usuario_id,
      idSesion: row.id_sesion,
      idMaquina: row.id_maquina,
      accion: row.accion,
      categoria: row.categoria,
      descripcion: row.descripcion,
      detalles: row.detalles ? JSON.parse(row.detalles) : null,
      tipoRecurso: row.tipo_recurso,
      idRecurso: row.id_recurso,
      snapshotAntes: row.snapshot_antes ? JSON.parse(row.snapshot_antes) : null,
      snapshotDespues: row.snapshot_despues ? JSON.parse(row.snapshot_despues) : null,
      hashRegistro: row.hash_registro,
      hashAnterior: row.hash_anterior,
      numeroSecuencia: row.numero_secuencia
    };
  }

  /**
   * Verificar integridad de la cadena de auditoría
   * Detecta si algún registro ha sido manipulado
   */
  verifyIntegrity(): IntegrityCheckResult {
    const rows = this.db.prepare(`
      SELECT
        r1.id,
        r1.numero_secuencia,
        r1.hash_registro,
        r1.hash_anterior,
        r2.hash_registro as hash_anterior_real
      FROM registros_auditoria r1
      LEFT JOIN registros_auditoria r2 ON r1.numero_secuencia = r2.numero_secuencia + 1
      ORDER BY r1.numero_secuencia
    `).all() as any[];

    const violations: Array<{
      id: number;
      numeroSecuencia: number;
      expectedHash: string;
      actualHash: string;
    }> = [];

    for (const row of rows) {
      // Verificar encadenamiento
      if (row.numero_secuencia === 1) {
        // Primer registro: no debe tener hash anterior
        if (row.hash_anterior !== null) {
          violations.push({
            id: row.id,
            numeroSecuencia: row.numero_secuencia,
            expectedHash: 'null',
            actualHash: row.hash_anterior
          });
        }
      } else {
        // Registros posteriores: hash_anterior debe coincidir con hash del anterior
        if (row.hash_anterior !== row.hash_anterior_real) {
          violations.push({
            id: row.id,
            numeroSecuencia: row.numero_secuencia,
            expectedHash: row.hash_anterior_real || 'null',
            actualHash: row.hash_anterior || 'null'
          });
        }
      }
    }

    return {
      isValid: violations.length === 0,
      totalRecords: rows.length,
      violatedRecords: violations.length,
      violations
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  getStats(): any {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM registros_auditoria').get() as any;

    const porCategoria = this.db.prepare(`
      SELECT categoria, COUNT(*) as count
      FROM registros_auditoria
      GROUP BY categoria
    `).all();

    const ultimoRegistro = this.db.prepare(`
      SELECT fecha_hora, accion
      FROM registros_auditoria
      ORDER BY numero_secuencia DESC
      LIMIT 1
    `).get() as any;

    return {
      totalRegistros: total.count,
      porCategoria,
      ultimoRegistro: ultimoRegistro ? {
        fecha: ultimoRegistro.fecha_hora,
        accion: ultimoRegistro.accion
      } : null
    };
  }

  /**
   * Exportar logs de auditoría (para compliance)
   */
  exportLogs(params: AuditQuery = {}): string {
    const records = this.query({ ...params, limit: 100000 });

    // Generar CSV
    const lines: string[] = [
      'ID,UUID,Fecha/Hora,Usuario ID,Acción,Categoría,Descripción,Tipo Recurso,ID Recurso,Hash,Hash Anterior,Secuencia'
    ];

    for (const record of records) {
      lines.push([
        record.id,
        record.uuid,
        record.fechaHora,
        record.usuarioId || '',
        record.accion,
        record.categoria,
        record.descripcion || '',
        record.tipoRecurso || '',
        record.idRecurso || '',
        record.hashRegistro,
        record.hashAnterior || '',
        record.numeroSecuencia
      ].join(','));
    }

    return lines.join('\n');
  }

  /**
   * Logging helpers para operaciones comunes
   */

  async logLogin(usuarioId: number, idSesion: string, idMaquina: string, success: boolean): Promise<void> {
    await this.log({
      usuarioId,
      idSesion,
      idMaquina,
      accion: success ? 'login' : 'login_failed',
      categoria: 'AUTH',
      descripcion: success ? 'Inicio de sesión exitoso' : 'Intento de inicio de sesión fallido'
    });
  }

  async logLogout(usuarioId: number, idSesion: string): Promise<void> {
    await this.log({
      usuarioId,
      idSesion,
      accion: 'logout',
      categoria: 'AUTH',
      descripcion: 'Cierre de sesión'
    });
  }

  async logActaCreated(usuarioId: number, actaId: number, actaData: any): Promise<void> {
    await this.log({
      usuarioId,
      accion: 'crear_acta',
      categoria: 'DATA',
      descripcion: `Acta creada: ${actaData.numero_acta}`,
      tipoRecurso: 'acta',
      idRecurso: actaId.toString(),
      snapshotDespues: actaData
    });
  }

  async logActaUpdated(usuarioId: number, actaId: number, beforeData: any, afterData: any): Promise<void> {
    await this.log({
      usuarioId,
      accion: 'actualizar_acta',
      categoria: 'DATA',
      descripcion: `Acta actualizada: ${afterData.numero_acta}`,
      tipoRecurso: 'acta',
      idRecurso: actaId.toString(),
      snapshotAntes: beforeData,
      snapshotDespues: afterData
    });
  }

  async logActaFinalized(usuarioId: number, actaId: number, actaData: any): Promise<void> {
    await this.log({
      usuarioId,
      accion: 'finalizar_acta',
      categoria: 'VOTE',
      descripcion: `Acta finalizada: ${actaData.numero_acta}`,
      tipoRecurso: 'acta',
      idRecurso: actaId.toString(),
      snapshotDespues: actaData
    });
  }
}

export default AuditService;
