import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Combobox } from "./ui/combobox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Plus, X, Edit, Check, ChevronDown, FileText, RefreshCw, FileCheck } from "lucide-react";
import { type VoteEntry, type PoliticalOrganization } from "../data/mockData";
import { getSelectedOrganizations, getCircunscripcionOrganizations } from "../lib/localStorage";
import { toast } from "sonner";

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface VoteLimits {
  preferential1: number;
  preferential2: number;
}

interface PreferentialConfig {
  hasPreferential1: boolean;
  hasPreferential2: boolean;
}

interface VoteEntryFormProps {
  category: string;
  categoryLabel?: string;
  existingEntries?: VoteEntry[];
  voteLimits: VoteLimits;
  preferentialConfig: PreferentialConfig;
  onEntriesChange: (entries: VoteEntry[]) => void;
  mesaNumber: number;
  actaNumber: string;
  totalElectores: number;
  cedulasExcedentes: number;
  tcv: number | null;
  onCedulasExcedentesChange: (value: number) => void;
  onTcvChange: (value: number | null) => void;
  selectedLocation: {
    departamento: string;
    provincia: string;
    distrito: string;
    jee: string;
  };
  circunscripcionElectoral: string;
  // totalCedulasRecibidas: number;
  onMesaDataChange: (mesa: number, acta:string, electores: number) => void;
  onJeeChange: (jee: string) => void;
  onDepartamentoChange: (value: string) => void;
  onProvinciaChange: (value: string) => void;
  onDistritoChange: (value: string) => void;
  getDepartamentos: () => string[];
  getProvincias: (departamento: string) => string[];
  getDistritos: (departamento: string, provincia: string) => string[];
  isInternationalLocation: boolean;
  jeeOptions: string[];
  mesaElectoralInfo?: {
    mesa_number: string;
    tipo_ubicacion: string;
    circunscripcion_electoral: string;
    departamento: string;
    provincia: string;
    distrito: string;
    teh: string;
  } | null;
  isFormFinalized?: boolean;
  onFormFinalizedChange?: (isFinalized: boolean) => void;
  isMesaDataSaved?: boolean;
  onMesaDataSavedChange?: (isSaved: boolean) => void;
  areMesaFieldsLocked?: boolean;
  // Time tracking props
  startTime: Date | null;
  endTime: Date | null;
  currentTime: Date;
  onStartTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  onCurrentTimeChange: (time: Date) => void;
  onViewSummary: () => void;
  onCreateNewActa?: () => void;
  onSwitchToActa?: (index: number) => void;
  categoryActas?: any[];
  currentActaIndex?: number;
  politicalOrganizations: PoliticalOrganization[];
  isMesaAlreadyFinalized?: (mesaNumber: number) => boolean;
}

