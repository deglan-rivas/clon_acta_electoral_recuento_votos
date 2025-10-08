// Component for selecting electoral circumscription

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface CircunscripcionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  circunscripciones: string[];
}

export function CircunscripcionSelector({ value, onChange, circunscripciones }: CircunscripcionSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Circunscripción Electoral:
      </label>
      <Select value={value || "NONE"} onValueChange={(val) => onChange(val === "NONE" ? "" : val)}>
        <SelectTrigger className="w-80">
          <SelectValue placeholder="Seleccionar Circunscripción Electoral..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NONE">
            <span className="text-gray-500 italic">-- Ninguna seleccionada --</span>
          </SelectItem>
          {circunscripciones.map((circunscripcion) => (
            <SelectItem key={circunscripcion} value={circunscripcion}>
              {circunscripcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
