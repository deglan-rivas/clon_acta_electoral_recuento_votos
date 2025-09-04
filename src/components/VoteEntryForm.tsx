import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Combobox } from "./ui/combobox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, Save } from "lucide-react";
import { type VoteEntry, politicalOrganizations } from "../data/mockData";
import { toast } from "sonner";

interface VoteLimits {
  preferential1: number;
  preferential2: number;
}

interface PreferentialConfig {
  hasPreferential1: boolean;
  hasPreferential2: boolean;
}

interface VoteEntryFormProps {
  category: string;
  existingEntries?: VoteEntry[];
  voteLimits: VoteLimits;
  preferentialConfig: PreferentialConfig;
  onEntriesChange: (entries: VoteEntry[]) => void;
}

export function VoteEntryForm({ category, existingEntries = [], voteLimits, preferentialConfig, onEntriesChange }: VoteEntryFormProps) {
  // Use existingEntries directly from parent (which comes from categoryData)
  const [entries, setEntries] = useState<VoteEntry[]>(existingEntries);

  // Update local entries when existingEntries change (category switch)
  useEffect(() => {
    setEntries(existingEntries);
  }, [existingEntries]);

  // Report entries changes to parent component
  const updateEntries = (newEntries: VoteEntry[]) => {
    setEntries(newEntries);
    onEntriesChange(newEntries);
  };

  // Calculate next table number based on current entries
  const getNextTableNumber = () => {
    if (entries.length === 0) return 1;
    const maxTableNumber = Math.max(...entries.map(entry => entry.tableNumber));
    return maxTableNumber + 1;
  };

  const [newEntry, setNewEntry] = useState<Partial<VoteEntry>>({
    tableNumber: getNextTableNumber(),
    party: "",
    preferentialVote1: 0,
    preferentialVote2: 0,
  });

  // Update table number when entries change
  useEffect(() => {
    setNewEntry(prev => ({
      ...prev,
      tableNumber: getNextTableNumber(),
    }));
  }, [entries]);

  const handleAddEntry = () => {
    if (!newEntry.party) {
      toast.error("Por favor seleccione una organización política");
      return;
    }

    // Validate vote limits only for enabled preferential votes
    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      toast.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`);
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`);
      return;
    }

    const entry: VoteEntry = {
      tableNumber: newEntry.tableNumber!,
      party: newEntry.party!,
      preferentialVote1: pref1,
      preferentialVote2: pref2,
    };

    const updatedEntries = [...entries, entry];
    updateEntries(updatedEntries);
    
    // Calculate next table number for the new entry
    const nextTableNumber = Math.max(...updatedEntries.map(e => e.tableNumber)) + 1;
    
    setNewEntry({
      tableNumber: nextTableNumber,
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    toast.success("Voto registrado exitosamente");
  };

  const handleSaveAll = () => {
    toast.success(`${entries.length} votos guardados para ${category}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide text-red-700">
            INGRESO DE VOTOS - {category.toUpperCase()}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo Registro de Votos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 mb-4 ${
            preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2 
              ? 'md:grid-cols-4' 
              : 'md:grid-cols-3'
          }`}>
            <div>
              <label className="text-sm font-medium mb-2 block">N° Votantes</label>
              <Input
                type="number"
                placeholder="Número automático"
                value={newEntry.tableNumber || ""}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Organización Política</label>
              <Combobox
                value={newEntry.party}
                onValueChange={(value) => setNewEntry({ ...newEntry, party: value })}
                options={politicalOrganizations.map((org) => ({
                  value: `${org.order} | ${org.name}`,
                  label: `${org.order} | ${org.name}`,
                }))}
                placeholder="Seleccionar partido"
                searchPlaceholder="Buscar partido..."
                emptyText="No se encontraron partidos"
              />
            </div>
            {preferentialConfig.hasPreferential1 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Voto Pref. 1 
                  <span className="text-xs text-gray-500 ml-1">(Máx: {voteLimits.preferential1})</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  max={voteLimits.preferential1}
                  placeholder="0"
                  value={newEntry.preferentialVote1 || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value <= voteLimits.preferential1) {
                      setNewEntry({ ...newEntry, preferentialVote1: value });
                    }
                  }}
                />
              </div>
            )}
            {preferentialConfig.hasPreferential2 && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Voto Pref. 2 
                  <span className="text-xs text-gray-500 ml-1">(Máx: {voteLimits.preferential2})</span>
                </label>
                <Input
                  type="number"
                  min={0}
                  max={voteLimits.preferential2}
                  placeholder="0"
                  value={newEntry.preferentialVote2 || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value <= voteLimits.preferential2) {
                      setNewEntry({ ...newEntry, preferentialVote2: value });
                    }
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAddEntry} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar Voto
            </Button>
            {entries.length > 0 && (
              <Button onClick={handleSaveAll} variant="secondary" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar Todo ({entries.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Votos Registrados
              <Badge variant="secondary">{entries.length} registros</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-red-600 text-white">
                  <TableHead className="text-white text-center font-semibold">N° VOTANTES</TableHead>
                  <TableHead className="text-white font-semibold">INGRESAR VOTOS</TableHead>
                  {preferentialConfig.hasPreferential1 && (
                    <TableHead className="text-white w-32 text-center font-semibold">VOTO PREF. 1</TableHead>
                  )}
                  {preferentialConfig.hasPreferential2 && (
                    <TableHead className="text-white w-32 text-center font-semibold">VOTO PREF. 2</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="text-center font-medium">{entry.tableNumber}</TableCell>
                    <TableCell className="py-3">{entry.party}</TableCell>
                    {preferentialConfig.hasPreferential1 && (
                      <TableCell className="text-center font-semibold">{entry.preferentialVote1}</TableCell>
                    )}
                    {preferentialConfig.hasPreferential2 && (
                      <TableCell className="text-center font-semibold">{entry.preferentialVote2}</TableCell>
                    )}
                  </TableRow>
                ))}
                {/* Empty rows for visual consistency */}
                {Array.from({ length: Math.max(0, 10 - entries.length) }).map((_, index) => (
                  <TableRow key={`empty-${index}`} className={(entries.length + index) % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="text-center text-gray-400">{entries.length + index + 1}</TableCell>
                    <TableCell className="text-gray-400 py-3">-</TableCell>
                    {preferentialConfig.hasPreferential1 && (
                      <TableCell className="text-center text-gray-400">-</TableCell>
                    )}
                    {preferentialConfig.hasPreferential2 && (
                      <TableCell className="text-center text-gray-400">-</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}