export function VoteEntryForm({
  category, categoryLabel, existingEntries = [], voteLimits, preferentialConfig, onEntriesChange,
  mesaNumber, actaNumber, totalElectores, cedulasExcedentes, tcv, onCedulasExcedentesChange, onTcvChange,
  selectedLocation, circunscripcionElectoral, onMesaDataChange,
  onJeeChange, onDepartamentoChange, onProvinciaChange, onDistritoChange,
  getDepartamentos, getProvincias, getDistritos, isInternationalLocation,
  jeeOptions,
  mesaElectoralInfo,
  isFormFinalized: externalIsFormFinalized, onFormFinalizedChange,
  isMesaDataSaved: externalIsMesaDataSaved, onMesaDataSavedChange,
  areMesaFieldsLocked = false,
  startTime, endTime, currentTime, onStartTimeChange, onEndTimeChange, onCurrentTimeChange,
  onViewSummary,
  onCreateNewActa,
  onSwitchToActa,
  categoryActas = [],
  currentActaIndex = 0,
  politicalOrganizations,
  isMesaAlreadyFinalized
}: VoteEntryFormProps) {
  console.log('[VoteEntryForm] Rendered with politicalOrganizations:', politicalOrganizations?.length || 0);

  // Use existingEntries directly from parent (which comes from categoryData)
  const [entries, setEntries] = useState<VoteEntry[]>(existingEntries);

  // Get selected organizations from localStorage (try circunscripción-specific first, fallback to global)
  const selectedOrganizationKeys = circunscripcionElectoral
    ? getCircunscripcionOrganizations(circunscripcionElectoral)
    : getSelectedOrganizations();

  const availableOrganizations = (politicalOrganizations || []).filter(org =>
    selectedOrganizationKeys.includes(org.key)
  );

  console.log('[VoteEntryForm] Available organizations:', availableOrganizations.length);


  // Local state for form inputs before saving
  const [localMesaNumber, setLocalMesaNumber] = useState<string>('');
  const [localActaNumber, setLocalActaNumber] = useState<string>('');
  const [localTotalElectores, setLocalTotalElectores] = useState<number>(totalElectores);
  // const [localTotalCedulasRecibidas, setLocalTotalCedulasRecibidas] = useState<number>(totalCedulasRecibidas);
  
  // State to control if mesa data is saved and inputs should be disabled
  const [localIsMesaDataSaved, setLocalIsMesaDataSaved] = useState<boolean>(false);
  const isMesaDataSaved = externalIsMesaDataSaved !== undefined ? externalIsMesaDataSaved : localIsMesaDataSaved;
  
  // State to control if the form is finalized and all inputs should be disabled
  const [localIsFormFinalized, setLocalIsFormFinalized] = useState<boolean>(false);
  const isFormFinalized = externalIsFormFinalized !== undefined ? externalIsFormFinalized : localIsFormFinalized;

  
  // Block control logic
  const isBloque1Enabled = !isMesaDataSaved && !isFormFinalized; // Enabled only before session starts
  const isBloque2Enabled = isMesaDataSaved && !isFormFinalized;  // Enabled only after session starts and before finalization
  


  // Update local entries when existingEntries change (category switch)
  useEffect(() => {
    setEntries(existingEntries);
  }, [existingEntries]);

  // Debug: Check APIs on component mount
  useEffect(() => {
    console.log("VoteEntryForm mounted - checking APIs:");
    console.log("window.api:", window.api);
    console.log("window.electronAPI:", (window as any).electronAPI);

    // Set a timeout to check again after a moment
    setTimeout(() => {
      console.log("VoteEntryForm after timeout - checking APIs:");
      console.log("window.api:", window.api);
      console.log("window.electronAPI:", (window as any).electronAPI);
    }, 1000);
  }, []);

  // Update local state when parent values change
  useEffect(() => {
    // Always update mesa number (including when it's 0 to clear the field)
    setLocalMesaNumber(mesaNumber > 0 ? mesaNumber.toString().padStart(6, '0') : '');
    // Always update acta number (including when it's empty to clear the field)
    setLocalActaNumber(actaNumber);
    setLocalTotalElectores(totalElectores);
    // setLocalTotalCedulasRecibidas(totalCedulasRecibidas);
  }, [mesaNumber, actaNumber, totalElectores]);


  // Reset form state when category changes
  useEffect(() => {
    setNewEntry({
      tableNumber: getNextTableNumber(),
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    setEditingTableNumber(null);
    setOriginalEntry(null);
  }, [category]);

  // Report entries changes to parent component
  const updateEntries = (newEntries: VoteEntry[]) => {
    setEntries(newEntries);
    onEntriesChange(newEntries);
  };

  // Calculate next table number based on current entries
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

  // Update table number when entries change
  useEffect(() => {
    setNewEntry(prev => ({
      ...prev,
      tableNumber: getNextTableNumber(),
    }));
  }, [entries]);

  // Edit state management
  const [editingTableNumber, setEditingTableNumber] = useState<number | null>(null);
  const [originalEntry, setOriginalEntry] = useState<VoteEntry | null>(null);
  
  // Refs for auto-focus
  const actaInputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const shouldPreserveCursorRef = useRef<boolean>(false);

  // State for acta dropdown
  const [showActaDropdown, setShowActaDropdown] = useState<boolean>(false);
  const actaDropdownRef = useRef<HTMLDivElement>(null);

  // Effect to restore cursor position
  useEffect(() => {
    if (shouldPreserveCursorRef.current && actaInputRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        if (actaInputRef.current) {
          actaInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        }
      });
      shouldPreserveCursorRef.current = false;
    }
  }, [localActaNumber]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actaDropdownRef.current && !actaDropdownRef.current.contains(event.target as Node)) {
        setShowActaDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleAddEntry = () => {
    // Check if adding this entry would exceed total electores
    if (entries.length >= localTotalElectores) {
      toast.error(`No se pueden agregar más cédulas. Límite alcanzado: ${localTotalElectores} electores hábiles`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '450px'
        },
        duration: 4000
      });
      return;
    }

    if (!newEntry.party) {
      toast.error("Por favor seleccione una organización política", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    // Validate vote limits only for enabled preferential votes
    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      toast.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    // Validate that preferential votes are not allowed with BLANCO or NULO
    if (isBlankOrNull(newEntry.party || "") && (pref1 > 0 || pref2 > 0)) {
      toast.error("No se pueden ingresar votos preferenciales con BLANCO o NULO", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    // Validate that preferential votes are different when both are enabled
    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        toast.error("Los votos preferenciales 1 y 2 deben tener valores diferentes", {
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            width: '400px'
          },
          duration: 4000
        });
        return;
      }
    }

    const entry: VoteEntry = {
      tableNumber: newEntry.tableNumber!,
      party: newEntry.party!,
      preferentialVote1: isBlankOrNull(newEntry.party || "") ? 0 : pref1,
      preferentialVote2: isBlankOrNull(newEntry.party || "") ? 0 : pref2,
    };

    const updatedEntries = [...entries, entry];
    updateEntries(updatedEntries);
    
    // Calculate next table number for the new entry
    const nextTableNumber = Math.max(...updatedEntries.map(e => e.tableNumber || 0)) + 1;
    
    setNewEntry({
      tableNumber: nextTableNumber,
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    toast.success("Voto registrado exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 2000
    });
  };


  const handleEditEntry = (entry: VoteEntry) => {
    setEditingTableNumber(entry.tableNumber);
    setOriginalEntry({ ...entry });
    setNewEntry({
      tableNumber: entry.tableNumber,
      party: entry.party,
      preferentialVote1: entry.preferentialVote1,
      preferentialVote2: entry.preferentialVote2,
    });
  };

  const handleConfirmEdit = () => {
    if (!newEntry.party) {
      toast.error("Por favor seleccione una organización política", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    // Validate vote limits only for enabled preferential votes
    const pref1 = newEntry.preferentialVote1 || 0;
    const pref2 = newEntry.preferentialVote2 || 0;

    if (preferentialConfig.hasPreferential1 && pref1 > voteLimits.preferential1) {
      toast.error(`El Voto Preferencial 1 no puede exceder ${voteLimits.preferential1}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    if (preferentialConfig.hasPreferential2 && pref2 > voteLimits.preferential2) {
      toast.error(`El Voto Preferencial 2 no puede exceder ${voteLimits.preferential2}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        }
      });
      return;
    }

    // Validate that preferential votes are not allowed with BLANCO or NULO
    if (isBlankOrNull(newEntry.party || "") && (pref1 > 0 || pref2 > 0)) {
      toast.error("No se pueden ingresar votos preferenciales con BLANCO o NULO", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    // Validate that preferential votes are different when both are enabled
    if (preferentialConfig.hasPreferential1 && preferentialConfig.hasPreferential2) {
      if (pref1 > 0 && pref2 > 0 && pref1 === pref2) {
        toast.error("Los votos preferenciales 1 y 2 deben tener valores diferentes", {
          style: {
            background: '#dc2626',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px',
            width: '400px'
          },
          duration: 4000
        });
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
    updateEntries(updatedEntries);
    
    // Reset edit state and form
    setEditingTableNumber(null);
    setOriginalEntry(null);
    setNewEntry({
      tableNumber: getNextTableNumber(),
      party: "",
      preferentialVote1: 0,
      preferentialVote2: 0,
    });
    
    toast.success("Voto actualizado exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 2000
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

  // Helper function to check if party is BLANCO or NULO
  const isBlankOrNull = (party: string) => {
    return party === "BLANCO" || party === "NULO" || party.includes("BLANCO") || party.includes("NULO");
  };

  // Time formatting functions
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatElapsedTime = (start: Date, current: Date) => {
    const diffMs = current.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle save mesa data with validations
  const handleSaveMesaData = () => {
    const mesaToCheck = parseInt(localMesaNumber) || 0;

    // Validation 0: Check if mesa has already been finalized in this category
    if (isMesaAlreadyFinalized && isMesaAlreadyFinalized(mesaToCheck)) {
      toast.error(`Mesa N° ${mesaToCheck.toString().padStart(6, '0')} ya ha sido recontada para este tipo de elección`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '550px'
        },
        duration: 5000
      });
      return;
    }

    // Validation 1: Location must be fully selected
    if (!selectedLocation.departamento) {
      toast.error("Debe seleccionar un Departamento", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    if (!selectedLocation.provincia) {
      toast.error("Debe seleccionar una Provincia", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    if (!selectedLocation.distrito) {
      toast.error("Debe seleccionar un Distrito", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    if (!circunscripcionElectoral) {
      toast.error("Debe seleccionar una Circunscripción Electoral", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    if (!selectedLocation.jee) {
      toast.error("Debe seleccionar un JEE", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    // Validation 2: Political organizations must be enabled
    if (selectedOrganizationKeys.length === 0) {
      toast.error("Debe activar al menos una Organización Política en Configuración", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '450px'
        },
        duration: 4000
      });
      return;
    }

    // Validation 3: Check if only NULO and BLANCO are enabled
    const nonBlankNullOrgs = availableOrganizations.filter(org =>
      !org.name.includes("BLANCO") && !org.name.includes("NULO")
    );

    if (nonBlankNullOrgs.length === 0) {
      toast.error(`No hay Organizaciones Políticas registradas para la Circunscripción electoral: ${circunscripcionElectoral}`, {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '500px'
        },
        duration: 4000
      });
      return;
    }

    // Validation 4: Mesa number must be 6 digits, acta number must follow format, electores between 1-300
    if (localMesaNumber.length !== 6 || parseInt(localMesaNumber) <= 0) {
      toast.error("N° Mesa debe tener 6 dígitos y ser mayor a 0", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    // Validate acta format
    const actaRegex = /^\d{6}-\d{2}-[A-Z]$/;
    if (!actaRegex.test(localActaNumber)) {
      toast.error("N° Acta debe tener formato 000000-00-A", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    if (localTotalElectores <= 0 || localTotalElectores > 300) {
      toast.error("TEH debe estar entre 1 y 300", {
        style: {
          background: '#dc2626',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          width: '400px'
        },
        duration: 4000
      });
      return;
    }

    // Validation 2: Cédulas Recibidas must be less than or equal to Total Electores
    // if (localTotalCedulasRecibidas > localTotalElectores) {
    //   toast.error("Las cédulas recibidas no pueden ser mayores que el total de electores", {
    //     style: {
    //       background: '#dc2626',
    //       color: 'white',
    //       fontWeight: 'bold',
    //       fontSize: '16px'
    //     },
    //     duration: 4000
    //   });
    //   return;
    // }

    // If validations pass, update the parent state
    onMesaDataChange(parseInt(localMesaNumber), localActaNumber, localTotalElectores);
    const now = new Date();
    onStartTimeChange(now); // Capture start time
    onCurrentTimeChange(now); // Initialize currentTime to same value as startTime
    if (onMesaDataSavedChange) {
      onMesaDataSavedChange(true);
    } else {
      setLocalIsMesaDataSaved(true);
    }
    toast.success("Datos de mesa guardados exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 2000
    });
  };

  const handleGeneratePdfPresidencial = async (finalizationTime: Date, startTime: Date | null) => {
    try {
      const { width, height } = await (async () => {
        const existingPdfUrl = './03_10_25/ACTA DE RECUENTO PRESIDENCIAL 39  PARTIDOS.pdf';
        const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        return firstPage.getSize();
      })();

      const labels: { [key: string]: { votes: number | string; x: number; y: number } } = {};
      let y_pos = height - 248.5;
      politicalOrganizations.forEach(org => {
        const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
        const isSelected = selectedOrganizationKeys.includes(org.key);

        if (org.name === "BLANCO") {
          labels[partyName] = { votes: isSelected ? 0 : "-", x: 234.6, y: height - 1092 };
        } else if (org.name === "NULO") {
          labels[partyName] = { votes: isSelected ? 0 : "-", x: 234.6, y: height - 1115 };
        } else {
          labels[partyName] = { votes: isSelected ? 0 : "-", x: 446, y: y_pos };
          y_pos -= 21.1;
        }
      });

      const voteCount = calculateVoteData();
      for (const party in voteCount) {
        if (labels.hasOwnProperty(party) && labels[party].votes !== "-") {
          labels[party].votes = voteCount[party];
        }
      }

      console.log("Diccionario de etiquetas de votos con coordenadas:", labels);

      const existingPdfUrl = './03_10_25/ACTA DE RECUENTO PRESIDENCIAL 39  PARTIDOS.pdf';//'./ACTA_RECUENTO_PRESIDENCIAL.pdf';
      const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const horaFin = formatTime(finalizationTime);
      const fechaFin = formatDate(finalizationTime);
      const dateTimeString = `${horaFin} del ${fechaFin}`;

      const data = [
        { texto: localMesaNumber, x: 45, y: height - 132, color: rgb(0, 0, 0), size: 14 },
        { texto: localActaNumber, x: 137, y: height - 132, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.jee.toUpperCase(), x: 230, y: height - 132, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.departamento.toUpperCase(), x: 45, y: height - 175, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.provincia.toUpperCase(), x: 230, y: height - 175, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.distrito.toUpperCase(), x: 410, y: height - 175, color: rgb(0, 0, 0), size: 14 },
        { texto: dateTimeString, x: 102, y: height - 1166, color: rgb(0, 0, 0), size: 6.5 },
        { texto: `${entries.length}`, x: 763, y: height - 147, color: rgb(0, 0, 0), size: 15 },
        { texto: `${localTotalElectores}`, x: 759, y: height - 121, color: rgb(0, 0, 0), size: 15 },
        { texto: `${cedulasExcedentes}`, x: 475, y: height - 1092, color: rgb(0, 0, 0), size: 15 },
        { texto: `${entries.length}`, x: 234.6, y: height - 1138, color: rgb(0, 0, 0), size: 15 },
      ];

      if (startTime) {
        const horaInicio = formatTime(startTime);
        const fechaInicio = formatDate(startTime);
        const startDateTimeString = `${horaInicio} del ${fechaInicio}`;
        data.push({ texto: startDateTimeString, x: 102, y: height - 198, color: rgb(0, 0, 0), size: 6.5 });
      }

      for (const partyName in labels) {
        if (labels.hasOwnProperty(partyName)) {
          const label = labels[partyName];
          data.push({ texto: `${label.votes}`, x: label.x, y: label.y, color: rgb(0, 0, 0), size: 15 });
        }
      }

      data.forEach(item => {
        firstPage.drawText(item.texto, {
          x: item.x,
          y: item.y,
          font: helveticaBoldFont,
          size: item.size,
          color: item.color,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const filename = `acta_presidencial_${localMesaNumber}.pdf`;

      // Debug: Check what APIs are available
      console.log("window.api:", window.api);
      console.log("window.api?.savePdf:", window.api?.savePdf);
      console.log("typeof window.api?.savePdf:", typeof window.api?.savePdf);
      console.log("Is Electron environment:", !!(window as any).electronAPI || !!(window as any).api);

      // Use Electron API to save and open PDF directly
      if (window.api && typeof window.api.savePdf === 'function') {
        const saveResult = await window.api.savePdf(pdfBytes, filename);
        if (saveResult.success && saveResult.filePath) {
          console.log("PDF guardado exitosamente en:", saveResult.filePath);
          toast.success(`PDF guardado en el escritorio: ${filename}`);

          // Automatically open the PDF
          const openResult = await window.api.openPdf(saveResult.filePath);
          if (openResult.success) {
            console.log("PDF abierto exitosamente");
          } else {
            console.error("Error al abrir PDF:", openResult.error);
            toast.error("PDF guardado pero no se pudo abrir automáticamente");
          }
        } else {
          console.error("Error al guardar PDF:", saveResult.error);
          toast.error("Error al guardar el PDF");
        }
      } else {
        // Fallback to browser download for web version
        const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("PDF generado y descarga iniciada (modo web).");
      }

    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  };

  const handleGeneratePdfSenadoresNacional = async (finalizationTime: Date, startTime: Date | null) => {
    const calculateVoteDataForPdf = () => {
        const voteCount: { [partyKey: string]: number } = {};
        const matrix: { [partyKey: string]: { [prefNumber: number]: number, total: number } } = {};

        politicalOrganizations.forEach(org => {
            const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
            const isSelected = selectedOrganizationKeys.includes(org.key);

            if (isSelected) {
                voteCount[partyKey] = 0;
                matrix[partyKey] = { total: 0 };
                for (let i = 1; i <= 30; i++) {
                    matrix[partyKey][i] = 0;
                }
            }
        });
        
        entries.forEach(entry => {
            if (entry.party) {
                voteCount[entry.party] = (voteCount[entry.party] || 0) + 1;
                if (matrix[entry.party]) {
                    if (entry.preferentialVote1 >= 1 && entry.preferentialVote1 <= 30) {
                        matrix[entry.party][entry.preferentialVote1]++;
                        matrix[entry.party].total++;
                    }
                    if (entry.preferentialVote2 >= 1 && entry.preferentialVote2 <= 30) {
                        matrix[entry.party][entry.preferentialVote2]++;
                        matrix[entry.party].total++;
                    }
                }
            }
        });
        
        return { voteCount, matrix };
    };

    try {
      const { width, height } = await (async () => {
        const existingPdfUrl = './03_10_25/39_ACTA_DE_RECUENTO_SENADORES_DISTRITO_UNICO.pdf';
        const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        return firstPage.getSize();
      })();
 
      const { voteCount, matrix } = calculateVoteDataForPdf();

      const labels: { [key: string]: { votes: number | string; x: number; y: number } } = {};
      let y_pos = height - 150;
      politicalOrganizations.forEach(org => {
        const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
        const isSelected = selectedOrganizationKeys.includes(org.key);

        if (org.name === "BLANCO") {
          labels[partyName] = { votes: isSelected ? 0 : "-", x: 245.6, y: height - 753.8 };
        } else if (org.name === "NULO") {
          labels[partyName] = { votes: isSelected ? 0 : "-", x: 245.6, y: height - 773.4 };
        } else {
          labels[partyName] = { votes: isSelected ? 0 : "-", x: 230, y: y_pos };
          y_pos -= 15.132;
        }
      });

      for (const party in voteCount) {
        if (labels.hasOwnProperty(party) && labels[party].votes !== "-") {
          labels[party].votes = voteCount[party];
        }
      }

      console.log("Diccionario de etiquetas de votos con coordenadas (Senadores Nacional):", labels);

      const existingPdfUrl = './03_10_25/39_ACTA_DE_RECUENTO_SENADORES_DISTRITO_UNICO.pdf';
      const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const horaFin = formatTime(finalizationTime);
      const fechaFin = formatDate(finalizationTime);

      const data = [
        { texto: localMesaNumber, x: 44, y: height - 102, color: rgb(0, 0, 0), size: 9 },
        { texto: localActaNumber, x: 106, y: height - 102, color: rgb(0, 0, 0), size: 9 },
        { texto: selectedLocation.jee.toUpperCase(), x: 168, y: height - 102, color: rgb(0, 0, 0), size: 9 },
        { texto: selectedLocation.departamento.toUpperCase(), x: 423, y: height - 102, color: rgb(0, 0, 0), size: 9 },
        { texto: selectedLocation.provincia.toUpperCase(), x: 581, y: height - 102, color: rgb(0, 0, 0), size: 9 },
        { texto: selectedLocation.distrito.toUpperCase(), x: 739, y: height - 102, color: rgb(0, 0, 0), size: 9 },
        { texto: horaFin, x: 95, y: height - 816, color: rgb(0, 0, 0), size: 10 },
        { texto: fechaFin, x: 205, y: height - 816, color: rgb(0, 0, 0), size: 10 },
        { texto: `${entries.length}`, x: 1120, y: height - 114, color: rgb(0, 0, 0), size: 15 },
        { texto: `${localTotalElectores}`, x: 1120, y: height - 91, color: rgb(0, 0, 0), size: 15 },
        { texto: `${cedulasExcedentes}`, x: 525.6, y: height - 753.8, color: rgb(0, 0, 0), size: 15 },
        { texto: `${entries.length}`, x: 245.6, y: height - 793.4, color: rgb(0, 0, 0), size: 15 },
      ];

      if (startTime) {
        const horaInicio = formatTime(startTime);
        const fechaInicio = formatDate(startTime);
        data.push({ texto: horaInicio, x: 95, y: height - 118, color: rgb(0, 0, 0), size: 10 });
        data.push({ texto: fechaInicio, x: 205, y: height - 118, color: rgb(0, 0, 0), size: 10 });
      }

      for (const partyName in labels) {
        if (labels.hasOwnProperty(partyName)) {
          const label = labels[partyName];
          data.push({ texto: `${label.votes}`, x: label.x, y: label.y, color: rgb(0, 0, 0), size: 15 });
        }
      }

      // START: Add preferential vote cross-table
      let tableY = height - 149; // Starting Y position for the table.
      const tableXStart = 268.8;
      const cellWidth = 22.95;
      let lineHeight = 15.132;
      let fontSize = 11.5;


      // Draw rows
      politicalOrganizations.forEach(org => {
          const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
          const isBlancoOrNulo = org.name === 'BLANCO' || org.name === 'NULO';
          const isSelected = selectedOrganizationKeys.includes(org.key);

          if (!isBlancoOrNulo) {
              if (tableY < 50) return; // Stop if we're at the bottom of the page

              const totalXPos = tableXStart + (30 * cellWidth);

              if (isSelected && matrix[partyKey]) {
                  const partyMatrix = matrix[partyKey];
                  let horizontalSum = 0;
                  for (let i = 1; i <= 30; i++) {
                      const count = partyMatrix[i] || 0;
                      firstPage.drawText(`${count}`, { x: tableXStart + ((i - 1) * cellWidth), y: tableY, font: helveticaBoldFont, size: fontSize, color: rgb(0, 0, 0) });
                      horizontalSum += count;
                  }
                  firstPage.drawText(`${horizontalSum}`, { x: totalXPos, y: tableY, font: helveticaBoldFont, size: fontSize, color: rgb(0, 0, 0) });
              } else {
                  // For unselected organizations, show dashes
                  for (let i = 1; i <= 30; i++) {
                      firstPage.drawText("-", { x: tableXStart + ((i - 1) * cellWidth), y: tableY, font: helveticaBoldFont, size: fontSize, color: rgb(0, 0, 0) });
                  }
                  firstPage.drawText("-", { x: totalXPos, y: tableY, font: helveticaBoldFont, size: fontSize, color: rgb(0, 0, 0) });
              }

              tableY -= lineHeight;
          }
      });
      // END: Add preferential vote cross-table


      data.forEach(item => {
        firstPage.drawText(item.texto, {
          x: item.x,
          y: item.y,
          font: helveticaBoldFont,
          size: item.size,
          color: item.color,
        });
      });

      const pdfBytes = await pdfDoc.save();
      const filename = `acta_senadores_nacional_${localMesaNumber}.pdf`;

      // Use Electron API to save and open PDF directly
      if (window.api && typeof window.api.savePdf === 'function') {
        const saveResult = await window.api.savePdf(pdfBytes, filename);
        if (saveResult.success && saveResult.filePath) {
          console.log("PDF de Senadores Nacional guardado exitosamente en:", saveResult.filePath);
          toast.success(`PDF guardado en el escritorio: ${filename}`);

          // Automatically open the PDF
          const openResult = await window.api.openPdf(saveResult.filePath);
          if (openResult.success) {
            console.log("PDF abierto exitosamente");
          } else {
            console.error("Error al abrir PDF:", openResult.error);
            toast.error("PDF guardado pero no se pudo abrir automáticamente");
          }
        } else {
          console.error("Error al guardar PDF:", saveResult.error);
          toast.error("Error al guardar el PDF");
        }
      } else {
        // Fallback to browser download for web version
        const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("PDF de Senadores Nacional generado y descarga iniciada (modo web).");
      }

    } catch (error) {
      console.error("Error al generar el PDF de Senadores Nacional:", error);
    }
  };


  // Handle finalize form - disable all inputs permanently
  const handleFinalizeForm = async () => {
    console.log("Finalizando formulario...")
    const now = new Date();

    onEndTimeChange(now); // Capture end time

    // If TCV is null (linked to entries.length), save the actual value for auto-loading
    if (tcv === null) {
      onTcvChange(entries.length);
    }

    if (onFormFinalizedChange) {
      onFormFinalizedChange(true);
    } else {
      setLocalIsFormFinalized(true);
    }
    toast.success("Formulario finalizado exitosamente", {
      style: {
        background: '#16a34a',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        width: '400px'
      },
      duration: 3000
    });
  };

  // Handle generate PDF - called from Ver Acta button
  const handleVerActa = async () => {
    const finalizationTime = endTime || new Date();
    switch (category) {
      case "presidencial":
        await handleGeneratePdfPresidencial(finalizationTime, startTime);
        break;
      case "senadoresNacional":
        await handleGeneratePdfSenadoresNacional(finalizationTime, startTime);
        break;
      case "senadoresRegional":
        console.log("Categoría es Senadores Regional");
        // await handleGeneratePdfSenadoresRegional(finalizationTime, startTime);
        break;
      case "diputados":
        console.log("Categoría es Diputados");
        // await handleGeneratePdfDiputados(finalizationTime, startTime);
        break;
      case "parlamentoAndino":
        console.log("Categoría es Parlamento Andino");
        // await handleGeneratePdfParlamentoAndino(finalizationTime, startTime);
        break;
      default:
        console.log("Categoría desconocida:", category);
        break;
    }
  };

  // Calculate vote counts for horizontal bars
  const calculateVoteData = () => {
    const voteCount: { [party: string]: number } = {};
    
    // Count votes by party
    entries.forEach(entry => {
      voteCount[entry.party] = (voteCount[entry.party] || 0) + 1;
    });
    
    return voteCount;
  };

  return (
    <div className="space-y-6">
      {/* Mesa Data Entry Section */}
      <Card>
        <CardContent className="p-4 [&:last-child]:pb-4">
          <div className="space-y-4">
          <div className="flex justify-between items-center gap-6">
            {/* Input Fields Container */}
            <div className="flex gap-4 items-center">
              {!isBloque1Enabled ? (
                // Display mode - show styled divs (when session started, after clicking Iniciar)
                <>
                  {/* Mesa Number Display */}
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap">
                    <span className="text-sm font-medium text-orange-700">Mesa:</span>
                    <span className="font-semibold text-orange-900 ml-1">{String(localMesaNumber || "").padStart(6, '0')}</span>
                  </div>

                  {/* Acta Number Display */}
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap">
                    <span className="text-sm font-medium text-orange-700">Acta:</span>
                    <span className="font-semibold text-orange-900 ml-1">{localActaNumber}</span>
                  </div>

                  {/* JEE Display */}
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap" title="JURADO ELECTORAL ESPECIAL">
                    <span className="text-sm font-medium text-orange-700">JEE:</span>
                    <span className="font-semibold text-orange-900 ml-1">{selectedLocation.jee}</span>
                  </div>

                  {/* Total Electores Hábiles Display */}
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap" title="TOTAL DE ELECTORES HÁBILES">
                    <span className="text-sm font-medium text-orange-700">TEH:</span>
                    <span className="font-semibold text-orange-900 ml-1">{localTotalElectores}</span>
                  </div>

                  {/* Total de Ciudadanos que Votaron Display */}
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap" title="TOTAL DE CIUDADANOS QUE VOTARON">
                    <span className="text-sm font-medium text-orange-700">TCV:</span>
                    <span className="font-semibold text-orange-900 ml-1">{tcv !== null ? tcv : entries.length}</span>
                  </div>
                </>
              ) : (
                // Edit mode - show input fields (before clicking Iniciar)
                <>
                  {/* Mesa Number Input */}
                  <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                    <label className="text-sm font-medium text-gray-700 flex items-center pr-2">N° Mesa</label>
                    <Input
                      type="text"
                      maxLength={6}
                      value={localMesaNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only digits
                        if (value.length <= 6) {
                          setLocalMesaNumber(value);

                          // Update acta number when mesa number changes, preserving existing parts
                          if (value.length === 6) {
                            const currentActaParts = localActaNumber.split('-');
                            const secondPart = currentActaParts[1] || '';
                            const thirdPart = currentActaParts[2] || '';

                            // Build new acta number preserving existing second and third parts
                            let newActaNumber = value;
                            if (secondPart || thirdPart) {
                              newActaNumber += '-' + secondPart;
                              if (thirdPart) {
                                newActaNumber += '-' + thirdPart;
                              }
                            } else {
                              newActaNumber += '-';
                            }

                            setLocalActaNumber(newActaNumber);

                            // Trigger location auto-population when mesa number is complete
                            onMesaDataChange(parseInt(value), newActaNumber, localTotalElectores);

                            // Auto-focus to acta field only if it's empty or just has the mesa number
                            if (!secondPart && !thirdPart) {
                              setTimeout(() => {
                                actaInputRef.current?.focus();
                                // Position cursor at the end
                                const input = actaInputRef.current;
                                if (input) {
                                  input.setSelectionRange(input.value.length, input.value.length);
                                }
                              }, 0);
                            }
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
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      const input = e.target as HTMLInputElement;
                      const cursorPosition = input.selectionStart || 0;
                      const currentValue = input.value;
                      
                      // If cursor is right after a dash and there's no selection
                      if (cursorPosition > 0 && currentValue[cursorPosition - 1] === '-' && input.selectionStart === input.selectionEnd) {
                        e.preventDefault();
                        // Remove the dash and the character before it
                        const newValue = currentValue.slice(0, cursorPosition - 2) + currentValue.slice(cursorPosition);
                        setLocalActaNumber(newValue);
                        
                        // Update Mesa field if we're editing the first 6 digits
                        const parts = newValue.split('-');
                        if (parts[0] && parts[0].length <= 6) {
                          setLocalMesaNumber(parts[0]);
                        }
                        
                        // Set cursor position after the deletion
                        setTimeout(() => {
                          input.setSelectionRange(cursorPosition - 2, cursorPosition - 2);
                        }, 0);
                      }
                    }
                  }}
                  onChange={(e) => {
                    const input = e.target as HTMLInputElement;
                    const newValue = e.target.value.toUpperCase();
                    const oldValue = localActaNumber;
                    const cursorPosition = input.selectionStart || 0;
                    
                    // Allow direct editing while maintaining format
                    let formattedValue = newValue;
                    
                    // Remove invalid characters but preserve structure
                    formattedValue = formattedValue.replace(/[^0-9A-Z\-]/g, '');
                    
                    // Detect if this is normal editing (backspace/delete/typing within first 6 digits)
                    const isNormalEditing = Math.abs(newValue.length - oldValue.length) === 1 && cursorPosition <= 6;
                    
                    // Validate the format structure
                    const parts = formattedValue.split('-');
                    
                    if (parts.length === 1) {
                      // Only first part (up to 6 digits)
                      const digits = parts[0].replace(/[^0-9]/g, '');
                      if (digits.length <= 6) {
                        formattedValue = digits;
                        // Sync with Mesa field (including when digits are removed)
                        setLocalMesaNumber(digits);
                        
                        // Preserve cursor position for normal editing
                        if (isNormalEditing) {
                          cursorPositionRef.current = cursorPosition;
                          shouldPreserveCursorRef.current = true;
                        }
                        
                        // Auto-add first dash when reaching 6 digits
                        if (digits.length === 6 && !newValue.includes('-')) {
                          formattedValue = digits + '-';
                          cursorPositionRef.current = digits.length + 1;
                          shouldPreserveCursorRef.current = true;
                        }
                      } else {
                        return; // Don't update if too many digits
                      }
                    } else if (parts.length === 2) {
                      // First part + second part
                      const firstPart = parts[0].replace(/[^0-9]/g, '').slice(0, 6);
                      const secondPart = parts[1].replace(/[^0-9]/g, '').slice(0, 2);
                      
                      if (firstPart.length >= 1 && firstPart.length <= 6) {
                        formattedValue = firstPart + '-' + secondPart;
                        // Sync with Mesa field
                        setLocalMesaNumber(firstPart);
                        
                        // Preserve cursor position for editing within first part
                        if (isNormalEditing && cursorPosition <= 6) {
                          cursorPositionRef.current = cursorPosition;
                          shouldPreserveCursorRef.current = true;
                        }
                        
                        // Auto-add second dash when reaching 2 digits in second part
                        if (secondPart.length === 2 && !newValue.endsWith('-') && newValue.split('-').length === 2) {
                          formattedValue = firstPart + '-' + secondPart + '-';
                          cursorPositionRef.current = formattedValue.length;
                          shouldPreserveCursorRef.current = true;
                        }
                      } else {
                        return; // Don't update if first part incomplete
                      }
                    } else if (parts.length === 3) {
                      // Full format
                      const firstPart = parts[0].replace(/[^0-9]/g, '').slice(0, 6);
                      const secondPart = parts[1].replace(/[^0-9]/g, '').slice(0, 2);
                      const thirdPart = parts[2].replace(/[^A-Z]/g, '').slice(0, 1);
                      
                      if (firstPart.length >= 1 && firstPart.length <= 6 && secondPart.length <= 2) {
                        formattedValue = firstPart + '-' + secondPart + '-' + thirdPart;
                        // Sync with Mesa field
                        setLocalMesaNumber(firstPart);
                        
                        // Preserve cursor position for editing within first part
                        if (isNormalEditing && cursorPosition <= 6) {
                          cursorPositionRef.current = cursorPosition;
                          shouldPreserveCursorRef.current = true;
                        }
                      } else {
                        return; // Don't update if format invalid
                      }
                    } else {
                      return; // Too many parts, don't update
                    }
                    
                    // Only update if within expected length
                    if (formattedValue.length <= 11) {
                      setLocalActaNumber(formattedValue);
                    }
                  }}
                      className="max-w-32 px-0.5 pr-8 text-center font-semibold"
                    />
                    {/* Dropdown Button */}
                    <button
                      type="button"
                      onClick={() => setShowActaDropdown(!showActaDropdown)}
                      className="absolute right-0 top-0 h-full px-2 hover:bg-gray-200 rounded-r transition-colors"
                      title="Ver actas guardadas"
                    >
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* Dropdown Menu */}
                    {showActaDropdown && categoryActas && categoryActas.length > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="py-1">
                          {categoryActas
                            .filter((acta, index) => {
                              // Show acta if it has an acta number OR if it's not the current acta
                              // This hides only the current empty acta
                              if (index === currentActaIndex && !acta.actaNumber && acta.mesaNumber === 0) {
                                return false;
                              }
                              return true;
                            })
                            .map((acta, originalIndex) => {
                              // Find the original index in the unfiltered array
                              const index = categoryActas.indexOf(acta);
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
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 transition-colors ${
                                index === currentActaIndex ? 'bg-blue-100 font-semibold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {acta.actaNumber || (index === currentActaIndex ? '' : 'Sin número')}
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
                    <Select
                      value={selectedLocation.jee || ""}
                      onValueChange={onJeeChange}
                    >
                      <SelectTrigger className="w-47 h-8">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {jeeOptions.map((jee) => (
                          <SelectItem key={jee} value={jee}>
                            {jee}
                          </SelectItem>
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

                  {/* Total de Ciudadanos que Votaron Display (always non-editable, linked to entries or preloaded) */}
                  <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                    <label className="text-sm font-medium text-gray-700 flex items-center pr-2" title="TOTAL DE CIUDADANOS QUE VOTARON">TCV</label>
                    <Input
                      type="number"
                      value={tcv !== null ? tcv : entries.length}
                      readOnly
                      disabled
                      className="max-w-20 text-center font-semibold bg-gray-200 text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </>
              )}
              
              {/* Total Cédulas Recibidas Input */}
              {/* <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">Total de Votantes</label>
                <Input
                  type="number"
                  min={1}
                  value={localTotalCedulasRecibidas || ""}
                  onChange={(e) => setLocalTotalCedulasRecibidas(parseInt(e.target.value) || 0)}
                  className="max-w-20 text-center font-semibold"
                  placeholder="0"
                />
              </div> */}

              {/* Save Button */}
              {!isMesaDataSaved ? (
                <Button
                  onClick={handleSaveMesaData}
                  disabled={!isBloque1Enabled}
                  className={`px-6 py-2 rounded font-medium ${
                    !isBloque1Enabled
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-800 hover:bg-green-700 text-white"
                  }`}
                >
                  Iniciar
                </Button>
              ) : !isFormFinalized ? (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded font-medium text-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sesión Iniciada
                </div>
              ) : null}
              
              {/* Finalize Button */}
              {!isFormFinalized ? (
                <Button
                  onClick={handleFinalizeForm}
                  disabled={!isMesaDataSaved}
                  className={`px-6 py-2 rounded font-medium ${
                    !isMesaDataSaved
                      ? "bg-red-400 text-red-100 cursor-not-allowed hover:bg-red-400"
                      : "bg-red-800 hover:bg-red-700 text-white"
                  }`}
                >
                  Finalizar
                </Button>
              ) : (
                <div className="flex items-center gap-1 bg-red-100 text-red-800 px-2 py-1 rounded font-medium text-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sesión Finalizada
                </div>
              )}

              {/* Resumen Dropdown Menu - Only visible when form is finalized */}
              {isFormFinalized && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="px-6 py-2 rounded font-medium bg-red-800 hover:bg-red-700 text-white">
                      Opciones
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleVerActa}>
                      <FileCheck className="mr-2 h-4 w-4" />
                      Ver Acta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      // Create a new acta
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

            {/* Time Tracking Badges */}
            <div className="flex items-center gap-3">
              {/* Start Time */}
              {startTime && (
                <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium text-sm text-center">
                  <div className="font-semibold">Hora Inicio</div>
                  <div className="font-semibold">{formatTime(startTime)}</div>
                  {/* <div className="text-xs opacity-90">{formatDate(startTime)}</div> */}
                </div>
              )}
              
              {/* End Time */}
              {endTime && (
                <div className="bg-red-100 text-red-800 px-3 py-2 rounded-lg font-medium text-sm text-center">
                  <div className="font-semibold">Hora Fin</div>
                  <div className="font-semibold">{formatTime(endTime)}</div>
                  {/* <div className="text-xs opacity-90">{formatDate(endTime)}</div> */}
                </div>
              )}
              
              {/* Elapsed Time */}
              {startTime && !endTime && (
                <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg font-medium text-sm text-center">
                  <div className="font-semibold">En Progreso</div>
                  <div className="font-semibold">{formatElapsedTime(startTime, currentTime)}</div>
                </div>
              )}
              
              {/* Total Time (when finished) */}
              {startTime && endTime && (
                <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium text-sm text-center">
                  <div className="font-semibold">Tiempo Total</div>
                  <div className="font-semibold">{formatElapsedTime(startTime, endTime)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Location Dropdowns Row */}
          <div className="flex gap-4 items-center">
            {!isBloque1Enabled ? (
              // Display mode - show styled divs (when session started, after clicking Iniciar)
              <>
                {/* Departamento/Continente Display */}
                <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap">
                  <span className="text-sm font-medium text-orange-700">
                    {isInternationalLocation ? "Continente:" : "Departamento:"}
                  </span>
                  <span className="font-semibold text-orange-900 ml-1">{selectedLocation.departamento || "-"}</span>
                </div>

                {/* Provincia/País Display */}
                <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap">
                  <span className="text-sm font-medium text-orange-700">
                    {isInternationalLocation ? "País:" : "Provincia:"}
                  </span>
                  <span className="font-semibold text-orange-900 ml-1">{selectedLocation.provincia || "-"}</span>
                </div>

                {/* Distrito/Ciudad Display */}
                <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 whitespace-nowrap">
                  <span className="text-sm font-medium text-orange-700">
                    {isInternationalLocation ? "Ciudad:" : "Distrito:"}
                  </span>
                  <span className="font-semibold text-orange-900 ml-1">{selectedLocation.distrito || "-"}</span>
                </div>
              </>
            ) : (
              // Edit mode - show select dropdowns (before clicking Iniciar)
              <>
                {/* Departamento/Continente Dropdown */}
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
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provincia/País Dropdown */}
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
                        <SelectItem key={prov} value={prov}>
                          {prov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Distrito/Ciudad Dropdown */}
                <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                  <label className="text-sm font-medium text-gray-700 flex items-center pr-2">
                    {isInternationalLocation ? "Ciudad" : "Distrito"}
                  </label>
                  <Select
                    value={selectedLocation.distrito || undefined}
                    onValueChange={onDistritoChange}
                    disabled={areMesaFieldsLocked}
                  >
                    <SelectTrigger className={`w-64 h-8 ${areMesaFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder={isInternationalLocation ? "Seleccionar Ciudad" : "Seleccionar Distrito"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getDistritos(selectedLocation.departamento, selectedLocation.provincia).map((dist) => (
                        <SelectItem key={dist} value={dist}>
                          {dist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side layout: Progress bars on left (5/12), Table on right (7/12) */}
      <div className="grid grid-cols-12 gap-6 w-full">
        
        {/* Horizontal Progress Bars Summary - Left Side (5/12 width) */}
        <Card className="w-full col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold border-b-2 border-red-800 pb-2">
              RANKING ACTA - {categoryLabel?.toUpperCase() || category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const voteCount = calculateVoteData();
              const maxVotes = Math.max(...Object.values(voteCount), 1);
              const totalVotes = entries.length;
              
              const votesWithData = Object.entries(voteCount).filter(([, count]) => count > 0);
              
              if (votesWithData.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Sin votos registrados aún</p>
                    <p className="text-xs mt-1">Los resultados aparecerán aquí cuando agregue votos</p>
                  </div>
                );
              }
              
              return votesWithData
                .sort(([,a], [,b]) => b - a)
                .map(([party, count]) => {
                  const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                  const barWidth = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
                  
                  return (
                    <div key={party} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <strong className="text-sm font-semibold">{party}:</strong>
                          <span className="text-sm font-semibold text-red-800">{count} votos</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-6 overflow-hidden relative">
                          <div 
                            className="h-full bg-red-800 transition-all duration-700 ease-out flex items-center justify-end pr-2 text-white text-xs font-semibold"
                            style={{ width: `${barWidth}%` }}
                          >
                            {count}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {percentage.toFixed(1)}% del total
                        </div>
                      </div>
                    </div>
                  );
                });
            })()}
            
            {/* <div className="bg-red-800 text-white p-4 rounded-lg text-center font-semibold mt-4">
              Total Procesado: {entries.length}/{totalElectores} cédulas ({totalElectores > 0 ? ((entries.length / totalElectores) * 100).toFixed(1) : '0.0'}%)
            </div> */}
          </CardContent>
        </Card>

        {/* Entries Table - Right Side (7/12 width) */}
        <Card className="w-full col-span-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold border-b-2 border-red-800 pb-2 flex items-center justify-between gap-4">
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
                  disabled={entries.length !== localTotalElectores || isFormFinalized}
                  className={`max-w-20 text-center font-semibold border border-gray-300 ${entries.length !== localTotalElectores || isFormFinalized ? "opacity-50 cursor-not-allowed bg-gray-200" : "bg-white"}`}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-4">
                <span>VOTOS RECONTADOS</span>
                <Badge variant="default" className="bg-red-800 text-xl font-semibold">{entries.length} cédulas</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-0">
            <Table>
              <TableHeader>
                <TableRow className="text-white bg-red-800">
                  <TableHead className="text-white text-center font-semibold w-28">N° CÉDULA</TableHead>
                  <TableHead className="text-white font-semibold">INGRESAR VOTOS</TableHead>
                  {preferentialConfig.hasPreferential1 && (
                    <TableHead className="text-white w-32 text-center font-semibold">VOTO PREF. 1</TableHead>
                  )}
                  {preferentialConfig.hasPreferential2 && (
                    <TableHead className="text-white w-32 text-center font-semibold">VOTO PREF. 2</TableHead>
                  )}
                  <TableHead className="text-white w-32 text-center font-semibold">ACCIÓN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Form row */}
                <TableRow className="border-2 bg-red-50 border-red-800 w-28">
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
                          // Reset preferential votes if BLANCO or NULO is selected
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
                      className={`h-12 text-base ${
                        !isBloque2Enabled ? "opacity-50 cursor-not-allowed" : ""
                      }`}
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
                              : "text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        className={`h-12 px-6 text-base font-semibold ${
                          !newEntry.party || newEntry.party === "" || !isBloque2Enabled
                            ? "text-gray-400 bg-gray-300 cursor-not-allowed hover:bg-gray-300"
                            : "text-white bg-red-800 hover:bg-red-700 hover:cursor-pointer"
                        }`}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        AGREGAR
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                
                {[...entries].reverse().map((entry, index) => {
                  const isLastEntry = index === 0; // First item in reversed array is the last added entry
                  return (
                    <TableRow key={entries.length - 1 - index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="text-center font-medium w-28">{entry.tableNumber}</TableCell>
                      <TableCell className="py-3">{entry.party}</TableCell>
                      {preferentialConfig.hasPreferential1 && (
                        <TableCell className="text-center font-semibold">{entry.preferentialVote1 === 0 ? "-" : entry.preferentialVote1}</TableCell>
                      )}
                      {preferentialConfig.hasPreferential2 && (
                        <TableCell className="text-center font-semibold">{entry.preferentialVote2 === 0 ? "-" : entry.preferentialVote2}</TableCell>
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
      </div> {/* End grid container */}
    </div>
  );
}