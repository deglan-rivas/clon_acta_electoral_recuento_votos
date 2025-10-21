// Electoral category configuration for Peru 2026 Elections

export interface ElectoralCategory {
  id: string;
  key: string;
  label: string;
}

export const ELECTORAL_CATEGORIES: ElectoralCategory[] = [
  { id: "A", key: "presidencial", label: "Presidencial" },
  { id: "B", key: "senadoresNacional", label: "Senadores D. Único" },
  { id: "C", key: "senadoresRegional", label: "Senadores D. Múltiple" },
  { id: "D", key: "diputados", label: "Diputados" },
  { id: "E", key: "parlamentoAndino", label: "Parlamento Andino" },
];

export const PREFERENTIAL_VOTE_CONFIG: Record<string, { hasPreferential1: boolean; hasPreferential2: boolean }> = {
  presidencial: { hasPreferential1: false, hasPreferential2: false },
  senadoresNacional: { hasPreferential1: true, hasPreferential2: true },
  senadoresRegional: { hasPreferential1: true, hasPreferential2: false },
  diputados: { hasPreferential1: true, hasPreferential2: true },
  parlamentoAndino: { hasPreferential1: true, hasPreferential2: true },
};

export const NATIONAL_CATEGORIES = ['presidencial', 'parlamentoAndino', 'senadoresNacional'];
