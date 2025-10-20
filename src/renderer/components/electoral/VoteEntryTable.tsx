// VoteEntryTable - Main vote entry table with organization selection
// Handles vote entry CRUD operations and validation

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Combobox } from "../ui/combobox";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Plus, Edit, Check, X } from "lucide-react";
import type { VoteEntry, VoteLimits, PreferentialConfig, CategoryColors } from "../../types/acta.types";
import type { PoliticalOrganization } from "../../types/organization.types";
import { ToastService } from "../../services/ui/toastService";
import { VoteAlert } from "../ui/VoteAlert";

interface VoteEntryTableProps {
  entries: VoteEntry[];
  availableOrganizations: PoliticalOrganization[];
  voteLimits: VoteLimits;
  preferentialConfig: PreferentialConfig;
  totalElectores: number;
  cedulasExcedentes: number;
  isFormFinalized: boolean;
  isMesaDataSaved: boolean;
  categoryColors: CategoryColors;
  onEntriesChange: (entries: VoteEntry[]) => void;
  onCedulasExcedentesChange: (value: number) => void;
  onSaveActa?: () => Promise<void>;
}

export function VoteEntryTable({
  entries,
  availableOrganizations,
  voteLimits,
  preferentialConfig,
  totalElectores,
  cedulasExcedentes,
  isFormFinalized,
  isMesaDataSaved,
  categoryColors,
  onEntriesChange,
  onCedulasExcedentesChange,
  onSaveActa,
}: VoteEntryTableProps) {
  // Block control logic
  const isBloque2Enabled = isMesaDataSaved && !isFormFinalized;

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('Voto ingresado correctamente.');

  // Calculate next table number
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

  const [editingTableNumber, setEditingTableNumber] = useState<number | null>(null);
  const [_originalEntry, setOriginalEntry] = useState<VoteEntry | null>(null);

  // Update table number when entries change
  useEffect(() => {
    if (editingTableNumber === null) {
      setNewEntry(prev => ({
        ...prev,
        tableNumber: getNextTableNumber(),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries.length, editingTableNumber]);

  // Check if party is BLANCO or NULO
  const isBlankOrNull = (party: string): boolean => {
    return party === "BLANCO" || party === "NULO";
  };

  const handleAddEntry = async () => {
    // Check if adding this entry would exceed total electores
    if (entries.length >= totalElectores) {
      ToastService.error(`No se pueden agregar más cédulas. Límite alcanzado: ${totalElectores} electores hábiles`, '450px', 4000);
      return;
    }

    if (!newEntry.party) {
      ToastService.error("Por favor seleccione una organización política");
      return;
    }

    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      ToastService.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`);
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      ToastService.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`);
      return;
    }

    if (isBlankOrNull(newEntry.party || "") && (pref1 > 0 || pref2 > 0)) {
      ToastService.error("No se pueden ingresar votos preferenciales con BLANCO o NULO", '450px', 4000);
      return;
    }

    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        ToastService.error("Los votos preferenciales 1 y 2 deben tener valores diferentes", '450px', 4000);
        return;
      }
    }

    const entry: VoteEntry = {
      tableNumber: newEntry.tableNumber!,
      party: newEntry.party!,
      preferentialVote1: isBlankOrNull(newEntry.party || "") ? 0 : pref1,
      preferentialVote2: isBlankOrNull(newEntry.party || "") ? 0 : pref2,
    };

    onEntriesChange([...entries, entry]);
    setNewEntry({
      tableNumber: getNextTableNumber() + 1,
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });

    // Save to repository
    if (onSaveActa) {
      await onSaveActa();
    }

    // Show alert instead of toast
    setAlertMessage('Voto ingresado correctamente.');
    setShowAlert(true);
  };

  const handleEditEntry = (entry: VoteEntry) => {
    setEditingTableNumber(entry.tableNumber);
    setOriginalEntry(entry);
    setNewEntry({
      tableNumber: entry.tableNumber,
      party: entry.party,
      preferentialVote1: entry.preferentialVote1 || 0,
      preferentialVote2: entry.preferentialVote2 || 0,
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

  const handleConfirmEdit = async () => {
    if (!newEntry.party) {
      ToastService.error("Por favor seleccione una organización política");
      return;
    }

    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      ToastService.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`);
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      ToastService.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`);
      return;
    }

    if (isBlankOrNull(newEntry.party || "") && (pref1 > 0 || pref2 > 0)) {
      ToastService.error("No se pueden ingresar votos preferenciales con BLANCO o NULO", '450px', 4000);
      return;
    }

    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        ToastService.error("Los votos preferenciales 1 y 2 deben tener valores diferentes", '450px', 4000);
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
    onEntriesChange(updatedEntries);

    setEditingTableNumber(null);
    setOriginalEntry(null);
    setNewEntry({
      tableNumber: getNextTableNumber(),
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });

    // Save to repository
    if (onSaveActa) {
      await onSaveActa();
    }

    // Show alert instead of toast
    setAlertMessage('Voto actualizado correctamente.');
    setShowAlert(true);
  };

  return (
    <>
      {/* Vote Alert */}
      <VoteAlert
        isOpen={showAlert}
        voteCount={entries.length}
        alertType="with-button"
        position="top"
        message={alertMessage}
        onClose={() => setShowAlert(false)}
      />

      <Card className="w-full col-span-8">
        <CardHeader>
        <CardTitle
          className="text-lg font-semibold pb-2 flex items-center justify-between gap-4"
          style={{ borderBottom: `2px solid ${categoryColors.dark}` }}
        >
          {/* Cédulas Excedentes Input */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Cédulas Excedentes:</label>
            <Input
              type="number"
              min={0}
              value={cedulasExcedentes || ""}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= 0) {
                  onCedulasExcedentesChange(value);
                }
              }}
              disabled={entries.length !== totalElectores || isFormFinalized}
              className={`max-w-20 text-center font-semibold border border-gray-300 ${
                entries.length !== totalElectores || isFormFinalized
                  ? "opacity-50 cursor-not-allowed bg-gray-200"
                  : "bg-white"
              }`}
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-4">
            <span>VOTOS RECONTADOS</span>
            <Badge
              variant="default"
              className="text-xl font-semibold text-gray-800"
              style={{ backgroundColor: categoryColors.dark }}
            >
              {entries.length} cédulas
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 py-0">
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: categoryColors.dark }}>
              <TableHead className="text-gray-800 text-center font-semibold w-28">N° CÉDULA</TableHead>
              <TableHead className="text-gray-800 font-semibold">INGRESAR VOTOS</TableHead>
              {preferentialConfig.hasPreferential1 && (
                <TableHead className="text-gray-800 w-32 text-center font-semibold">VOTO PREF. 1</TableHead>
              )}
              {preferentialConfig.hasPreferential2 && (
                <TableHead className="text-gray-800 w-32 text-center font-semibold">VOTO PREF. 2</TableHead>
              )}
              <TableHead className="text-gray-800 w-32 text-center font-semibold">ACCIÓN</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Form row */}
            <TableRow className="border-2 w-28" style={{ backgroundColor: '#f9fafb', borderColor: categoryColors.dark }}>
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
                    if (isBloque2Enabled) {
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
                    }
                  }}
                  options={availableOrganizations.map((org) => ({
                    value: org.order ? `${org.order} | ${org.name}` : org.name,
                    label: org.order ? `${org.order} | ${org.name}` : org.name,
                  }))}
                  placeholder="Seleccionar partido..."
                  searchPlaceholder="Buscar partido..."
                  emptyText="No se encontraron partidos"
                  disabled={!isBloque2Enabled}
                  className={`h-12 text-base ${!isBloque2Enabled ? "opacity-50 cursor-not-allowed" : ""}`}
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
                      if (isBloque2Enabled) {
                        const value = parseInt(e.target.value) || 0;
                        if (value <= voteLimits.preferential1) {
                          setNewEntry({ ...newEntry, preferentialVote1: value });
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Block: e, E, +, -, . (only allow natural numbers)
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    disabled={isBlankOrNull(newEntry.party || "") || !isBloque2Enabled}
                    className={`h-12 text-center text-lg font-semibold ${
                      isBlankOrNull(newEntry.party || "") || !isBloque2Enabled
                        ? "bg-gray-100 cursor-not-allowed" : ""
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
                      if (isBloque2Enabled) {
                        const value = parseInt(e.target.value) || 0;
                        if (value <= voteLimits.preferential2) {
                          setNewEntry({ ...newEntry, preferentialVote2: value });
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      // Block: e, E, +, -, . (only allow natural numbers)
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    disabled={isBlankOrNull(newEntry.party || "") || !isBloque2Enabled}
                    className={`h-12 text-center text-lg font-semibold ${
                      isBlankOrNull(newEntry.party || "") || !isBloque2Enabled
                        ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </TableCell>
              )}
              <TableCell className="px-2">
                {editingTableNumber ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleConfirmEdit}
                      disabled={!isBloque2Enabled}
                      className={`p-3 rounded-full transition-colors duration-200 ${
                        !isBloque2Enabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-green-600 hover:text-green-800 hover:bg-green-50"
                      }`}
                      title="Confirmar"
                      aria-label="Confirmar"
                    >
                      <Check className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={!isBloque2Enabled}
                      className={`p-3 rounded-full transition-colors duration-200 ${
                        !isBloque2Enabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-800 hover:bg-red-50"
                      }`}
                      title="Cancelar"
                      aria-label="Cancelar"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddEntry}
                    disabled={!newEntry.party || newEntry.party === "" || !isBloque2Enabled}
                    className={`px-4 py-3 font-semibold rounded ${
                      !newEntry.party || newEntry.party === "" || !isBloque2Enabled
                        ? "text-gray-400 bg-gray-300 cursor-not-allowed hover:bg-gray-300"
                        : "text-gray-800 hover:cursor-pointer"
                    }`}
                    style={!newEntry.party || newEntry.party === "" || !isBloque2Enabled ? {} : {
                      backgroundColor: categoryColors.dark,
                    }}
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    AGREGAR
                  </Button>
                )}
              </TableCell>
            </TableRow>

            {/* Display entries in reverse order (newest first) */}
            {[...entries].reverse().map((entry, index) => {
              const isLastEntry = index === 0;
              const bgColor = index % 2 === 0 ? categoryColors.light : '#f9fafb';
              return (
                <TableRow key={entries.length - 1 - index} style={{ backgroundColor: bgColor }}>
                  <TableCell className="text-center font-medium w-28">{entry.tableNumber}</TableCell>
                  <TableCell className="py-3">{entry.party}</TableCell>
                  {preferentialConfig.hasPreferential1 && (
                    <TableCell className="text-center font-semibold">
                      {entry.preferentialVote1 === 0 ? "-" : entry.preferentialVote1}
                    </TableCell>
                  )}
                  {preferentialConfig.hasPreferential2 && (
                    <TableCell className="text-center font-semibold">
                      {entry.preferentialVote2 === 0 ? "-" : entry.preferentialVote2}
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      {isLastEntry && (
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className={`p-2 rounded-full transition-colors duration-200 ${
                            editingTableNumber !== null || !isBloque2Enabled
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          }`}
                          title="Editar"
                          aria-label="Editar"
                          disabled={editingTableNumber !== null || !isBloque2Enabled}
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
    </>
  );
}
