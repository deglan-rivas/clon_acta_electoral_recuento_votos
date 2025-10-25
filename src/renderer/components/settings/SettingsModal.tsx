import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { type PoliticalOrganization } from "../../types";
import { useActaRepository } from "../../hooks/useActaRepository";
import { useCircunscripcionData } from "../../hooks/useCircunscripcionData";
import { useOrganizationLoader } from "../../hooks/useOrganizationLoader";
import { getUniqueCircunscripcionesByCategory } from "../../utils/circunscripcionUtils";
import { PREFERENTIAL_VOTE_CONFIG } from "../../config/electoralCategories";
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

  // Check if category has preferential votes (all except presidencial)
  const hasPreferentialVotes = PREFERENTIAL_VOTE_CONFIG[category]?.hasPreferential1 || PREFERENTIAL_VOTE_CONFIG[category]?.hasPreferential2;

  // Partial recount mode state
  const [isPartialRecountMode, setIsPartialRecountMode] = useState<boolean>(false);

  // Load organizations with custom hook
  const { selectedOrganizations, setSelectedOrganizations } = useOrganizationLoader(
    open,
    selectedCircunscripcion,
    politicalOrganizations
  );

  // Store original state for cancel functionality
  const [originalSelectedOrganizations, setOriginalSelectedOrganizations] = useState<string[]>([]);
  const [originalIsPartialRecount, setOriginalIsPartialRecount] = useState<boolean>(false);

  // Load partial recount mode from repository
  useEffect(() => {
    if (open && selectedCircunscripcion) {
      const loadPartialRecountMode = async () => {
        const isPartial = await repository.getIsPartialRecount(selectedCircunscripcion);
        setIsPartialRecountMode(isPartial);
        setOriginalIsPartialRecount(isPartial);
      };
      loadPartialRecountMode();
    }
  }, [open, selectedCircunscripcion, repository]);

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

  // Handle individual organization selection
  const handleOrganizationToggle = (orgKey: string) => {
    const org = (politicalOrganizations || []).find(o => o.key === orgKey);
    console.log('[OrganizationToggle] Toggling:', orgKey, 'isSpecial:', org && isSpecialOrganization(org));

    // In partial recount mode, prevent toggling BLANCO and NULO
    if (isPartialRecountMode && org && (org.name === 'BLANCO' || org.name === 'NULO')) {
      console.log('[OrganizationToggle] Cannot toggle BLANCO/NULO in partial recount mode');
      return;
    }

    // Full recount mode: organizations are read-only (loaded from CSV)
    // Partial recount mode: allow toggling
    if (!isPartialRecountMode) {
      console.log('[OrganizationToggle] Organizations are read-only in full recount mode');
      return;
    }

    setSelectedOrganizations(prev => {
      const newSelection = prev.includes(orgKey)
        ? prev.filter(key => key !== orgKey)
        : [...prev, orgKey];
      console.log('[OrganizationToggle] Previous:', prev, 'New:', newSelection);
      return newSelection;
    });
  };

  // Handle select all/none (works with filtered results)
  const handleSelectAll = () => {
    // Only allow select all in partial recount mode
    if (!isPartialRecountMode) {
      console.log('[SelectAll] Cannot select all in full recount mode (read-only)');
      return;
    }

    const blancoNuloKeys = getBlancoNuloKeys(politicalOrganizations || []);
    const toggleableOrgs = getToggleableOrganizations(filtered);

    // Filter out BLANCO and NULO from toggleable orgs in partial recount mode
    const selectableOrgs = toggleableOrgs.filter(org => org.name !== 'BLANCO' && org.name !== 'NULO');

    const allSelectableSelected = selectableOrgs.every(org => selectedOrganizations.includes(org.key));

    if (allSelectableSelected) {
      // Deselect all filtered organizations except BLANCO and NULO
      setSelectedOrganizations(prev => prev.filter(key =>
        blancoNuloKeys.includes(key) || !selectableOrgs.some(org => org.key === key)
      ));
    } else {
      // Select all filtered organizations excluding BLANCO and NULO
      const newSelections = selectableOrgs.map(org => org.key);
      setSelectedOrganizations(prev => [...new Set([...prev, ...newSelections])]);
    }
  };

  // Save changes to repository and parent
  const handleSave = async () => {
    if (selectedCircunscripcion) {
      // Save partial recount mode
      await repository.saveIsPartialRecount(selectedCircunscripcion, isPartialRecountMode);

      if (isPartialRecountMode) {
        // Filter out BLANCO and NULO from selected organizations for partial recount
        const filteredOrganizations = selectedOrganizations.filter(orgKey => {
          const org = (politicalOrganizations || []).find(o => o.key === orgKey);
          return org && org.name !== 'BLANCO' && org.name !== 'NULO';
        });

        // Save selected organizations for partial recount in separate key (without BLANCO/NULO)
        await repository.savePartialRecountOrganizations(selectedCircunscripcion, filteredOrganizations);

        console.log('[SettingsModal.handleSave] Partial recount organizations saved:', {
          circunscripcion: selectedCircunscripcion,
          total: filteredOrganizations.length,
          organizations: filteredOrganizations
        });
      }
      // In full recount mode, organizations are already loaded from CSV (read-only)
      // No need to save anything - just use the pre-loaded data
    } else {
      await repository.saveSelectedOrganizations(selectedOrganizations);
    }

    onOpenChange(false);
  };

  // Cancel changes and revert to original state
  const handleCancel = () => {
    setSelectedOrganizations(originalSelectedOrganizations);
    setIsPartialRecountMode(originalIsPartialRecount);
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

          {selectedCircunscripcion && hasPreferentialVotes && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex-1">
                <label htmlFor="partial-recount-mode" className="font-medium text-gray-900 cursor-pointer">
                  Modo Recuento Parcial
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Activa esta opción para realizar un recuento parcial seleccionando organizaciones políticas específicas.
                  {isPartialRecountMode && <span className="block mt-1 text-amber-700 font-medium">⚠️ TCV no será validado en recuento parcial</span>}
                </p>
              </div>
              <Switch
                id="partial-recount-mode"
                checked={isPartialRecountMode}
                onCheckedChange={setIsPartialRecountMode}
                className="ml-4"
              />
            </div>
          )}

          {selectedCircunscripcion && (
            <>
              {!isPartialRecountMode && (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded text-sm text-gray-700">
                  ℹ️ Organizaciones políticas cargadas desde circunscripción electoral (solo lectura)
                </div>
              )}
              {isPartialRecountMode && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded text-sm text-amber-800">
                  ⚠️ Seleccione las organizaciones políticas para el recuento parcial (BLANCO y NULO no permitidos)
                </div>
              )}
              <OrganizationsTable
                organizations={filtered}
                selectedKeys={selectedOrganizations}
                allToggleableSelected={areAllToggleableSelected(filtered, selectedOrganizations)}
                searchValue={organizationFilter}
                isPartialRecountMode={isPartialRecountMode}
                onToggle={handleOrganizationToggle}
                onSelectAll={handleSelectAll}
                onSearchChange={setOrganizationFilter}
                onClearSearch={() => setOrganizationFilter("")}
              />
            </>
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