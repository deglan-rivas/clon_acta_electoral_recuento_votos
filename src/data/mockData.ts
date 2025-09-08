// Datos mock para el sistema electoral JNE

export interface PoliticalParty {
  code: string;
  name: string;
  votes?: number;
  preferentialVote1?: number;
  preferentialVote2?: number;
}

export interface VoteEntry {
  cedula: string;
  party: string;
  preferentialVote1: number;
  preferentialVote2: number;
}

export interface ElectoralData {
  department: string;
  province: string;
  district: string;
  totalEligibleVoters: number;
  totalVotersTurnout: number;
  parties: PoliticalParty[];
  voteEntries: VoteEntry[];
  statistics: {
    participationRate: number;
    absenteeismRate: number;
    blankVotes: number;
    nullVotes: number;
  };
}

export const mockElectoralData: Record<string, ElectoralData> = {
  presidencial: {
    department: "LIMA",
    province: "LIMA", 
    district: "JESÚS MARÍA",
    totalEligibleVoters: 300,
    totalVotersTurnout: 280,
    parties: [
      { code: "01", name: "PARTIDO POLÍTICO AMANECER DE NUEVO", votes: 45 },
      { code: "02", name: "PARTIDO POLÍTICO PAZ Y AMOR", votes: 32 },
      { code: "03", name: "PARTIDO POLÍTICO GOTAS DE LLUVIA", votes: 28 },
      { code: "04", name: "PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO", votes: 19 },
      { code: "05", name: "PARTIDO POLÍTICO EN LA DISTANCIA", votes: 25 },
      { code: "06", name: "PARTIDO POLÍTICO AL OTRO LADO", votes: 15 },
      { code: "07", name: "PARTIDO POLÍTICO EL TRABAJO DIGNIFICA", votes: 22 },
      { code: "08", name: "PARTIDO POLÍTICO HOJAS AL VIENTO", votes: 18 },
      { code: "09", name: "PARTIDO POLÍTICO SEMBRANDO LA AMISTAD", votes: 12 },
      { code: "10", name: "PARTIDO POLÍTICO ESTAMOS EN ARMONÍA", votes: 8 },
    ],
    voteEntries: [
      // { tableNumber: 1, party: "02 | PARTIDO POLÍTICO PAZ Y AMOR", preferentialVote1: 7, preferentialVote2: 12 },
      // { tableNumber: 2, party: "05 | PARTIDO POLÍTICO EN LA DISTANCIA", preferentialVote1: 25, preferentialVote2: 1 },
      // { tableNumber: 3, party: "08 | PARTIDO POLÍTICO HOJAS AL VIENTO", preferentialVote1: 11, preferentialVote2: 22 },
      // { tableNumber: 4, party: "04 | PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO", preferentialVote1: 13, preferentialVote2: 19 },
      // { tableNumber: 5, party: "01 | PARTIDO POLÍTICO AMANECER DE NUEVO", preferentialVote1: 5, preferentialVote2: 30 },
    ],
    statistics: {
      participationRate: 93.33,
      absenteeismRate: 6.67,
      blankVotes: 12,
      nullVotes: 8,
    }
  },
  senadoresNacional: {
    department: "LIMA",
    province: "LIMA",
    district: "JESÚS MARÍA", 
    totalEligibleVoters: 300,
    totalVotersTurnout: 275,
    parties: [
      { code: "01", name: "PARTIDO POLÍTICO AMANECER DE NUEVO", votes: 38 },
      { code: "02", name: "PARTIDO POLÍTICO PAZ Y AMOR", votes: 42 },
      { code: "03", name: "PARTIDO POLÍTICO GOTAS DE LLUVIA", votes: 35 },
      { code: "04", name: "PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO", votes: 25 },
      { code: "05", name: "PARTIDO POLÍTICO EN LA DISTANCIA", votes: 30 },
      { code: "06", name: "PARTIDO POLÍTICO AL OTRO LADO", votes: 18 },
      { code: "07", name: "PARTIDO POLÍTICO EL TRABAJO DIGNIFICA", votes: 20 },
      { code: "08", name: "PARTIDO POLÍTICO HOJAS AL VIENTO", votes: 15 },
    ],
    voteEntries: [],
    statistics: {
      participationRate: 91.67,
      absenteeismRate: 8.33,
      blankVotes: 15,
      nullVotes: 10,
    }
  },
  senadoresRegional: {
    department: "LIMA",
    province: "LIMA",
    district: "JESÚS MARÍA",
    totalEligibleVoters: 300,
    totalVotersTurnout: 270,
    parties: [
      { code: "01", name: "PARTIDO POLÍTICO AMANECER DE NUEVO", votes: 40 },
      { code: "02", name: "PARTIDO POLÍTICO PAZ Y AMOR", votes: 35 },
      { code: "03", name: "PARTIDO POLÍTICO GOTAS DE LLUVIA", votes: 30 },
      { code: "04", name: "PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO", votes: 28 },
      { code: "05", name: "PARTIDO POLÍTICO EN LA DISTANCIA", votes: 22 },
    ],
    voteEntries: [],
    statistics: {
      participationRate: 90.0,
      absenteeismRate: 10.0,
      blankVotes: 18,
      nullVotes: 12,
    }
  },
  diputados: {
    department: "LIMA",
    province: "LIMA",
    district: "JESÚS MARÍA",
    totalEligibleVoters: 300,
    totalVotersTurnout: 285,
    parties: [
      { code: "01", name: "PARTIDO POLÍTICO AMANECER DE NUEVO", votes: 50 },
      { code: "02", name: "PARTIDO POLÍTICO PAZ Y AMOR", votes: 45 },
      { code: "03", name: "PARTIDO POLÍTICO GOTAS DE LLUVIA", votes: 38 },
      { code: "04", name: "PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO", votes: 32 },
      { code: "05", name: "PARTIDO POLÍTICO EN LA DISTANCIA", votes: 28 },
      { code: "06", name: "PARTIDO POLÍTICO AL OTRO LADO", votes: 25 },
    ],
    voteEntries: [],
    statistics: {
      participationRate: 95.0,
      absenteeismRate: 5.0,
      blankVotes: 10,
      nullVotes: 5,
    }
  },
  parlamentoAndino: {
    department: "LIMA",
    province: "LIMA",
    district: "JESÚS MARÍA",
    totalEligibleVoters: 300,
    totalVotersTurnout: 260,
    parties: [
      { code: "01", name: "PARTIDO POLÍTICO AMANECER DE NUEVO", votes: 35 },
      { code: "02", name: "PARTIDO POLÍTICO PAZ Y AMOR", votes: 30 },
      { code: "03", name: "PARTIDO POLÍTICO GOTAS DE LLUVIA", votes: 25 },
      { code: "04", name: "PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO", votes: 22 },
    ],
    voteEntries: [],
    statistics: {
      participationRate: 86.67,
      absenteeismRate: 13.33,
      blankVotes: 20,
      nullVotes: 15,
    }
  }
};

