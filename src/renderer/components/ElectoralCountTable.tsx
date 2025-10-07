import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent} from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { type ElectoralData, type PoliticalOrganization } from "../data/mockData";
import { getActiveActaData, getSelectedOrganizations, getCircunscripcionOrganizations } from "../lib/localStorage";
import { getCategoryColors } from "../lib/categoryColors";

interface ElectoralCountTableProps {
  data: ElectoralData;
  category: string;
  selectedLocation?: {
    departamento: string;
    provincia: string;
    distrito: string;
    jee: string;
  };
  circunscripcionElectoral?: string;
  totalElectores?: number;
  onBackToEntry: () => void;
  politicalOrganizations: PoliticalOrganization[];
  voteLimits?: {
    preferential1: number;
    preferential2: number;
  };
  // totalCedulasRecibidas?: number;
}

export function ElectoralCountTable({ data, category, circunscripcionElectoral, totalElectores = 0, onBackToEntry, politicalOrganizations, voteLimits}: ElectoralCountTableProps) {
  console.log('[ElectoralCountTable] Rendered with politicalOrganizations:', politicalOrganizations?.length || 0);

  // Get category-specific color theme
  const categoryColors = getCategoryColors(category);

  // Check if category should show preferential columns
  const showPreferentialColumns = ['senadoresNacional', 'senadoresRegional', 'diputados', 'parlamentoAndino'].includes(category);

  // Get the maximum preferential vote number to display based on category
  const maxPreferentialNumber = voteLimits?.preferential1 || 30;

  // Get vote entries for the currently active acta
  const actaData = getActiveActaData(category);
  const voteEntries = actaData.voteEntries || [];

  // Get selected organizations from localStorage (try circunscripción-specific first, fallback to global)
  const selectedOrganizationKeys = circunscripcionElectoral
    ? getCircunscripcionOrganizations(circunscripcionElectoral)
    : getSelectedOrganizations();

  const availableOrganizations = (politicalOrganizations || []).filter(org =>
    selectedOrganizationKeys.includes(org.key)
  );

  console.log('[ElectoralCountTable] Available organizations:', availableOrganizations.length);

  // Calculate vote counts and preferential matrix for all political organizations
  const calculateVoteData = () => {
    const voteCount: { [partyKey: string]: number } = {};
    const matrix: { [partyKey: string]: { [prefNumber: number]: number, total: number } } = {};
    
    // Initialize for selected political organizations
    availableOrganizations.forEach(org => {
      const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
      voteCount[partyKey] = 0;
      matrix[partyKey] = { total: 0 };
      for (let i = 1; i <= maxPreferentialNumber; i++) {
        matrix[partyKey][i] = 0;
      }
    });
    
    // Process vote entries
    voteEntries.forEach(entry => {
      if (entry.party) {
        // Count total votes for this party
        voteCount[entry.party] = (voteCount[entry.party] || 0) + 1;
        
        // Handle preferential votes
        if (matrix[entry.party]) {
          [entry.preferentialVote1, entry.preferentialVote2].forEach(vote => {
            if (vote >= 1 && vote <= maxPreferentialNumber) {
              matrix[entry.party][vote]++;
              matrix[entry.party].total++;
            }
          });
        }
      }
    });
    
    return { voteCount, matrix };
  };
  
  const { voteCount, matrix: preferentialMatrix } = calculateVoteData();
  
  // Calculate statistics from actual vote counts
  const calculateStatistics = () => {
    const blancoVotes = voteCount['BLANCO'] || 0;
    const nuloVotes = voteCount['NULO'] || 0;
    const blankAndNullVotes = blancoVotes + nuloVotes;

    // Total votes emitted excludes BLANCO and NULO
    const totalValidVotes = Object.entries(voteCount)
      .filter(([party]) => party !== 'BLANCO' && party !== 'NULO')
      .reduce((sum, [, count]) => sum + count, 0);

    const totalVotesEmitted = totalValidVotes;
    const totalVotersWhoVoted = totalValidVotes + blankAndNullVotes;

    // Calculate participation and absenteeism percentages using actual totalElectores
    const participationRate = totalElectores > 0
      ? (totalVotersWhoVoted / totalElectores * 100)
      : 0;
    const absenteeismRate = 100 - participationRate;

    return {
      totalVotesEmitted,
      totalVotersWhoVoted,
      blankAndNullVotes,
      participationRate,
      absenteeismRate
    };
  };
  
  const stats = calculateStatistics();

  return (
    <div className="space-y-6">
      {/* Combined Statistics Header */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-3">
            {/* Group 1: Electores y Votantes */}
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-blue-700">Electores Hábiles</span>
              {/* <p className="text-lg font-semibold text-blue-900">{data.totalEligibleVoters}</p> */}
              <p className="text-lg font-semibold text-blue-900">{totalElectores || 0}</p>
            </div>
            {/* <div className="bg-green-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-green-700">Ciudadanos que Votaron</span>
              <p className="text-lg font-semibold text-green-900">{totalCedulasRecibidas || 0}</p>
            </div> */}
            <div className="bg-blue-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-blue-700">TCV</span>
              {/* <p className="text-lg font-semibold text-blue-900">{stats.totalVotesEmitted}</p> */}
              <p className="text-lg font-semibold text-green-900">{stats.totalVotersWhoVoted}</p>
            </div>
            
            {/* Group 2: Tipos de Votos */}
            <div className="bg-green-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-green-700">Votos Válidos</span>
              <p className="text-lg font-semibold text-green-900">{stats.totalVotesEmitted}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-gray-700">Votos Blancos</span>
              <p className="text-lg font-semibold text-gray-900">{voteCount['BLANCO'] || 0}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-gray-700">Votos Nulos</span>
              <p className="text-lg font-semibold text-gray-900">{voteCount['NULO'] || 0}</p>
            </div>
            
            {/* Group 3: Porcentajes */}
            <div className="bg-green-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-green-700">% Participación</span>
              <p className="text-lg font-semibold text-green-900">{stats.participationRate.toFixed(2)}%</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center border border-gray-200">
              <span className="text-xs font-medium text-yellow-700">% Ausentismo</span>
              <p className="text-lg font-semibold text-yellow-900">{stats.absenteeismRate.toFixed(2)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="h-6" style={{backgroundColor: categoryColors.dark}}>
                <TableHead className="w-16 text-center font-semibold text-gray-800 py-1 h-6" rowSpan={2}>CÓDIGO</TableHead>
                <TableHead className="font-semibold text-gray-800 py-1 h-6" rowSpan={2} style={{ width: 'auto', minWidth: '250px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>ORGANIZACIÓN POLÍTICA</TableHead>
                <TableHead className="text-center font-semibold text-gray-800 py-1" rowSpan={2} style={{ width: '80px', minWidth: '80px', maxWidth: '80px', whiteSpace: 'normal', lineHeight: '1.2', fontSize: '0.80rem' }}>TOTAL DE VOTOS</TableHead>
                {showPreferentialColumns && (
                  <>
                    <TableHead className="text-center font-semibold text-gray-800 border-l-2 border-gray-400 py-1 h-6" colSpan={maxPreferentialNumber}>VOTO PREFERENCIAL</TableHead>
                    <TableHead className="w-20 text-center font-semibold text-gray-800 border-l-2 border-gray-400 py-1 h-6" rowSpan={2}>TOTAL VP</TableHead>
                  </>
                )}
              </TableRow>
              {showPreferentialColumns && (
                <TableRow className="h-6" style={{backgroundColor: categoryColors.dark}}>
                  {Array.from({length: maxPreferentialNumber}, (_, i) => (
                    <TableHead key={i + 1} className="w-8 text-center font-semibold text-red-600 bg-gray-300 text-xs px-1 py-0 h-6">{i + 1}</TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {availableOrganizations.map((org, index) => {
                const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
                const totalVotes = voteCount[partyKey] || 0;
                const partyMatrix = showPreferentialColumns ? preferentialMatrix[partyKey] : null;
                const isBlancoOrNulo = org.name === 'BLANCO' || org.name === 'NULO';

                const bgColor = index % 2 === 0 ? '#f9fafb' : categoryColors.light;
                return (
                  <TableRow key={org.key || `${org.order}-${index}`} className="h-6" style={{ backgroundColor: bgColor }}>
                    <TableCell className="text-center font-medium py-1">{org.order || "-"}</TableCell>
                    <TableCell className="py-1" style={{ width: '150px', minWidth: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={org.name}>{org.name}</TableCell>
                    <TableCell className="text-center font-semibold py-1">{totalVotes}</TableCell>
                    {showPreferentialColumns && (
                      <>
                        {isBlancoOrNulo ? (
                          <TableCell
                            colSpan={maxPreferentialNumber + 1}
                            className="text-center text-gray-400 border-l border-gray-200 py-1"
                          >
                            {/* Empty cell for BLANCO and NULO */}
                          </TableCell>
                        ) : (
                          <>
                            {Array.from({length: maxPreferentialNumber}, (_, i) => {
                              const value = partyMatrix ? partyMatrix[i + 1] || 0 : 0;
                              const isNonZero = value > 0;
                              return (
                                <TableCell
                                  key={i + 1}
                                  className={`w-8 text-center text-xs px-1 py-1 border-l border-gray-200 ${
                                    isNonZero
                                      ? 'text-red-600 bg-green-100'
                                      : ''
                                  }`}
                                >
                                  {value}
                                </TableCell>
                              );
                            })}
                            <TableCell className="w-20 text-center font-semibold border-l-2 border-gray-300 py-1">
                              {partyMatrix ? partyMatrix.total || 0 : 0}
                            </TableCell>
                          </>
                        )}
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}