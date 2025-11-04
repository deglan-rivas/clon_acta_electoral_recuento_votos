import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { CsvDataService, type CircunscripcionOrganizacionMapping } from "../services/data/csvDataService";
import type {
  UbigeoRecord,
  CircunscripcionRecord,
  JeeRecord,
  MesaElectoralRecord,
  JeeMiembroRecord
} from "../types/acta.types";
import type { PoliticalOrganization } from "../types";
import { useActaRepository } from "../hooks/useActaRepository";

interface AppDataContextType {
  ubigeoData: UbigeoRecord[];
  circunscripcionData: CircunscripcionRecord[];
  jeeData: JeeRecord[];
  mesaElectoralData: MesaElectoralRecord[];
  politicalOrganizations: PoliticalOrganization[];
  jeeMiembrosData: JeeMiembroRecord[];
  isLoading: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const repository = useActaRepository();
  const [ubigeoData, setUbigeoData] = useState<UbigeoRecord[]>([]);
  const [circunscripcionData, setCircunscripcionData] = useState<CircunscripcionRecord[]>([]);
  const [jeeData, setJeeData] = useState<JeeRecord[]>([]);
  const [mesaElectoralData, setMesaElectoralData] = useState<MesaElectoralRecord[]>([]);
  const [politicalOrganizations, setPoliticalOrganizations] = useState<PoliticalOrganization[]>([]);
  const [jeeMiembrosData, setJeeMiembrosData] = useState<JeeMiembroRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Helper function to process and store circunscripcion-organizacion mappings
   * Groups mappings by circunscripcion+category and stores organization keys in localStorage
   */
  const processAndStoreCircunscripcionMappings = async (mappings: CircunscripcionOrganizacionMapping[]) => {
    const categoryIdMap: Record<string, string> = {
      'A': 'presidencial',
      'B': 'senadoresNacional',
      'C': 'senadoresRegional',
      'D': 'diputados',
      'E': 'parlamentoAndino'
    };

    // Group by circunscripcion_electoral and categoria_id
    const groupedMappings: Record<string, string[]> = {};

    mappings.forEach(mapping => {
      const categoryName = categoryIdMap[mapping.categoria_id] || mapping.categoria_id;
      const key = `${mapping.circunscripcion_electoral}|${categoryName}`;

      if (!groupedMappings[key]) {
        groupedMappings[key] = [];
      }
      groupedMappings[key].push(mapping.organizacion_key);
    });

    // Store in localStorage - now storing per circunscripcion AND category
    // This allows filtering organizations by category
    for (const [key, orgKeys] of Object.entries(groupedMappings)) {
      const [circunscripcion, categoryName] = key.split('|');
      await repository.saveCircunscripcionOrganizations(circunscripcion, categoryName, orgKeys);
    }

    console.log('[AppDataProvider] Circunscripcion organizations stored in localStorage (by category):', Object.keys(groupedMappings).length);
  };

  useEffect(() => {
    const loadAllCsvData = async () => {
      setIsLoading(true);
      const data = await CsvDataService.loadAllData();
      setUbigeoData(data.ubigeoData);
      setCircunscripcionData(data.circunscripcionData);
      setJeeData(data.jeeData);
      setMesaElectoralData(data.mesaElectoralData);
      setPoliticalOrganizations(data.politicalOrganizations);
      setJeeMiembrosData(data.jeeMiembrosData);

      // Process and store circunscripcion-organizacion mappings
      if (data.circunscripcionOrgMapping && data.circunscripcionOrgMapping.length > 0) {
        await processAndStoreCircunscripcionMappings(data.circunscripcionOrgMapping);
      }

      setIsLoading(false);
    };

    loadAllCsvData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        ubigeoData,
        circunscripcionData,
        jeeData,
        mesaElectoralData,
        politicalOrganizations,
        jeeMiembrosData,
        isLoading,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
