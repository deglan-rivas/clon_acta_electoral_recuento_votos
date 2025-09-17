import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Combobox } from "./ui/combobox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Plus, X, Edit, Check } from "lucide-react";
import { type VoteEntry, politicalOrganizations } from "../data/mockData";
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
  selectedLocation: {
    departamento: string;
    provincia: string;
    distrito: string;
  };
  // totalCedulasRecibidas: number;
  onMesaDataChange: (mesa: number, acta:string, electores: number) => void;
  isFormFinalized?: boolean;
  onFormFinalizedChange?: (isFinalized: boolean) => void;
  isMesaDataSaved?: boolean;
  onMesaDataSavedChange?: (isSaved: boolean) => void;
  // Time tracking props
  startTime: Date | null;
  endTime: Date | null;
  currentTime: Date;
  onStartTimeChange: (time: Date | null) => void;
  onEndTimeChange: (time: Date | null) => void;
  onCurrentTimeChange: (time: Date) => void;
}

export function VoteEntryForm({ 
  category, categoryLabel, existingEntries = [], voteLimits, preferentialConfig, onEntriesChange, 
  mesaNumber, actaNumber, totalElectores, selectedLocation, onMesaDataChange, 
  isFormFinalized: externalIsFormFinalized, onFormFinalizedChange, 
  isMesaDataSaved: externalIsMesaDataSaved, onMesaDataSavedChange,
  startTime, endTime, currentTime, onStartTimeChange, onEndTimeChange, onCurrentTimeChange 
}: VoteEntryFormProps) {
  // Use existingEntries directly from parent (which comes from categoryData)
  const [entries, setEntries] = useState<VoteEntry[]>(existingEntries);

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

  // Update local state when parent values change
  useEffect(() => {
    if (mesaNumber > 0) {
      setLocalMesaNumber(mesaNumber.toString().padStart(6, '0'));
    }
    if (actaNumber > 0) {
      setLocalActaNumber(`${actaNumber.toString().padStart(6, '0')}-00-A`);
    }
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


  const handleAddEntry = () => {
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
    // Validation 1: Mesa number must be 6 digits, acta number must follow format, electores between 1-300
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
      toast.error("Total Electores debe estar entre 1 y 300", {
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
        const existingPdfUrl = './ACTA_RECUENTO_PRESIDENCIAL.pdf';
        const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        return firstPage.getSize();
      })();

      const labels: { [key: string]: { votes: number; x: number; y: number } } = {};
      let y_pos = height - 225.5;
      politicalOrganizations.forEach(org => {
        const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
        if (org.name === "BLANCO") {
          labels[partyName] = { votes: 0, x: 294.6, y: height - 1056 }; 
        } else if (org.name === "NULO") {
          labels[partyName] = { votes: 0, x: 294.6, y: height - 1068 };
        } else {
          labels[partyName] = { votes: 0, x: 444, y: y_pos };
          y_pos -= 21.1;
        }
      });

      const voteCount = calculateVoteData();
      for (const party in voteCount) {
        if (labels.hasOwnProperty(party)) {
          labels[party].votes = voteCount[party];
        }
      }

      console.log("Diccionario de etiquetas de votos con coordenadas:", labels);

      const existingPdfUrl = './ACTA_RECUENTO_PRESIDENCIAL.pdf';
      const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const horaFin = formatTime(finalizationTime);
      const fechaFin = formatDate(finalizationTime);
      const dateTimeString = `${horaFin} del ${fechaFin}`;

      const data = [
        { texto: selectedLocation.departamento.toUpperCase(), x: 45, y: height - 175, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.provincia.toUpperCase(), x: 230, y: height - 175, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.distrito.toUpperCase(), x: 410, y: height - 175, color: rgb(0, 0, 0), size: 14 },
        { texto: dateTimeString, x: 100, y: height - 1170, color: rgb(0, 0, 0), size: 10 },
        { texto: `${entries.length}`, x: 763, y: height - 147, color: rgb(0, 0, 0), size: 15 },
        { texto: `${entries.length}`, x: 294.6, y: height - 1080, color: rgb(0, 0, 0), size: 15 },
      ];

      if (startTime) {
        const horaInicio = formatTime(startTime);
        const fechaInicio = formatDate(startTime);
        const startDateTimeString = `${horaInicio} del ${fechaInicio}`;
        data.push({ texto: startDateTimeString, x: 100, y: height - 1151, color: rgb(0, 0, 0), size: 10 });
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
      const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `acta_presidencial_${localMesaNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("PDF generado y descarga iniciada.");

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
            voteCount[partyKey] = 0;
            matrix[partyKey] = { total: 0 };
            for (let i = 1; i <= 30; i++) {
                matrix[partyKey][i] = 0;
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
        const existingPdfUrl = './ACTA_SENADORES_NACIONAL.pdf';
        const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        return firstPage.getSize();
      })();
 
      const { voteCount, matrix } = calculateVoteDataForPdf();

      const labels: { [key: string]: { votes: number; x: number; y: number } } = {};
      let y_pos = height - 150;
      politicalOrganizations.forEach(org => {
        const partyName = org.order ? `${org.order} | ${org.name}` : org.name;
        if (org.name === "BLANCO") {
          labels[partyName] = { votes: 0, x: 222.6, y: height - 760.8 }; 
        } else if (org.name === "NULO") {
          labels[partyName] = { votes: 0, x: 222.6, y: height - 790.4 };
        } else {
          labels[partyName] = { votes: 0, x: 230, y: y_pos };
          y_pos -= 15.132;
        }
      });

      for (const party in voteCount) {
        if (labels.hasOwnProperty(party)) {
          labels[party].votes = voteCount[party];
        }
      }

      console.log("Diccionario de etiquetas de votos con coordenadas (Senadores Nacional):", labels);

      const existingPdfUrl = './ACTA_SENADORES_NACIONAL.pdf';
      const existingPdfBytes = await fetch(existingPdfUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      const horaFin = formatTime(finalizationTime);
      const fechaFin = formatDate(finalizationTime);

      const data = [
        { texto: selectedLocation.departamento.toUpperCase(), x: 140, y: height - 103, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.provincia.toUpperCase(), x: 415, y: height - 103, color: rgb(0, 0, 0), size: 14 },
        { texto: selectedLocation.distrito.toUpperCase(), x: 688, y: height - 103, color: rgb(0, 0, 0), size: 14 },
        { texto: horaFin, x: 345, y: height - 743, color: rgb(0, 0, 0), size: 10 },
        { texto: fechaFin, x: 460, y: height - 743, color: rgb(0, 0, 0), size: 10 },
        { texto: `${entries.length}`, x: 1120, y: height - 114, color: rgb(0, 0, 0), size: 15 },
        { texto: `${entries.length}`, x: 222.6, y: height - 820, color: rgb(0, 0, 0), size: 15 },
      ];

      if (startTime) {
        const horaInicio = formatTime(startTime);
        const fechaInicio = formatDate(startTime);
        data.push({ texto: horaInicio, x: 120, y: height - 115, color: rgb(0, 0, 0), size: 10 });
        data.push({ texto: fechaInicio, x: 205, y: height - 115, color: rgb(0, 0, 0), size: 10 });
      }

      for (const partyName in labels) {
        if (labels.hasOwnProperty(partyName)) {
          const label = labels[partyName];
          data.push({ texto: `${label.votes}`, x: label.x, y: label.y, color: rgb(0, 0, 0), size: 15 });
        }
      }

      // START: Add preferential vote cross-table
      let tableY = height - 150; // Starting Y position for the table.
      const tableXStart = 269;
      const cellWidth = 22.95;
      let lineHeight = 15.132;
      let fontSize = 13;


      // Draw rows
      politicalOrganizations.forEach(org => {
          const partyKey = org.order ? `${org.order} | ${org.name}` : org.name;
          const isBlancoOrNulo = org.name === 'BLANCO' || org.name === 'NULO';

          if (!isBlancoOrNulo && matrix[partyKey]) {
              if (tableY < 50) return; // Stop if we're at the bottom of the page

              const partyMatrix = matrix[partyKey];
              for (let i = 1; i <= 30; i++) {
                  const count = partyMatrix[i] || 0;
                  if (count > 0) {
                      firstPage.drawText(`${count}`, { x: tableXStart + ((i-1) * cellWidth), y: tableY, font: helveticaBoldFont, size: fontSize, color: rgb(0, 0, 0) });
                  }
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
      const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `acta_senadores_nacional_${localMesaNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("PDF de Senadores Nacional generado y descarga iniciada.");

    } catch (error) {
      console.error("Error al generar el PDF de Senadores Nacional:", error);
    }
  };


  // Handle finalize form - disable all inputs permanently
  const handleFinalizeForm = async () => {
    console.log("Finalizando formulario...")
    const now = new Date();
    switch (category) {
      case "presidencial":
        await handleGeneratePdfPresidencial(now, startTime); // Generar PDF al finalizar
        break;
      case "senadoresNacional":
        await handleGeneratePdfSenadoresNacional(now, startTime);
        break;
      case "senadoresRegional":
        console.log("Categoría es Senadores Regional");
        break;
      case "diputados":
        console.log("Categoría es Diputados");
        break;
      case "parlamentoAndino":
        console.log("Categoría es Parlamento Andino");
        break;
      default:
        console.log("Categoría desconocida:", category);
        break;
    }
    // const conteoVotos = calculateVoteData();
    // console.log("Conteo de votos por partido:", conteoVotos);
    onEndTimeChange(now); // Capture end time
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
          <div className="flex justify-between items-center gap-6">
            {/* Input Fields Container */}
            <div className="flex gap-4 items-center">
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
                  disabled={!isBloque1Enabled}
                  className={`max-w-24 px-0.5 text-center font-semibold ${
                    !isBloque1Enabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Acta Number Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">N° Acta</label>
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
                  disabled={!isBloque1Enabled}
                  className={`max-w-32 px-0.5 text-center font-semibold ${
                    !isBloque1Enabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              {/* Total Electores Input */}
              <div className="bg-gray-50 p-2 rounded border border-gray-300 flex flex-row">
                <label className="text-sm font-medium text-gray-700 flex items-center pr-2">Total Electores</label>
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
                  disabled={!isBloque1Enabled}
                  className={`max-w-20 text-center font-semibold ${
                    !isBloque1Enabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""
                  }`}
                  placeholder="0"
                />
              </div>
              
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
              ) : (
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded font-medium text-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sesión Iniciada
                </div>
              )}
              
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
        </CardContent>
      </Card>

      {/* Side-by-side layout: Progress bars on left (5/12), Table on right (7/12) */}
      <div className="grid grid-cols-12 gap-6 w-full">
        
        {/* Horizontal Progress Bars Summary - Left Side (5/12 width) */}
        <Card className="w-full col-span-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold border-b-2 border-red-800 pb-2">
              RESUMEN ACTA - {categoryLabel?.toUpperCase() || category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}
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
            <CardTitle className="text-lg font-semibold border-b-2 border-red-800 pb-2 flex items-center justify-start gap-4">
              
              CÉDULAS RECONTADAS
              <Badge variant="default" className="bg-red-800 text-xl font-semibold">{entries.length} cédulas</Badge>
              {entries.length - localTotalElectores > 0 ? <Badge variant="default" className="bg-yellow-100 text-xl font-semibold text-yellow-800">{entries.length - localTotalElectores} {(entries.length - localTotalElectores) > 1 ? "cédulas" : "cédula"} en exceso</Badge> : null}
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
                      options={politicalOrganizations.map((org) => ({
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