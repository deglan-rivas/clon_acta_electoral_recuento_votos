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


      {/* Entries Table */}
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
                  <TableHead className="text-white w-32 text-center font-semibold">ACCIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Form row */}
                <TableRow className="bg-yellow-100 border-2 border-yellow-400">
                  <TableCell className="text-center text-lg font-bold text-blue-600">
                    {getNextTableNumber()}
                  </TableCell>
                  <TableCell className="px-2">
                    <Combobox
                      value={newEntry.party}
                      onValueChange={(value) => setNewEntry({ ...newEntry, party: value })}
                      options={politicalOrganizations.map((org) => ({
                        value: `${org.order} | ${org.name}`,
                        label: `${org.order} | ${org.name}`,
                      }))}
                      placeholder="Seleccionar partido..."
                      searchPlaceholder="Buscar partido..."
                      emptyText="No se encontraron partidos"
                      className="h-12 text-base"
                    />
                  </TableCell>
                  {preferentialConfig.hasPreferential1 && (
                    <TableCell className="px-2">
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
                        className="h-12 text-center text-lg font-semibold"
                      />
                    </TableCell>
                  )}
                  {preferentialConfig.hasPreferential2 && (
                    <TableCell className="px-2">
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
                        className="h-12 text-center text-lg font-semibold"
                      />
                    </TableCell>
                  )}
                  <TableCell className="px-2">
                    <Button onClick={handleAddEntry} className="h-12 px-6 text-base font-semibold bg-green-600 hover:bg-green-700">
                      <Plus className="h-5 w-5 mr-2" />
                      AGREGAR
                    </Button>
                  </TableCell>
                </TableRow>
                
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
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-sm">Registrado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}