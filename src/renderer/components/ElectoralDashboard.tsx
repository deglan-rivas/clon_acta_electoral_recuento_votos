import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ElectoralCountTable } from "./ElectoralCountTable";
import { VoteEntryForm } from "./VoteEntryForm";
import { mockElectoralData } from "../data/mockData";
import { Vote, Users, Building2, Globe, Crown, FileText, BarChart3, Settings } from "lucide-react";
import logoJne from '/logo_jne.svg';
import csvFile from '/TB_UBIGEOS.csv?url';
import circunscripcionCsvFile from '/circunscripcion_electoral_por_categoria.csv?url';
import jeeCsvFile from '/jee.csv?url';
import mesaElectoralCsvFile from '/mesa_electoral_data.csv?url';
import { SettingsModal } from "./SettingsModal";
import { toast } from "sonner";

// Type for Circunscripción Electoral data
type CircunscripcionRecord = {
  category: string;
  departamento: string;
  provincia: string;
  circunscripcion_electoral: string;
};
import { Button } from "./ui/button";
import {
  getActiveCategory,
  saveActiveCategory,
  getAllCategoryData,
  saveCategoryData,
  type CategoryData,
} from "../lib/localStorage";

// Types for Ubigeo data
type UbigeoRecord = {
  ubigeo_reniec: string;
  ubigeo_inei: string;
  departamento_inei: string;
  departamento: string;
  provincia_inei: string;
  provincia: string;
  distrito: string;
};

// Type for Mesa Electoral data
type MesaElectoralRecord = {
  mesa_number: string;
  tipo_ubicacion: string;
  circunscripcion_electoral: string;
  departamento: string;
  provincia: string;
  distrito: string;
};

