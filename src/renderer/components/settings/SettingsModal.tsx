import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "../ui/button";
import { type PoliticalOrganization } from "../../types";
import { useActaRepository } from "../../hooks/useActaRepository";
import { useCircunscripcionData } from "../../hooks/useCircunscripcionData";
import { useOrganizationLoader } from "../../hooks/useOrganizationLoader";
import { useEnforceBlancoNulo } from "../../hooks/useEnforceBlancoNulo";
import { getUniqueCircunscripcionesByCategory } from "../../utils/circunscripcionUtils";
import {
  filterOrganizations,
  isSpecialOrganization,
  getToggleableOrganizations,
  areAllToggleableSelected,
  getBlancoNuloKeys
} from "../../utils/organizationUtils";
import { CircunscripcionSelector } from "./CircunscripcionSelector";
import { OrganizationsTable } from "./OrganizationsTable";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  currentCircunscripcionElectoral?: string;
  politicalOrganizations: PoliticalOrganization[];
}

export function SettingsModal({ open, onOpenChange, category, currentCircunscripcionElectoral, politicalOrganizations }: SettingsModalProps) {
  const repository = useActaRepository();

  // Load circunscripción electoral data from CSV
  const circunscripcionData = useCircunscripcionData(open);
  const [selectedCircunscripcion, setSelectedCircunscripcion] = useState<string>(currentCircunscripcionElectoral || "");

  // Get unique circunscripciones filtered by category
  const uniqueCircunscripciones = getUniqueCircunscripcionesByCategory(circunscripcionData, category);

  // Load organizations with custom hook
  const { selectedOrganizations, setSelectedOrganizations } = useOrganizationLoader(
    open,
    selectedCircunscripcion,
    politicalOrganizations
  );

  // Store original state for cancel functionality
  const [originalSelectedOrganizations, setOriginalSelectedOrganizations] = useState<string[]>([]);

  // Update original when modal opens or selection loads
  useEffect(() => {
    if (open && selectedOrganizations.length > 0) {
      setOriginalSelectedOrganizations(selectedOrganizations);
    }
  }, [open, selectedOrganizations]);

  // Filter state
  const [organizationFilter, setOrganizationFilter] = useState("");

  // Reset circunscripción when modal opens
  useEffect(() => {
    if (open) {
      setSelectedCircunscripcion(currentCircunscripcionElectoral || "");
      setOrganizationFilter("");
    }
  }, [open, currentCircunscripcionElectoral]);

  // Filtered organizations based on search
  const filtered = filterOrganizations(politicalOrganizations || [], organizationFilter);

  // Enforce BLANCO and NULO are always selected
  useEnforceBlancoNulo(selectedOrganizations, setSelectedOrganizations, politicalOrganizations);

  // Handle individual organization selection
  const handleOrganizationToggle = (orgKey: string) => {
    const org = (politicalOrganizations || []).find(o => o.key === orgKey);
    if (org && isSpecialOrganization(org)) {
      return;
    }

    setSelectedOrganizations(prev => {
      if (prev.includes(orgKey)) {
        return prev.filter(key => key !== orgKey);
      } else {
        return [...prev, orgKey];
      }
    });
  };

  // Handle select all/none (works with filtered results)
  const handleSelectAll = () => {
    const blancoNuloKeys = getBlancoNuloKeys(politicalOrganizations || []);
    const toggleableOrgs = getToggleableOrganizations(filtered);
    const allToggleableSelected = toggleableOrgs.every(org => selectedOrganizations.includes(org.key));

    if (allToggleableSelected) {
      // Deselect all filtered organizations except BLANCO and NULO
      setSelectedOrganizations(prev => prev.filter(key =>
        blancoNuloKeys.includes(key) || !toggleableOrgs.some(org => org.key === key)
      ));
    } else {
      // Select all filtered organizations including BLANCO and NULO
      const newSelections = filtered.map(org => org.key);
      setSelectedOrganizations(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  // Save changes to repository and parent
  const handleSave = async () => {
    if (selectedCircunscripcion) {
      await repository.saveCircunscripcionOrganizations(selectedCircunscripcion, selectedOrganizations);
    } else {
      await repository.saveSelectedOrganizations(selectedOrganizations);
    }

    onOpenChange(false);
  };

  // Cancel changes and revert to original state
  const handleCancel = () => {
    setSelectedOrganizations(originalSelectedOrganizations);
    setOrganizationFilter("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[60vw] !max-w-5xl max-h-[80vh] overflow-y-auto">
        <VisuallyHidden.Root>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Configurar organizaciones políticas
          </DialogDescription>
        </VisuallyHidden.Root>

        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            Seleccione una Circunscripción Electoral para configurar sus organizaciones políticas específicas.
          </div>

          <CircunscripcionSelector
            value={selectedCircunscripcion}
            onChange={setSelectedCircunscripcion}
            circunscripciones={uniqueCircunscripciones}
          />

          {!selectedCircunscripcion && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Seleccione una Circunscripción Electoral para configurar sus organizaciones políticas</p>
            </div>
          )}

          {selectedCircunscripcion && (
            <OrganizationsTable
              organizations={filtered}
              selectedKeys={selectedOrganizations}
              allToggleableSelected={areAllToggleableSelected(filtered, selectedOrganizations)}
              searchValue={organizationFilter}
              onToggle={handleOrganizationToggle}
              onSelectAll={handleSelectAll}
              onSearchChange={setOrganizationFilter}
              onClearSearch={() => setOrganizationFilter("")}
            />
          )}
        </div>

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleCancel}
        >
          CANCELAR
        </Button>
        <Button
          onClick={handleSave}
          className="bg-red-800 hover:bg-red-900 text-white"
        >
          GUARDAR
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}