import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X } from "lucide-react";
import { politicalOrganizations } from "../data/mockData";
import circunscripcionCsvFile from '/circunscripcion_electoral_por_categoria.csv?url';
import {
  getSelectedOrganizations,
  saveSelectedOrganizations,
  getCircunscripcionOrganizations,
  saveCircunscripcionOrganizations
} from "../lib/localStorage";

// Type for Circunscripción Electoral data
type CircunscripcionRecord = {
  category: string;
  departamento: string;
  provincia: string;
  circunscripcion_electoral: string;
};

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
  currentCircunscripcionElectoral?: string;
}

export function SettingsModal({ open, onOpenChange, category, voteLimits, onVoteLimitsChange, preferentialConfig, isFormFinalized, isMesaDataSaved, currentCircunscripcionElectoral }: SettingsModalProps) {
  // Load circunscripción electoral data from CSV
  const [circunscripcionData, setCircunscripcionData] = useState<CircunscripcionRecord[]>([]);
  const [selectedCircunscripcion, setSelectedCircunscripcion] = useState<string>(currentCircunscripcionElectoral || "");

  // Load circunscripción data on mount
  useEffect(() => {
    const loadCircunscripcionData = async () => {
      try {
        const response = await fetch(circunscripcionCsvFile);
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header
        const records: CircunscripcionRecord[] = lines
          .filter(line => line.trim())
          .map(line => {
            const [category, circunscripcion_electoral] = line.split(';');
            return {
              category: category?.trim() || '',
              departamento: '', // Not used in this CSV
              provincia: '', // Not used in this CSV
              circunscripcion_electoral: circunscripcion_electoral?.trim() || ''
            };
          });
        setCircunscripcionData(records);
      } catch (error) {
        console.error('Error loading circunscripción electoral data:', error);
      }
    };

    if (open) {
      loadCircunscripcionData();
    }
  }, [open]);

  // Get unique circunscripciones filtered by category
  const getUniqueCircunscripciones = () => {
    // First check if current category exists in CSV
    const categoryExists = circunscripcionData.some(record => record.category === category);

    let filteredRecords;
    if (categoryExists) {
      // Category found - show only records for this category
      filteredRecords = circunscripcionData.filter(record => record.category === category);
    } else {
      // Category not found - show all records with empty category (regional)
      filteredRecords = circunscripcionData.filter(record => record.category === '');
    }

    const unique = Array.from(new Set(
      filteredRecords
        .map(record => record.circunscripcion_electoral)
        .filter(circunscripcion => circunscripcion !== '')
    ));
    return unique.sort();
  };

  // Original saved values (loaded once when modal opens)
  const [originalSelectedOrganizations] = useState<string[]>(() => {
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

  const [originalVoteLimits] = useState<VoteLimits>({ ...voteLimits });

  // Temporary state for current edits (not persisted until save)
  const [tempSelectedOrganizations, setTempSelectedOrganizations] = useState<string[]>(() => {
    // Load organizations for the selected circunscripción
    if (selectedCircunscripcion) {
      return getCircunscripcionOrganizations(selectedCircunscripcion);
    }
    return originalSelectedOrganizations;
  });
  const [tempVoteLimits, setTempVoteLimits] = useState<VoteLimits>(originalVoteLimits);

  // Filter state
  const [organizationFilter, setOrganizationFilter] = useState("");

  // Update selected circunscripción when current one changes
  useEffect(() => {
    if (currentCircunscripcionElectoral && currentCircunscripcionElectoral !== selectedCircunscripcion) {
      setSelectedCircunscripcion(currentCircunscripcionElectoral);
    }
  }, [currentCircunscripcionElectoral]);

  // Update organizations when circunscripción changes
  useEffect(() => {
    if (selectedCircunscripcion) {
      const circunscripcionOrgs = getCircunscripcionOrganizations(selectedCircunscripcion);
      if (circunscripcionOrgs.length === 0) {
        // If no organizations saved for this circunscripción, default to BLANCO and NULO
        const blancoNuloKeys = politicalOrganizations
          .filter(org => org.name === 'BLANCO' || org.name === 'NULO')
          .map(org => org.key);
        setTempSelectedOrganizations(blancoNuloKeys);
      } else {
        setTempSelectedOrganizations(circunscripcionOrgs);
      }
    }
  }, [selectedCircunscripcion]);

  // Filtered organizations based on search
  const filteredOrganizations = politicalOrganizations.filter(org =>
    org.name.toLowerCase().includes(organizationFilter.toLowerCase()) ||
    (org.order && org.order.toString().includes(organizationFilter))
  );

  // Block control logic - same as VoteEntryForm
  const isBloque2Enabled = isMesaDataSaved && !isFormFinalized;

  // Ensure BLANCO and NULO are always selected in temp state
  useEffect(() => {
    const blancoNuloKeys = politicalOrganizations
      .filter(org => org.name === 'BLANCO' || org.name === 'NULO')
      .map(org => org.key);

    const missingBlancoNulo = blancoNuloKeys.filter(key => !tempSelectedOrganizations.includes(key));

    if (missingBlancoNulo.length > 0) {
      setTempSelectedOrganizations(prev => [...new Set([...prev, ...missingBlancoNulo])]);
    }
  }, [tempSelectedOrganizations]);

  // Handle individual organization selection (temp state)
  const handleOrganizationToggle = (orgKey: string) => {
    // Find the organization to check if it's BLANCO or NULO
    const org = politicalOrganizations.find(o => o.key === orgKey);
    if (org && (org.name === 'BLANCO' || org.name === 'NULO')) {
      // Don't allow toggling BLANCO or NULO
      return;
    }

    setTempSelectedOrganizations(prev => {
      if (prev.includes(orgKey)) {
        return prev.filter(key => key !== orgKey);
      } else {
        return [...prev, orgKey];
      }
    });
  };

  // Handle select all/none (works with filtered results, temp state)
  const handleSelectAll = () => {
    // Get BLANCO and NULO keys to always keep them selected
    const blancoNuloKeys = politicalOrganizations
      .filter(org => org.name === 'BLANCO' || org.name === 'NULO')
      .map(org => org.key);

    // Filter out BLANCO and NULO from toggle operations
    const toggleableOrgs = filteredOrganizations.filter(org =>
      org.name !== 'BLANCO' && org.name !== 'NULO'
    );

    const allToggleableSelected = toggleableOrgs.every(org => tempSelectedOrganizations.includes(org.key));

    if (allToggleableSelected) {
      // Deselect all filtered organizations except BLANCO and NULO
      setTempSelectedOrganizations(prev => prev.filter(key =>
        blancoNuloKeys.includes(key) || !toggleableOrgs.some(org => org.key === key)
      ));
    } else {
      // Select all filtered organizations including BLANCO and NULO
      const newSelections = filteredOrganizations.map(org => org.key);
      setTempSelectedOrganizations(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  // Handle vote limits change (temp state)
  const handleVoteLimitsChange = (limits: VoteLimits) => {
    setTempVoteLimits(limits);
  };

  // Save changes to localStorage and parent
  const handleSave = () => {
    if (selectedCircunscripcion) {
      // Save per-circunscripción organizations
      saveCircunscripcionOrganizations(selectedCircunscripcion, tempSelectedOrganizations);
    } else {
      // Fallback to global save if no circunscripción selected
      saveSelectedOrganizations(tempSelectedOrganizations);
    }
    onVoteLimitsChange(tempVoteLimits);
    onOpenChange(false);
  };

  // Cancel changes and revert to original state
  const handleCancel = () => {
    setTempSelectedOrganizations(originalSelectedOrganizations);
    setTempVoteLimits(originalVoteLimits);
    setOrganizationFilter("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[60vw] !max-w-5xl max-h-[80vh] overflow-y-auto">
        {/* <DialogHeader>
          <DialogTitle className="text-xl">Configuración</DialogTitle>
        </DialogHeader> */}

        <Tabs defaultValue="organizations" className="w-full">
          <TabsList className={`grid w-full ${(preferentialConfig.hasPreferential1 || preferentialConfig.hasPreferential2) ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="organizations">Organizaciones Políticas</TabsTrigger>
            {(preferentialConfig.hasPreferential1 || preferentialConfig.hasPreferential2) && (
              <TabsTrigger value="votelimits">Límites de Votos Preferenciales</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="organizations" className="space-y-3">
            <div className="text-sm text-gray-600">
              Seleccione una Circunscripción Electoral para configurar sus organizaciones políticas específicas.
            </div>

            {/* Circunscripción Electoral Dropdown */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Circunscripción Electoral:
              </label>
              <Select value={selectedCircunscripcion} onValueChange={setSelectedCircunscripcion}>
                <SelectTrigger className="w-80">
                  <SelectValue placeholder="Seleccionar Circunscripción Electoral..." />
                </SelectTrigger>
                <SelectContent>
                  {getUniqueCircunscripciones().map((circunscripcion) => (
                    <SelectItem key={circunscripcion} value={circunscripcion}>
                      {circunscripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedCircunscripcion && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Seleccione una Circunscripción Electoral para configurar sus organizaciones políticas</p>
              </div>
            )}

            {selectedCircunscripcion && (
              <div className="space-y-3">

            {/* Organizations Selection */}
            
              <Table>
                <TableHeader>
                  <TableRow className="text-white" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
                    <TableHead className="text-white w-16 text-center font-semibold">
                      <Checkbox
                        checked={
                          filteredOrganizations.length > 0 &&
                          filteredOrganizations
                            .filter(org => org.name !== 'BLANCO' && org.name !== 'NULO')
                            .every(org => tempSelectedOrganizations.includes(org.key))
                        }
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
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableBody>
                    {filteredOrganizations.map((org, index) => (
                      <TableRow key={org.key} className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}>
                        <TableCell className="text-center w-16">
                          {org.name === 'BLANCO' || org.name === 'NULO' ? (
                            <Checkbox
                              checked={true}
                              disabled={true}
                              className="opacity-50"
                            />
                          ) : (
                            <Checkbox
                              checked={tempSelectedOrganizations.includes(org.key)}
                              onCheckedChange={() => handleOrganizationToggle(org.key)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-center font-medium w-20">{org.order}</TableCell>
                        <TableCell className="py-3">{org.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
            )}
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
                        value={tempVoteLimits.preferential1}
                        onChange={(e) => {
                          if (isBloque2Enabled) {
                            handleVoteLimitsChange({
                              ...tempVoteLimits,
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
                        value={tempVoteLimits.preferential2}
                        onChange={(e) => {
                          if (isBloque2Enabled) {
                            handleVoteLimitsChange({
                              ...tempVoteLimits,
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
                        <span className="text-sm font-semibold text-blue-900">{tempVoteLimits.preferential1}</span>
                      </div>
                    )}
                    {preferentialConfig.hasPreferential2 && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          Voto Pref. 2
                        </Badge>
                        <span className="text-sm font-semibold text-blue-900">{tempVoteLimits.preferential2}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          CANCELAR
        </Button>
        <Button
          onClick={handleSave}
          className="bg-red-800 hover:bg-red-900 text-white"
        >
          GUARDAR
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}