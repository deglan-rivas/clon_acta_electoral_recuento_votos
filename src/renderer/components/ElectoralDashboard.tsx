import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ElectoralCountTable } from "./ElectoralCountTable";
import { VoteEntryForm } from "./VoteEntryForm";
import { PoliticalOrganizations } from "./PoliticalOrganizations";
import { mockElectoralData } from "../data/mockData";
import { Vote, Users, Building2, Globe, Crown, FileText, BarChart3, Settings } from "lucide-react";
import logoJne from '/logo_jne.svg';
import csvFile from '/TB_UBIGEOS.csv?url';
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

export function ElectoralDashboard() {
  const [activeCategory, setActiveCategory] = useState(() => getActiveCategory());
  const [categoryData, setCategoryData] = useState(() => getAllCategoryData());
  
  // Ubigeo state
  const [ubigeoData, setUbigeoData] = useState<UbigeoRecord[]>([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>("");
  const [selectedProvincia, setSelectedProvincia] = useState<string>("");
  const [selectedDistrito, setSelectedDistrito] = useState<string>("");

  // Current time state (not persisted per category)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

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
    
    loadUbigeoData();
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

  // Helper functions to get current category data
  const getCurrentCategoryData = (): CategoryData => {
    return categoryData[activeCategory];
  };

  const updateCurrentCategoryData = (updates: Partial<CategoryData>): void => {
    setCategoryData(prev => ({
      ...prev,
      [activeCategory]: {
        ...prev[activeCategory],
        ...updates,
      }
    }));
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
    { key: "recuento", label: "Recuento", icon: BarChart3 },
    { key: "organizaciones", label: "Organizaciones Políticas", icon: Settings },
  ];

  // Get unique departamentos
  const getDepartamentos = () => {
    const unique = Array.from(new Set(ubigeoData.map(record => record.departamento)));
    return unique.sort();
  };

  // Get provincias for selected departamento
  const getProvincias = (departamento: string) => {
    if (!departamento) return [];
    const filtered = ubigeoData.filter(record => record.departamento === departamento);
    const unique = Array.from(new Set(filtered.map(record => record.provincia)));
    return unique.sort();
  };

  // Get distritos for selected provincia
  const getDistritos = (departamento: string, provincia: string) => {
    if (!departamento || !provincia) return [];
    const filtered = ubigeoData.filter(record => 
      record.departamento === departamento && record.provincia === provincia
    );
    const unique = Array.from(new Set(filtered.map(record => record.distrito)));
    return unique.sort();
  };

  // Handle departamento change
  const handleDepartamentoChange = (value: string) => {
    setSelectedDepartamento(value);
    setSelectedProvincia("");
    setSelectedDistrito("");
  };

  // Handle provincia change
  const handleProvinciaChange = (value: string) => {
    setSelectedProvincia(value);
    setSelectedDistrito("");
  };

  // Check if location dropdowns should be visible
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
            distrito: selectedDistrito
          }}
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
            distrito: selectedDistrito
          }}
          // totalCedulasRecibidas={totalCedulasRecibidas}
          onMesaDataChange={(mesa, acta, electores) => {
            updateCurrentCategoryData({
              mesaNumber: mesa,
              actaNumber: acta,
              totalElectores: electores
            });
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
      case "organizaciones":
        return <PoliticalOrganizations 
          category={activeCategory} 
          voteLimits={voteLimits} 
          onVoteLimitsChange={(limits) => updateCurrentCategoryData({ voteLimits: limits })}
          preferentialConfig={preferentialConfig}
          isFormFinalized={isFormFinalized}
          isMesaDataSaved={isMesaDataSaved}
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

            {/* Location Dropdowns - Only visible for ingreso and recuento */}
            {showLocationDropdowns && (
              <>
                {/* Departamento Dropdown */}
                <Select value={selectedDepartamento} onValueChange={handleDepartamentoChange}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDepartamentos().map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Provincia Dropdown */}
                <Select 
                  value={selectedProvincia} 
                  onValueChange={handleProvinciaChange}
                  disabled={!selectedDepartamento}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {getProvincias(selectedDepartamento).map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Distrito Dropdown */}
                <Select 
                  value={selectedDistrito} 
                  onValueChange={setSelectedDistrito}
                  disabled={!selectedProvincia}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Distrito" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDistritos(selectedDepartamento, selectedProvincia).map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mesa Number Display */}
                {mesaNumber > 0 && (
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                    <span className="text-xs font-medium text-orange-700">Mesa:</span>
                    <span className="text-sm font-semibold text-orange-900 ml-1">{String(mesaNumber).padStart(3, '0')}</span>
                  </div>
                  
                )}
                {/* Acta code Display */}
                {actaNumber ? (
                  <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                    <span className="text-xs font-medium text-orange-700">Acta:</span>
                    <span className="text-sm font-semibold text-orange-900 ml-1">{actaNumber}</span>
                  </div>                  
                ) : null}
              </>
            )}
            </div>
            <Badge 
              variant="secondary" 
              className="text-white font-semibold text-base px-4 py-2 shrink-0 bg-red-800"
            >
              EG2026
            </Badge>
          </div>
          
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="space-y-4">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}