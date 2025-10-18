// Type definitions for Acta Electoral

export interface ActaData {
  voteLimits: {
    preferential1: number;
    preferential2: number;
  };
  voteEntries: VoteEntry[];
  activeSection: string;
  mesaNumber: number;
  actaNumber: string;
  totalElectores: number;
  cedulasExcedentes: number;
  tcv: number | null; // Total de Ciudadanos que Votaron (null means use entries.length)
  isFormFinalized: boolean;
  isMesaDataSaved: boolean;
  areMesaFieldsLocked: boolean; // Track if location and TEH fields are locked after auto-fill
  isConformidadDownloaded: boolean; // Track if Conformidad document has been downloaded
  startTime: string | null; // Store as ISO string
  endTime: string | null; // Store as ISO string
  selectedLocation: {
    departamento: string;
    provincia: string;
    distrito: string;
    circunscripcionElectoral: string;
    jee: string;
  };
}

export interface CategoryData {
  actas: ActaData[];
}

export interface VoteEntry {
  tableNumber: number;
  party: string;
  preferentialVote1?: number;
  preferentialVote2?: number;
}

export interface VoteLimits {
  preferential1: number;
  preferential2: number;
}

export interface PreferentialConfig {
  hasPreferential1: boolean;
  hasPreferential2: boolean;
}

export interface LocationData {
  departamento: string;
  provincia: string;
  distrito: string;
  jee: string;
}

export interface CategoryColors {
  light: string;
  dark: string;
}

export interface SelectedLocation {
  departamento: string;
  provincia: string;
  distrito: string;
  circunscripcionElectoral: string;
  jee: string;
}

// CSV Data Types
export interface UbigeoRecord {
  ubigeo_reniec: string;
  ubigeo_inei: string;
  departamento_inei: string;
  departamento: string;
  provincia_inei: string;
  provincia: string;
  distrito: string;
}

export interface CircunscripcionRecord {
  category: string;
  departamento: string;
  provincia: string;
  circunscripcion_electoral: string;
}

export interface JeeRecord {
  id: string;
  jee: string;
  ciudad: string;
}

export interface MesaElectoralRecord {
  mesa_number: string;
  tipo_ubicacion: string;
  circunscripcion_electoral: string;
  departamento: string;
  provincia: string;
  distrito: string;
  teh: string;
}

export interface MesaElectoralInfo {
  mesa_number: string;
  tipo_ubicacion: string;
  circunscripcion_electoral: string;
  departamento: string;
  provincia: string;
  distrito: string;
  teh: string;
}

export interface JeeMiembroRecord {
  jee_id: string;
  JURADOELECTORAL: string;
  TXDOCUMENTOIDENTIDAD: string;
  NOMBRES: string;
  APELLIDOPATERNO: string;
  APELLIDOMATERNO: string;
  CARGO: string;
}

// Default values
export const DEFAULT_ACTA_DATA: ActaData = {
  voteLimits: { preferential1: 30, preferential2: 30 },
  voteEntries: [],
  activeSection: 'ingreso',
  mesaNumber: 0,
  actaNumber: '',
  totalElectores: 0,
  cedulasExcedentes: 0,
  tcv: null,
  isFormFinalized: false,
  isMesaDataSaved: false,
  areMesaFieldsLocked: false,
  isConformidadDownloaded: false,
  startTime: null,
  endTime: null,
  selectedLocation: {
    departamento: '',
    provincia: '',
    distrito: '',
    circunscripcionElectoral: '',
    jee: ''
  }
};
