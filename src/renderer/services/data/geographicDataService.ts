// Service for geographic data operations (departamentos, provincias, distritos)
import type { UbigeoRecord, MesaElectoralRecord } from '../../types/acta.types';

export class GeographicDataService {
  /**
   * Get unique departamentos (or continentes for international)
   */
  static getDepartamentos(
    isInternational: boolean,
    ubigeoData: UbigeoRecord[],
    mesaElectoralData: MesaElectoralRecord[]
  ): string[] {
    if (isInternational) {
      // Get continentes from mesa electoral data
      const continentes = mesaElectoralData
        .filter(record => record.circunscripcion_electoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO')
        .map(record => record.departamento?.trim() || '');
      const unique = Array.from(new Set(continentes))
        .filter(cont => cont !== '');
      return unique.sort();
    } else {
      // Get departamentos from ubigeo data (national)
      const unique = Array.from(new Set(ubigeoData.map(record => record.departamento?.trim() || '')))
        .filter(dept => dept !== '');
      return unique.sort();
    }
  }

  /**
   * Get provincias for selected departamento (or países for international)
   */
  static getProvincias(
    departamento: string,
    isInternational: boolean,
    ubigeoData: UbigeoRecord[],
    mesaElectoralData: MesaElectoralRecord[]
  ): string[] {
    if (!departamento) return [];

    if (isInternational) {
      // Get países for the selected continente from mesa electoral data
      const filtered = mesaElectoralData.filter(
        record => record.circunscripcion_electoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO' &&
                 record.departamento === departamento
      );
      const unique = Array.from(new Set(filtered.map(record => record.provincia?.trim() || '')))
        .filter(prov => prov !== '');
      return unique.sort();
    } else {
      // Get provincias from ubigeo data (national)
      const filtered = ubigeoData.filter(record => record.departamento === departamento);
      const unique = Array.from(new Set(filtered.map(record => record.provincia?.trim() || '')))
        .filter(prov => prov !== '');
      return unique.sort();
    }
  }

  /**
   * Get distritos for selected provincia (or ciudades for international)
   */
  static getDistritos(
    departamento: string,
    provincia: string,
    isInternational: boolean,
    ubigeoData: UbigeoRecord[],
    mesaElectoralData: MesaElectoralRecord[]
  ): string[] {
    if (!departamento || !provincia) return [];

    if (isInternational) {
      // Get ciudades for the selected país from mesa electoral data
      const filtered = mesaElectoralData.filter(
        record => record.circunscripcion_electoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO' &&
                 record.departamento === departamento &&
                 record.provincia === provincia
      );
      const unique = Array.from(new Set(filtered.map(record => record.distrito?.trim() || '')))
        .filter(distrito => distrito !== '');
      return unique.sort();
    } else {
      // Get distritos from ubigeo data (national)
      const filtered = ubigeoData.filter(record =>
        record.departamento === departamento && record.provincia === provincia
      );
      const unique = Array.from(new Set(filtered.map(record => record.distrito?.trim() || '')))
        .filter(distrito => distrito !== '');
      return unique.sort();
    }
  }

  /**
   * Lookup mesa electoral info by mesa number
   */
  static getMesaElectoralInfo(
    mesaNumber: string,
    mesaElectoralData: MesaElectoralRecord[]
  ): MesaElectoralRecord | null {
    if (!mesaNumber || mesaElectoralData.length === 0) return null;

    const paddedMesaNumber = mesaNumber.padStart(6, '0');
    const mesaRecord = mesaElectoralData.find(record => record.mesa_number === paddedMesaNumber);
    return mesaRecord || null;
  }
}
