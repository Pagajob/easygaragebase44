
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Loader2, Check } from "lucide-react";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

export default function OnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "", // Changed from companyName to name
    siret: "", // Added siret
    address: "" // Added address
  });
  const [logoFile, setLogoFile] = useState(null); // Added state for logo file

  // Removed useEffect checkExistingOrganization - logic moved to handleSubmit

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Note: No UI element for logoFile, siret, or address is added as per the outline.
  // They will default to null/empty string and are primarily handled in the handleSubmit logic.

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) { // Changed from companyName to name
      setError("Veuillez entrer le nom de votre entreprise");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("=== DÉBUT ONBOARDING ===");
      const user = await base44.auth.me();
      console.log("Utilisateur actuel:", user.email);

      // Vérifier si l'utilisateur a déjà une organisation
      if (user.organization_id) {
        console.log("Utilisateur a déjà une organisation:", user.organization_id);
        window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
        return;
      }

      // Upload du logo si fourni (logoFile state exists but no UI to set it in this version)
      let logoUrl = "";
      if (logoFile) {
        console.log("Upload du logo...");
        // This assumes base44.integrations.Core.UploadFile is available and correctly configured
        const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
        logoUrl = file_url;
        console.log("Logo uploadé:", logoUrl);
      }

      // Créer l'organisation avec l'email du propriétaire
      console.log("Création de l'organisation...");
      const organization = await base44.entities.Organization.create({
        name: formData.name.trim(), // Changed from companyName to name
        siret: formData.siret || "", // Use siret from formData, default to empty string
        address: formData.address || "", // Use address from formData, default to empty string
        logo_url: logoUrl,
        subscription_plan: "free",
        owner_email: user.email,
        vehicles_count: 0,
        reservations_count_month: 0,
        pdf_count_month: 0
      });
      console.log("Organisation créée:", organization.id);

      // Mettre à jour l'utilisateur avec l'organization_id ET le rôle admin
      console.log("Mise à jour de l'utilisateur avec organization_id et rôle admin...");
      await base44.auth.updateMe({
        organization_id: organization.id,
        organization_role: "admin" // NOUVEAU: Définir comme admin
      });
      console.log("Utilisateur mis à jour");

      // Nettoyer le cache local (though redirection usually handles this)
      localStorage.removeItem('cached_organization');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cached_organization_')) {
          localStorage.removeItem(key);
        }
      });
      console.log("Cache local nettoyé");


      // Rediriger vers la page d'accueil
      console.log("Redirection vers la page d'accueil");
      window.location.href = "/"; // MODIFIÉ: Redirection vers la racine

    } catch (error) {
      console.error("Erreur lors de la création:", error);
      let errorMessage = "Une erreur est survenue lors de la création de votre espace. Veuillez réessayer.";
      if (error.message) {
        errorMessage = error.message; // Keep more specific message if available
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // Removed the 'if (step === 2)' block as the redirection is now immediate.

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-lg border-white/40 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img 
              src={EASYGARAGE_LOGO} 
              alt="EasyGarage" 
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Bienvenue sur EasyGarage
          </CardTitle>
          <p className="text-slate-600 mt-2 text-sm">
            Configurons votre entreprise pour commencer
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-700 font-medium"> {/* Changed htmlFor */}
                Nom de votre entreprise *
              </Label>
              <div className="relative mt-2">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="name" // Changed id
                  type="text"
                  value={formData.name} // Changed value
                  onChange={(e) => handleInputChange("name", e.target.value)} // Changed field name
                  placeholder="Ex: Location Auto Paris"
                  className="pl-11 h-12 bg-white/50 border-slate-300/50 rounded-xl"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium mb-1">Erreur</p>
                <p className="text-xs text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-2">
                  Si le problème persiste, contactez le support.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Configuration en cours...
                </>
              ) : (
                <>
                  <Building className="w-5 h-5 mr-2" />
                  Créer mon entreprise
                </>
              )}
            </Button>

            <p className="text-xs text-slate-500 text-center">
              En continuant, vous acceptez de créer votre espace EasyGarage
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
