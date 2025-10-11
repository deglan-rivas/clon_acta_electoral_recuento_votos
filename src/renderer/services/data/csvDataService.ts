// Service for loading CSV data files
import type { UbigeoRecord, CircunscripcionRecord, JeeRecord, MesaElectoralRecord } from '../../types/acta.types';
import type { PoliticalOrganization } from '../../types';

// CSV file imports
import csvFile from '/TB_UBIGEOS.csv?url';
import circunscripcionCsvFile from '/circunscripcion_electoral_por_categoria.csv?url';
import jeeCsvFile from '/jee.csv?url';
import mesaElectoralCsvFile from '/mesa_electoral_data.csv?url';
import politicalOrgsCsvFile from '/organizaciones_politicas.csv?url';

export class CsvDataService {
  /**
   * Load Ubigeo data (national geographic divisions)
   */
  static async loadUbigeoData(): Promise<UbigeoRecord[]> {
    try {
      const response = await fetch(csvFile);
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Skip header
      const records: UbigeoRecord[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [ubigeo_reniec, ubigeo_inei, departamento_inei, departamento, provincia_inei, provincia, distrito] = line.split(';');
          return {
            ubigeo_reniec,
            ubigeo_inei,
            departamento_inei,
            departamento,
            provincia_inei,
            provincia,
            distrito
          };
        });
      return records;
    } catch (error) {
      console.error('Error loading ubigeo data:', error);
      return [];
    }
  }

  /**
   * Load Circunscripción Electoral data
   */
  static async loadCircunscripcionData(): Promise<CircunscripcionRecord[]> {
    try {
      const response = await fetch(circunscripcionCsvFile);
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Skip header
      const records: CircunscripcionRecord[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [category, circunscripcion_electoral] = line.split(';');
          return {
            category: category?.trim() || '',
            departamento: '', // Not used in this CSV
            provincia: '', // Not used in this CSV
            circunscripcion_electoral: circunscripcion_electoral?.trim() || ''
          };
        });
      return records;
    } catch (error) {
      console.error('Error loading circunscripción electoral data:', error);
      return [];
    }
  }

  /**
   * Load JEE (Jurados Electorales Especiales) data
   * CSV format: id;jee
   */
  static async loadJeeData(): Promise<JeeRecord[]> {
    try {
      const response = await fetch(jeeCsvFile);
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Skip header
      const jeeRecords: JeeRecord[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [id, jee] = line.split(';');
          return {
            id: id?.trim() || '',
            jee: jee?.trim() || ''
          };
        })
        .filter(record => record.id && record.jee); // Remove entries with missing id or jee

      // Sort by jee name
      return jeeRecords.sort((a, b) => a.jee.localeCompare(b.jee));
    } catch (error) {
      console.error('Error loading JEE data:', error);
      return [];
    }
  }

  /**
   * Load Mesa Electoral data (voting table information)
   */
  static async loadMesaElectoralData(): Promise<MesaElectoralRecord[]> {
    try {
      const response = await fetch(mesaElectoralCsvFile);
      const text = await response.text();
      const lines = text.split('\n').slice(1); // Skip header
      const records: MesaElectoralRecord[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [mesa_number, tipo_ubicacion, circunscripcion_electoral, departamento, provincia, distrito, teh] = line.split(';');
          return {
            mesa_number: mesa_number?.trim() || '',
            tipo_ubicacion: tipo_ubicacion?.trim() || '',
            circunscripcion_electoral: circunscripcion_electoral?.trim() || '',
            departamento: departamento?.trim() || '',
            provincia: provincia?.trim() || '',
            distrito: distrito?.trim() || '',
            teh: teh?.trim() || ''
          };
        });
      return records;
    } catch (error) {
      console.error('Error loading mesa electoral data:', error);
      return [];
    }
  }

  /**
   * Load Political Organizations data
   */
  static async loadPoliticalOrganizations(): Promise<PoliticalOrganization[]> {
    try {
      console.log('[CsvDataService] Loading political organizations from:', politicalOrgsCsvFile);
      const response = await fetch(politicalOrgsCsvFile);
      const text = await response.text();
      console.log('[CsvDataService] Political orgs CSV loaded, length:', text.length);
      const lines = text.split('\n').slice(1); // Skip header
      console.log('[CsvDataService] Political orgs lines count:', lines.length);
      const organizations: PoliticalOrganization[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [key, order, name] = line.split(';');
          return {
            key: key?.trim() || '',
            order: order?.trim() ? parseInt(order.trim(), 10) : undefined,
            name: name?.trim() || ''
          };
        });
      console.log('[CsvDataService] Political organizations loaded:', organizations.length);
      return organizations;
    } catch (error) {
      console.error('[CsvDataService] Error loading political organizations data:', error);
      return [];
    }
  }

  /**
   * Load all CSV data at once
   */
  static async loadAllData() {
    const [ubigeo, circunscripcion, jee, mesaElectoral, politicalOrgs] = await Promise.all([
      this.loadUbigeoData(),
      this.loadCircunscripcionData(),
      this.loadJeeData(),
      this.loadMesaElectoralData(),
      this.loadPoliticalOrganizations()
    ]);

    return {
      ubigeoData: ubigeo,
      circunscripcionData: circunscripcion,
      jeeData: jee,
      mesaElectoralData: mesaElectoral,
      politicalOrganizations: politicalOrgs
    };
  }
}
