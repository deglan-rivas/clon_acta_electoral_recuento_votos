import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ElectoralCountTable } from "./ElectoralCountTable";
import { VoteEntryForm } from "./VoteEntryForm";
import { PoliticalOrganizations } from "./PoliticalOrganizations";
import { mockElectoralData } from "../data/mockData";
import { Vote, Users, Building2, Globe, Crown } from "lucide-react";
import {
  getActiveCategory,
  saveActiveCategory,
  getAllCategoryData,
  saveCategoryData,
  type CategoryData,
} from "../lib/localStorage";

export function ElectoralDashboard() {
  const [activeCategory, setActiveCategory] = useState(() => getActiveCategory());
  const [categoryData, setCategoryData] = useState(() => getAllCategoryData());

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
  const activeSection = getCurrentCategoryData()?.activeSection || 'recuento';
  const voteLimits = getCurrentCategoryData()?.voteLimits || { preferential1: 1, preferential2: 1 };

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
    { key: "ingreso", label: "Ingreso de Votos" },
    { key: "recuento", label: "Recuento" },
    { key: "organizaciones", label: "Organizaciones Políticas" },
  ];

  const renderSection = () => {
    const data = mockElectoralData[activeCategory];
    const preferentialConfig = getPreferentialVoteConfig(activeCategory);
    const currentCategoryData = getCurrentCategoryData();
    
    switch (activeSection) {
      case "recuento":
        return <ElectoralCountTable data={data} category={activeCategory} />;
      case "ingreso":
        return <VoteEntryForm 
          category={activeCategory} 
          existingEntries={currentCategoryData?.voteEntries || []} 
          voteLimits={voteLimits} 
          preferentialConfig={preferentialConfig}
          onEntriesChange={(entries) => updateCurrentCategoryData({ voteEntries: entries })}
        />;
      case "organizaciones":
        return <PoliticalOrganizations 
          category={activeCategory} 
          voteLimits={voteLimits} 
          onVoteLimitsChange={(limits) => updateCurrentCategoryData({ voteLimits: limits })}
          preferentialConfig={preferentialConfig}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img src="./logo_jne.svg" className="w-8 h-8" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Recuento de Votos
                </h1>
              </div>
              {/* Category Selector */}
              <Select value={activeCategory} onValueChange={setActiveCategory}>
                <SelectTrigger className="w-52">
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
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Elecciones Generales 2026
            </Badge>
          </div>
          
          {/* Section Navigation in Header */}
          <div className="pb-3">
            <Tabs 
              value={activeSection} 
              onValueChange={(section) => updateCurrentCategoryData({ activeSection: section })}
            >
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                {sections.map((section) => (
                  <TabsTrigger
                    key={section.key}
                    value={section.key}
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900"
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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