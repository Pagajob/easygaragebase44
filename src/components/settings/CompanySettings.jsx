
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building, Upload, Loader2, Check } from "lucide-react";
import { getCurrentOrganizationId } from "../utils/multiTenant";
import AddressAutocomplete from "../shared/AddressAutocomplete";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

export default function CompanySettings({ organization }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    siret: "",
    address: "",
    logo_url: ""
  });

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        siret: organization.siret || "",
        address: organization.address || "",
        logo_url: organization.logo_url || ""
      });
    }
  }, [organization]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setSuccessMessage(null);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange("logo_url", file_url);

      if (organization) {
        await base44.entities.Organization.update(organization.id, {
          logo_url: file_url
        });
        queryClient.invalidateQueries({ queryKey: ['organization'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        setSuccessMessage("Logo mis à jour avec succès");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error("Erreur lors de l'upload du logo:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const updateOrganizationMutation = useMutation({
    mutationFn: async (data) => {
      if (!organization) {
        throw new Error("Organisation non trouvée");
      }
      return await base44.entities.Organization.update(organization.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      setSuccessMessage("Informations mises à jour avec succès");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateOrganizationMutation.mutate(formData);
  };

  const logoUrl = formData.logo_url || EASYGARAGE_LOGO;

  return (
    <Card className="bg-white/40 dark:bg-slate-800/40 text-card-foreground rounded-xl backdrop-blur-lg border border-white/20 dark:border-slate-700/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
          <Building className="w-5 h-5" />
          Informations de l'entreprise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="mb-2 block text-slate-700 dark:text-slate-300">Logo de l'entreprise</Label>
            <div className="flex items-center gap-4">
              <div className="rounded-[1000px] relative group">
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="rounded-[100px] w-20 h-20 object-cover border-2 border-white/50 dark:border-slate-600/50 shadow-lg" />

                <div className="bg-black/50 opacity-0 rounded-[1000px] absolute inset-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Upload className="w-6 h-6 text-white" />
                  </label>
                </div>
              </div>
              
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={isUploading} />

                <label htmlFor="logo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    className="cursor-pointer rounded-full dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                    asChild>

                    <span>
                      {isUploading ?
                      <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Upload en cours...
                        </> :

                      <>
                          <Upload className="w-4 h-4 mr-2" />
                          Changer le logo
                        </>
                      }
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Format recommandé : PNG ou JPG, 512x512px
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Nom de l'entreprise *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required className="flex h-10 w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/30 rounded-lg text-slate-900 dark:text-slate-900"

              placeholder="Mon Garage Auto" />

          </div>

          <div>
            <Label htmlFor="siret" className="text-slate-700 dark:text-slate-300">SIRET</Label>
            <Input
              id="siret"
              value={formData.siret}
              onChange={(e) => handleInputChange("siret", e.target.value)} className="flex h-10 w-full border px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-white/50 dark:bg-slate-700/50 border-white/30 dark:border-slate-600/30 rounded-lg text-slate-900 dark:text-slate-900"

              placeholder="123 456 789 00012" />

          </div>

          <div>
            <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Adresse complète</Label>
            <AddressAutocomplete
              value={formData.address}
              onChange={(value) => handleInputChange("address", value)}
              placeholder="Rechercher une adresse..." />

          </div>

          {successMessage &&
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
              <Check className="w-4 h-4" />
              {successMessage}
            </div>
          }

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={updateOrganizationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-full">

              {updateOrganizationMutation.isPending ?
              <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </> :

              "Sauvegarder les modifications"
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>);

}