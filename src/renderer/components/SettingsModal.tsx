import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { X } from "lucide-react";
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

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  voteLimits: VoteLimits;
  onVoteLimitsChange: (limits: VoteLimits) => void;
  preferentialConfig: PreferentialConfig;
  isFormFinalized: boolean;
  isMesaDataSaved: boolean;
}

export function SettingsModal({ open, onOpenChange, category, voteLimits, onVoteLimitsChange, preferentialConfig, isFormFinalized, isMesaDataSaved }: SettingsModalProps) {
  // State for selected organizations (global across all categories)
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>(() => {
    const saved = getSelectedOrganizations();
    // If no saved selection, default to including BLANCO and NULO
    if (saved.length === 0) {
      const blancoNuloKeys = politicalOrganizations
        .filter(org => org.name === 'BLANCO' || org.name === 'NULO')
        .map(org => org.key);
      return blancoNuloKeys;
    }
    return saved;
  });

  // Filter state
  const [organizationFilter, setOrganizationFilter] = useState("");

  // Filtered organizations based on search
  const filteredOrganizations = politicalOrganizations.filter(org =>
    org.name.toLowerCase().includes(organizationFilter.toLowerCase()) ||
    (org.order && org.order.toString().includes(organizationFilter))
  );

  // Block control logic - same as VoteEntryForm
  const isBloque2Enabled = isMesaDataSaved && !isFormFinalized;

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

  // Handle select all/none (works with filtered results)
  const handleSelectAll = () => {
    const allSelected = filteredOrganizations.every(org => selectedOrganizations.includes(org.key));
    if (allSelected) {
      // Deselect all filtered organizations
      setSelectedOrganizations(prev => prev.filter(key =>
        !filteredOrganizations.some(org => org.key === key)
      ));
    } else {
      // Select all filtered organizations
      const newSelections = filteredOrganizations.map(org => org.key);
      setSelectedOrganizations(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[60vw] !max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Configuración</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="organizations" className="w-full">
          <TabsList className={`grid w-full ${(preferentialConfig.hasPreferential1 || preferentialConfig.hasPreferential2) ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="organizations">Organizaciones Políticas</TabsTrigger>
            {(preferentialConfig.hasPreferential1 || preferentialConfig.hasPreferential2) && (
              <TabsTrigger value="votelimits">Límites de Votos Preferenciales</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="organizations" className="space-y-6">
            <div className="text-sm text-gray-600">
              Seleccione las organizaciones políticas que estarán disponibles en todos los tipos de elección.
            </div>

            {/* Organizations Selection */}
            <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="text-white" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
                    <TableHead className="text-white w-16 text-center font-semibold">
                      <Checkbox
                        checked={filteredOrganizations.length > 0 && filteredOrganizations.every(org => selectedOrganizations.includes(org.key))}
                        onCheckedChange={handleSelectAll}
                        className="border-white data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                      />
                    </TableHead>
                    <TableHead className="text-white w-20 text-center font-semibold">ORDEN</TableHead>
                    <TableHead className="text-white font-semibold">ORGANIZACIÓN POLÍTICA</TableHead>
                  </TableRow>
                  <TableRow className="bg-gray-50">
                    <TableHead className="p-2"></TableHead>
                    <TableHead className="p-2"></TableHead>
                    <TableHead className="p-2">
                      <div className="flex items-center space-x-1">
                        <Input
                          placeholder="Filtrar..."
                          value={organizationFilter}
                          onChange={(e) => setOrganizationFilter(e.target.value)}
                          className="h-8 text-sm border-gray-300 flex-1"
                        />
                        {organizationFilter && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setOrganizationFilter("")}
                            className="h-8 w-8 p-0 hover:bg-gray-200"
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
              <div className="max-h-86 overflow-y-auto">
                <Table>
                  <TableBody>
                    {filteredOrganizations.map((org, index) => (
                      <TableRow key={org.key} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                        <TableCell className="text-center w-16">
                          <Checkbox
                            checked={selectedOrganizations.includes(org.key)}
                            onCheckedChange={() => handleOrganizationToggle(org.key)}
                          />
                        </TableCell>
                        <TableCell className="text-center font-medium w-20">{org.order}</TableCell>
                        <TableCell className="py-3">{org.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {(preferentialConfig.hasPreferential1 || preferentialConfig.hasPreferential2) && (
          <TabsContent value="votelimits" className="space-y-6">
            <Card>
              <CardContent>
                <div className={`grid grid-cols-1 gap-6 ${preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2 ? 'md:grid-cols-2' : ''}`}>
                  {preferentialConfig.hasPreferential1 && (
                    <div>
                      <br/>
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
          </TabsContent>
        )}
      </Tabs>
      </DialogContent>
    </Dialog>
  );
}