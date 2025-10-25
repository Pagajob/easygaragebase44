
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  ArrowRight,
  ArrowLeft,
  Camera,
  Gauge,
  Fuel,
  AlertTriangle,
  X,
  Plus,
  Upload,
  TrendingUp,
  CheckCircle // Added CheckCircle icon
} from
"lucide-react";
import { base44 } from "@/api/base44Client";
import { differenceInHours, parseISO } from "date-fns";
import { formatCurrency, getOrganizationCurrency, formatNumber } from "../utils/formatters"; // Updated import

const fuelLevels = [
{ value: "vide", label: "Vide", percentage: 0 },
{ value: "1/4", label: "1/4", percentage: 25 },
{ value: "1/2", label: "1/2", percentage: 50 },
{ value: "3/4", label: "3/4", percentage: 75 },
{ value: "plein", label: "Plein", percentage: 100 }];


export default function CheckOutStep2({ reservation, vehicle, checkIn, checkOutData, updateCheckOutData, onNext, onBack }) {
  const [isUploading, setIsUploading] = useState(false);
  const [showDamageForm, setShowDamageForm] = useState(false);
  const [damageForm, setDamageForm] = useState({
    type: "rayure",
    location: "",
    description: "",
    severity: "leger"
  });
  const [errors, setErrors] = useState({});
  const [currency, setCurrency] = useState('EUR'); // Added currency state

  // Load organization currency on component mount
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  // Calculer avec la bonne logique (24h = 1 jour)
  const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
  const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);
  const hours = differenceInHours(endDateTime, startDateTime);

  // CORRECTION: 24h = 1 jour, 24h01 = 2 jours
  const calculatedRentalDays = hours > 0 ? Math.ceil(hours / 24) : 1;

  const calculatedIncludedKm = vehicle?.unlimited_km ? 999999 : calculatedRentalDays * (vehicle?.daily_km_included || 200);

  const kmStart = checkIn?.mileage_start || 0;
  const kmEnd = checkOutData.mileage_end || 0;
  const kmDifference = kmEnd - kmStart;

  // Validation function
  const validate = () => {
    const newErrors = {};

    if (!checkOutData.mileage_end || checkOutData.mileage_end < kmStart) {
      newErrors.mileage_end = "Le kilométrage de retour doit être supérieur ou égal au kilométrage de départ";
    }

    if (!checkOutData.fuel_level) {
      newErrors.fuel_level = "Le niveau de carburant est requis";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const updateMileage = (value) => {
    const numValue = parseInt(value, 10) || 0;
    updateCheckOutData({ mileage_end: numValue });
    if (errors.mileage_end) {
      setErrors((prev) => ({ ...prev, mileage_end: undefined }));
    }
  };

  const updateFuelLevel = (value) => {
    updateCheckOutData({ fuel_level: value });
    if (errors.fuel_level) {
      setErrors((prev) => ({ ...prev, fuel_level: undefined }));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const newPhoto = {
        url: file_url,
        label: "Photo retour"
      };

      updateCheckOutData({
        photos: [...checkOutData.photos, newPhoto]
      });
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDamage = () => {
    const damage = {
      ...damageForm,
      date_reported: new Date().toISOString().split('T')[0]
    };

    updateCheckOutData({
      damages: [...checkOutData.damages, damage]
    });

    setShowDamageForm(false);
    setDamageForm({
      type: "rayure",
      location: "",
      description: "",
      severity: "leger"
    });
  };

  const handleRemovePhoto = (index) => {
    const newPhotos = checkOutData.photos.filter((_, i) => i !== index);
    updateCheckOutData({ photos: newPhotos });
  };

  const handleRemoveDamage = (index) => {
    const newDamages = checkOutData.damages.filter((_, i) => i !== index);
    updateCheckOutData({ damages: newDamages });
  };

  const getFuelLevelFromPercentage = (percentage) => {
    if (percentage <= 10) return "vide";
    if (percentage <= 37) return "1/4";
    if (percentage <= 62) return "1/2";
    if (percentage <= 87) return "3/4";
    return "plein";
  };

  const getPercentageFromFuelLevel = (level) => {
    return fuelLevels.find((f) => f.value === level)?.percentage || 50;
  };

  const handleFuelSliderChange = (value) => {
    const fuelLevel = getFuelLevelFromPercentage(value[0]);
    updateFuelLevel(fuelLevel);
  };

  const extraKm = vehicle?.unlimited_km ? 0 : Math.max(0, kmDifference - calculatedIncludedKm);
  const extraKmCost = extraKm * (vehicle?.price_per_extra_km || 1.00);

  const currentFuelPercentage = getPercentageFromFuelLevel(checkOutData.fuel_level);
  const startFuelPercentage = getPercentageFromFuelLevel(checkIn?.fuel_level || "1/2");

  return (
    <div className="space-y-6">
      {/* Kilométrage */}
      <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20"> {/* Updated Card styling */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base dark:text-white"> {/* Updated text color */}
            <Gauge className="w-5 h-5" />
            Kilométrage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
              <Label className="text-sm text-blue-600 mb-1">Départ</Label>
              <p className="text-2xl font-bold text-blue-900">{formatNumber(kmStart)} km</p>
            </div>
            <div className="p-4 bg-white/60 rounded-xl border-2 border-slate-300">
              <Label htmlFor="mileage_end" className="text-sm text-slate-600 mb-1">Retour *</Label>
              <Input
                id="mileage_end"
                type="number"
                value={checkOutData.mileage_end || ''}
                onChange={(e) => updateMileage(e.target.value)}
                className={`text-2xl font-bold h-auto py-1 ${errors.mileage_end ? 'border-red-500' : ''}`}
                placeholder="0" />

              {errors.mileage_end &&
              <p className="text-xs text-red-500 mt-1">{errors.mileage_end}</p>
              }
            </div>
          </div>

          {/* Affichage du calcul des km */}
          {kmDifference > 0 && // Only show if kmDifference is positive
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-blue-700 dark:text-blue-300">Kilométrage parcouru</span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  {kmDifference.toLocaleString('fr-FR')} km
                </span>
              </div>
              
              {!vehicle?.unlimited_km ?
              <>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-300">Kilométrage inclus</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">
                      {calculatedIncludedKm.toLocaleString('fr-FR')} km
                    </span>
                  </div>

                  {extraKm > 0 &&
                <>
                      <div className="flex justify-between text-sm">
                        <span className="text-orange-700 dark:text-orange-300">Kilomètres supplémentaires</span>
                        <span className="font-semibold text-orange-900 dark:text-orange-100">
                          {extraKm.toLocaleString('fr-FR')} km
                        </span>
                      </div>

                      <div className="flex justify-between text-sm pt-2 border-t border-blue-200 dark:border-blue-700">
                        <span className="text-blue-700 dark:text-blue-300">
                          Coût supplémentaire ({formatCurrency(vehicle?.price_per_extra_km || 1, currency)}/km)
                        </span>
                        <span className="font-bold text-lg text-orange-900 dark:text-orange-100">
                          {formatCurrency(extraKmCost, currency)}
                        </span>
                      </div>
                    </>
                }
                </> :

              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                  <CheckCircle className="w-4 h-4" />
                  <span>Kilométrage illimité - Aucun surcoût</span>
                </div>
              }
            </div>
          </div>
          }
        </CardContent>
      </Card>

      {/* Niveau de carburant avec slider */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Fuel className="w-5 h-5" />
            Niveau de carburant *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comparaison départ/retour */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-800 mb-2">Départ</p>
              <div className="inline-block">
                <div className="w-16 h-24 border-3 border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden relative bg-white dark:bg-black/10">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                    style={{ height: `${startFuelPercentage}%` }} />

                  {[25, 50, 75].map((level) =>
                  <div
                    key={level}
                    className="absolute left-0 right-0 border-t border-slate-300 dark:border-slate-600 border-dashed"
                    style={{ bottom: `${level}%` }} />

                  )}
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{checkIn?.fuel_level}</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-500 dark:text-slate-800 mb-2">Retour</p>
              <div className="inline-block">
                <div className="w-16 h-24 border-3 border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden relative bg-white dark:bg-black/10">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 transition-all duration-500"
                    style={{ height: `${currentFuelPercentage}%` }}>

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  </div>
                  {[25, 50, 75].map((level) =>
                  <div
                    key={level}
                    className="absolute left-0 right-0 border-t border-slate-300 dark:border-slate-600 border-dashed"
                    style={{ bottom: `${level}%` }} />

                  )}
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">{checkOutData.fuel_level}</p>
              </div>
            </div>
          </div>

          {/* Slider */}
          <div className="px-4 py-6 bg-slate-50/50 dark:bg-transparent">
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-800 mb-2">
                <span>Vide</span>
                <span>1/4</span>
                <span>1/2</span>
                <span>3/4</span>
                <span>Plein</span>
              </div>
              <Slider
                value={[currentFuelPercentage]}
                onValueChange={handleFuelSliderChange}
                max={100}
                step={1}
                className="w-full" />

            </div>

            <p className="text-center text-sm text-slate-600 dark:text-slate-800">
              Niveau actuel: <strong className="text-slate-900 dark:text-white">{currentFuelPercentage}%</strong>
            </p>
          </div>

          {/* Boutons rapides */}
          {errors.fuel_level &&
          <p className="text-xs text-red-500 text-center mt-2">{errors.fuel_level}</p>
          }
        </CardContent>
      </Card>

      {/* Photos optionnelles */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="w-5 h-5" />
            Photos (optionnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {checkOutData.photos.map((photo, idx) =>
            <div key={idx} className="relative">
                <img src={photo.url} alt="Photo" className="w-full h-24 object-cover rounded-lg" />
                <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1 right-1 bg-white/80 text-red-500 hover:text-red-600 rounded-full p-1 h-auto">

                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {checkOutData.photos.length < 10 &&
            <div>
                <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={isUploading} />

                <label htmlFor="photo-upload">
                  <div className="w-full h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50">
                    {isUploading ?
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> :

                  <>
                        <Upload className="w-6 h-6 text-slate-400" />
                        <span className="text-xs text-slate-500 mt-1">Ajouter</span>
                      </>
                  }
                  </div>
                </label>
              </div>
            }
          </div>
        </CardContent>
      </Card>

      {/* Nouveaux dégâts */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5" />
            Nouveaux dégâts constatés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checkOutData.damages.length === 0 ?
          <p className="text-sm text-slate-500 text-center py-4">
              Aucun nouveau dégât signalé
            </p> :

          <div className="space-y-2">
              {checkOutData.damages.map((damage, idx) =>
            <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-red-900">
                      {damage.type} - {damage.severity}
                    </p>
                    <p className="text-xs text-red-700">{damage.location}</p>
                    <p className="text-xs text-red-600 mt-1">{damage.description}</p>
                  </div>
                  <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDamage(idx)}
                className="text-red-500 hover:text-red-700">

                    <X className="w-4 h-4" />
                  </Button>
                </div>
            )}
            </div>
          }

          {!showDamageForm ?
          <Button
            onClick={() => setShowDamageForm(true)}
            variant="outline" className="bg-background px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full">


              <Plus className="w-4 h-4 mr-2" />
              Signaler un nouveau dégât
            </Button> :

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <h5 className="font-semibold text-sm text-orange-900">Signaler un dégât</h5>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                  value={damageForm.type}
                  onChange={(e) => setDamageForm({ ...damageForm, type: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm">

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
                  className="w-full p-2 border rounded-lg text-sm">

                    <option value="leger">Léger</option>
                    <option value="moyen">Moyen</option>
                    <option value="grave">Grave</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Localisation</Label>
                <Input
                value={damageForm.location}
                onChange={(e) => setDamageForm({ ...damageForm, location: e.target.value })}
                placeholder="Ex: Pare-choc avant gauche"
                className="text-sm" />

              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                value={damageForm.description}
                onChange={(e) => setDamageForm({ ...damageForm, description: e.target.value })}
                className="text-sm"
                rows={2}
                placeholder="Décrivez le défaut..." />

              </div>

              <div className="flex gap-2">
                <Button
                size="sm"
                onClick={handleAddDamage}
                className="flex-1"
                disabled={!damageForm.location || !damageForm.description}>

                  Ajouter
                </Button>
                <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDamageForm(false)}>

                  Annuler
                </Button>
              </div>
            </div>
          }
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Notes (optionnel)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={checkOutData.notes}
            onChange={(e) => updateCheckOutData({ notes: e.target.value })}
            rows={3}
            placeholder="Remarques sur le retour du véhicule..."
            className="text-sm" />

        </CardContent>
      </Card>

      {/* Boutons navigation */}
      <div className="flex gap-3">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1 rounded-full"
          size="lg">

          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 rounded-full"
          size="lg">

          Signatures
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>);

}