export const politicalOrganizations = [
  { key: "01", order: "01", name: "PARTIDO POLÍTICO AMANECER DE NUEVO" },
  { key: "02", order: "02", name: "PARTIDO POLÍTICO PAZ Y AMOR" },
  { key: "03", order: "03", name: "PARTIDO POLÍTICO GOTAS DE LLUVIA" },
  { key: "04", order: "04", name: "PARTIDO POLÍTICO LA MAGIA DEL ENCUENTRO" },
  { key: "05", order: "05", name: "PARTIDO POLÍTICO EN LA DISTANCIA" },
  { key: "06", order: "06", name: "PARTIDO POLÍTICO AL OTRO LADO" },
  { key: "07", order: "07", name: "PARTIDO POLÍTICO EL TRABAJO DIGNIFICA"},
  { key: "08", order: "08", name: "PARTIDO POLÍTICO HOJAS AL VIENTO"},
  { key: "09", order: "09", name: "PARTIDO POLÍTICO SEMBRANDO LA AMISTAD" },
  { key: "10", order: "10", name: "PARTIDO POLÍTICO ESTAMOS EN ARMONÍA" },
  { key: "11", order: "11", name: "PARTIDO POLÍTICO ALCANZAR EL INFINITO" },
  { key: "12", order: "12", name: "PARTIDO POLÍTICO EL MEJOR AMIGO" },
  { key: "13", order: "13", name: "PARTIDO POLÍTICO PIENSA POSITIVAMENTE" },
  { key: "14", order: "14", name: "PARTIDO POLÍTICO LIDERANDO EL FUTURO" },
  { key: "15", order: "15", name: "PARTIDO POLÍTICO NIÑOS PRIMERO" },
  { key: "16", order: "16", name: "PARTIDO POLÍTICO FELICES POR SIEMPRE" },
  { key: "17", order: "17", name: "PARTIDO POLÍTICO SALVEMOS AL PLANETA" },
  { key: "18", order: "18", name: "PARTIDO POLÍTICO LOS CAMPEONES" },
  { key: "19", order: "19", name: "PARTIDO POLÍTICO ORDENANDO LA CASA" },
  { key: "20", order: "20", name: "PARTIDO POLÍTICO COLECCIONISTA DE OBJETOS" },
  { key: "21", order: "21", name: "PARTIDO POLÍTICO OPTIMISMO TOTAL" },
  { key: "22", order: "22", name: "PARTIDO POLÍTICO BUEN VIAJE" },
  { key: "23", order: "23", name: "PARTIDO POLÍTICO VISTA ALEGRE" },
  { key: "24", order: "24", name: "PARTIDO POLÍTICO EL MAPA DE LOS SUEÑOS" },
  { key: "25", order: "25", name: "PARTIDO POLÍTICO EL VUELO DEL ESPÍRITU" },
  { key: "26", order: "26", name: "PARTIDO POLÍTICO EL LENGUAJE DEL SILENCIO" },
  { key: "27", order: "27", name: "PARTIDO POLÍTICO SUEÑOS COMPARTIDOS" },
  { key: "28", order: "28", name: "PARTIDO POLÍTICO EL ABRAZO DE LA PAZ" },
  { key: "29", order: "29", name: "PARTIDO POLÍTICO TODO ESTARÁ BIEN" },
  { key: "30", order: "30", name: "PARTIDO POLÍTICO UN SOLO LATIDO" },
  { key: "31", order: "31", name: "PARTIDO POLÍTICO EL PERDÓN ES DIVINO" },
  { key: "32", order: "32", name: "PARTIDO POLÍTICO BRILLO DEL ALMA" },
  { key: "33", order: "33", name: "PARTIDO POLÍTICO EL HILO INVISIBLE" },
  { key: "34", order: "34", name: "PARTIDO POLÍTICO LA MELODÍA DEL CARIÑO" },
  { key: "35", order: "35", name: "PARTIDO POLÍTICO PENSANDO EN TI" },
  { key: "36", order: "36", name: "PARTIDO POLÍTICO EL ESPEJO DEL ALMA" },
  { key: "37", order: "37", name: "PARTIDO POLÍTICO EL TEJIDO DE LA VIDA" },
  { key: "38", order: "38", name: "PARTIDO POLÍTICO EL AROMA DE LA CONFIANZA" },
  { key: "39", order: "39", name: "PARTIDO POLÍTICO EL SABOR DE LA LEALTAD" },
  { key: "40", order: "", name: "BLANCO" },
  { key: "41", order: "", name: "NULO" }
];