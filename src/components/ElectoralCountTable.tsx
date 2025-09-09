import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { type ElectoralData } from "../data/mockData";
import { getCategoryData } from "../lib/localStorage";
import { politicalOrganizations } from "../data/mockData";

interface ElectoralCountTableProps {
  data: ElectoralData;
  category: string;
}

export function ElectoralCountTable({ data, category }: ElectoralCountTableProps) {
  // Check if category should show preferential columns
  const showPreferentialColumns = ['senadoresNacional', 'senadoresRegional', 'diputados', 'parlamentoAndino'].includes(category);

  // Get vote entries for this category
  const categoryData = getCategoryData(category);
  const voteEntries = categoryData.voteEntries || [];

  // Calculate vote counts and preferential matrix for all political organizations
  const calculateVoteData = () => {
    const voteCount: { [partyKey: string]: number } = {};
    const matrix: { [partyKey: string]: { [prefNumber: number]: number, total: number } } = {};
    
    // Initialize for all political organizations
    politicalOrganizations.forEach(org => {
      const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
      voteCount[partyKey] = 0;
      matrix[partyKey] = { total: 0 };
      for (let i = 1; i <= 30; i++) {
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
          // Handle preferentialVote1
          if (entry.preferentialVote1 >= 1 && entry.preferentialVote1 <= 30) {
            matrix[entry.party][entry.preferentialVote1]++;
            matrix[entry.party].total++;
          }
          // Handle preferentialVote2
          if (entry.preferentialVote2 >= 1 && entry.preferentialVote2 <= 30) {
            matrix[entry.party][entry.preferentialVote2]++;
            matrix[entry.party].total++;
          }
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
    
    // Calculate participation and absenteeism percentages
    const participationRate = data.totalEligibleVoters > 0 
      ? (totalVotersWhoVoted / data.totalEligibleVoters * 100)
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
      {/* Header Information */}
      <Card>
        <CardHeader className="pb-4">
          {/* <CardTitle className="text-lg uppercase tracking-wide text-red-700">
            ELECCIONES GENERALES 2026 - {category.toUpperCase()}
          </CardTitle> */}
          <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-600">DEPARTAMENTO:</span>
              <p className="font-medium">{data.department}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">PROVINCIA:</span>
              <p className="font-medium">{data.province}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">DISTRITO:</span>
              <p className="font-medium">{data.district}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-blue-700">Total de Electores Hábiles:</span>
              <p className="text-xl font-semibold text-blue-900">{data.totalEligibleVoters}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <span className="text-sm font-medium text-green-700">Total de Ciudadanos que Votaron:</span>
              <p className="text-xl font-semibold text-green-900">{stats.totalVotersWhoVoted}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-white h-6" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
                <TableHead className="w-16 text-center font-semibold text-white py-1 h-6" rowSpan={2}>CÓDIGO</TableHead>
                <TableHead className="font-semibold text-white py-1 h-6" rowSpan={2}>ORGANIZACIÓN POLÍTICA</TableHead>
                <TableHead className="text-center font-semibold text-white py-1" rowSpan={2} style={{ width: '80px', minWidth: '80px', maxWidth: '80px', whiteSpace: 'normal', lineHeight: '1.2', fontSize: '0.80rem' }}>TOTAL DE VOTOS</TableHead>
                {showPreferentialColumns && (
                  <>
                    <TableHead className="text-center font-semibold text-white border-l-2 border-white py-1 h-6" colSpan={30}>VOTO PREFERENCIAL</TableHead>
                    <TableHead className="w-20 text-center font-semibold text-white border-l-2 border-white py-1 h-6" rowSpan={2}>TOTAL VP</TableHead>
                  </>
                )}
              </TableRow>
              {showPreferentialColumns && (
                <TableRow className="text-white h-6" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
                  {Array.from({length: 30}, (_, i) => (
                    <TableHead key={i + 1} className="w-8 text-center font-semibold text-red-600 bg-gray-300 text-xs px-1 py-0 h-6">{i + 1}</TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {politicalOrganizations.map((org, index) => {
                const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
                const totalVotes = voteCount[partyKey] || 0;
                const partyMatrix = showPreferentialColumns ? preferentialMatrix[partyKey] : null;
                const isBlancoOrNulo = org.name === 'BLANCO' || org.name === 'NULO';
                
                return (
                  <TableRow key={org.key || `${org.order}-${index}`} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} h-6`}>
                    <TableCell className="text-center font-medium py-1">{org.order || "-"}</TableCell>
                    <TableCell className="py-1">{org.name}</TableCell>
                    <TableCell className="text-center font-semibold py-1">{totalVotes}</TableCell>
                    {showPreferentialColumns && (
                      <>
                        {isBlancoOrNulo ? (
                          <TableCell 
                            colSpan={31} 
                            className="text-center text-gray-400 border-l border-gray-200 py-1"
                          >
                            {/* Empty cell for BLANCO and NULO */}
                          </TableCell>
                        ) : (
                          <>
                            {Array.from({length: 30}, (_, i) => {
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

      {/* Statistics */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-900">{stats.totalVotesEmitted}</div>
              <div className="text-sm text-blue-700">TOTAL DE VOTOS EMITIDOS</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-900">{stats.participationRate.toFixed(2)}%</div>
              <div className="text-sm text-green-700">% DE PARTICIPACIÓN</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-900">{stats.absenteeismRate.toFixed(2)}%</div>
              <div className="text-sm text-yellow-700">% AUSENTISMO</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-900">{stats.blankAndNullVotes}</div>
              <div className="text-sm text-red-700">VOTOS EN BLANCO + NULOS</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}