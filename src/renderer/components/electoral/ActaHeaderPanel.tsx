// ActaHeaderPanel - Mesa info, location, and action buttons
// Handles mesa number, acta number, location inputs, and session controls

import { useState, useRef, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { ChevronDown, RefreshCw, FileCheck, Download, Loader2, RotateCcw, Pause, Play } from "lucide-react";
import type { CategoryColors, JeeRecord, JeeMiembroRecord } from "../../types/acta.types";
import { ToastService } from "../../services/ui/toastService";
import { ELECTORAL_CATEGORIES } from "../../config/electoralCategories";
import { ConformidadDocumentService } from "../../services/documents/conformidadDocumentService";

interface ActaHeaderPanelProps {
  // Mesa data
  mesaNumber: number;
  actaNumber: string;
  totalElectores: number;
  tcv: number | null;
  entriesLength: number;
  isPartialRecount?: boolean;

  // Location
  selectedLocation: {
    departamento: string;
    provincia: string;
    distrito: string;
    jee: string;
  };
  isInternationalLocation: boolean;
  areMesaFieldsLocked: boolean;

  // State flags
  isMesaDataSaved: boolean;
  isFormFinalized: boolean;
  isPaused?: boolean;
  isConformidadDownloaded: boolean;

  // Acta navigation
  categoryActas?: any[];
  currentActaIndex?: number;

  // Category info
  activeCategory: string; // For generating acta number with category ID
  categoryColors: CategoryColors;

  // Location options
  jeeOptions: JeeRecord[];
  jeeMiembrosData: JeeMiembroRecord[];
  getDepartamentos: () => string[];
  getProvincias: (departamento: string) => string[];
  getDistritos: (departamento: string, provincia: string) => string[];

  // Callbacks
  onLoadMesaInfo: (mesa: number) => void; // Load mesa data from CSV (no save)
  onMesaDataChange: (mesa: number, acta: string, electores: number) => void; // Save to localStorage
  onJeeChange: (jee: string) => void;
  onDepartamentoChange: (value: string) => void;
  onProvinciaChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
  onSaveMesaData: () => void;
  onFinalizeForm: () => void;
  onPauseCounting?: () => void;
  onResumeCounting?: () => void;
  onReinicializar?: () => void;
  onVerActa: () => void;
  onCreateNewActa?: () => void;
  onSwitchToActa?: (index: number) => void;
  isMesaAlreadyFinalized?: (mesaNumber: number) => boolean;
  onConformidadDownloaded?: () => void;
}

export function ActaHeaderPanel({
  mesaNumber,
  actaNumber,
  totalElectores,
  tcv,
  entriesLength,
  isPartialRecount = false,
  selectedLocation,
  isInternationalLocation,
  areMesaFieldsLocked,
  isMesaDataSaved,
  isFormFinalized,
  isPaused = false,
  isConformidadDownloaded,
  categoryActas = [],
  currentActaIndex = 0,
  activeCategory,
  categoryColors,
  jeeOptions,
  jeeMiembrosData,
  getDepartamentos,
  getProvincias,
  getDistritos,
  onLoadMesaInfo,
  onMesaDataChange,
  onJeeChange,
  onDepartamentoChange,
  onProvinciaChange,
  onDistritoChange,
  onSaveMesaData,
  onFinalizeForm,
  onPauseCounting,
  onResumeCounting,
  onReinicializar,
  onVerActa,
  onCreateNewActa,
  onSwitchToActa,
  isMesaAlreadyFinalized,
  onConformidadDownloaded,
}: ActaHeaderPanelProps) {
  // Local state for inputs before saving
  const [localMesaNumber, setLocalMesaNumber] = useState<string>('');
  const [localActaNumber, setLocalActaNumber] = useState<string>('');
  const [localTotalElectores, setLocalTotalElectores] = useState<number>(totalElectores);

  // Acta dropdown state
  const [showActaDropdown, setShowActaDropdown] = useState<boolean>(false);
  const actaDropdownRef = useRef<HTMLDivElement>(null);
  const actaInputRef = useRef<HTMLInputElement>(null);

  // Loading state for Conformidad generation
  const [isGeneratingConformidad, setIsGeneratingConformidad] = useState<boolean>(false);

  // Acta number input handlers - COMMENTED OUT: Acta number is now auto-generated
  // const actaInputHandlers = useActaNumberInput({
  //   localActaNumber,
  //   setLocalActaNumber,
  //   setLocalMesaNumber
  // });

  // Refs to track previous values without causing re-renders
  const prevMesaNumberRef = useRef<string>('');
  const prevJeeRef = useRef<string>('');

  // Block control logic
  const isBloque1Enabled = !isMesaDataSaved && !isFormFinalized;

  // Iniciar button should require Conformidad to be downloaded first
  const canIniciar = isBloque1Enabled && isConformidadDownloaded;

  // Update local state when parent values change
  useEffect(() => {
    const prevMesaNumber = prevMesaNumberRef.current;
    const prevJee = prevJeeRef.current;
    const newMesaNumber = mesaNumber > 0 ? mesaNumber.toString().padStart(6, '0') : '';
    const currentJee = selectedLocation.jee;

    setLocalMesaNumber(newMesaNumber);
    setLocalTotalElectores(totalElectores);

    // Check if actaNumber already exists and is valid (has proper format)
    const actaRegex = /^\d{6}-\d{2}-[A-E]$/;
    const hasValidActaNumber = actaNumber && actaRegex.test(actaNumber);

    // Auto-generate acta number when:
    // 1. Mesa number is valid (6 digits)
    // 2. JEE is selected
    // 3. JEE options are loaded (to ensure we can find the JEE ID)
    // 4. Either (mesa changed OR JEE changed)
    // 5. OR when both localActaNumber and actaNumber are empty (initial entry)
    const mesaChanged = newMesaNumber !== prevMesaNumber && prevMesaNumber !== '';
    const jeeChanged = currentJee !== prevJee && prevJee !== '';
    const isInitialEntry = !localActaNumber && !actaNumber;

    const shouldGenerateActa = newMesaNumber.length === 6 &&
                              currentJee &&
                              jeeOptions.length > 0 &&
                              (mesaChanged || jeeChanged || isInitialEntry);

    if (shouldGenerateActa) {
      // Find the JEE ID from the selected JEE name
      const selectedJeeRecord = jeeOptions.find(jee => jee.jee === selectedLocation.jee);
      const jeeId = selectedJeeRecord?.id || '';

      // Find the category ID
      const categoryRecord = ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory);
      const categoryId = categoryRecord?.id || '';

      // Only generate acta number if ALL components are available
      if (newMesaNumber && jeeId && categoryId) {
        // Generate acta number: mesaNumber-jeeId-categoryId
        const newActaNumber = `${newMesaNumber}-${jeeId}-${categoryId}`;
        setLocalActaNumber(newActaNumber);

        // Save the auto-generated acta number to localStorage immediately
        const mesaNum = parseInt(newMesaNumber);
        if (mesaNum > 0) {
          onMesaDataChange(mesaNum, newActaNumber, totalElectores);
        }
      } else {
        // If any component is missing, keep acta number empty
        setLocalActaNumber('');
      }
    } else if (!shouldGenerateActa && hasValidActaNumber) {
      // Sync from parent if not auto-generating but has valid acta (loading from storage)
      setLocalActaNumber(actaNumber);
    }

    // Update refs for next comparison
    prevMesaNumberRef.current = newMesaNumber;
    prevJeeRef.current = currentJee;
  }, [mesaNumber, actaNumber, totalElectores, jeeOptions, selectedLocation.jee, activeCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actaDropdownRef.current && !actaDropdownRef.current.contains(event.target as Node)) {
        setShowActaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveMesaData = async () => {
    const mesaNum = parseInt(localMesaNumber);

    console.log('[ActaHeaderPanel.handleSaveMesaData] Starting save with:', {
      mesaNum,
      localMesaNumber,
      localActaNumber,
      localTotalElectores
    });

    if (!localMesaNumber || localMesaNumber.length !== 6) {
      ToastService.error("El número de mesa debe tener 6 dígitos");
      return;
    }

    if (!localActaNumber) {
      ToastService.error("El número de acta es requerido");
      return;
    }

    // Validate acta format
    const actaRegex = /^\d{6}-\d{2}-[A-Z]$/;
    if (!actaRegex.test(localActaNumber)) {
      ToastService.error("N° Acta debe tener formato 000000-00-A");
      return;
    }

    if (!selectedLocation.departamento || !selectedLocation.provincia || !selectedLocation.distrito) {
      ToastService.error("Debe seleccionar la ubicación completa (Departamento, Provincia, Distrito)");
      return;
    }

    if (!selectedLocation.jee) {
      ToastService.error("Debe seleccionar el JEE");
      return;
    }

    if (localTotalElectores <= 0) {
      ToastService.error("El Total de Electores Hábiles debe ser mayor a 0");
      return;
    }

    // Check if mesa is already finalized for this category
    // A mesa can only be registered once per category (whether partial or full recount)
    if (isMesaAlreadyFinalized && isMesaAlreadyFinalized(mesaNum)) {
      ToastService.error(`La mesa ${localMesaNumber} ya ha sido finalizada para este tipo de elección`, '450px', 4000);
      return;
    }

    // Update mesa data with current local values before saving
    console.log('[ActaHeaderPanel.handleSaveMesaData] Calling onMesaDataChange with:', {
      mesaNum,
      localActaNumber,
      localTotalElectores
    });
    onMesaDataChange(mesaNum, localActaNumber, localTotalElectores);

    console.log('[ActaHeaderPanel.handleSaveMesaData] Calling onSaveMesaData');
    onSaveMesaData();
  };

  const handleDownloadConformidad = async () => {
    // Prevent multiple clicks
    if (isGeneratingConformidad) {
      return;
    }

    try {
      setIsGeneratingConformidad(true);

      // Validate required fields before download
      if (!localMesaNumber || localMesaNumber.length !== 6) {
        ToastService.error("Debe ingresar un número de mesa válido (6 dígitos)");
        return;
      }

      if (!selectedLocation.jee) {
        ToastService.error("Debe seleccionar el JEE");
        return;
      }

      if (!selectedLocation.departamento || !selectedLocation.provincia || !selectedLocation.distrito) {
        ToastService.error("Debe seleccionar la ubicación completa (Departamento, Provincia, Distrito)");
        return;
      }

      // Find the ciudad and ID from the selected JEE
      const selectedJeeRecord = jeeOptions.find(jee => jee.jee === selectedLocation.jee);
      const ciudad = selectedJeeRecord?.ciudad || '';
      const jeeId = selectedJeeRecord?.id || '';

      if (!ciudad) {
        ToastService.error("No se pudo obtener la ciudad del JEE seleccionado");
        return;
      }

      // Find JEE members by jeeId
      const presidente = jeeMiembrosData.find(m => m.jee_id === jeeId && m.CARGO === 'PRESIDENTE');
      const segundoMiembro = jeeMiembrosData.find(m => m.jee_id === jeeId && m.CARGO === 'SEGUNDO MIEMBRO');
      const tercerMiembro = jeeMiembrosData.find(m => m.jee_id === jeeId && m.CARGO === 'TERCER MIEMBRO');

      // Prepare data for the document
      const data = {
        jee: selectedLocation.jee,
        mesaNumber: localMesaNumber,
        departamento: selectedLocation.departamento,
        provincia: selectedLocation.provincia,
        distrito: selectedLocation.distrito,
        ciudad: ciudad,
        // Presidente fields
        PRESIDENTE_NOMBRES: presidente?.NOMBRES || '',
        PRESIDENTE_APELLIDOPATERNO: presidente?.APELLIDOPATERNO || '',
        PRESIDENTE_APELLIDOMATERNO: presidente?.APELLIDOMATERNO || '',
        // Segundo Miembro fields
        SEGUNDO_MIEMBRO_NOMBRES: segundoMiembro?.NOMBRES || '',
        SEGUNDO_MIEMBRO_APELLIDOPATERNO: segundoMiembro?.APELLIDOPATERNO || '',
        SEGUNDO_MIEMBRO_APELLIDOMATERNO: segundoMiembro?.APELLIDOMATERNO || '',
        // Tercer Miembro fields
        TERCER_MIEMBRO_NOMBRES: tercerMiembro?.NOMBRES || '',
        TERCER_MIEMBRO_APELLIDOPATERNO: tercerMiembro?.APELLIDOPATERNO || '',
        TERCER_MIEMBRO_APELLIDOMATERNO: tercerMiembro?.APELLIDOMATERNO || '',
      };

      // Get category label for filename
      const categoryRecord = ELECTORAL_CATEGORIES.find(cat => cat.key === activeCategory);
      const categoryLabel = categoryRecord?.label || activeCategory;

      // Sanitize filename by removing special characters (tildes, dots, etc.)
      // to prevent encoding issues in PowerShell
      const sanitizeFilename = (text: string): string => {
        return text
          .normalize('NFD') // Decompose accented characters
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (tildes)
          .replace(/\./g, '') // Remove dots
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/[^\w-]/g, ''); // Remove any remaining special characters except underscore and dash
      };

      // Generate filename with sanitized category label
      const filename = `Conformidad_${sanitizeFilename(categoryLabel)}_Mesa_${localMesaNumber}_${sanitizeFilename(selectedLocation.jee)}.docx`;

      await ConformidadDocumentService.generateAndDownload(data, filename);

      // Mark conformidad as downloaded
      if (onConformidadDownloaded) {
        onConformidadDownloaded();
      }

      ToastService.success("Formato de conformidad generado y abierto exitosamente");
    } catch (error) {
      console.error('Error downloading conformidad document:', error);

      // Display the error message from the service
      const errorMessage = error instanceof Error ? error.message : "Error al generar el documento de conformidad";
      ToastService.error(errorMessage);
      
    } finally {
      setIsGeneratingConformidad(false);
    }
  };

  // Check if conformidad button should be enabled
  const isConformidadEnabled =
    localMesaNumber.length === 6 &&
    selectedLocation.jee !== '' &&
    selectedLocation.departamento !== '' &&
    selectedLocation.provincia !== '' &&
    selectedLocation.distrito !== '';

  return (
    <div className="space-y-3">
      {/* First Row: Mesa info and action buttons */}
      <div className="flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          {!isBloque1Enabled ? (
            // Display mode (after clicking Iniciar)
            <>
              <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }}>
                <span className="text-sm font-medium text-gray-700">N° Mesa:</span>
                <span className="font-semibold text-gray-800 ml-1">{localMesaNumber || "-"}</span>
              </div>

              <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }}>
                <span className="text-sm font-medium text-gray-700">N° Acta:</span>
                <span className="font-semibold text-gray-800 ml-1">{localActaNumber || "-"}</span>
              </div>

              <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }}>
                <span className="text-sm font-medium text-gray-700">JEE:</span>
                <span className="font-semibold text-gray-800 ml-1">{selectedLocation.jee || "-"}</span>
              </div>

              <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }} title="TOTAL DE ELECTORES HÁBILES">
                <span className="text-sm font-medium text-gray-700">TEH:</span>
                <span className="font-semibold text-gray-800 ml-1">{localTotalElectores || "-"}</span>
              </div>

              <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }} title="TOTAL DE CIUDADANOS QUE VOTARON">
                <span className="text-sm font-medium text-gray-700">TCV:</span>
                <span className="font-semibold text-gray-800 ml-1">
                  {isPartialRecount ? "-" : (tcv !== null ? tcv : "-")}
                </span>
              </div>
            </>
          ) : (
            // Edit mode (before clicking Iniciar)
            <>
              {/* Mesa Number Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">N° Mesa</label>
                <Input
                  type="text"
                  maxLength={6}
                  value={localMesaNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) {
                      setLocalMesaNumber(value);

                      if (value.length === 6) {
                        // Load mesa info from CSV (no save to localStorage yet)
                        onLoadMesaInfo(parseInt(value));

                        // The acta number will be auto-generated by the useEffect
                        // when all components (mesa, JEE, category) are available
                      }
                    }
                  }}
                  className="max-w-24 px-0.5 text-center font-semibold"
                />
              </div>

              {/* Acta Number Input with Dropdown */}
              <div ref={actaDropdownRef} className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row relative">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">N° Acta</label>
                <div className="relative flex items-center">
                  <Input
                    ref={actaInputRef}
                    type="text"
                    maxLength={11}
                    value={localActaNumber}
                    readOnly
                    disabled
                    className="max-w-32 px-0.5 pr-8 text-center font-semibold bg-gray-200 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowActaDropdown(!showActaDropdown)}
                    className="absolute right-0 top-0 h-full px-2 hover:bg-gray-200 rounded-r transition-colors"
                    title="Ver actas guardadas"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  </button>

                  {showActaDropdown && categoryActas && categoryActas.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {categoryActas
                          .map((acta, index) => ({ acta, index })) // Keep track of original index
                          .filter(({ index }) => index !== currentActaIndex) // Exclude currently active acta
                          .sort((a, b) => b.index - a.index) // Sort in descending order (newest first)
                          .map(({ acta, index }) => {
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  if (onSwitchToActa) {
                                    onSwitchToActa(index);
                                  }
                                  setShowActaDropdown(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    {acta.actaNumber || 'Sin número'}
                                  </span>
                                  {acta.isFormFinalized && (
                                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                                      Finalizada
                                    </span>
                                  )}
                                </div>
                                {acta.mesaNumber > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Mesa: {String(acta.mesaNumber).padStart(6, '0')} | TEH: {acta.totalElectores || 0} | TCV: {acta.voteEntries?.length || 0}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* JEE Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2" title="JURADO ELECTORAL ESPECIAL">JEE</label>
                <Select value={selectedLocation.jee || ""} onValueChange={onJeeChange}>
                  <SelectTrigger className="w-47 h-8">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {jeeOptions.map((jeeRecord) => (
                      <SelectItem key={jeeRecord.id} value={jeeRecord.jee}>{jeeRecord.jee}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Total Electores Hábiles Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2" title="TOTAL DE ELECTORES HÁBILES">TEH</label>
                <Input
                  type="number"
                  min={0}
                  max={300}
                  value={localTotalElectores || ""}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    if (value >= 0 && value <= 300) {
                      setLocalTotalElectores(value);
                    }
                  }}
                  disabled={areMesaFieldsLocked}
                  className={`max-w-20 text-center font-semibold ${areMesaFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  placeholder="0"
                />
              </div>

              {/* TCV Display */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2" title="TOTAL DE CIUDADANOS QUE VOTARON">TCV</label>
                <Input
                  type="text"
                  value={isPartialRecount ? "" : (tcv !== null ? tcv : "")}
                  readOnly
                  disabled
                  className="max-w-20 text-center font-semibold bg-gray-200 text-gray-700 cursor-not-allowed"
                />
              </div>

              {/* Conformidad Download Button */}
              <Button
                onClick={handleDownloadConformidad}
                disabled={!isConformidadEnabled || isGeneratingConformidad}
                className={`px-4 py-2 rounded font-medium flex items-center gap-2 ${
                  (!isConformidadEnabled || isGeneratingConformidad) ? "cursor-not-allowed bg-gray-300 text-gray-500" : "text-gray-800 hover:opacity-90"
                }`}
                style={(!isConformidadEnabled || isGeneratingConformidad) ? {} : { backgroundColor: categoryColors.dark }}
                title={isGeneratingConformidad ? "Generando documento..." : "Descargar formato de conformidad de sobre lacrado"}
              >
                {isGeneratingConformidad ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Conformidad
                  </>
                )}
              </Button>
            </>
          )}

          {/* Action Buttons */}
          {!isMesaDataSaved ? (
            <Button
              onClick={handleSaveMesaData}
              disabled={!canIniciar}
              className={`px-6 py-2 rounded font-medium ${
                !canIniciar ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "text-gray-800"
              }`}
              style={!canIniciar ? {} : { backgroundColor: categoryColors.dark }}
              title={!isConformidadDownloaded && isBloque1Enabled ? "Debe descargar el formato de conformidad antes de iniciar el recuento" : ""}
            >
              Iniciar
            </Button>
          ) : !isFormFinalized ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded font-medium text-center justify-center text-gray-800" style={{ backgroundColor: categoryColors.light }}>
              {isPaused ? (
                <>
                  <Pause className="w-5 h-5" />
                  Sesión Pausada
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sesión Iniciada
                </>
              )}
            </div>
          ) : null}

          {!isFormFinalized ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={!isMesaDataSaved}
                  className={`px-6 py-2 rounded font-medium ${
                    !isMesaDataSaved ? "cursor-not-allowed text-gray-400" : "text-gray-800"
                  }`}
                  style={!isMesaDataSaved ? { backgroundColor: '#e5e7eb' } : { backgroundColor: categoryColors.dark }}
                >
                  Opciones
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isPaused ? (
                  // When paused, only show Reanudar button
                  <DropdownMenuItem onClick={onResumeCounting}>
                    <Play className="mr-2 h-4 w-4" />
                    Reanudar
                  </DropdownMenuItem>
                ) : (
                  // When not paused, show all options
                  <>
                    {/* Temporarily hidden - Pausar functionality */}
                    {/* <DropdownMenuItem onClick={onPauseCounting}>
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </DropdownMenuItem> */}
                    <DropdownMenuItem onClick={onFinalizeForm}>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Finalizar
                    </DropdownMenuItem>
                    {onReinicializar && (
                      <DropdownMenuItem onClick={onReinicializar}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reiniciar
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded font-medium text-center text-gray-800" style={{ backgroundColor: categoryColors.light }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Sesión Finalizada
            </div>
          )}

          {isFormFinalized && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="px-6 py-2 rounded font-medium text-gray-800" style={{ backgroundColor: categoryColors.dark }}>
                  Opciones
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onVerActa}>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Ver Acta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (onCreateNewActa) {
                    onCreateNewActa();
                  }
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nuevo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Second Row: Location Dropdowns */}
      <div className="flex gap-4 items-center">
        {!isBloque1Enabled ? (
          // Display mode
          <>
            <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }}>
              <span className="text-sm font-medium text-gray-700">
                {isInternationalLocation ? "Continente:" : "Departamento:"}
              </span>
              <span className="font-semibold text-gray-800 ml-1">{selectedLocation.departamento || "-"}</span>
            </div>

            <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }}>
              <span className="text-sm font-medium text-gray-700">
                {isInternationalLocation ? "País:" : "Provincia:"}
              </span>
              <span className="font-semibold text-gray-800 ml-1">{selectedLocation.provincia || "-"}</span>
            </div>

            <div className="px-3 py-2 rounded-lg border whitespace-nowrap" style={{ backgroundColor: categoryColors.light, borderColor: categoryColors.dark }}>
              <span className="text-sm font-medium text-gray-700">
                {isInternationalLocation ? "Ciudad:" : "Distrito:"}
              </span>
              <span className="font-semibold text-gray-800 ml-1">{selectedLocation.distrito || "-"}</span>
            </div>
          </>
        ) : (
          // Edit mode
          <>
            <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
              <label className="text-sm font-medium text-gray-700 flex items-center pr-2">
                {isInternationalLocation ? "Continente" : "Departamento"}
              </label>
              <Select
                value={selectedLocation.departamento || undefined}
                onValueChange={onDepartamentoChange}
                disabled={areMesaFieldsLocked}
              >
                <SelectTrigger className={`w-49 h-8 ${areMesaFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder={isInternationalLocation ? "Seleccionar Continente" : "Seleccionar Departamento"} />
                </SelectTrigger>
                <SelectContent>
                  {getDepartamentos().map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
              <label className="text-sm font-medium text-gray-700 flex items-center pr-2">
                {isInternationalLocation ? "País" : "Provincia"}
              </label>
              <Select
                value={selectedLocation.provincia || undefined}
                onValueChange={onProvinciaChange}
                disabled={areMesaFieldsLocked}
              >
                <SelectTrigger className={`w-56 h-8 ${areMesaFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder={isInternationalLocation ? "Seleccionar País" : "Seleccionar Provincia"} />
                </SelectTrigger>
                <SelectContent>
                  {getProvincias(selectedLocation.departamento).map((prov) => (
                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
              <label className="text-sm font-medium text-gray-700 flex items-center pr-2">
                {isInternationalLocation ? "Ciudad" : "Distrito"}
              </label>
              <Select
                value={selectedLocation.distrito || undefined}
                onValueChange={onDistritoChange}
                disabled={areMesaFieldsLocked}
              >
                <SelectTrigger className={`w-56 h-8 ${areMesaFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <SelectValue placeholder={isInternationalLocation ? "Seleccionar Ciudad" : "Seleccionar Distrito"} />
                </SelectTrigger>
                <SelectContent>
                  {getDistritos(selectedLocation.departamento, selectedLocation.provincia).map((dist) => (
                    <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
