
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox"; // NEW IMPORT
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Upload,
  Gauge,
  Fuel,
  AlertTriangle,
  X,
  Plus,
  Loader2
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const REQUIRED_PHOTOS = [
  { id: "compteur", label: "Compteur", description: "Odomètre + jauge de carburant" },
  { id: "avant", label: "Face avant", description: "Vue frontale complète" },
  { id: "avant_gauche", label: "Avant gauche", description: "Aile / porte AVG" },
  { id: "jante_avant_gauche", label: "Jante avant gauche", description: "Roue avant gauche" },
  { id: "arriere_gauche", label: "Arrière gauche", description: "Aile / porte ARG" },
  { id: "jante_arriere_gauche", label: "Jante arrière gauche", description: "Roue arrière gauche" },
  { id: "arriere", label: "Face arrière", description: "Vue arrière complète" },
  { id: "arriere_droite", label: "Arrière droite", description: "Aile / porte ARD" },
  { id: "jante_arriere_droite", label: "Jante arrière droite", description: "Roue arrière droite" },
  { id: "avant_droite", label: "Avant droite", description: "Aile / porte AVD" },
  { id: "jante_avant_droite", label: "Jante avant droite", description: "Roue avant droite" }];


const fuelLevels = [
  { value: "vide", label: "Vide", percentage: 0 },
  { value: "1/8", label: "1/8", percentage: 12.5 },
  { value: "1/4", label: "1/4", percentage: 25 },
  { value: "3/8", label: "3/8", percentage: 37.5 },
  { value: "1/2", label: "1/2", percentage: 50 },
  { value: "5/8", label: "5/8", percentage: 62.5 },
  { value: "3/4", label: "3/4", percentage: 75 },
  { value: "7/8", label: "7/8", percentage: 87.5 },
  { value: "plein", label: "Plein", percentage: 100 }];


