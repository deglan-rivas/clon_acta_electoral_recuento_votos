// Electoral category configuration for Peru 2026 Elections
import { Crown, Building2, Users, Vote, Globe } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ElectoralCategory {
  id: string;
  key: string;
  label: string;
  icon: LucideIcon;
}

export const ELECTORAL_CATEGORIES: ElectoralCategory[] = [
  { id: "A", key: "presidencial", label: "Presidencial", icon: Crown },
  { id: "B", key: "senadoresNacional", label: "Senadores D. Único", icon: Building2 },
  { id: "C", key: "senadoresRegional", label: "Senadores D. Múltiple", icon: Users },
  { id: "D", key: "diputados", label: "Diputados", icon: Vote },
  { id: "E", key: "parlamentoAndino", label: "Parlamento Andino", icon: Globe },
];

export const PREFERENTIAL_VOTE_CONFIG: Record<string, { hasPreferential1: boolean; hasPreferential2: boolean }> = {
  presidencial: { hasPreferential1: false, hasPreferential2: false },
  senadoresNacional: { hasPreferential1: true, hasPreferential2: true },
  senadoresRegional: { hasPreferential1: true, hasPreferential2: false },
  diputados: { hasPreferential1: true, hasPreferential2: true },
  parlamentoAndino: { hasPreferential1: true, hasPreferential2: true },
};

export const NATIONAL_CATEGORIES = ['presidencial', 'parlamentoAndino', 'senadoresNacional'];
