// ActaRankingPanel - Displays vote ranking by political organization
// Always visible, shows empty state when no votes

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import type { VoteEntry, CategoryColors } from "../../types/acta.types";
import type { PoliticalOrganization } from "../../types/organization.types";

interface ActaRankingPanelProps {
  entries: VoteEntry[];
  organizations: PoliticalOrganization[];
  categoryColors: CategoryColors;
  categoryLabel?: string;
}

interface RankingEntry {
  organization: string;
  votes: number;
  logo?: string;
}

export function ActaRankingPanel({
  entries,
  organizations,
  categoryColors,
  categoryLabel,
}: ActaRankingPanelProps) {
  // Calculate votes per organization
  const votesByOrg = entries.reduce((acc, entry) => {
    const orgName = entry.party;
    acc[orgName] = (acc[orgName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Create ranking with organization details
  const ranking: RankingEntry[] = Object.entries(votesByOrg)
    .map(([orgName, votes]) => {
      const org = organizations.find(
        (o) => o.order ? `${o.order} | ${o.name}` === orgName : o.name === orgName
      );
      return {
        organization: orgName,
        votes,
        logo: org?.logo,
      };
    })
    .sort((a, b) => b.votes - a.votes); // Sort by votes descending

  // Calculate max votes and total for percentage calculations
  const maxVotes = Math.max(...ranking.map(r => r.votes), 1);
  const totalVotes = entries.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle
          className="text-lg font-semibold pb-2"
          style={{ borderBottom: `2px solid ${categoryColors.dark}` }}
        >
          RANKING ACTA - {categoryLabel?.toUpperCase() || 'ORGANIZACIÓN POLÍTICA'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ranking.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Sin votos registrados aún</p>
            <p className="text-xs mt-1">Los resultados aparecerán aquí cuando agregue votos</p>
          </div>
        ) : (
          // Ranking list with progress bars
          ranking.map((entry) => {
            const percentage = totalVotes > 0 ? (entry.votes / totalVotes) * 100 : 0;
            const barWidth = maxVotes > 0 ? (entry.votes / maxVotes) * 100 : 0;

            return (
              <div
                key={entry.organization}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <strong className="text-sm font-semibold">{entry.organization}:</strong>
                    <span className="text-sm font-semibold" style={{ color: categoryColors.dark }}>
                      {entry.votes} votos
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden relative">
                    <div
                      className="h-full transition-all duration-700 ease-out flex items-center justify-end pr-2 text-white text-xs font-semibold"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: categoryColors.dark
                      }}
                    >
                      {entry.votes}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {percentage.toFixed(1)}% del total
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
