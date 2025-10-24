/**
 * Servicio de ID de Máquina - MachineIdService
 *
 * Proporciona identificación única de la máquina para:
 * - Binding de licencias a hardware específico
 * - Derivación de claves vinculadas a la máquina
 * - Auditoría forense (identificar qué máquina realizó operaciones)
 *
 * Basado en SECURITY_IMPLEMENTATION_PLAN.md - Phase 3: Machine Binding
 */

import * as crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Interfaces
// ============================================================================

export interface MachineInfo {
  machineId: string;                     // ID único de la máquina
  hostname: string;                      // Nombre del host
  platform: string;                      // Plataforma (win32, linux, darwin)
  arch: string;                          // Arquitectura (x64, arm64)
  cpus: number;                          // Número de CPUs
  totalMemory: number;                   // Memoria total en bytes
  networkInterfaces: string[];           // MACs de interfaces de red
  generatedAt: string;                   // Timestamp de generación
}

export interface MachineIdOptions {
  useNetworkInterfaces?: boolean;        // Incluir MACs (puede cambiar con virtualización)
  useCpuInfo?: boolean;                  // Incluir info de CPU
  useOsInfo?: boolean;                   // Incluir info de SO
  persistPath?: string;                  // Ruta para persistir el ID
}

// ============================================================================
// Servicio de Machine ID
// ============================================================================

export class MachineIdService {
  private cachedMachineId: string | null = null;
  private persistPath: string;

  constructor(persistPath?: string) {
    // Ruta por defecto para persistir el machine ID
    this.persistPath = persistPath || path.join(process.cwd(), 'data', '.machine-id');
  }

  /**
   * Obtener o generar Machine ID
   * Intenta cargar desde disco, si no existe lo genera y persiste
   */
  async getMachineId(): Promise<string> {
    // Si ya está en cache, retornar
    if (this.cachedMachineId) {
      return this.cachedMachineId;
    }

    // Intentar cargar desde disco
    const persistedId = await this.loadPersistedMachineId();
    if (persistedId) {
      this.cachedMachineId = persistedId;
      return persistedId;
    }

    // Generar nuevo ID
    const machineId = await this.generateMachineId();

    // Persistir
    await this.persistMachineId(machineId);

    this.cachedMachineId = machineId;
    return machineId;
  }

  /**
   * Generar Machine ID basado en características del hardware
   */
  private async generateMachineId(options: MachineIdOptions = {}): Promise<string> {
    const {
      useNetworkInterfaces = true,
      useCpuInfo = true,
      useOsInfo = true
    } = options;

    const components: string[] = [];

    // 1. Hostname
    components.push(os.hostname());

    // 2. Platform y arquitectura
    if (useOsInfo) {
      components.push(os.platform());
      components.push(os.arch());
    }

    // 3. CPU info
    if (useCpuInfo) {
      const cpus = os.cpus();
      if (cpus.length > 0) {
        // Usar modelo del primer CPU
        components.push(cpus[0].model);
        components.push(cpus.length.toString());
      }
    }

    // 4. Network interfaces (MACs)
    if (useNetworkInterfaces) {
      const macs = this.getNetworkMacs();
      if (macs.length > 0) {
        // Ordenar para consistencia
        macs.sort();
        components.push(macs.join(','));
      }
    }

    // 5. User info (opcional, puede no estar disponible)
    try {
      const userInfo = os.userInfo();
      if (userInfo.username) {
        components.push(userInfo.username);
      }
    } catch (error) {
      // Ignorar si no está disponible
    }

    // Combinar todos los componentes
    const combined = components.join('|');

    // Generar hash SHA-256
    const hash = crypto.createHash('sha256')
      .update(combined)
      .digest('hex');

    return hash;
  }

  /**
   * Obtener direcciones MAC de interfaces de red
   */
  private getNetworkMacs(): string[] {
    const interfaces = os.networkInterfaces();
    const macs: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (iface) {
        for (const config of iface) {
          // Filtrar loopback y interfaces virtuales
          if (!config.internal && config.mac && config.mac !== '00:00:00:00:00:00') {
            macs.push(config.mac.toLowerCase());
          }
        }
      }
    }

    return macs;
  }

  /**
   * Obtener información completa de la máquina
   */
  async getMachineInfo(): Promise<MachineInfo> {
    const machineId = await this.getMachineId();

    return {
      machineId,
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      networkInterfaces: this.getNetworkMacs(),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Cargar Machine ID persistido desde disco
   */
  private async loadPersistedMachineId(): Promise<string | null> {
    try {
      if (fs.existsSync(this.persistPath)) {
        const content = await fs.promises.readFile(this.persistPath, 'utf8');
        const trimmed = content.trim();

        // Validar formato (debe ser hash SHA-256 hex)
        if (/^[0-9a-f]{64}$/i.test(trimmed)) {
          return trimmed;
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar machine ID persistido:', error);
    }
    return null;
  }

  /**
   * Persistir Machine ID en disco
   */
  private async persistMachineId(machineId: string): Promise<void> {
    try {
      // Crear directorio si no existe
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      // Escribir Machine ID
      await fs.promises.writeFile(this.persistPath, machineId, 'utf8');

      // En sistemas Unix, hacer el archivo de solo lectura
      if (os.platform() !== 'win32') {
        await fs.promises.chmod(this.persistPath, 0o400);
      }
    } catch (error) {
      console.error('Error al persistir machine ID:', error);
      throw error;
    }
  }

  /**
   * Regenerar Machine ID (SOLO para casos especiales)
   * ADVERTENCIA: Esto invalidará la licencia actual
   */
  async regenerateMachineId(): Promise<string> {
    const newId = await this.generateMachineId();
    await this.persistMachineId(newId);
    this.cachedMachineId = newId;
    return newId;
  }

  /**
   * Verificar si el Machine ID actual coincide con uno esperado
   */
  async verifyMachineId(expectedId: string): Promise<boolean> {
    const currentId = await this.getMachineId();
    return currentId === expectedId;
  }

  /**
   * Limpiar cache (útil para testing)
   */
  clearCache(): void {
    this.cachedMachineId = null;
  }

  /**
   * Eliminar Machine ID persistido (SOLO para testing/desarrollo)
   */
  async deletePersisted(): Promise<void> {
    try {
      if (fs.existsSync(this.persistPath)) {
        await fs.promises.unlink(this.persistPath);
      }
      this.cachedMachineId = null;
    } catch (error) {
      console.error('Error al eliminar machine ID persistido:', error);
      throw error;
    }
  }
}

export default MachineIdService;
