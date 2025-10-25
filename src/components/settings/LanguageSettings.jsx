
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe } from "lucide-react";
import { useTranslation } from "../utils/i18n";

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' }
];

export default function LanguageSettings() {
  const { language, setLanguage } = useTranslation();

  return (
    <Card className="bg-white/40 dark:bg-slate-800/40 text-card-foreground rounded-xl backdrop-blur-lg border border-white/20 dark:border-slate-700/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
          <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Langue / Language
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full h-12 rounded-xl bg-white/50 dark:bg-slate-700/50 border border-white/20 dark:border-slate-600/20 text-slate-900 dark:text-white">
            <SelectValue>
              {languages.find(l => l.code === language)?.flag} {languages.find(l => l.code === language)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            {languages.map(lang => (
              <SelectItem key={lang.code} value={lang.code} className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {language === 'fr' && "Choisissez la langue de l'interface"}
          {language === 'en' && "Choose your interface language"}
          {language === 'de' && "Wählen Sie Ihre Sprache"}
          {language === 'es' && "Elija su idioma"}
        </p>
      </CardContent>
    </Card>
  );
}
