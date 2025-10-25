import { createContext, useContext, useState, useEffect } from 'react';

// Traductions
const translations = {
  fr: {
    // Navigation
    nav_dashboard: "Tableau",
    nav_vehicles: "Véhicules",
    nav_clients: "Clients",
    nav_reservations: "Résa",
    nav_settings: "Réglages",
    
    // Commun
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    search: "Rechercher",
    loading: "Chargement...",
    confirm: "Confirmer",
    close: "Fermer",
    
    // Dashboard
    dashboard_title: "Tableau de bord",
    monthly_revenue: "Revenus du mois",
    monthly_charges: "Charges du mois",
    monthly_profit: "Bénéfice du mois",
    owner_payments: "Reversé propriétaires",
    
    // Settings
    settings_title: "Paramètres",
    company_settings: "Entreprise",
    users_settings: "Utilisateurs",
    exports: "Exports",
    fees: "Frais",
    my_account: "Mon compte",
    logout: "Se déconnecter",
    language: "Langue",
    need_help: "Besoin d'aide ?",
    
    // Layout
    logo_alt: "Logo",
    app_name: "EasyGarage",
    mobile_subtitle: "Gestion de flotte",
    status_online: "En ligne",
    
    // Plans
    plan_free: "Gratuit",
    plan_essentiel: "Essentiel",
    plan_pro: "Pro",
    plan_entreprise: "Entreprise",
  },
  
  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_vehicles: "Vehicles",
    nav_clients: "Clients",
    nav_reservations: "Bookings",
    nav_settings: "Settings",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",
    loading: "Loading...",
    confirm: "Confirm",
    close: "Close",
    
    // Dashboard
    dashboard_title: "Dashboard",
    monthly_revenue: "Monthly Revenue",
    monthly_charges: "Monthly Charges",
    monthly_profit: "Monthly Profit",
    owner_payments: "Owner Payments",
    
    // Settings
    settings_title: "Settings",
    company_settings: "Company",
    users_settings: "Users",
    exports: "Exports",
    fees: "Fees",
    my_account: "My Account",
    logout: "Logout",
    language: "Language",
    need_help: "Need help?",
    
    // Layout
    logo_alt: "Logo",
    app_name: "EasyGarage",
    mobile_subtitle: "Fleet Management",
    status_online: "Online",
    
    // Plans
    plan_free: "Free",
    plan_essentiel: "Essential",
    plan_pro: "Pro",
    plan_entreprise: "Enterprise",
  },
  
  de: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_vehicles: "Fahrzeuge",
    nav_clients: "Kunden",
    nav_reservations: "Buchungen",
    nav_settings: "Einstellungen",
    
    // Common
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    add: "Hinzufügen",
    search: "Suchen",
    loading: "Laden...",
    confirm: "Bestätigen",
    close: "Schließen",
    
    // Dashboard
    dashboard_title: "Dashboard",
    monthly_revenue: "Monatlicher Umsatz",
    monthly_charges: "Monatliche Kosten",
    monthly_profit: "Monatlicher Gewinn",
    owner_payments: "Eigentümerzahlungen",
    
    // Settings
    settings_title: "Einstellungen",
    company_settings: "Unternehmen",
    users_settings: "Benutzer",
    exports: "Exporte",
    fees: "Gebühren",
    my_account: "Mein Konto",
    logout: "Abmelden",
    language: "Sprache",
    need_help: "Brauchen Sie Hilfe?",
    
    // Layout
    logo_alt: "Logo",
    app_name: "EasyGarage",
    mobile_subtitle: "Flottenverwaltung",
    status_online: "Online",
    
    // Plans
    plan_free: "Kostenlos",
    plan_essentiel: "Essential",
    plan_pro: "Pro",
    plan_entreprise: "Enterprise",
  },
  
  es: {
    // Navigation
    nav_dashboard: "Panel",
    nav_vehicles: "Vehículos",
    nav_clients: "Clientes",
    nav_reservations: "Reservas",
    nav_settings: "Ajustes",
    
    // Common
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    add: "Añadir",
    search: "Buscar",
    loading: "Cargando...",
    confirm: "Confirmar",
    close: "Cerrar",
    
    // Dashboard
    dashboard_title: "Panel de control",
    monthly_revenue: "Ingresos mensuales",
    monthly_charges: "Gastos mensuales",
    monthly_profit: "Beneficio mensual",
    owner_payments: "Pagos a propietarios",
    
    // Settings
    settings_title: "Ajustes",
    company_settings: "Empresa",
    users_settings: "Usuarios",
    exports: "Exportaciones",
    fees: "Tarifas",
    my_account: "Mi cuenta",
    logout: "Cerrar sesión",
    language: "Idioma",
    need_help: "¿Necesita ayuda?",
    
    // Layout
    logo_alt: "Logotipo",
    app_name: "EasyGarage",
    mobile_subtitle: "Gestión de flotas",
    status_online: "En línea",
    
    // Plans
    plan_free: "Gratis",
    plan_essentiel: "Esencial",
    plan_pro: "Pro",
    plan_entreprise: "Empresa",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('easygarage_language') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('easygarage_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations.fr[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}