// Fonction de compression d'image
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionner si nécessaire
        if (width > maxWidth) {
          height = height * maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Créer un nouveau fichier avec le blob compressé
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur lors de la compression'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export default function CheckInStep2({ reservation, vehicle, checkInData, updateCheckInData, onNext, onBack }) {
  const [uploadingPhotos, setUploadingPhotos] = useState(new Set()); // Track des uploads en cours
  const [showDamageForm, setShowDamageForm] = useState(null);
  const [damageForm, setDamageForm] = useState({
    type: "rayure",
    location: "",
    description: "",
    severity: "leger"
  });
  const [continueWithoutPhotos, setContinueWithoutPhotos] = useState(false); // NEW STATE

  const handlePhotoSelected = async (e, category) => {
    const file = e.target.files[0];
    if (!file) return;

    // Générer un ID unique pour cet upload
    const uploadId = `${category}_${Date.now()}`;

    // Ajouter à la liste des uploads en cours
    setUploadingPhotos((prev) => new Set([...prev, uploadId]));

    try {
      // Compresser l'image avant l'upload
      console.log(`Compression de l'image ${category}...`);
      const compressedFile = await compressImage(file, 1200, 0.8);

      console.log(`Taille originale: ${(file.size / 1024).toFixed(0)}KB`);
      console.log(`Taille compressée: ${(compressedFile.size / 1024).toFixed(0)}KB`);

      // Upload de l'image compressée
      const { file_url } = await base44.integrations.Core.UploadFile({ file: compressedFile });

      const newPhoto = {
        url: file_url,
        label: REQUIRED_PHOTOS.find((p) => p.id === category)?.label || "Photo supplémentaire",
        category: category
      };

      updateCheckInData({
        photos: [...checkInData.photos, newPhoto]
      });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      alert("Une erreur est survenue lors de l'upload de la photo.");
    } finally {
      // Retirer de la liste des uploads en cours
      setUploadingPhotos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }

    e.target.value = ''; // Reset file input
  };

  const handleAddDamage = (photoCategory) => {
    const damage = {
      ...damageForm,
      location: photoCategory,
      date_reported: new Date().toISOString().split('T')[0]
    };

    updateCheckInData({
      damages: [...checkInData.damages, damage]
    });

    setShowDamageForm(null);
    setDamageForm({
      type: "rayure",
      location: "",
      description: "",
      severity: "leger"
    });
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = checkInData.photos.filter((_, i) => i !== index);
    updateCheckInData({ photos: newPhotos });
  };

  const getPhotoForCategory = (category) => {
    return checkInData.photos.find((p) => p.category === category);
  };

  const getDamagesForCategory = (category) => {
    return checkInData.damages.filter((d) => d.location === category);
  };

  const isPhotoUploading = (category) => {
    return Array.from(uploadingPhotos).some((id) => id.startsWith(`${category}_`));
  };

  const allRequiredPhotosTaken = REQUIRED_PHOTOS.every((p) => getPhotoForCategory(p.id));
  const progress = (checkInData.photos.filter((p) => REQUIRED_PHOTOS.some((r) => r.id === p.category)).length / REQUIRED_PHOTOS.length) * 100;

  // Modified canProceed logic
  const canProceed =
    checkInData.mileage_start > 0 &&
    uploadingPhotos.size === 0 &&
    (continueWithoutPhotos || allRequiredPhotosTaken);

  const getFuelLevelFromPercentage = (percentage) => {
    // Trouver le niveau le plus proche
    const closest = fuelLevels.reduce((prev, curr) => {
      return Math.abs(curr.percentage - percentage) < Math.abs(prev.percentage - percentage) ? curr : prev;
    });
    return closest.value;
  };

  const getPercentageFromFuelLevel = (level) => {
    return fuelLevels.find((f) => f.value === level)?.percentage || 50;
  };

  const handleFuelSliderChange = (value) => {
    const fuelLevel = getFuelLevelFromPercentage(value[0]);
    updateCheckInData({ fuel_level: fuelLevel });
  };

  const currentFuelPercentage = getPercentageFromFuelLevel(checkInData.fuel_level);

  const handleNextStep = () => {
    if (!continueWithoutPhotos) {
      const missingPhotos = REQUIRED_PHOTOS.filter(
        (reqPhoto) => !checkInData.photos.some((p) => p.category === reqPhoto.id)
      );

      if (missingPhotos.length > 0) {
        alert(
          `Veuillez ajouter les photos manquantes :\n${missingPhotos
            .map((p) => `- ${p.label}`)
            .join("\n")}`
        );
        return;
      }
    }

    if (!checkInData.mileage_start || checkInData.mileage_start <= 0) {
      alert("Veuillez saisir le kilométrage de départ.");
      return;
    }

    // Fuel level always has a default value from the slider, so no explicit check needed here

    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Header avec progression (NEW SECTION) */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              Photos & État du véhicule
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {checkInData.photos.filter((p) => REQUIRED_PHOTOS.some((r) => r.id === p.category)).length} / {REQUIRED_PHOTOS.length} photos obligatoires • Étape 2/3
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* NEW: Option continuer sans photos */}
        <div className="mt-4 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <Checkbox
            id="continue-without-photos"
            checked={continueWithoutPhotos}
            onCheckedChange={setContinueWithoutPhotos}
            className="mt-0.5"
            disabled={uploadingPhotos.size > 0}
          />
          <div className="flex-1">
            <label
              htmlFor="continue-without-photos"
              className="text-sm font-semibold text-amber-900 dark:text-amber-200 cursor-pointer"
            >
              Continuer sans photos
            </label>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              ⚠️ Non recommandé : en cas de litige, vous n'aurez aucune preuve de l'état du véhicule au départ
            </p>
          </div>
        </div>
      </div>

      {/* Kilométrage */}
      <Card className="rounded-xl border text-card-foreground bg-white/70 backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">🏎️</span>
            Kilométrage de départ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            value={checkInData.mileage_start}
            onChange={(e) => updateCheckInData({ mileage_start: parseInt(e.target.value) || 0 })}
            className="text-lg font-semibold"
            placeholder="Entrer le kilométrage"
            disabled={uploadingPhotos.size > 0} />
        </CardContent>
      </Card>

      {/* Niveau de carburant avec barre de progression */}
      <Card className="rounded-xl border text-card-foreground bg-white/70 backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">⛽️</span>
            Niveau de carburant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barre de progression horizontale */}
          <div className="relative w-full h-8 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${currentFuelPercentage}%` }}>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
            {/* Marqueurs de pourcentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700 dark:text-white drop-shadow-lg">
                {checkInData.fuel_level} • {currentFuelPercentage}%
              </span>
            </div>
          </div>

          {/* Slider avec 9 crans */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-800 mb-2">
              <span>Vide</span>
              <span>1/8</span>
              <span>1/4</span>
              <span>3/8</span>
              <span>1/2</span>
              <span>5/8</span>
              <span>3/4</span>
              <span>7/8</span>
              <span>Plein</span>
            </div>
            <Slider
              value={[currentFuelPercentage]}
              onValueChange={handleFuelSliderChange}
              min={0}
              max={100}
              step={12.5}
              className="w-full"
              disabled={uploadingPhotos.size > 0} />
          </div>

          {/* Champ autonomie restante */}
          <div>
            <Label htmlFor="remaining_range" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm text-slate-700 dark:text-slate-800">Autonomie restante (km) - optionnel
            </Label>
            <Input
              id="remaining_range"
              type="number"
              value={checkInData.remaining_range || ''}
              onChange={(e) => updateCheckInData({ remaining_range: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="Ex: 450"
              className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50"
              disabled={uploadingPhotos.size > 0} />
          </div>
        </CardContent>
      </Card>

      {/* Photos obligatoires - Render conditionally */}
      {!continueWithoutPhotos ? (
        <Card className="rounded-xl border text-card-foreground bg-white/70 backdrop-blur-lg border-white/40 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-xl">📸</span>
              Photos du véhicule ({checkInData.photos.filter((p) => REQUIRED_PHOTOS.some((r) => r.id === p.category)).length}/{REQUIRED_PHOTOS.length})
              {uploadingPhotos.size > 0 &&
                <span className="text-sm text-blue-600 font-normal ml-2">
                  ({uploadingPhotos.size} upload{uploadingPhotos.size > 1 ? 's' : ''} en cours...)
                </span>
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REQUIRED_PHOTOS.map((photoReq) => {
              const photo = getPhotoForCategory(photoReq.id);
              const damages = getDamagesForCategory(photoReq.id);
              const isCurrentlyUploading = isPhotoUploading(photoReq.id);

              return (
                <div key={photoReq.id} className="border-2 border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{photoReq.label}</h4>
                      <p className="text-xs text-slate-500">{photoReq.description}</p>
                    </div>
                    {photo &&
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDamageForm(photoReq.id)}
                          className="text-orange-600 hover:text-orange-700"
                          disabled={uploadingPhotos.size > 0}>
                          <AlertTriangle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePhoto(checkInData.photos.findIndex((p) => p === photo))}
                          className="text-red-500 hover:text-red-600"
                          disabled={uploadingPhotos.size > 0}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    }
                  </div>

                  {photo ?
                    <div className="relative">
                      <img src={photo.url} alt={photoReq.label} className="w-full h-32 object-cover rounded-lg" />
                      {damages.length > 0 &&
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {damages.length} défaut(s)
                        </div>
                      }
                    </div> :
                    isCurrentlyUploading ?
                      <div className="w-full h-32 border-2 border-blue-300 rounded-lg flex flex-col items-center justify-center bg-blue-50">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                        <span className="text-sm text-blue-700 font-medium">Upload en cours...</span>
                        <span className="text-xs text-blue-600 mt-1">Compression et envoi</span>
                      </div> :

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoSelected(e, photoReq.id)}
                          className="hidden"
                          id={`photo-${photoReq.id}`}
                          disabled={uploadingPhotos.size > 0} // Disable if any photo is uploading
                        />
                        <label htmlFor={`photo-${photoReq.id}`}>
                          <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                            <Camera className="w-8 h-8 text-slate-400 mb-2" />
                            <span className="text-sm text-slate-500">Prendre la photo</span>
                          </div>
                        </label>
                      </div>
                  }

                  {/* Formulaire de signalement de dégât */}
                  {showDamageForm === photoReq.id &&
                    <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-3">
                      <h5 className="font-semibold text-sm text-orange-900">Signaler un défaut</h5>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Type</Label>
                          <select
                            value={damageForm.type}
                            onChange={(e) => setDamageForm({ ...damageForm, type: e.target.value })}
                            className="w-full p-2 border rounded-lg text-sm"
                            disabled={uploadingPhotos.size > 0}>
                            <option value="rayure">Rayure</option>
                            <option value="bosse">Bosse</option>
                            <option value="cassure">Cassure</option>
                            <option value="usure">Usure</option>
                            <option value="autre">Autre</option>
                          </select>
                        </div>

                        <div>
                          <Label className="text-xs">Gravité</Label>
                          <select
                            value={damageForm.severity}
                            onChange={(e) => setDamageForm({ ...damageForm, severity: e.target.value })}
                            className="w-full p-2 border rounded-lg text-sm"
                            disabled={uploadingPhotos.size > 0}>
                            <option value="leger">Léger</option>
                            <option value="moyen">Moyen</option>
                            <option value="grave">Grave</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Description</Label>
                        <textarea
                          value={damageForm.description}
                          onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                          className="w-full p-2 border rounded-lg text-sm"
                          rows={2}
                          placeholder="Décrivez le défaut..."
                          disabled={uploadingPhotos.size > 0} />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddDamage(photoReq.id)}
                          className="flex-1"
                          disabled={uploadingPhotos.size > 0}>
                          Ajouter le défaut
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowDamageForm(null)}
                          disabled={uploadingPhotos.size > 0}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  }

                  {/* Liste des dégâts */}
                  {damages.length > 0 && showDamageForm !== photoReq.id &&
                    <div className="mt-2 space-y-1">
                      {damages.map((damage, idx) =>
                        <div key={idx} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                          {damage.type} ({damage.severity}): {damage.description}
                        </div>
                      )}
                    </div>
                  }
                </div>);

            })}

            {/* Photos supplémentaires */}
            <div className="pt-4 border-t-2 border-dashed">
              <h4 className="font-semibold text-sm mb-3">Photos supplémentaires (max 10)</h4>
              <div className="grid grid-cols-2 gap-3">
                {checkInData.photos.
                  filter((p) => !REQUIRED_PHOTOS.some((r) => r.id === p.category)).
                  slice(0, 10).
                  map((photo, idx) =>
                    <div key={idx} className="relative">
                      <img src={photo.url} alt="Supplémentaire" className="w-full h-24 object-cover rounded-lg" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePhoto(checkInData.photos.findIndex((p) => p === photo))}
                        className="absolute top-1 right-1 bg-white/80 text-red-500 hover:text-red-600 rounded-full p-1 h-auto"
                        disabled={uploadingPhotos.size > 0}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                {checkInData.photos.filter((p) => !REQUIRED_PHOTOS.some((r) => r.id === p.category)).length < 10 &&
                  <>
                    {isPhotoUploading("autre") ?
                      <div className="w-full h-24 border-2 border-blue-300 rounded-lg flex flex-col items-center justify-center bg-blue-50">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <span className="text-xs text-blue-600 mt-1">Upload...</span>
                      </div> :

                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handlePhotoSelected(e, "autre")}
                          className="hidden"
                          id="photo-extra"
                          disabled={uploadingPhotos.size > 0} // Disable if any photo is uploading
                        />
                        <label htmlFor="photo-extra">
                          <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                            <Plus className="w-6 h-6 text-slate-400" />
                            <span className="text-xs text-slate-500">Ajouter</span>
                          </div>
                        </label>
                      </div>
                    }
                  </>
                }
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Afficher un message si "continuer sans photos" est coché (NEW SECTION) */
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                Photos désactivées
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Vous avez choisi de continuer sans photos. Cela peut poser problème en cas de litige sur l'état du véhicule.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* Boutons navigation (MODIFIED) */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 rounded-full h-12 border-2"
          size="lg"
          disabled={uploadingPhotos.size > 0}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNextStep} // Use the new handleNextStep for validation
          disabled={!canProceed}
          className="flex-1 rounded-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          size="lg">
          {uploadingPhotos.size > 0 ?
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Upload en cours...
            </> :
            <>
              Continuer
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          }
        </Button>
      </div>

      {!canProceed && uploadingPhotos.size === 0 && !continueWithoutPhotos &&
        <p className="text-center text-sm text-orange-600">
          Veuillez remplir le kilométrage et prendre toutes les photos obligatoires
        </p>
      }
      {!canProceed && uploadingPhotos.size === 0 && continueWithoutPhotos &&
        <p className="text-center text-sm text-orange-600">
          Veuillez remplir le kilométrage.
        </p>
      }

      {uploadingPhotos.size > 0 &&
        <p className="text-center text-sm text-blue-600">
          Veuillez patienter pendant l'upload des photos ({uploadingPhotos.size} restante{uploadingPhotos.size > 1 ? 's' : ''})
        </p>
      }
    </div>);
}
