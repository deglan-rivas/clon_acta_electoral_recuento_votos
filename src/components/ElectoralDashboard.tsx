import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">JNE</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Recuento de Votos
              </h1>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Elecciones Generales 2026
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Navigation Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-white border border-gray-200">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger
                  key={category.key}
                  value={category.key}
                  className="flex flex-col items-center space-y-2 p-4 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-red-200"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.key} value={category.key} className="space-y-6">
              {/* Section Navigation */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3">
                    <category.icon className="h-6 w-6 text-red-600" />
                    <span>{category.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Content Area */}
              <div className="space-y-6">
                {renderSection()}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}