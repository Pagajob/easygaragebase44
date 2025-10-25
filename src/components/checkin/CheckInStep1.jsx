
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Car, Calendar, Clock, ArrowRight, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

export default function CheckInStep1({ reservation, vehicle, client, onNext }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [isUploadingId, setIsUploadingId] = useState(false);
  // Use clientData in local state to allow updates without prop changes
  const [clientData, setClientData] = useState(client);

  // Vérifications de sécurité
  if (!reservation || !vehicle || !client) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Chargement des informations...</p>
      </div>);

  }

  const handleLicensePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingLicense(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Mettre à jour la fiche client avec la photo du permis
      await base44.entities.Client.update(client.id, {
        license_photo_url: file_url
      });

      // Mettre à jour l'état local
      setClientData((prevClientData) => ({ ...prevClientData, license_photo_url: file_url }));

      alert("✅ Photo du permis ajoutée avec succès à la fiche client !");
    } catch (error) {
      console.error("Erreur lors de l'upload du permis:", error);
      alert("❌ Erreur lors de l'ajout de la photo du permis");
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

      // Mettre à jour la fiche client avec la photo de la CNI
      await base44.entities.Client.update(client.id, {
        id_photo_url: file_url
      });

      // Mettre à jour l'état local
      setClientData((prevClientData) => ({ ...prevClientData, id_photo_url: file_url }));

      alert("✅ Photo de la pièce d'identité ajoutée avec succès à la fiche client !");
    } catch (error) {
      console.error("Erreur lors de l'upload de la CNI:", error);
      alert("❌ Erreur lors de l'ajout de la photo de la pièce d'identité");
    } finally {
      setIsUploadingId(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informations client */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            Informations client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br rounded-[100px] w-20 h-20 from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{clientData.name}</h3>
              <p className="text-slate-600 text-sm">{clientData.email}</p>
              <p className="text-slate-600 text-sm">{clientData.phone}</p>
            </div>
          </div>

          {/* Documents cliquables */}
          <div className="space-y-3 mt-4">
            <p className="text-sm font-semibold text-slate-700">Documents</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Pièce d'identité */}
              {clientData.id_photo_url ?
              <button
                onClick={() => setSelectedImage({ url: clientData.id_photo_url, title: "Pièce d'identité" })}
                className="relative group overflow-hidden rounded-xl border-2 border-slate-200 hover:border-blue-500 transition-all">

                  <img
                  src={clientData.id_photo_url}
                  alt="Pièce d'identité"
                  className="w-full h-32 object-cover" />

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium">Pièce d'identité</p>
                    {clientData.id_document &&
                  <p className="text-white/80 text-xs truncate">{clientData.id_document}</p>
                  }
                  </div>
                </button> :

              <div className="relative">
                  <input
                  type="file"
                  accept="image/*"
                  capture="environment" // Suggests using the camera on mobile devices
                  onChange={handleIdPhotoUpload}
                  className="hidden"
                  id="id-photo-upload"
                  disabled={isUploadingId} />

                  <label htmlFor="id-photo-upload">
                    <div className="h-32 bg-orange-50 rounded-xl border-2 border-dashed border-orange-300 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-100 transition-colors">
                      {isUploadingId ?
                    <>
                          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-1" />
                          <p className="text-xs text-orange-600 font-medium">Upload...</p>
                        </> :

                    <>
                          <Upload className="w-6 h-6 text-orange-500 mb-1" />
                          <p className="text-xs text-orange-600 font-medium">Ajouter CNI</p>
                          <p className="text-xs text-orange-500">Manquante</p>
                        </>
                    }
                    </div>
                  </label>
                </div>
              }

              {/* Permis de conduire */}
              {clientData.license_photo_url ?
              <button
                onClick={() => setSelectedImage({ url: clientData.license_photo_url, title: "Permis de conduire" })}
                className="relative group overflow-hidden rounded-xl border-2 border-slate-200 hover:border-blue-500 transition-all">

                  <img
                  src={clientData.license_photo_url}
                  alt="Permis de conduire"
                  className="w-full h-32 object-cover" />

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs font-medium">Permis de conduire</p>
                    {clientData.license_number &&
                  <p className="text-white/80 text-xs truncate">{clientData.license_number}</p>
                  }
                  </div>
                </button> :

              <div className="relative">
                  <input
                  type="file"
                  accept="image/*"
                  capture="environment" // Suggests using the camera on mobile devices
                  onChange={handleLicensePhotoUpload}
                  className="hidden"
                  id="license-photo-upload"
                  disabled={isUploadingLicense} />

                  <label htmlFor="license-photo-upload">
                    <div className="h-32 bg-orange-50 rounded-xl border-2 border-dashed border-orange-300 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-100 transition-colors">
                      {isUploadingLicense ?
                    <>
                          <Loader2 className="w-6 h-6 text-orange-500 animate-spin mb-1" />
                          <p className="text-xs text-orange-600 font-medium">Upload...</p>
                        </> :

                    <>
                          <Upload className="w-6 h-6 text-orange-500 mb-1" />
                          <p className="text-xs text-orange-600 font-medium">Ajouter permis</p>
                          <p className="text-xs text-orange-500">Manquant</p>
                        </>
                    }
                    </div>
                  </label>
                </div>
              }
            </div>

            {clientData.license_date &&
            <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Permis obtenu le {format(parseISO(clientData.license_date), 'dd/MM/yyyy', { locale: fr })}
              </p>
            }

            {/* Warning for missing documents */}
            {(!clientData.id_photo_url || !clientData.license_photo_url) &&
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-orange-700 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Certains documents sont manquants. Vous pouvez les ajouter maintenant pour compléter le dossier client.</span>
                </p>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Informations véhicule */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🏎️</span>
            Véhicule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-32 h-24 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {vehicle.photo_url ?
              <img src={vehicle.photo_url} alt="Véhicule" className="w-full h-full object-cover" /> :

              <Car className="w-12 h-12 text-slate-400" />
              }
            </div>
            <div>
              <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
              <p className="text-slate-600 font-mono">{vehicle.plate}</p>
              <p className="text-slate-500 text-sm mt-1">
                {vehicle.year} • {vehicle.fuel_type}
              </p>
              <p className="text-slate-500 text-sm">
                Kilométrage actuel: {vehicle.mileage?.toLocaleString() || 0} km
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations réservation */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🕤</span>
            Réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reservation.start_date &&
          <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Du {format(parseISO(reservation.start_date), "d MMMM yyyy", { locale: fr })}
                {reservation.end_date && ` au ${format(parseISO(reservation.end_date), "d MMMM yyyy", { locale: fr })}`}
              </span>
            </div>
          }
          {reservation.start_time &&
          <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Départ prévu à {reservation.start_time}</span>
            </div>
          }
        </CardContent>
      </Card>

      {/* Bouton suivant */}
      <Button
        onClick={onNext}
        className="w-full rounded-full shadow-lg"
        size="lg"
        disabled={isUploadingLicense || isUploadingId} // Disable button during uploads
      >
        {isUploadingLicense || isUploadingId ?
        <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Upload en cours...
          </> :

        <>
            Commencer l'état des lieux
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        }
      </Button>

      {/* Modal d'affichage d'image */}
      {selectedImage &&
      <Dialog open={true} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
            <div className="relative">
              <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">

                <span className="text-white text-2xl">×</span>
              </button>
              <div className="p-4">
                <h3 className="text-white text-lg font-semibold mb-4">{selectedImage.title}</h3>
                <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />

              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    </div>);

}