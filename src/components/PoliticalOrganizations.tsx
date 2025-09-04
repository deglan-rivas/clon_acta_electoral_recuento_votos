import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { politicalOrganizations } from "../data/mockData";

interface VoteLimits {
  preferential1: number;
  preferential2: number;
}

interface PreferentialConfig {
  hasPreferential1: boolean;
  hasPreferential2: boolean;
}

interface PoliticalOrganizationsProps {
  category: string;
  voteLimits: VoteLimits;
  onVoteLimitsChange: (limits: VoteLimits) => void;
  preferentialConfig: PreferentialConfig;
}

export function PoliticalOrganizations({ category, voteLimits, onVoteLimitsChange, preferentialConfig }: PoliticalOrganizationsProps) {
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

      {/* Vote Limits Configuration - Only show if category has preferential votes */}
      {(preferentialConfig.hasPreferential1 || preferentialConfig.hasPreferential2) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuración de Límites de Votos Preferenciales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 gap-6 ${preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2 ? 'md:grid-cols-2' : ''}`}>
              {preferentialConfig.hasPreferential1 && (
                <div>
                  <label 
                    htmlFor="pref1-limit" 
                    className="text-sm font-medium mb-2 block text-gray-700 cursor-pointer"
                  >
                    Límite Voto Preferencial 1
                  </label>
                  <Input
                    id="pref1-limit"
                    type="number"
                    min={1}
                    max={199}
                    step={1}
                    value={voteLimits.preferential1}
                    onChange={(e) => onVoteLimitsChange({ 
                      ...voteLimits, 
                      preferential1: parseInt(e.target.value) || 1 
                    })}
                    className="max-w-xs"
                    placeholder="Ingrese límite para Voto Pref. 1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rango válido: 1 - 199
                  </p>
                </div>
              )}
              
              {preferentialConfig.hasPreferential2 && (
                <div>
                  <label 
                    htmlFor="pref2-limit" 
                    className="text-sm font-medium mb-2 block text-gray-700 cursor-pointer"
                  >
                    Límite Voto Preferencial 2
                  </label>
                  <Input
                    id="pref2-limit"
                    type="number"
                    min={1}
                    max={199}
                    step={1}
                    value={voteLimits.preferential2}
                    onChange={(e) => onVoteLimitsChange({ 
                      ...voteLimits, 
                      preferential2: parseInt(e.target.value) || 1 
                    })}
                    className="max-w-xs"
                    placeholder="Ingrese límite para Voto Pref. 2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Rango válido: 1 - 199
                  </p>
                </div>
              )}
            </div>

            {/* Current Limits Display */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Límites Configurados Actualmente</h4>
              <div className={`grid gap-4 ${preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {preferentialConfig.hasPreferential1 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      Voto Pref. 1
                    </Badge>
                    <span className="text-sm font-semibold text-blue-900">{voteLimits.preferential1}</span>
                  </div>
                )}
                {preferentialConfig.hasPreferential2 && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      Voto Pref. 2
                    </Badge>
                    <span className="text-sm font-semibold text-blue-900">{voteLimits.preferential2}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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