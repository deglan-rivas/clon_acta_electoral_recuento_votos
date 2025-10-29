import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";
import { getCategoryColors } from "../utils/categoryColors";
import { useVoteSummaryData } from "../hooks/useVoteSummaryData";
import { useVoteStatistics } from "../hooks/useVoteStatistics";
import { formatPartyKey } from "../utils/voteCalculations";
import { hasPreferentialVoting, DEFAULT_MAX_PREFERENTIAL } from "../config/electoralConstants";
import { StatCard } from "../components/electoral/StatCard";
import type { ElectoralData, PoliticalOrganization } from "../types";

interface VoteSummaryPageProps {
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
  politicalOrganizations: PoliticalOrganization[];
  voteLimits?: {
    preferential1: number;
    preferential2: number;
  };
}

export function VoteSummaryPage({
  category,
  circunscripcionElectoral,
  totalElectores = 0,
  politicalOrganizations,
  voteLimits,
}: VoteSummaryPageProps) {
  // Load vote summary data from repository
  const { voteEntries, selectedOrganizationKeys, tcv } = useVoteSummaryData({
    category,
    circunscripcionElectoral
  });

  // Get category-specific color theme
  const categoryColors = getCategoryColors(category);

  // Check if category should show preferential columns
  const showPreferentialColumns = hasPreferentialVoting(category);

  // Get the maximum preferential vote number to display based on category
  const maxPreferentialNumber = voteLimits?.preferential1 || DEFAULT_MAX_PREFERENTIAL;

  // Filter available organizations
  const availableOrganizations = (politicalOrganizations || []).filter(org =>
    selectedOrganizationKeys.includes(org.key)
  );

  // Calculate vote statistics using custom hook
  const { voteCount, preferentialMatrix, statistics: stats } = useVoteStatistics({
    voteEntries,
    availableOrganizations,
    maxPreferentialNumber,
    totalElectores
  });

  return (
    <div className="space-y-6">
      {/* Combined Statistics Header */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-3">
            {/* Group 1: Electores y Votantes */}
            <StatCard
              label="Electores Hábiles"
              value={totalElectores || 0}
              colorScheme="blue"
            />
            <StatCard
              label="TCV"
              value={tcv !== null ? tcv : "-"}
              colorScheme="blue"
            />

            {/* Group 2: Tipos de Votos */}
            <StatCard
              label="Votos Válidos"
              value={stats.totalVotesEmitted}
              colorScheme="green"
            />
            <StatCard
              label="Votos Blancos"
              value={voteCount['BLANCO'] || 0}
              colorScheme="gray"
            />
            <StatCard
              label="Votos Nulos"
              value={voteCount['NULO'] || 0}
              colorScheme="gray"
            />

            {/* Group 3: Porcentajes */}
            <StatCard
              label="% Participación"
              value={`${stats.participationRate.toFixed(2)}%`}
              colorScheme="green"
            />
            <StatCard
              label="% Ausentismo"
              value={`${stats.absenteeismRate.toFixed(2)}%`}
              colorScheme="yellow"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="h-6" style={{ backgroundColor: categoryColors.dark }}>
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
                <TableRow className="h-6" style={{ backgroundColor: categoryColors.dark }}>
                  {Array.from({ length: maxPreferentialNumber }, (_, i) => (
                    <TableHead key={i + 1} className="w-8 text-center font-semibold text-red-600 bg-gray-300 text-xs px-1 py-0 h-6">{i + 1}</TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {availableOrganizations.map((org, index) => {
                const partyKey = formatPartyKey(org);
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
                            {Array.from({ length: maxPreferentialNumber }, (_, i) => {
                              const value = partyMatrix ? partyMatrix[i + 1] || 0 : 0;
                              const isNonZero = value > 0;
                              const classError = 'text-red-600';
                              return (
                                <TableCell
                                  key={i + 1}
                                  className={`w-8 text-center text-xs px-1 py-1 border-l border-gray-200 ${isNonZero
                                      ? 'font-semibold'
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
