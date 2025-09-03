import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { politicalOrganizations } from "../data/mockData";

interface PoliticalOrganizationsProps {
  category: string;
}

export function PoliticalOrganizations({ category }: PoliticalOrganizationsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide text-red-700">
            ORGANIZACIONES POLÍTICAS - {category.toUpperCase()}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-600 text-white">
                <TableHead className="text-white w-20 text-center font-semibold">ORDEN</TableHead>
                <TableHead className="text-white font-semibold">ORGANIZACIÓN POLÍTICA</TableHead>
                <TableHead className="text-white w-32 text-center font-semibold">PREFERENCIA 1</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {politicalOrganizations.map((org, index) => (
                <TableRow key={org.order} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="text-center font-medium">{org.order}</TableCell>
                  <TableCell className="py-3">{org.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {org.preference}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Additional empty rows */}
              <TableRow className="bg-white">
                <TableCell className="text-center text-gray-400">BLANCO</TableCell>
                <TableCell className="text-gray-400 py-3">-</TableCell>
                <TableCell className="text-center text-gray-400">-</TableCell>
              </TableRow>
              <TableRow className="bg-gray-50">
                <TableCell className="text-center text-gray-400">NULO</TableCell>
                <TableCell className="text-gray-400 py-3">-</TableCell>
                <TableCell className="text-center text-gray-400">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información Adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-blue-900">{politicalOrganizations.length}</div>
              <div className="text-sm text-blue-700">Organizaciones Registradas</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-green-900">Activo</div>
              <div className="text-sm text-green-700">Estado del Proceso</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-lg font-semibold text-yellow-900">2026</div>
              <div className="text-sm text-yellow-700">Año Electoral</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}