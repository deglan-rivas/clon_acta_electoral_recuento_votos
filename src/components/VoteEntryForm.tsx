import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Combobox } from "./ui/combobox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, X, Edit, Check } from "lucide-react";
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
    const maxTableNumber = Math.max(...entries.map(entry => entry.tableNumber || 0));
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

  // Edit state management
  const [editingTableNumber, setEditingTableNumber] = useState<number | null>(null);
  const [originalEntry, setOriginalEntry] = useState<VoteEntry | null>(null);


  const handleAddEntry = () => {
    if (!newEntry.party) {
      toast.error("Por favor seleccione una organización política", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      return;
    }

    // Validate vote limits only for enabled preferential votes
    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      toast.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      return;
    }

    // Validate that preferential votes are not allowed with BLANCO or NULO
    if (isBlankOrNull(newEntry.party || "") && (pref1 > 0 || pref2 > 0)) {
      toast.error("No se pueden ingresar votos preferenciales con BLANCO o NULO", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px'
        },
        duration: 4000
      });
      return;
    }

    // Validate that preferential votes are different when both are enabled
    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        toast.error("Los votos preferenciales 1 y 2 deben tener valores diferentes", {
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
          },
          duration: 4000
        });
        return;
      }
    }

    const entry: VoteEntry = {
      tableNumber: newEntry.tableNumber!,
      party: newEntry.party!,
      preferentialVote1: isBlankOrNull(newEntry.party || "") ? 0 : pref1,
      preferentialVote2: isBlankOrNull(newEntry.party || "") ? 0 : pref2,
    };

    const updatedEntries = [...entries, entry];
    updateEntries(updatedEntries);
    
    // Calculate next table number for the new entry
    const nextTableNumber = Math.max(...updatedEntries.map(e => e.tableNumber || 0)) + 1;
    
    setNewEntry({
      tableNumber: nextTableNumber,
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    toast.success("Voto registrado exitosamente");
  };


  const handleEditEntry = (entry: VoteEntry) => {
    setEditingTableNumber(entry.tableNumber);
    setOriginalEntry({ ...entry });
    setNewEntry({
      tableNumber: entry.tableNumber,
      party: entry.party,
      preferentialVote1: entry.preferentialVote1,
      preferentialVote2: entry.preferentialVote2,
    });
  };

  const handleConfirmEdit = () => {
    if (!newEntry.party) {
      toast.error("Por favor seleccione una organización política", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      return;
    }

    // Validate vote limits only for enabled preferential votes
    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      toast.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      return;
    }

    // Validate that preferential votes are not allowed with BLANCO or NULO
    if (isBlankOrNull(newEntry.party || "") && (pref1 > 0 || pref2 > 0)) {
      toast.error("No se pueden ingresar votos preferenciales con BLANCO o NULO", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px'
        },
        duration: 4000
      });
      return;
    }

    // Validate that preferential votes are different when both are enabled
    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        toast.error("Los votos preferenciales 1 y 2 deben tener valores diferentes", {
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
          },
          duration: 4000
        });
        return;
      }
    }

    const updatedEntry: VoteEntry = {
      tableNumber: newEntry.tableNumber!,
      party: newEntry.party!,
      preferentialVote1: isBlankOrNull(newEntry.party || "") ? 0 : pref1,
      preferentialVote2: isBlankOrNull(newEntry.party || "") ? 0 : pref2,
    };

    const updatedEntries = entries.map(entry => 
      entry.tableNumber === editingTableNumber ? updatedEntry : entry
    );
    updateEntries(updatedEntries);
    
    // Reset edit state and form
    setEditingTableNumber(null);
    setOriginalEntry(null);
    setNewEntry({
      tableNumber: getNextTableNumber(),
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    
    toast.success("Voto actualizado exitosamente");
  };

  const handleCancelEdit = () => {
    setEditingTableNumber(null);
    setOriginalEntry(null);
    setNewEntry({
      tableNumber: getNextTableNumber(),
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
  };

  // Helper function to check if party is BLANCO or NULO
  const isBlankOrNull = (party: string) => {
    return party === "BLANCO" || party === "NULO" || party.includes("BLANCO") || party.includes("NULO");
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
                <TableRow className="text-white" style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}>
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
                <TableRow className="border-2" style={{backgroundColor: "oklch(0.9200 0.0120 15)", borderColor: "oklch(0.5200 0.2100 15)"}}>
                  <TableCell className="px-2">
                    <Input
                      type="number"
                      placeholder="Número automático"
                      value={newEntry.tableNumber || ""}
                      disabled
                      className="h-12 text-center text-lg font-semibold bg-gray-50 cursor-not-allowed"
                    />
                  </TableCell>
                  <TableCell className="px-2">
                    <Combobox
                      value={newEntry.party}
                      onValueChange={(value) => {
                        // Reset preferential votes if BLANCO or NULO is selected
                        if (isBlankOrNull(value)) {
                          setNewEntry({ 
                            ...newEntry, 
                            party: value, 
                            preferentialVote1: 0, 
                            preferentialVote2: 0 
                          });
                        } else {
                          setNewEntry({ ...newEntry, party: value });
                        }
                      }}
                      options={politicalOrganizations.map((org) => ({
                        value: org.order ? `${org.order} | ${org.name}` : org.name,
                        label: org.order ? `${org.order} | ${org.name}` : org.name,
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
                        disabled={isBlankOrNull(newEntry.party || "")}
                        className={`h-12 text-center text-lg font-semibold ${
                          isBlankOrNull(newEntry.party || "") ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
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
                        disabled={isBlankOrNull(newEntry.party || "")}
                        className={`h-12 text-center text-lg font-semibold ${
                          isBlankOrNull(newEntry.party || "") ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      />
                    </TableCell>
                  )}
                  <TableCell className="px-2">
                    {editingTableNumber ? (
                      <div className="flex gap-1">
                        <button
                          onClick={handleConfirmEdit}
                          className="p-3 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors duration-200"
                          title="Confirmar"
                          aria-label="Confirmar"
                        >
                          <Check className="h-6 w-6" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                          title="Cancelar"
                          aria-label="Cancelar"
                        >
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleAddEntry} 
                        className="h-12 px-6 text-base font-semibold text-white hover:opacity-90" 
                        style={{backgroundColor: "oklch(0.5200 0.2100 15)"}}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        AGREGAR
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                
                {[...entries].reverse().map((entry, index) => {
                  const isLastEntry = index === 0; // First item in reversed array is the last added entry
                  return (
                    <TableRow key={entries.length - 1 - index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="text-center font-medium">{entry.tableNumber}</TableCell>
                      <TableCell className="py-3">{entry.party}</TableCell>
                      {preferentialConfig.hasPreferential1 && (
                        <TableCell className="text-center font-semibold">{entry.preferentialVote1}</TableCell>
                      )}
                      {preferentialConfig.hasPreferential2 && (
                        <TableCell className="text-center font-semibold">{entry.preferentialVote2}</TableCell>
                      )}
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {isLastEntry && (
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors duration-200"
                              title="Editar"
                              aria-label="Editar"
                              disabled={editingTableNumber !== null}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
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