export function ElectoralDashboard() {
  const [activeCategory, setActiveCategory] = useState(() => getActiveCategory());
  const [categoryData, setCategoryData] = useState(() => getAllCategoryData());
  
  // Ubigeo state
  const [ubigeoData, setUbigeoData] = useState<UbigeoRecord[]>([]);
  const [circunscripcionData, setCircunscripcionData] = useState<CircunscripcionRecord[]>([]);
  const [jeeData, setJeeData] = useState<string[]>([]);
  const [mesaElectoralData, setMesaElectoralData] = useState<MesaElectoralRecord[]>([]);

  // Get location from current category data
  const getCurrentCategoryData = (): CategoryData => {
    return categoryData[activeCategory];
  };

  // Function to lookup mesa electoral data
  const getMesaElectoralInfo = (mesaNumber: string): MesaElectoralRecord | null => {
    if (!mesaNumber || mesaElectoralData.length === 0) return null;

    const paddedMesaNumber = mesaNumber.padStart(6, '0');
    const mesaRecord = mesaElectoralData.find(record => record.mesa_number === paddedMesaNumber);
    return mesaRecord || null;
  };

  const currentLocationData = getCurrentCategoryData()?.selectedLocation || { departamento: '', provincia: '', distrito: '', circunscripcionElectoral: '', jee: '' };
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>(currentLocationData.departamento);
  const [selectedProvincia, setSelectedProvincia] = useState<string>(currentLocationData.provincia);
  const [selectedDistrito, setSelectedDistrito] = useState<string>(currentLocationData.distrito);
  const [selectedJee, setSelectedJee] = useState<string>(currentLocationData.jee);
  const [selectedCircunscripcionElectoral, setSelectedCircunscripcionElectoral] = useState<string>(currentLocationData.circunscripcionElectoral);

  // Current time state (not persisted per category)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load Ubigeo data from CSV
  useEffect(() => {
    const loadUbigeoData = async () => {
      try {
        const response = await fetch(csvFile);
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header
        const records: UbigeoRecord[] = lines
          .filter(line => line.trim())
          .map(line => {
            const [ubigeo_reniec, ubigeo_inei, departamento_inei, departamento, provincia_inei, provincia, distrito] = line.split(';');
            return {
              ubigeo_reniec,
              ubigeo_inei,
              departamento_inei,
              departamento,
              provincia_inei,
              provincia,
              distrito
            };
          });
        setUbigeoData(records);
      } catch (error) {
        console.error('Error loading ubigeo data:', error);
      }
    };

    const loadCircunscripcionData = async () => {
      try {
        const response = await fetch(circunscripcionCsvFile);
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header
        const records: CircunscripcionRecord[] = lines
          .filter(line => line.trim())
          .map(line => {
            const [category, circunscripcion_electoral] = line.split(';');
            return {
              category: category?.trim() || '',
              departamento: '', // Not used in this CSV
              provincia: '', // Not used in this CSV
              circunscripcion_electoral: circunscripcion_electoral?.trim() || ''
            };
          });
        setCircunscripcionData(records);
      } catch (error) {
        console.error('Error loading circunscripción electoral data:', error);
      }
    };

    const loadJeeData = async () => {
      try {
        const response = await fetch(jeeCsvFile);
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header
        const jeeList = lines
          .filter(line => line.trim())
          .map(line => line.trim());
        setJeeData(jeeList.sort());
      } catch (error) {
        console.error('Error loading JEE data:', error);
      }
    };

    const loadMesaElectoralData = async () => {
      try {
        const response = await fetch(mesaElectoralCsvFile);
        const text = await response.text();
        const lines = text.split('\n').slice(1); // Skip header
        const records: MesaElectoralRecord[] = lines
          .filter(line => line.trim())
          .map(line => {
            const [mesa_number, tipo_ubicacion, circunscripcion_electoral, departamento, provincia, distrito] = line.split(';');
            return {
              mesa_number: mesa_number?.trim() || '',
              tipo_ubicacion: tipo_ubicacion?.trim() || '',
              circunscripcion_electoral: circunscripcion_electoral?.trim() || '',
              departamento: departamento?.trim() || '',
              provincia: provincia?.trim() || '',
              distrito: distrito?.trim() || ''
            };
          });
        setMesaElectoralData(records);
      } catch (error) {
        console.error('Error loading mesa electoral data:', error);
      }
    };

    loadUbigeoData();
    loadCircunscripcionData();
    loadJeeData();
    loadMesaElectoralData();
  }, []);

  // Time tracking interval - update currentTime every second
  useEffect(() => {
    const currentCategoryData = getCurrentCategoryData();
    const startTime = currentCategoryData?.startTime ? new Date(currentCategoryData.startTime) : null;
    const endTime = currentCategoryData?.endTime ? new Date(currentCategoryData.endTime) : null;

    if (startTime && !endTime) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeCategory, categoryData]);


  // Save activeCategory to localStorage when it changes
  useEffect(() => {
    saveActiveCategory(activeCategory);
  }, [activeCategory]);

  // Save entire categoryData to localStorage when it changes
  useEffect(() => {
    Object.entries(categoryData).forEach(([category, data]) => {
      saveCategoryData(category, data);
    });
  }, [categoryData]);

  // Sync location state when active category changes or when category data is updated
  useEffect(() => {
    const currentLocationData = getCurrentCategoryData()?.selectedLocation || { departamento: '', provincia: '', distrito: '', circunscripcionElectoral: '', jee: '' };
    setSelectedDepartamento(currentLocationData.departamento);
    setSelectedProvincia(currentLocationData.provincia);
    setSelectedDistrito(currentLocationData.distrito);
    setSelectedJee(currentLocationData.jee);
    setSelectedCircunscripcionElectoral(currentLocationData.circunscripcionElectoral);
  }, [activeCategory, categoryData]);

  // Auto-set circunscripción electoral when category changes and data is available
  useEffect(() => {
    if (circunscripcionData.length > 0) {
      const options = getCircunscripcionElectoralOptions();

      // For specific categories with only one option, auto-select it
      if (options.length === 1 && (activeCategory === 'presidencial' || activeCategory === 'parlamentoAndino' || activeCategory === 'senadoresNacional')) {
        const autoSelectedCirc = options[0];
        if (selectedCircunscripcionElectoral !== autoSelectedCirc) {
          setSelectedCircunscripcionElectoral(autoSelectedCirc);

          // Update localStorage with auto-selected circunscripción
          updateCurrentCategoryData({
            selectedLocation: {
              departamento: selectedDepartamento,
              provincia: selectedProvincia,
              distrito: selectedDistrito,
              circunscripcionElectoral: autoSelectedCirc,
              jee: selectedJee
            }
          });
        }
      } else if (options.length > 0) {
        // For other categories (senadoresRegional, diputados), clear the selection
        // so user can manually select from available departmental options
        setSelectedCircunscripcionElectoral('');

        // Also update localStorage to clear the selection
        updateCurrentCategoryData({
          selectedLocation: {
            departamento: selectedDepartamento,
            provincia: selectedProvincia,
            distrito: selectedDistrito,
            circunscripcionElectoral: '',
            jee: selectedJee
          }
        });
      }
    }
  }, [activeCategory, circunscripcionData]);

  // Helper functions to get current category data
  const updateCurrentCategoryData = (updates: Partial<CategoryData>): void => {
    setCategoryData(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        ...updates,
      }
    }));
  };

  // Function to determine circunscripción electoral based on category, departamento and provincia
  const getCircunscripcionElectoral = (category: string, departamento: string, provincia: string) => {
    if (circunscripcionData.length === 0) return "";

    // First check if category exists in CSV
    const categoryExists = circunscripcionData.some(record => record.category === category);

    if (categoryExists) {
      // Category found in CSV - use category-specific logic
      const categoryMatch = circunscripcionData.find(record =>
        record.category === category
      );
      if (categoryMatch) return categoryMatch.circunscripcion_electoral;
    }

    // Category not found in CSV or fallback - use regional logic with empty category
    if (!departamento) return "";

    // For Lima, provincia selection is required
    if (departamento.toUpperCase() === "LIMA") {
      if (!provincia) {
        return ""; // Return empty if Lima is selected but no provincia yet
      }

      if (provincia.toUpperCase() === "LIMA") {
        // Find LIMA METROPOLITANA record
        const match = circunscripcionData.find(record =>
          record.category === "" && // Regional records have empty category
          record.departamento.toUpperCase() === "LIMA" &&
          record.provincia.toUpperCase() === "LIMA"
        );
        return match ? match.circunscripcion_electoral : "LIMA METROPOLITANA";
      } else {
        // Find LIMA PROVINCIAS record (provincia is empty for this case)
        const match = circunscripcionData.find(record =>
          record.category === "" && // Regional records have empty category
          record.departamento.toUpperCase() === "LIMA" &&
          record.provincia === ""
        );
        return match ? match.circunscripcion_electoral : "LIMA PROVINCIAS";
      }
    }

    // For other departamentos, match where provincia is empty and category is empty (regional)
    const match = circunscripcionData.find(record =>
      record.category === "" && // Regional records have empty category
      record.departamento.toUpperCase() === departamento.toUpperCase() &&
      record.provincia === ""
    );

    return match ? match.circunscripcion_electoral : departamento.toUpperCase();
  };

  // Get current values from categoryData
  const currentCategoryData = getCurrentCategoryData();
  const activeSection = currentCategoryData?.activeSection || 'recuento';
  const voteLimits = currentCategoryData?.voteLimits || { preferential1: 30, preferential2: 30 };
  const mesaNumber = currentCategoryData?.mesaNumber || 0;
  const actaNumber = currentCategoryData?.actaNumber || '';
  const totalElectores = currentCategoryData?.totalElectores || 0;
  const isFormFinalized = currentCategoryData?.isFormFinalized || false;
  const isMesaDataSaved = currentCategoryData?.isMesaDataSaved || false;
  const startTime = currentCategoryData?.startTime ? new Date(currentCategoryData.startTime) : null;
  const endTime = currentCategoryData?.endTime ? new Date(currentCategoryData.endTime) : null;

  // Location fields should be disabled when session is started or finalized
  const areLocationFieldsDisabled = isMesaDataSaved || isFormFinalized;

  // Define preferential vote configuration by category
  const getPreferentialVoteConfig = (category: string) => {
    switch (category) {
      case "presidencial":
        return { hasPreferential1: false, hasPreferential2: false };
      case "senadoresNacional":
        return { hasPreferential1: true, hasPreferential2: true };
      case "senadoresRegional":
        return { hasPreferential1: true, hasPreferential2: false };
      case "diputados":
        return { hasPreferential1: true, hasPreferential2: true };
      case "parlamentoAndino":
        return { hasPreferential1: true, hasPreferential2: true };
      default:
        return { hasPreferential1: false, hasPreferential2: false };
    }
  };

  const categories = [
    { key: "presidencial", label: "Presidencial", icon: Crown },
    { key: "senadoresNacional", label: "Senadores Nacional", icon: Building2 },
    { key: "senadoresRegional", label: "Senadores Regional", icon: Users },
    { key: "diputados", label: "Diputados", icon: Vote },
    { key: "parlamentoAndino", label: "Parlamento Andino", icon: Globe },
  ];

  const sections = [
    { key: "ingreso", label: "Ingreso de Votos", icon: FileText },
    { key: "recuento", label: "Resumen Recuento", icon: BarChart3 },
  ];

  // Check if current selection is international
  const isInternationalLocation = selectedCircunscripcionElectoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO';

  // Get unique departamentos (or continentes for international)
  const getDepartamentos = () => {
    if (isInternationalLocation) {
      // Get continentes from mesa electoral data
      const continentes = mesaElectoralData
        .filter(record => record.circunscripcion_electoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO')
        .map(record => record.departamento?.trim() || '');
      const unique = Array.from(new Set(continentes))
        .filter(cont => cont !== '');
      return unique.sort();
    } else {
      // Get departamentos from ubigeo data (national)
      const unique = Array.from(new Set(ubigeoData.map(record => record.departamento?.trim() || '')))
        .filter(dept => dept !== '');
      return unique.sort();
    }
  };

  // Get provincias for selected departamento (or países for international)
  const getProvincias = (departamento: string) => {
    if (!departamento) return [];

    if (isInternationalLocation) {
      // Get países for the selected continente from mesa electoral data
      const filtered = mesaElectoralData.filter(
        record => record.circunscripcion_electoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO' &&
                 record.departamento === departamento
      );
      const unique = Array.from(new Set(filtered.map(record => record.provincia?.trim() || '')))
        .filter(prov => prov !== '');
      return unique.sort();
    } else {
      // Get provincias from ubigeo data (national)
      const filtered = ubigeoData.filter(record => record.departamento === departamento);
      const unique = Array.from(new Set(filtered.map(record => record.provincia?.trim() || '')))
        .filter(prov => prov !== '');
      return unique.sort();
    }
  };

  // Get distritos for selected provincia (or ciudades for international)
  const getDistritos = (departamento: string, provincia: string) => {
    if (!departamento || !provincia) return [];

    if (isInternationalLocation) {
      // Get ciudades for the selected país from mesa electoral data
      const filtered = mesaElectoralData.filter(
        record => record.circunscripcion_electoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO' &&
                 record.departamento === departamento &&
                 record.provincia === provincia
      );
      const unique = Array.from(new Set(filtered.map(record => record.distrito?.trim() || '')))
        .filter(distrito => distrito !== '');
      return unique.sort();
    } else {
      // Get distritos from ubigeo data (national)
      const filtered = ubigeoData.filter(record =>
        record.departamento === departamento && record.provincia === provincia
      );
      const unique = Array.from(new Set(filtered.map(record => record.distrito?.trim() || '')))
        .filter(distrito => distrito !== '');
      return unique.sort();
    }
  };

  // Get available circunscripciones for current category
  const getCircunscripcionElectoralOptions = () => {
    // For specific categories (presidencial, parlamentoAndino, senadoresNacional),
    // show only their specific circunscripción
    if (activeCategory === 'presidencial' || activeCategory === 'parlamentoAndino' || activeCategory === 'senadoresNacional') {
      const categorySpecific = circunscripcionData.find(record => record.category === activeCategory);
      if (categorySpecific && categorySpecific.circunscripcion_electoral && categorySpecific.circunscripcion_electoral.trim() !== '') {
        return [categorySpecific.circunscripcion_electoral];
      }
      // Fallback in case the specific category isn't found
      return [];
    }

    // For all other categories (senadoresRegional, diputados, etc.),
    // show all circunscripciones where category is empty (departmental ones)
    const departmental = circunscripcionData
      .filter(record => !record.category || record.category.trim() === "")
      .map(record => record.circunscripcion_electoral)
      .filter(circ => circ && circ.trim() !== ''); // Filter out empty strings

    return [...new Set(departmental)].sort();
  };

  // Handle departamento change
  const handleDepartamentoChange = (value: string) => {
    setSelectedDepartamento(value);
    setSelectedProvincia("");
    setSelectedDistrito("");
    setSelectedJee("");

    // Update localStorage with new location data
    updateCurrentCategoryData({
      selectedLocation: {
        departamento: value,
        provincia: "",
        distrito: "",
        circunscripcionElectoral: selectedCircunscripcionElectoral,
        jee: ""
      }
    });
  };

  // Handle provincia change
  const handleProvinciaChange = (value: string) => {
    setSelectedProvincia(value);
    setSelectedDistrito("");
    setSelectedJee("");

    // Update localStorage with new location data
    updateCurrentCategoryData({
      selectedLocation: {
        departamento: selectedDepartamento,
        provincia: value,
        distrito: "",
        circunscripcionElectoral: selectedCircunscripcionElectoral,
        jee: ""
      }
    });
  };

  // Handle distrito change
  const handleDistritoChange = (value: string) => {
    setSelectedDistrito(value);

    // Update localStorage with new location data
    updateCurrentCategoryData({
      selectedLocation: {
        departamento: selectedDepartamento,
        provincia: selectedProvincia,
        distrito: value,
        circunscripcionElectoral: selectedCircunscripcionElectoral,
        jee: selectedJee
      }
    });
  };

  // Handle JEE change
  const handleJeeChange = (value: string) => {
    setSelectedJee(value);

    // Update localStorage with new location data
    updateCurrentCategoryData({
      selectedLocation: {
        departamento: selectedDepartamento,
        provincia: selectedProvincia,
        distrito: selectedDistrito,
        circunscripcionElectoral: selectedCircunscripcionElectoral,
        jee: value
      }
    });
  };

  // Handle Circunscripción Electoral change
  const handleCircunscripcionElectoralChange = (value: string) => {
    const wasInternational = selectedCircunscripcionElectoral === 'PERUANOS RESIDENTES EN EL EXTRANJERO';
    const isNowInternational = value === 'PERUANOS RESIDENTES EN EL EXTRANJERO';

    // Clear location fields if switching between national and international
    if (wasInternational !== isNowInternational) {
      setSelectedDepartamento("");
      setSelectedProvincia("");
      setSelectedDistrito("");
      setSelectedJee("");

      setSelectedCircunscripcionElectoral(value);

      // Update localStorage with cleared location data
      updateCurrentCategoryData({
        selectedLocation: {
          departamento: "",
          provincia: "",
          distrito: "",
          circunscripcionElectoral: value,
          jee: ""
        }
      });
    } else {
      setSelectedCircunscripcionElectoral(value);

      // Update localStorage with current location data
      updateCurrentCategoryData({
        selectedLocation: {
          departamento: selectedDepartamento,
          provincia: selectedProvincia,
          distrito: selectedDistrito,
          circunscripcionElectoral: value,
          jee: selectedJee
        }
      });
    }
  };

  // Show location dropdowns to display auto-populated values from mesa number
  const showLocationDropdowns = activeSection === 'ingreso' || activeSection === 'recuento';

  const renderSection = () => {
    const data = mockElectoralData[activeCategory];
    const preferentialConfig = getPreferentialVoteConfig(activeCategory);
    const currentCategoryData = getCurrentCategoryData();
    
    switch (activeSection) {
      case "recuento":
        return <ElectoralCountTable
          data={data}
          category={activeCategory}
          selectedLocation={{
            departamento: selectedDepartamento,
            provincia: selectedProvincia,
            distrito: selectedDistrito,
            jee: selectedJee
          }}
          circunscripcionElectoral={selectedCircunscripcionElectoral}
          totalElectores={totalElectores}
          // totalCedulasRecibidas={totalCedulasRecibidas}
        />;
      case "ingreso":
        return <VoteEntryForm
          key={`${activeCategory}`}
          category={activeCategory}
          categoryLabel={categories.find(cat => cat.key === activeCategory)?.label}
          existingEntries={currentCategoryData?.voteEntries || []}
          voteLimits={voteLimits}
          preferentialConfig={preferentialConfig}
          onEntriesChange={(entries) => updateCurrentCategoryData({ voteEntries: entries })}
          mesaNumber={mesaNumber}
          actaNumber={actaNumber}
          totalElectores={totalElectores}
          selectedLocation={{
            departamento: selectedDepartamento,
            provincia: selectedProvincia,
            distrito: selectedDistrito,
            jee: selectedJee
          }}
          circunscripcionElectoral={selectedCircunscripcionElectoral}
          mesaElectoralInfo={mesaNumber > 0 ? getMesaElectoralInfo(mesaNumber.toString()) : null}
          onJeeChange={handleJeeChange}
          jeeOptions={jeeData}
          // totalCedulasRecibidas={totalCedulasRecibidas}
          onMesaDataChange={(mesa, acta, electores) => {
            // Look up mesa electoral data to auto-populate location fields
            const mesaInfo = getMesaElectoralInfo(mesa.toString());

            if (mesaInfo) {
              // Auto-populate location fields based on mesa data
              setSelectedDepartamento(mesaInfo.departamento);
              setSelectedProvincia(mesaInfo.provincia);
              setSelectedDistrito(mesaInfo.distrito);
              setSelectedCircunscripcionElectoral(mesaInfo.circunscripcion_electoral);

              // Update category data with mesa info and auto-populated location
              updateCurrentCategoryData({
                mesaNumber: mesa,
                actaNumber: acta,
                totalElectores: electores,
                selectedLocation: {
                  departamento: mesaInfo.departamento,
                  provincia: mesaInfo.provincia,
                  distrito: mesaInfo.distrito,
                  jee: selectedJee, // Keep current JEE selection
                  circunscripcionElectoral: mesaInfo.circunscripcion_electoral
                }
              });
            } else {
              // Mesa number not found in data - show error message
              toast.error(`Mesa N° ${mesa.toString().padStart(6, '0')} no encontrada en los datos electorales`, {
                style: {
                  background: '#dc2626',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  width: '450px'
                },
                duration: 4000
              });

              // Still update the mesa data but without auto-populating location
              updateCurrentCategoryData({
                mesaNumber: mesa,
                actaNumber: acta,
                totalElectores: electores
              });
            }
          }}
          isFormFinalized={isFormFinalized}
          onFormFinalizedChange={(finalized) => updateCurrentCategoryData({ isFormFinalized: finalized })}
          isMesaDataSaved={isMesaDataSaved}
          onMesaDataSavedChange={(saved) => updateCurrentCategoryData({ isMesaDataSaved: saved })}
          startTime={startTime}
          endTime={endTime}
          currentTime={currentTime}
          onStartTimeChange={(time) => updateCurrentCategoryData({ startTime: time?.toISOString() || null })}
          onEndTimeChange={(time) => updateCurrentCategoryData({ endTime: time?.toISOString() || null })}
          onCurrentTimeChange={setCurrentTime}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 gap-4">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <img src={logoJne} className="w-14" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Recuento de Votos
                </h1>
              </div>
              {/* Category Selector */}
              <Select value={activeCategory} onValueChange={setActiveCategory}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.key} value={category.key}>
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Section Navigation in Header */}
              <Select value={activeSection} onValueChange={(section) => updateCurrentCategoryData({ activeSection: section })}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map((section) => {
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
              <Select
                value={selectedCircunscripcionElectoral || ""}
                onValueChange={handleCircunscripcionElectoralChange}
                disabled={areLocationFieldsDisabled}
              >
                <SelectTrigger
                  className={`w-48 ${areLocationFieldsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  title="Circunscripción Electoral"
                >
                  <SelectValue placeholder="Circunscripción Electoral" />
                </SelectTrigger>
                <SelectContent>
                  {getCircunscripcionElectoralOptions().map((circ) => (
                    <SelectItem key={circ} value={circ}>
                      {circ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Location Dropdowns - Only visible for ingreso and recuento */}
            {showLocationDropdowns && (
              <>
                {/* Departamento/Continente Dropdown */}
                <Select
                  value={selectedDepartamento}
                  onValueChange={handleDepartamentoChange}
                  disabled={areLocationFieldsDisabled}
                >
                  <SelectTrigger
                    className={`w-40 ${areLocationFieldsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={isInternationalLocation ? "Continente" : "Departamento"}
                  >
                    <SelectValue placeholder={isInternationalLocation ? "Continente" : "Departamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getDepartamentos().map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Provincia/País Dropdown */}
                <Select
                  value={selectedProvincia}
                  onValueChange={handleProvinciaChange}
                  disabled={!selectedDepartamento || areLocationFieldsDisabled}
                >
                  <SelectTrigger
                    className={`w-40 ${areLocationFieldsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={isInternationalLocation ? "País" : "Provincia"}
                  >
                    <SelectValue placeholder={isInternationalLocation ? "País" : "Provincia"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getProvincias(selectedDepartamento).map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Distrito/Ciudad Dropdown */}
                <Select
                  value={selectedDistrito}
                  onValueChange={handleDistritoChange}
                  disabled={!selectedProvincia || areLocationFieldsDisabled}
                >
                  <SelectTrigger
                    className={`w-40 ${areLocationFieldsDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={isInternationalLocation ? "Ciudad" : "Distrito"}
                  >
                    <SelectValue placeholder={isInternationalLocation ? "Ciudad" : "Distrito"} />
                  </SelectTrigger>
                  <SelectContent>
                    {getDistritos(selectedDepartamento, selectedProvincia).map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </>
            )}
            </div>
            <div className="ml-auto flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
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

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {renderSection()}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        category={activeCategory}
        voteLimits={voteLimits}
        onVoteLimitsChange={(limits) => updateCurrentCategoryData({ voteLimits: limits })}
        preferentialConfig={getPreferentialVoteConfig(activeCategory)}
        isFormFinalized={isFormFinalized}
        isMesaDataSaved={isMesaDataSaved}
        currentCircunscripcionElectoral={selectedCircunscripcionElectoral}
      />
    </div>
  );
}