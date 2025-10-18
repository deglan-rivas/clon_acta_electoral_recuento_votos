import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { CsvDataService } from "../services/data/csvDataService";
import type {
  UbigeoRecord,
  CircunscripcionRecord,
  JeeRecord,
  MesaElectoralRecord,
  JeeMiembroRecord
} from "../types/acta.types";
import type { PoliticalOrganization } from "../types";

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
  const [ubigeoData, setUbigeoData] = useState<UbigeoRecord[]>([]);
  const [circunscripcionData, setCircunscripcionData] = useState<CircunscripcionRecord[]>([]);
  const [jeeData, setJeeData] = useState<JeeRecord[]>([]);
  const [mesaElectoralData, setMesaElectoralData] = useState<MesaElectoralRecord[]>([]);
  const [politicalOrganizations, setPoliticalOrganizations] = useState<PoliticalOrganization[]>([]);
  const [jeeMiembrosData, setJeeMiembrosData] = useState<JeeMiembroRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(false);
    };

    loadAllCsvData();
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
