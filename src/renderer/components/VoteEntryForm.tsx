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
  categoryLabel?: string;
  existingEntries?: VoteEntry[];
  voteLimits: VoteLimits;
  preferentialConfig: PreferentialConfig;
  onEntriesChange: (entries: VoteEntry[]) => void;
  mesaNumber: number;
  actaNumber: number;
  totalElectores: number;
  // totalCedulasRecibidas: number;
  onMesaDataChange: (mesa: number, acta:number, electores: number) => void;
}

export function VoteEntryForm({ category, categoryLabel, existingEntries = [], voteLimits, preferentialConfig, onEntriesChange, mesaNumber, actaNumber, totalElectores, onMesaDataChange }: VoteEntryFormProps) {
  // Use existingEntries directly from parent (which comes from categoryData)
  const [entries, setEntries] = useState<VoteEntry[]>(existingEntries);

  // Local state for form inputs before saving
  const [localMesaNumber, setLocalMesaNumber] = useState<number>(mesaNumber);
  const [localActaNumber, setLocalActaNumber] = useState<number>(actaNumber);
  const [localTotalElectores, setLocalTotalElectores] = useState<number>(totalElectores);
  // const [localTotalCedulasRecibidas, setLocalTotalCedulasRecibidas] = useState<number>(totalCedulasRecibidas);

  // Update local entries when existingEntries change (category switch)
  useEffect(() => {
    setEntries(existingEntries);
  }, [existingEntries]);

  // Update local state when parent values change
  useEffect(() => {
    setLocalMesaNumber(mesaNumber);
    setLocalActaNumber(actaNumber);
    setLocalTotalElectores(totalElectores);
    // setLocalTotalCedulasRecibidas(totalCedulasRecibidas);
  }, [mesaNumber, actaNumber, totalElectores]);

  // Reset form state when category changes
  useEffect(() => {
    setNewEntry({
      tableNumber: getNextTableNumber(),
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    setEditingTableNumber(null);
    setOriginalEntry(null);
  }, [category]);

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
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
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
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
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
          fontSize: '16px',
          width: '400px'
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
            fontSize: '16px',
            width: '400px'
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
    toast.success("Voto registrado exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 2000
    });
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
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
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
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
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
          fontSize: '16px',
          width: '400px'
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
            fontSize: '16px',
            width: '400px'
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
    
    toast.success("Voto actualizado exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 2000
    });
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

  // Handle save mesa data with validations
  const handleSaveMesaData = () => {
    // Validation 1: All values must be greater than 0
    if (localMesaNumber <= 0 || localActaNumber <= 0 || localTotalElectores <= 0) {
      toast.error("Todos los valores deben ser mayores a 0", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    // Validation 2: Cédulas Recibidas must be less than or equal to Total Electores
    // if (localTotalCedulasRecibidas > localTotalElectores) {
    //   toast.error("Las cédulas recibidas no pueden ser mayores que el total de electores", {
    //     style: {
    //       background: '#dc2626',
    //       color: 'white',
    //       fontWeight: 'bold',
    //       fontSize: '16px'
    //     },
    //     duration: 4000
    //   });
    //   return;
    // }

    // If validations pass, update the parent state
    onMesaDataChange(localMesaNumber, localActaNumber, localTotalElectores);
    toast.success("Datos de mesa guardados exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 2000
    });
  };

  // Calculate vote counts for horizontal bars
  const calculateVoteData = () => {
    const voteCount: { [party: string]: number } = {};
    
    // Count votes by party
    entries.forEach(entry => {
      voteCount[entry.party] = (voteCount[entry.party] || 0) + 1;
    });
    
    return voteCount;
  };

  return (
    <div className="space-y-6">
      {/* Mesa Data Entry Section */}
      <Card>
        <CardContent className="p-4 [&:last-child]:pb-4">
          <div className="flex justify-between items-center gap-6">
            {/* Input Fields Container */}
            <div className="flex gap-4 items-center">
              {/* Mesa Number Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">N° Mesa</label>
                <Input
                  type="number"
                  min={1}
                  value={localMesaNumber || ""}
                  onChange={(e) => setLocalMesaNumber(parseInt(e.target.value) || 0)}
                  className="max-w-24 px-0.5 text-center font-semibold"
                  placeholder="0"
                />
              </div>

              {/* Acta Number Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">N° Acta</label>
                <Input
                  type="number"
                  min={1}
                  value={localActaNumber || ""}
                  onChange={(e) => setLocalActaNumber(parseInt(e.target.value) || 0)}
                  className="max-w-28 px-0.5 text-center font-semibold"
                  placeholder="0"
                />
              </div>

              {/* Total Electores Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">Total Electores</label>
                <Input
                  type="number"
                  min={1}
                  value={localTotalElectores || ""}
                  onChange={(e) => setLocalTotalElectores(parseInt(e.target.value) || 0)}
                  className="max-w-20 text-center font-semibold"
                  placeholder="0"
                />
              </div>
              
              {/* Total Cédulas Recibidas Input */}
              {/* <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">Total de Votantes</label>
                <Input
                  type="number"
                  min={1}
                  value={localTotalCedulasRecibidas || ""}
                  onChange={(e) => setLocalTotalCedulasRecibidas(parseInt(e.target.value) || 0)}
                  className="max-w-20 text-center font-semibold"
                  placeholder="0"
                />
              </div> */}

              {/* Save Button */}
              <Button
                onClick={handleSaveMesaData}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded font-medium"
              >
                Guardar
              </Button>
            </div>

            {/* Cédulas Recontadas Badge */}
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-gray-700">Cédulas Recontadas:</span>
              <Badge variant="secondary" className="text-lg font-normal">{entries.length} cédula(s)</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side layout: Progress bars on left (5/12), Table on right (7/12) */}
      <div className="grid grid-cols-12 gap-6 w-full">
        
        {/* Horizontal Progress Bars Summary - Left Side (5/12 width) */}
        <Card className="w-full col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold border-b-2 border-red-800 pb-2">
              RESUMEN ACTA - {categoryLabel?.toUpperCase() || category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const voteCount = calculateVoteData();
              const maxVotes = Math.max(...Object.values(voteCount), 1);
              const totalVotes = entries.length;
              
              const votesWithData = Object.entries(voteCount).filter(([, count]) => count > 0);
              
              if (votesWithData.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Sin votos registrados aún</p>
                    <p className="text-xs mt-1">Los resultados aparecerán aquí cuando agregue votos</p>
                  </div>
                );
              }
              
              return votesWithData
                .sort(([,a], [,b]) => b - a)
                .map(([party, count]) => {
                  const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                  const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
                  
                  return (
                    <div key={party} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-sm font-semibold">{party}:</strong>
                          <span className="text-sm font-semibold text-red-800">{count} votos</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden relative">
                          <div 
                            className="h-full bg-red-800 transition-all duration-700 ease-out flex items-center justify-end pr-2 text-white text-xs font-semibold"
                            style={{ width: `${barWidth}%` }}
                          >
                            {count}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {percentage.toFixed(1)}% del total
                        </div>
                      </div>
                    </div>
                  );
                });
            })()}
            
            {/* <div className="bg-red-800 text-white p-4 rounded-lg text-center font-semibold mt-4">
              Total Procesado: {entries.length}/{totalElectores} cédulas ({totalElectores > 0 ? ((entries.length / totalElectores) * 100).toFixed(1) : '0.0'}%)
            </div> */}
          </CardContent>
        </Card>

        {/* Entries Table - Right Side (7/12 width) */}
        <Card className="w-full col-span-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold border-b-2 border-red-800 pb-2 flex items-center justify-between">
              CÉDULAS RECONTADAS
              <Badge variant="default" className="bg-emerald-700 text-xl font-semibold">{entries.length} cédulas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            <Table>
              <TableHeader>
                <TableRow className="text-white bg-red-800">
                  <TableHead className="text-white text-center font-semibold w-28">N° CÉDULA</TableHead>
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
                <TableRow className="border-2 bg-red-50 border-red-800 w-28">
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
                        // disabled={!newEntry.party || newEntry.party === ""}
                        className={`h-12 px-6 text-base font-semibold ${
                          !newEntry.party || newEntry.party === ""
                            ? "text-gray-400 bg-gray-300 cursor-not-allowed hover:bg-gray-300"
                            : "text-white bg-red-800 hover:bg-red-700 hover:cursor-pointer"
                        }`}
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
                      <TableCell className="text-center font-medium w-28">{entry.tableNumber}</TableCell>
                      <TableCell className="py-3">{entry.party}</TableCell>
                      {preferentialConfig.hasPreferential1 && (
                        <TableCell className="text-center font-semibold">{entry.preferentialVote1 === 0 ? "-" : entry.preferentialVote1}</TableCell>
                      )}
                      {preferentialConfig.hasPreferential2 && (
                        <TableCell className="text-center font-semibold">{entry.preferentialVote2 === 0 ? "-" : entry.preferentialVote2}</TableCell>
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
      </div> {/* End grid container */}
    </div>
  );
}