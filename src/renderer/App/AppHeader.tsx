import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Settings, User, Building2, Users, Vote, Globe, Filter } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import logoJne from '/logo_jne.svg';
import { ELECTORAL_CATEGORIES } from "../config/electoralCategories";
import { SECTIONS } from "../config/sections";

// Map category keys to their icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  presidencial: User,
  senadoresNacional: Building2,
  senadoresRegional: Users,
  diputados: Vote,
  parlamentoAndino: Globe,
};

// Import category colors utility
import { getCategoryColors } from "../utils/categoryColors";

interface AppHeaderProps {
  activeCategory: string;
  activeSection: string;
  selectedCircunscripcionElectoral: string;
  circunscripcionOptions: string[];
  areLocationFieldsDisabled: boolean;
  showLocationDropdowns: boolean;
  isPartialRecount?: boolean;
  onCategoryChange: (category: string) => void;
  onSectionChange: (section: string) => void;
  onCircunscripcionChange: (value: string) => void;
  onSettingsClick: () => void;
}

export function AppHeader({
  activeCategory,
  activeSection,
  selectedCircunscripcionElectoral,
  circunscripcionOptions,
  areLocationFieldsDisabled,
  showLocationDropdowns,
  isPartialRecount = false,
  onCategoryChange,
  onSectionChange,
  onCircunscripcionChange,
  onSettingsClick,
}: AppHeaderProps) {
  console.log('[AppHeader] Render - isPartialRecount:', isPartialRecount, 'selectedCircunscripcionElectoral:', selectedCircunscripcionElectoral);

  // Get category colors for the badge
  const categoryColors = getCategoryColors(activeCategory);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <img src={logoJne} className="w-14" alt="JNE Logo" />
              <h1 className="text-xl font-semibold text-gray-900">
                Recuento de Votos
              </h1>
            </div>

            {/* Category Selector */}
            <Select value={activeCategory} onValueChange={onCategoryChange}>
              <SelectTrigger
                className="w-52"
                title={ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory)?.label || "Seleccionar tipo de elección"}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ELECTORAL_CATEGORIES.map((category) => {
                  const Icon = CATEGORY_ICONS[category.key];
                  return (
                    <SelectItem key={category.key} value={category.key}>
                      <div className="flex items-center space-x-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Section Navigation */}
            <Select value={activeSection} onValueChange={onSectionChange}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <SelectItem key={section.key} value={section.key}>
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{section.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Circunscripción Electoral Dropdown */}
            {showLocationDropdowns && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Circunscripción Electoral:
                </label>
                <Select
                  value={selectedCircunscripcionElectoral || ""}
                  onValueChange={onCircunscripcionChange}
                  disabled={areLocationFieldsDisabled}
                >
                  <SelectTrigger
                    className={`w-89 ${areLocationFieldsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {circunscripcionOptions.map((circ) => (
                      <SelectItem key={circ} value={circ}>
                        {circ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isPartialRecount && selectedCircunscripcionElectoral && (
                  <Badge
                    variant="secondary"
                    className="px-2 py-1 text-sm font-medium text-gray-700 flex items-center gap-1 border-2"
                    style={{
                      backgroundColor: categoryColors.light,
                      borderColor: categoryColors.dark
                    }}
                    title="Recuento Selectivo: Solo se contarán las organizaciones políticas seleccionadas en Configuración"
                  >
                    <Filter className="h-3 w-3" />
                    Recuento Selectivo
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onSettingsClick}
              className="flex items-center space-x-2"
              title="Configurar"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Badge
              variant="secondary"
              className="text-white font-semibold text-base px-4 py-2 shrink-0 bg-red-800"
            >
              EG2026
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
