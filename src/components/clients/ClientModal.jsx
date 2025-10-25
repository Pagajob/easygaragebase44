
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AddressAutocomplete from "../shared/AddressAutocomplete"; // Added import

export default function ClientModal({ isOpen, onClose, client, onSave }) {
  const [formData, setFormData] = useState({
    type: "particulier",
    name: "",
    company_name: "",
    email: "",
    phone: "",
    address: "",
    license_number: "",
    license_date: "",
    license_photo_url: "",
    id_document: "",
    id_photo_url: "",
    siret: "",
    notes: ""
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData(client);
    } else {
      setFormData({
        type: "particulier",
        name: "",
        company_name: "",
        email: "",
        phone: "",
        address: "",
        license_number: "",
        license_date: "",
        license_photo_url: "",
        id_document: "",
        id_photo_url: "",
        siret: "",
        notes: ""
      });
    }
  }, [client, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLicensePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingLicense(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange("license_photo_url", file_url);
    } catch (error) {
      console.error("Erreur lors de l'upload du permis:", error);
    } finally {
      setIsUploadingLicense(false);
    }
  };

  const handleIdPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingId(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      handleInputChange("id_photo_url", file_url);
    } catch (error) {
      console.error("Erreur lors de l'upload de la CNI:", error);
    } finally {
      setIsUploadingId(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-white/30 dark:border-slate-700/30 rounded-2xl shadow-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="tracking-tight text-2xl font-bold dark:text-white">
            {client ? "Modifier le client" : "Ajouter un client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Type de client */}
          <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
            <CardHeader>
              <CardTitle className="font-semibold tracking-tight text-lg dark:text-white">Type de client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1 bg-slate-100/80 dark:bg-slate-700/50 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleInputChange("type", "particulier")}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-[100px] transition-all duration-200 flex items-center justify-center gap-2 ${
                  formData.type === 'particulier' ?
                  'bg-white text-slate-900 shadow-md dark:bg-slate-900 dark:text-white' :
                  'bg-transparent text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`
                  }>

                  <span className="text-lg">👤</span>
                  <span>Particulier</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange("type", "professionnel")}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-[100px] transition-all duration-200 flex items-center justify-center gap-2 ${
                  formData.type === 'professionnel' ?
                  'bg-white text-slate-900 shadow-md dark:bg-slate-900 dark:text-white' :
                  'bg-transparent text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`
                  }>

                  <span className="text-lg">🏢</span>
                  <span>Pro</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Informations de base */}
          <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
            <CardHeader>
              <CardTitle className="font-semibold tracking-tight text-lg dark:text-white">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">
                  {formData.type === 'particulier' ? 'Nom complet *' : 'Nom du contact *'}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

              </div>

              {formData.type === 'professionnel' &&
              <div>
                  <Label htmlFor="company_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Raison sociale</Label>
                  <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

                </div>
              }

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="bg-white/50 border-slate-300/50 rounded-lg" />

                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-white/50 border-slate-300/50 rounded-lg" />

                </div>
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-white">Adresse</Label>
                {/* Replaced Textarea with AddressAutocomplete */}
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => handleInputChange("address", value)}
                  placeholder="Rechercher une adresse..." />

              </div>

              {formData.type === 'professionnel' &&
              <div>
                  <Label htmlFor="siret" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">SIRET</Label>
                  <Input
                  id="siret"
                  value={formData.siret}
                  onChange={(e) => handleInputChange("siret", e.target.value)}
                  className="bg-white/50 border-slate-300/50 rounded-lg" />

                </div>
              }
            </CardContent>
          </Card>

          {/* Documents */}
          <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="license_number">Numéro de permis</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e) => handleInputChange("license_number", e.target.value)}
                    className="bg-white/50 border-slate-300/50 rounded-lg" />

                </div>
                <div>
                  <Label htmlFor="license_date">Date d'obtention</Label>
                  <Input
                    id="license_date"
                    type="date"
                    value={formData.license_date}
                    onChange={(e) => handleInputChange("license_date", e.target.value)}
                    className="bg-white/50 border-slate-300/50 rounded-lg" />

                </div>
              </div>

              {/* Photo du permis */}
              <div>
                <Label className="mb-2 block">Photo du permis de conduire</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLicensePhotoUpload}
                  className="hidden"
                  id="license-photo-upload"
                  disabled={isUploadingLicense} />


                {formData.license_photo_url ?
                <div className="relative group">
                    <img
                    src={formData.license_photo_url}
                    alt="Permis de conduire"
                    className="w-full h-48 object-cover rounded-lg border-2 border-slate-200" />

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <label htmlFor="license-photo-upload">
                        <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        asChild>

                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Changer
                          </span>
                        </Button>
                      </label>
                      <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleInputChange("license_photo_url", "")}>

                        <X className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div> :

                <label htmlFor="license-photo-upload">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                      {isUploadingLicense ?
                    <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm text-slate-500">Upload en cours...</p>
                        </div> :

                    <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-12 h-12 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">Ajouter une photo du permis</p>
                          <p className="text-xs text-slate-500 dark:text-slate-100">Cliquez pour parcourir</p>
                        </div>
                    }
                    </div>
                  </label>
                }
              </div>

              <div>
                <Label htmlFor="id_document">Référence pièce d'identité</Label>
                <Input
                  id="id_document"
                  value={formData.id_document}
                  onChange={(e) => handleInputChange("id_document", e.target.value)}
                  className="bg-white/50 border-slate-300/50 rounded-lg" />

              </div>

              {/* Photo de la CNI */}
              <div>
                <Label className="mb-2 block">Photo de la pièce d'identité</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIdPhotoUpload}
                  className="hidden"
                  id="id-photo-upload"
                  disabled={isUploadingId} />


                {formData.id_photo_url ?
                <div className="relative group">
                    <img
                    src={formData.id_photo_url}
                    alt="Pièce d'identité"
                    className="w-full h-48 object-cover rounded-lg border-2 border-slate-200" />

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <label htmlFor="id-photo-upload">
                        <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        asChild>

                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            Changer
                          </span>
                        </Button>
                      </label>
                      <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleInputChange("id_photo_url", "")}>

                        <X className="w-4 h-4 mr-2" />
                        Supprimer
                      </Button>
                    </div>
                  </div> :

                <label htmlFor="id-photo-upload">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                      {isUploadingId ?
                    <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-sm text-slate-500">Upload en cours...</p>
                        </div> :

                    <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-12 h-12 text-slate-400" />
                          <p className="text-sm font-medium text-slate-700">Ajouter une photo de la CNI</p>
                          <p className="text-xs text-slate-500 dark:text-slate-100">Cliquez pour parcourir</p>
                        </div>
                    }
                    </div>
                  </label>
                }
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
                placeholder="Notes internes sur le client..."
                className="bg-white/50 border-slate-300/50 rounded-lg" />

            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/20">
            <Button type="button" variant="ghost" onClick={onClose} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 rounded-full dark:text-white">
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-full">
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}