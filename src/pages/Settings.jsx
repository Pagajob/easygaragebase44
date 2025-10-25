
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Users,
  Download,
  Settings as SettingsIcon,
  LogOut,
  Crown,
  Euro,
  AlertTriangle,
  Loader2,
  Mail, // Added Mail icon
  Sparkles // Added Sparkles icon
} from
"lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl, getCurrentOrganizationId, filterByOrganization } from "@/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import CompanySettings from "../components/settings/CompanySettings";
import UsersSettings from "../components/settings/UsersSettings";
import ExportSettings from "../components/settings/ExportSettings";
import AdditionalFeesSettings from "../components/settings/AdditionalFeesSettings";
import LanguageSettings from "../components/settings/LanguageSettings"; // New import for language settings

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("company");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch current user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity
  });

  // Fetch organization data, dependent on user's organization_id
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return null;
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      return orgs.length > 0 ? orgs[0] : null;
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60 * 1000
  });

  // Fetch additional fees data
  const { data: additionalFees = [], isLoading: feesLoading } = useQuery({
    queryKey: ['additionalFees'],
    queryFn: () => filterByOrganization('AdditionalFee'),
    staleTime: 5 * 60 * 1000
  });

  const isLoading = userLoading || orgLoading;
  const isAdmin = user?.organization_role === 'admin';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await base44.auth.logout();
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>);

  }

  if (!isLoading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 dark:text-orange-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Accès restreint
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            Seuls les administrateurs peuvent accéder aux paramètres.
          </p>
          <Button onClick={() => window.location.href = createPageUrl("Dashboard")}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>);

  }

  const currentPlan = organization?.subscription_plan || 'free';

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Paramètres</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Configurez votre application
        </p>
      </div>

      {/* Bouton Gérer mon abonnement */}
      <Link to={createPageUrl("Subscription")} className="block">
        <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-full shadow-lg shadow-purple-500/30" size="lg">
          <Crown className="w-5 h-5 mr-2" />
          Gérer mon abonnement
        </Button>
      </Link>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
  <div className="space-y-2">
    <TabsList className="bg-white/40 text-muted-foreground rounded-xl h-10 items-center justify-center grid w-full grid-cols-2 backdrop-blur-lg border border-white/20 dark:bg-slate-800/40 dark:border-slate-700/50">
      <TabsTrigger 
        value="company" 
        className="text-xs font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap 
        ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50 
        data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:shadow-md 
        dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
      >
        <Building className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Entreprise</span>
        <span className="sm:hidden">Société</span>
      </TabsTrigger>
      <TabsTrigger 
        value="users" 
        className="text-xs font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap 
        ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50 
        data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:shadow-md 
        dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
      >
        <Users className="w-4 h-4 mr-1" />
        <span>Utilisateurs</span>
      </TabsTrigger>
    </TabsList>

    <TabsList className="grid w-full grid-cols-2 bg-white/40 backdrop-blur-lg border border-white/20 rounded-xl p-1 dark:bg-slate-800/40 dark:border-slate-700/50">
      <TabsTrigger 
        value="exports" 
        className="px-3 py-1.5 text-xs font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap 
        ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50 
        data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:shadow-md 
        dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
      >
        <Download className="w-4 h-4 mr-1" />
        <span>Exports</span>
      </TabsTrigger>
      <TabsTrigger 
        value="fees" 
        className="px-3 py-1.5 text-xs font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap 
        ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
        disabled:pointer-events-none disabled:opacity-50 
        data-[state=active]:text-foreground data-[state=active]:bg-white data-[state=active]:shadow-md 
        dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
      >
        <Euro className="w-4 h-4 mr-1" />
        <span>Frais</span>
      </TabsTrigger>
    </TabsList>
  </div>

  <TabsContent value="company" className="mt-6">
    <CompanySettings organization={organization} />
  </TabsContent>

  <TabsContent value="users" className="mt-6">
    <UsersSettings organization={organization} />
  </TabsContent>

  <TabsContent value="exports" className="mt-6">
    <ExportSettings />
  </TabsContent>

  <TabsContent value="fees" className="mt-6">
    <AdditionalFeesSettings
      additionalFees={additionalFees}
      isLoading={feesLoading}
    />
  </TabsContent>
</Tabs>

      {/* Langue - Nouvelle section */}
      <LanguageSettings />

      {/* Section utilisateur et déconnexion */}
      <Card className="bg-white/40 dark:bg-slate-800/40 text-card-foreground rounded-xl backdrop-blur-lg border border-white/20 dark:border-slate-700/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <span className="text-xl">👤</span>
            Mon compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informations utilisateur */}
          {user &&
          <div className="p-4 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-white/20 dark:border-slate-600/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white truncate">{user.full_name || "Utilisateur"}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.organization_role === 'admin' ?
              'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
              'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`
              }>
                  {user.organization_role === 'admin' ? 'Administrateur' : 'Agent'}
                </div>
              </div>
            </div>
          }

          {/* Bouton de déconnexion */}
          <Button
            onClick={handleLogout}
            disabled={isLoggingOut}
            variant="destructive"
            className="w-full rounded-full bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-500/30"
            size="lg">

            <LogOut className="w-5 h-5 mr-2" />
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>

          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Vous serez redirigé vers la page de connexion
          </p>
        </CardContent>
      </Card>

      {/* Section Support */}
      <Card className="bg-white/40 dark:bg-slate-800/40 text-card-foreground rounded-xl backdrop-blur-lg border border-white/20 dark:border-slate-700/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <span className="text-xl">💬</span>
            Besoin d'aide ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentPlan === 'entreprise' ? (
            <>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-900 dark:text-amber-200">Support Premium</span>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                  En tant qu'abonné Entreprise, vous bénéficiez d'un support prioritaire par téléphone.
                </p>
                <a
                  href="tel:+33769103645"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-full shadow-lg shadow-amber-500/30 transition-all"
                >
                  <span className="text-lg">📞</span>
                  <span>Appeler le +33 7 69 10 36 45</span>
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Disponible du lundi au vendredi, 9h-18h
              </p>
            </>
          ) : (
            <>
              <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
                  Notre équipe est là pour vous aider ! Contactez-nous par email pour toute question.
                </p>
                <a
                  href="mailto:support@easygarage.fr"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-full shadow-lg shadow-blue-500/30 transition-all"
                >
                  <Mail className="w-5 h-5" />
                  <span>support@easygarage.fr</span>
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Nous répondons sous 24-48h ouvrées
              </p>
              {(currentPlan === 'free' || currentPlan === 'essentiel' || currentPlan === 'pro') && (
                <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs text-amber-800 dark:text-amber-300 text-center flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Passez au plan <strong>Entreprise</strong> pour un support prioritaire par téléphone !
                    </span>
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>);

}
