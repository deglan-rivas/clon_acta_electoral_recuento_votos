import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { politicalOrganizations } from "../data/mockData";
import { getSelectedOrganizations, saveSelectedOrganizations } from "../lib/localStorage";

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
  isFormFinalized: boolean;
  isMesaDataSaved: boolean;
}

export function PoliticalOrganizations({ category, voteLimits, onVoteLimitsChange, preferentialConfig, isFormFinalized, isMesaDataSaved }: PoliticalOrganizationsProps) {
  // Block control logic - same as VoteEntryForm
  const isBloque2Enabled = isMesaDataSaved && !isFormFinalized;

  // State for selected organizations (global across all categories)
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>(() => getSelectedOrganizations());

  // Save to localStorage whenever selection changes
  useEffect(() => {
    saveSelectedOrganizations(selectedOrganizations);
  }, [selectedOrganizations]);

  // Handle individual organization selection
  const handleOrganizationToggle = (orgKey: string) => {
    setSelectedOrganizations(prev => {
      if (prev.includes(orgKey)) {
        return prev.filter(key => key !== orgKey);
      } else {
        return [...prev, orgKey];
      }
    });
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedOrganizations.length === politicalOrganizations.length) {
      setSelectedOrganizations([]);
    } else {
      setSelectedOrganizations(politicalOrganizations.map(org => org.key));
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide text-red-700">
            ORGANIZACIONES POLÍTICAS - {category.toUpperCase()}
          </CardTitle>
        </CardHeader>
      </Card> */}

      {/* Organizations Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Selección de Organizaciones Políticas</CardTitle>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {selectedOrganizations.length} de {politicalOrganizations.length} seleccionadas
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedOrganizations.length === politicalOrganizations.length ? 'Deseleccionar Todas' : 'Seleccionar Todas'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-white" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
                <TableHead className="text-white w-16 text-center font-semibold"></TableHead>
                <TableHead className="text-white w-20 text-center font-semibold">ORDEN</TableHead>
                <TableHead className="text-white font-semibold">ORGANIZACIÓN POLÍTICA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {politicalOrganizations.map((org, index) => (
                <TableRow key={org.key} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedOrganizations.includes(org.key)}
                      onCheckedChange={() => handleOrganizationToggle(org.key)}
                    />
                  </TableCell>
                  <TableCell className="text-center font-medium">{org.order}</TableCell>
                  <TableCell className="py-3">{org.name}</TableCell>
                </TableRow>
              ))}
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
                    onChange={(e) => {
                      if (isBloque2Enabled) {
                        onVoteLimitsChange({ 
                          ...voteLimits, 
                          preferential1: parseInt(e.target.value) || 1 
                        });
                      }
                    }}
                    className={`max-w-xs ${
                      !isBloque2Enabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
                    }`}
                    placeholder="Ingrese límite para Voto Pref. 1"
                    disabled={!isBloque2Enabled}
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
                    onChange={(e) => {
                      if (isBloque2Enabled) {
                        onVoteLimitsChange({ 
                          ...voteLimits, 
                          preferential2: parseInt(e.target.value) || 1 
                        });
                      }
                    }}
                    className={`max-w-xs ${
                      !isBloque2Enabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
                    }`}
                    placeholder="Ingrese límite para Voto Pref. 2"
                    disabled={!isBloque2Enabled}
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