// Datos mock para el sistema electoral JNE

// ElectoralData is kept in electoralTypes for legacy mock data
import type { ElectoralData } from '../types/electoralTypes';

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

// Political organizations will be loaded from CSV in ElectoralDashboard