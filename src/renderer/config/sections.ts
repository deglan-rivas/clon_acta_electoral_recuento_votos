// Section navigation configuration
import { FileText, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Section {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const SECTIONS: Section[] = [
  { key: "ingreso", label: "Ingreso de Votos", icon: FileText },
  { key: "recuento", label: "Resumen Recuento", icon: BarChart3 },
];
