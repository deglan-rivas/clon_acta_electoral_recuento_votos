import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { type ElectoralData } from "../data/mockData";

interface ElectoralCountTableProps {
  data: ElectoralData;
  category: string;
}

export function ElectoralCountTable({ data, category }: ElectoralCountTableProps) {
  const totalVotesEmitted = data.parties.reduce((sum, party) => sum + (party.votes || 0), 0);

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
              <p className="text-xl font-semibold text-green-900">{data.totalVotersTurnout}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Results Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-white" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
                <TableHead className="w-20 text-center font-semibold text-white">CÓDIGO</TableHead>
                <TableHead className="font-semibold text-white">ORGANIZACIÓN POLÍTICA</TableHead>
                <TableHead className="w-32 text-center font-semibold text-white">TOTAL DE VOTOS</TableHead>
                <TableHead className="w-24 text-center font-semibold text-white">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.parties.map((party, index) => {
                const percentage = totalVotesEmitted > 0 ? ((party.votes || 0) / totalVotesEmitted * 100).toFixed(2) : "0.00";
                return (
                  <TableRow key={party.code} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="text-center font-medium">{party.code}</TableCell>
                    <TableCell className="py-3">{party.name}</TableCell>
                    <TableCell className="text-center font-semibold">{party.votes || 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {percentage}%
                      </Badge>
                    </TableCell>
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
              <div className="text-lg font-semibold text-blue-900">{totalVotesEmitted}</div>
              <div className="text-sm text-blue-700">TOTAL DE VOTOS EMITIDOS</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-900">{data.statistics.participationRate}%</div>
              <div className="text-sm text-green-700">% DE PARTICIPACIÓN</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-900">{data.statistics.absenteeismRate}%</div>
              <div className="text-sm text-yellow-700">% AUSENTISMO</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-900">{data.statistics.blankVotes + data.statistics.nullVotes}</div>
              <div className="text-sm text-red-700">VOTOS EN BLANCO + NULOS</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}