import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Check, Moon, Sun } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ThemeSettings() {
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [organization, setOrganization] = useState(null);

  const themes = [
    {
      id: "default",
      name: "Défaut (Bleu)",
      colors: {
        primary: "#3b82f6",
        primaryDark: "#2563eb"
      }
    },
    {
      id: "emerald", 
      name: "Émeraude",
      colors: {
        primary: "#10b981",
        primaryDark: "#059669"
      }
    },
    {
      id: "purple",
      name: "Violet",
      colors: {
        primary: "#8b5cf6",
        primaryDark: "#7c3aed"
      }
    },
    {
      id: "orange",
      name: "Orange",
      colors: {
        primary: "#f97316",
        primaryDark: "#ea580c"
      }
    },
    {
      id: "rose",
      name: "Rose",
      colors: {
        primary: "#ec4899",
        primaryDark: "#db2777"
      }
    },
    {
      id: "indigo",
      name: "Indigo",
      colors: {
        primary: "#6366f1",
        primaryDark: "#4f46e5"
      }
    }
  ];

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // Charger le thème depuis localStorage
      const savedTheme = localStorage.getItem("app_theme") || "default";
      const savedDarkMode = localStorage.getItem("app_dark_mode") === "true";
      
      setSelectedTheme(savedTheme);
      setIsDarkMode(savedDarkMode);
      
      const theme = themes.find(t => t.id === savedTheme) || themes[0];
      applyThemeColors(theme, savedDarkMode);

      // Charger l'organisation
      const orgs = await base44.entities.Organization.list();
      if (orgs.length > 0) {
        setOrganization(orgs[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du thème:", error);
    }
  };

  const applyThemeColors = (theme, darkMode) => {
    const root = document.documentElement;
    
    // Appliquer/retirer la classe dark
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Appliquer les couleurs principales
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-dark', theme.colors.primaryDark);
  };

  const handleThemeChange = async (theme) => {
    setSelectedTheme(theme.id);
    localStorage.setItem("app_theme", theme.id);
    applyThemeColors(theme, isDarkMode);
    window.location.reload();
  };

  const handleDarkModeToggle = (checked) => {
    setIsDarkMode(checked);
    localStorage.setItem("app_dark_mode", checked.toString());
    
    const theme = themes.find(t => t.id === selectedTheme) || themes[0];
    applyThemeColors(theme, checked);
    
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Mode sombre */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Mode d'affichage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                {isDarkMode ? (
                  <Moon className="w-6 h-6 text-blue-400" />
                ) : (
                  <Sun className="w-6 h-6 text-yellow-500" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {isDarkMode ? "Mode sombre" : "Mode clair"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isDarkMode ? "Moins de fatigue visuelle" : "Interface lumineuse"}
                </p>
              </div>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleDarkModeToggle}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Couleurs */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <span className="text-xl">🎨</span>
            Couleur principale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium text-slate-900 dark:text-white">Choisissez votre couleur</Label>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              La couleur sera appliquée aux boutons et éléments interactifs
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedTheme === theme.id 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-lg' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white/50 dark:bg-slate-800/50'
                  }`}
                  onClick={() => handleThemeChange(theme)}
                >
                  {selectedTheme === theme.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-10 h-10 rounded-full shadow-md"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="w-10 h-10 rounded-full shadow-md"
                      style={{ backgroundColor: theme.colors.primaryDark }}
                    />
                  </div>
                  
                  <p className="font-semibold text-slate-900 dark:text-white">{theme.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Aperçu</h4>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                className="rounded-full shadow-lg"
                style={{ 
                  backgroundColor: themes.find(t => t.id === selectedTheme)?.colors.primary,
                  color: 'white'
                }}
              >
                Bouton principal
              </Button>
              <Button variant="outline" className="rounded-full border-slate-300 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Bouton secondaire
              </Button>
            </div>
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold">ℹ️</span>
              <span>
                <strong>Note:</strong> Les changements de thème sont appliqués immédiatement 
                et sauvegardés automatiquement pour votre session.
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}