import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, Save } from "lucide-react";
import { type VoteEntry, politicalOrganizations } from "../data/mockData";
import { toast } from "sonner";

interface VoteEntryFormProps {
  category: string;
  existingEntries?: VoteEntry[];
}

export function VoteEntryForm({ category, existingEntries = [] }: VoteEntryFormProps) {
  const [entries, setEntries] = useState<VoteEntry[]>(existingEntries);
  const [newEntry, setNewEntry] = useState<Partial<VoteEntry>>({
    tableNumber: undefined,
    party: "",
    preferentialVote1: 0,
    preferentialVote2: 0,
  });

  const handleAddEntry = () => {
    if (!newEntry.tableNumber || !newEntry.party) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    const entry: VoteEntry = {
      tableNumber: newEntry.tableNumber!,
      party: newEntry.party!,
      preferentialVote1: newEntry.preferentialVote1 || 0,
      preferentialVote2: newEntry.preferentialVote2 || 0,
    };

    setEntries([...entries, entry]);
    setNewEntry({
      tableNumber: undefined,
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">N° Mesa</label>
              <Input
                type="number"
                placeholder="Número de mesa"
                value={newEntry.tableNumber || ""}
                onChange={(e) => setNewEntry({ ...newEntry, tableNumber: parseInt(e.target.value) || undefined })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Organización Política</label>
              <Select
                value={newEntry.party}
                onValueChange={(value) => setNewEntry({ ...newEntry, party: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar partido" />
                </SelectTrigger>
                <SelectContent>
                  {politicalOrganizations.map((org) => (
                    <SelectItem key={org.order} value={`${org.order} | ${org.name}`}>
                      {org.order} | {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Voto Pref. 1</label>
              <Input
                type="number"
                placeholder="0"
                value={newEntry.preferentialVote1 || ""}
                onChange={(e) => setNewEntry({ ...newEntry, preferentialVote1: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Voto Pref. 2</label>
              <Input
                type="number"
                placeholder="0"
                value={newEntry.preferentialVote2 || ""}
                onChange={(e) => setNewEntry({ ...newEntry, preferentialVote2: parseInt(e.target.value) || 0 })}
              />
            </div>
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
                  <TableHead className="text-white w-32 text-center font-semibold">VOTO PREF. 1</TableHead>
                  <TableHead className="text-white w-32 text-center font-semibold">VOTO PREF. 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="text-center font-medium">{entry.tableNumber}</TableCell>
                    <TableCell className="py-3">{entry.party}</TableCell>
                    <TableCell className="text-center font-semibold">{entry.preferentialVote1}</TableCell>
                    <TableCell className="text-center font-semibold">{entry.preferentialVote2}</TableCell>
                  </TableRow>
                ))}
                {/* Empty rows for visual consistency */}
                {Array.from({ length: Math.max(0, 10 - entries.length) }).map((_, index) => (
                  <TableRow key={`empty-${index}`} className={(entries.length + index) % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell className="text-center text-gray-400">{entries.length + index + 1}</TableCell>
                    <TableCell className="text-gray-400 py-3">-</TableCell>
                    <TableCell className="text-center text-gray-400">-</TableCell>
                    <TableCell className="text-center text-gray-400">-</TableCell>
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