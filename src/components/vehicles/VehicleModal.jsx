
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Upload, AlertTriangle, Gauge } from "lucide-react";
import { UploadFile } from "@/api/integrations";
import { getOrganizationCurrency, getCurrencySymbol } from "../utils/formatters";

export default function VehicleModal({ isOpen, onClose, vehicle, onSave }) {
  const [formData, setFormData] = useState({
    plate: "",
    vin: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    fuel_type: "essence",
    horsepower: 0, // NEW FIELD
    mileage: 0,
    status: "disponible",
    financing_type: "comptant",
    purchase_price: 0,
    purchase_date: "",
    monthly_insurance: 0,
    down_payment: 0,
    monthly_payment: 0,
    residual_value: 0,
    monthly_rent: 0,
    deposit_paid: 0,
    owner_name: "",
    owner_price_24h: 0,
    owner_price_weekend: 0,
    insurance_provider: "",
    insurance_expiry: "",
    registration_expiry: "",
    monthly_charges: [],
    damages: [],
    unlimited_km: false,
    daily_km_included: 200,
    price_per_extra_km: 1.00,
    min_driver_age: 21,
    min_license_years: 2,
    price_24h: 0,
    price_weekend: 0,
    deposit: 0,
    deposit_rsv: 0,
    photo_url: "",
    notes: "",
    published_on_marketplace: false,
    marketplace_city: "",
    marketplace_description: "",
    marketplace_features: [],
    marketplace_images: []
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const [currencySymbol, setCurrencySymbol] = useState('€');
  const [uploadingImageIndex, setUploadingImageIndex] = useState(null);

  // Load currency on component mount
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
      setCurrencySymbol(getCurrencySymbol(curr));
    };
    loadCurrency();
  }, []);

  useEffect(() => {
    if (isOpen) { // Only update formData if modal is open or vehicle changes
      if (vehicle) {
        setFormData({
          ...vehicle,
          horsepower: vehicle.horsepower ?? 0, // NEW FIELD
          monthly_charges: vehicle.monthly_charges || [],
          damages: vehicle.damages || [],
          unlimited_km: vehicle.unlimited_km ?? false,
          daily_km_included: vehicle.daily_km_included ?? 200,
          price_per_extra_km: vehicle.price_per_extra_km ?? 1.00,
          min_driver_age: vehicle.min_driver_age ?? 21,
          min_license_years: vehicle.min_license_years ?? 2,
          price_24h: vehicle.price_24h ?? 0,
          price_weekend: vehicle.price_weekend ?? 0,
          deposit: vehicle.deposit ?? 0,
          deposit_rsv: vehicle.deposit_rsv ?? 0,
          monthly_insurance: vehicle.monthly_insurance ?? 0,
          down_payment: vehicle.down_payment ?? 0,
          monthly_payment: vehicle.monthly_payment ?? 0,
          residual_value: vehicle.residual_value ?? 0,
          monthly_rent: vehicle.monthly_rent ?? 0,
          deposit_paid: vehicle.deposit_paid ?? 0,
          owner_name: vehicle.owner_name ?? "",
          owner_price_24h: vehicle.owner_price_24h ?? 0,
          owner_price_weekend: vehicle.owner_price_weekend ?? 0,
          published_on_marketplace: vehicle.published_on_marketplace ?? false,
          marketplace_city: vehicle.marketplace_city ?? "",
          marketplace_description: vehicle.marketplace_description ?? "",
          marketplace_features: vehicle.marketplace_features ?? [],
          marketplace_images: vehicle.marketplace_images ?? []
        });
      } else {
        setFormData({
          plate: "",
          vin: "",
          make: "",
          model: "",
          year: new Date().getFullYear(),
          fuel_type: "essence",
          horsepower: 0, // NEW FIELD
          mileage: 0,
          status: "disponible",
          financing_type: "comptant",
          purchase_price: 0,
          purchase_date: "",
          monthly_insurance: 0,
          down_payment: 0,
          monthly_payment: 0,
          residual_value: 0,
          monthly_rent: 0,
          deposit_paid: 0,
          owner_name: "",
          owner_price_24h: 0,
          owner_price_weekend: 0,
          insurance_provider: "",
          insurance_expiry: "",
          registration_expiry: "",
          monthly_charges: [],
          damages: [],
          unlimited_km: false,
          daily_km_included: 200,
          price_per_extra_km: 1.00,
          min_driver_age: 21,
          min_license_years: 2,
          price_24h: 0,
          price_weekend: 0,
          deposit: 0,
          deposit_rsv: 0,
          photo_url: "",
          notes: "",
          published_on_marketplace: false,
          marketplace_city: "",
          marketplace_description: "",
          marketplace_features: [],
          marketplace_images: []
        });
      }
    }
  }, [vehicle, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange("photo_url", file_url);
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    } finally {
      setIsUploading(false);
      e.target.value = null; // Clear the input so same file can be re-selected
    }
  };

  const addMonthlyCharge = () => {
    setFormData((prev) => ({
      ...prev,
      monthly_charges: [
        ...prev.monthly_charges,
        { label: "", amount: 0, note: "" }
      ]
    }));
  };

  const removeMonthlyCharge = (index) => {
    setFormData((prev) => ({
      ...prev,
      monthly_charges: prev.monthly_charges.filter((_, i) => i !== index)
    }));
  };

  const updateMonthlyCharge = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      monthly_charges: prev.monthly_charges.map((charge, i) =>
        i === index ? { ...charge, [field]: value } : charge
      )
    }));
  };

  const removeDamage = (index) => {
    setFormData((prev) => ({
      ...prev,
      damages: prev.damages.filter((_, i) => i !== index)
    }));
  };

  const handleMarketplaceImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit of 10
    const currentImagesCount = formData.marketplace_images?.length || 0;
    const filesToAddCount = files.length;
    if (currentImagesCount + filesToAddCount > 10) {
      alert(`Vous ne pouvez télécharger que ${10 - currentImagesCount} images supplémentaires. La limite est de 10 images.`);
      e.target.value = null; // Clear the file input
      return;
    }

    for (let i = 0; i < files.length; i++) {
      setUploadingImageIndex(i); // Indicate which file is currently uploading
      try {
        // Corrected to use the imported UploadFile from "@/api/integrations"
        const { file_url } = await UploadFile({ file: files[i] });
        setFormData(prev => ({
          ...prev,
          // Ensure marketplace_images is an array before spreading
          marketplace_images: [...(prev.marketplace_images || []), file_url]
        }));
      } catch (error) {
        console.error("Erreur lors de l'upload d'image marketplace:", error);
      }
    }
    setUploadingImageIndex(null); // Reset after all uploads are done
    e.target.value = null; // Clear the input so same files can be re-selected
  };

  const removeMarketplaceImage = (index) => {
    setFormData(prev => ({
      ...prev,
      marketplace_images: prev.marketplace_images.filter((_, i) => i !== index)
    }));
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

  const renderFinancingFields = () => {
    switch (formData.financing_type) {
      case "comptant":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchase_price" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Prix d'achat ({currencySymbol})</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => handleInputChange("purchase_price", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <Label htmlFor="purchase_date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Date d'achat</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleInputChange("purchase_date", e.target.value)}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
            </div>
            <div>
              <Label htmlFor="monthly_insurance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Assurance mensuelle ({currencySymbol})</Label>
              <Input
                id="monthly_insurance"
                type="number"
                step="0.01"
                value={formData.monthly_insurance}
                onChange={(e) => handleInputChange("monthly_insurance", parseFloat(e.target.value))}
                className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
            </div>
          </div>);

      case "leasing":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly_insurance">Assurance mensuelle ({currencySymbol})</Label>
              <Input
                id="monthly_insurance"
                type="number"
                step="0.01"
                value={formData.monthly_insurance}
                onChange={(e) => handleInputChange("monthly_insurance", parseFloat(e.target.value))}
                className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="down_payment">Apport initial ({currencySymbol})</Label>
                <Input
                  id="down_payment"
                  type="number"
                  step="0.01"
                  value={formData.down_payment}
                  onChange={(e) => handleInputChange("down_payment", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <Label htmlFor="monthly_payment">Mensualités ({currencySymbol})</Label>
                <Input
                  id="monthly_payment"
                  type="number"
                  step="0.01"
                  value={formData.monthly_payment}
                  onChange={(e) => handleInputChange("monthly_payment", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
            </div>
            <div>
              <Label htmlFor="residual_value">Valeur résiduelle ({currencySymbol})</Label>
              <Input
                id="residual_value"
                type="number"
                step="0.01"
                value={formData.residual_value}
                onChange={(e) => handleInputChange("residual_value", parseFloat(e.target.value))}
                className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
            </div>
          </div>);

      case "lld":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly_insurance">Assurance mensuelle ({currencySymbol})</Label>
              <Input
                id="monthly_insurance"
                type="number"
                step="0.01"
                value={formData.monthly_insurance}
                onChange={(e) => handleInputChange("monthly_insurance", parseFloat(e.target.value))}
                className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthly_rent">Loyer mensuel ({currencySymbol})</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  step="0.01"
                  value={formData.monthly_rent}
                  onChange={(e) => handleInputChange("monthly_rent", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
              <div>
                <Label htmlFor="deposit_paid">Caution déposée ({currencySymbol})</Label>
                <Input
                  id="deposit_paid"
                  type="number"
                  step="0.01"
                  value={formData.deposit_paid}
                  onChange={(e) => handleInputChange("deposit_paid", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
            </div>
          </div>);

      case "mise_a_disposition":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly_insurance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Assurance mensuelle ({currencySymbol})</Label>
              <Input
                id="monthly_insurance"
                type="number"
                step="0.01"
                value={formData.monthly_insurance}
                onChange={(e) => handleInputChange("monthly_insurance", parseFloat(e.target.value))}
                className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
            </div>
            <div>
              <Label htmlFor="owner_name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Nom du propriétaire</Label>
              <Input
                id="owner_name"
                value={formData.owner_name}
                onChange={(e) => handleInputChange("owner_name", e.target.value)}
                className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner_price_24h" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Prix reversé 24H ({currencySymbol})</Label>
                <Input
                  id="owner_price_24h"
                  type="number"
                  step="0.01"
                  value={formData.owner_price_24h}
                  onChange={(e) => handleInputChange("owner_price_24h", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Montant versé au propriétaire pour une location 24H</p>
              </div>
              <div>
                <Label htmlFor="owner_price_weekend" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Prix reversé Weekend 48H ({currencySymbol})</Label>
                <Input
                  id="owner_price_weekend"
                  type="number"
                  step="0.01"
                  value={formData.owner_price_weekend}
                  onChange={(e) => handleInputChange("owner_price_weekend", parseFloat(e.target.value))}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Montant versé au propriétaire pour un weekend</p>
              </div>
            </div>
          </div>);

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-white/30 dark:border-slate-700/30 rounded-2xl shadow-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold dark:text-white">
            {vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-slate-100/80 text-muted-foreground p-1.5 rounded-[100px] items-center justify-center grid w-full grid-cols-6 gap-1 dark:bg-slate-700/50 h-auto">
              <TabsTrigger
                value="general" className="bg-transparent text-[10px] px-1 py-2 font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md sm:text-xs sm:px-2 dark:text-slate-300 dark:data-[state=active]:text-white">
                <span className="hidden sm:inline">Général</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
              <TabsTrigger
                value="pricing" className="text-[10px] px-1 py-2 font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md sm:text-xs sm:px-2 dark:text-slate-300 dark:data-[state=active]:text-white">
                Tarifs
              </TabsTrigger>
              <TabsTrigger
                value="financing" className="text-[10px] px-1 py-2 font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md sm:text-xs sm:px-2 dark:text-slate-300 dark:data-[state=active]:text-white">
                <span className="hidden sm:inline">Financement</span>
                <span className="sm:hidden">Fin.</span>
              </TabsTrigger>
              <TabsTrigger
                value="documents" className="text-[10px] px-1 py-2 font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md sm:text-xs sm:px-2 dark:text-slate-300 dark:data-[state=active]:text-white">
                <span className="hidden sm:inline">Documents</span>
                <span className="sm:hidden">Doc.</span>
              </TabsTrigger>
              <TabsTrigger
                value="charges" className="text-[10px] px-1 py-2 font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md sm:text-xs sm:px-2 dark:text-slate-300 dark:data-[state=active]:text-white">
                Charges
              </TabsTrigger>
              <TabsTrigger value="marketplace" className="text-[10px] px-1 py-2 font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-md sm:text-xs sm:px-2 dark:text-slate-300 dark:data-[state=active]:text-white">
                <span className="hidden sm:inline">Marketplace</span>
                <span className="sm:hidden">Market</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 pt-4">
              {/* Photo */}
              <div className="bg-white/40 dark:bg-slate-800/40 p-4 rounded-xl border border-white/20 dark:border-slate-700/20">
                <Label className="dark:text-slate-300">Photo du véhicule</Label>
                <div className="mt-2 flex flex-col sm:flex-row items-center gap-4">
                  {formData.photo_url &&
                    <img
                      src={formData.photo_url}
                      alt="Véhicule"
                      className="w-full sm:w-24 h-24 object-cover rounded-xl" />
                  }
                  <div className="flex-1 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload" />
                    <label htmlFor="photo-upload" className="w-full">
                      <div className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/50">
                        <Upload className="w-6 h-6 text-slate-500 dark:text-slate-400 mb-1" />
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {isUploading ? "Upload en cours..." : "Glisser-déposer ou cliquer"}
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Informations de base */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plate" className="dark:text-slate-300">Immatriculation *</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={(e) => handleInputChange("plate", e.target.value)}
                    required className="bg-white/50 px-3 py-2 text-base rounded-[100px] flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50" />
                </div>
                <div>
                  <Label htmlFor="vin" className="dark:text-slate-300">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => handleInputChange("vin", e.target.value)}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="make" className="dark:text-slate-300">Marque *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e) => handleInputChange("make", e.target.value)}
                    required
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="model" className="dark:text-slate-300">Modèle *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    required
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="year" className="dark:text-slate-300">Année</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", parseInt(e.target.value))}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="fuel_type" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-300">Motorisation
                  </Label>
                  <Select
                    value={formData.fuel_type}
                    onValueChange={(value) => handleInputChange("fuel_type", value)}>
                    <SelectTrigger
                      className="
        bg-white/50 dark:bg-slate-700/50
        border-slate-300/50 dark:border-slate-600/50
        rounded-full px-4 py-2
        text-slate-700 dark:text-slate-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-colors
      ">
                      <SelectValue placeholder="Choisir une motorisation" />
                    </SelectTrigger>

                    <SelectContent
                      className="
        bg-white/90 dark:bg-slate-800/90
        backdrop-blur-lg
        border border-white/30 dark:border-slate-700/30
        rounded-xl shadow-md
      ">
                      <SelectItem value="essence" className="dark:text-slate-100">Essence</SelectItem>
                      <SelectItem value="diesel" className="dark:text-slate-100">Diesel</SelectItem>
                      <SelectItem value="electrique" className="dark:text-slate-100">Électrique</SelectItem>
                      <SelectItem value="hybride" className="dark:text-slate-100">Hybride</SelectItem>
                      <SelectItem value="gpl" className="dark:text-slate-100">GPL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status" className="dark:text-slate-300">
                    Statut
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger
                      className="
        bg-white/50 dark:bg-slate-700/50
        border-slate-300/50 dark:border-slate-600/50
        rounded-full px-4 py-2
        text-slate-700 dark:text-slate-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-colors
      ">
                      <SelectValue placeholder="Choisir un statut" />
                    </SelectTrigger>

                    <SelectContent
                      className="
        bg-white/90 dark:bg-slate-800/90
        backdrop-blur-lg
        border border-white/30 dark:border-slate-700/30
        rounded-xl shadow-md
      ">
                      <SelectItem value="disponible" className="dark:text-slate-100">
                        Disponible
                      </SelectItem>
                      <SelectItem value="loue" className="dark:text-slate-100">
                        Loué
                      </SelectItem>
                      <SelectItem value="maintenance" className="dark:text-slate-100">
                        Maintenance
                      </SelectItem>
                      <SelectItem value="hors_service" className="dark:text-slate-100">
                        Hors service
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mileage" className="dark:text-slate-300">Kilométrage actuel</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => handleInputChange("mileage", parseInt(e.target.value))}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="horsepower" className="dark:text-slate-300">Puissance (ch)</Label>
                  <Input
                    id="horsepower"
                    type="number"
                    value={formData.horsepower}
                    onChange={(e) => handleInputChange("horsepower", parseInt(e.target.value))}
                    placeholder="ex: 150"
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
              </div>

              <div>
                <Label htmlFor="notes" className="dark:text-slate-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>

              {/* Dégâts connus */}
              {formData.damages && formData.damages.length > 0 &&
                <Card className="bg-orange-50/50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                      <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Dégâts connus ({formData.damages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {formData.damages.map((damage, index) =>
                      <div key={index} className="flex items-start justify-between p-3 bg-white/60 dark:bg-slate-700/60 border border-orange-200 dark:border-orange-700 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
                              {damage.type}
                            </span>
                            <span className="text-xs text-orange-700 dark:text-orange-200">•</span>
                            <span className="text-sm text-orange-800 dark:text-orange-200">
                              {damage.location}
                            </span>
                            <Badge className="bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 text-xs">
                              {damage.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-orange-700 dark:text-orange-200 mt-1">
                            {damage.description}
                          </p>
                          {damage.date_reported &&
                            <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                              Signalé le {new Date(damage.date_reported).toLocaleDateString('fr-FR')}
                            </p>
                          }
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDamage(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-full flex-shrink-0 ml-2">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              }
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 pt-4">
              <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Tarification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price_24h" className="dark:text-slate-300">Prix 24H ({currencySymbol})</Label>
                      <Input
                        id="price_24h"
                        type="number"
                        step="0.01"
                        value={formData.price_24h}
                        onChange={(e) => handleInputChange("price_24h", parseFloat(e.target.value))}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                    </div>
                    <div>
                      <Label htmlFor="price_weekend" className="dark:text-slate-300">Prix weekend 48H ({currencySymbol})</Label>
                      <Input
                        id="price_weekend"
                        type="number"
                        step="0.01"
                        value={formData.price_weekend}
                        onChange={(e) => handleInputChange("price_weekend", parseFloat(e.target.value))}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                    </div>
                  </div>

                  {/* Kilométrage illimité */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-200">Kilométrage illimité</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {formData.unlimited_km ? "Aucune limite de kilomètres" : "Limite de kilomètres appliquée"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.unlimited_km}
                      onCheckedChange={(checked) => handleInputChange("unlimited_km", checked)}
                      className="data-[state=checked]:bg-blue-600" />
                  </div>

                  {!formData.unlimited_km &&
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="daily_km_included" className="dark:text-slate-300">Kilométrage journalier inclus (km/jour)</Label>
                        <Input
                          id="daily_km_included"
                          type="number"
                          value={formData.daily_km_included}
                          onChange={(e) => handleInputChange("daily_km_included", parseInt(e.target.value))}
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Nombre de kilomètres inclus par jour de location</p>
                      </div>
                      <div>
                        <Label htmlFor="price_per_extra_km" className="dark:text-slate-300">Prix km supplémentaire ({currencySymbol}/km)</Label>
                        <Input
                          id="price_per_extra_km"
                          type="number"
                          step="0.01"
                          value={formData.price_per_extra_km}
                          onChange={(e) => handleInputChange("price_per_extra_km", parseFloat(e.target.value))}
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tarif appliqué si kilométrage dépassé</p>
                      </div>
                    </div>
                  }

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit" className="dark:text-slate-300">Caution de départ ({currencySymbol})</Label>
                      <Input
                        id="deposit"
                        type="number"
                        step="0.01"
                        value={formData.deposit}
                        onChange={(e) => handleInputChange("deposit", parseFloat(e.target.value))}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                    </div>
                    <div>
                      <Label htmlFor="deposit_rsv" className="dark:text-slate-300">Caution RSV ({currencySymbol})</Label>
                      <Input
                        id="deposit_rsv"
                        type="number"
                        step="0.01"
                        value={formData.deposit_rsv}
                        onChange={(e) => handleInputChange("deposit_rsv", parseFloat(e.target.value))}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
                <CardHeader>
                  <CardTitle className="text-lg dark:text-white">Exigences conducteur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_driver_age" className="dark:text-slate-300">Âge minimum (ans)</Label>
                      <Input
                        id="min_driver_age"
                        type="number"
                        value={formData.min_driver_age}
                        onChange={(e) => handleInputChange("min_driver_age", parseInt(e.target.value))}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                    </div>
                    <div>
                      <Label htmlFor="min_license_years" className="dark:text-slate-300">Ancienneté permis (années)</Label>
                      <Input
                        id="min_license_years"
                        type="number"
                        value={formData.min_license_years}
                        onChange={(e) => handleInputChange("min_license_years", parseInt(e.target.value))}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ces critères seront vérifiés lors de la réservation</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financing" className="space-y-4 pt-4">
              <div>
                <Label
                  htmlFor="financing_type"
                  className="dark:text-slate-300"
                >
                  Mode de financement
                </Label>

                <Select
                  value={formData.financing_type}
                  onValueChange={(value) => handleInputChange("financing_type", value)}
                >
                  <SelectTrigger
                    className="
        bg-white/50 dark:bg-slate-700/50
        border border-slate-300/50 dark:border-slate-600/50
        rounded-full px-4 py-2
        text-sm text-slate-700 dark:text-slate-100
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-colors
      "
                  >
                    <SelectValue placeholder="Choisir un mode de financement" />
                  </SelectTrigger>

                  <SelectContent
                    className="
        bg-white/90 dark:bg-slate-800/90
        backdrop-blur-lg
        border border-white/30 dark:border-slate-700/30
        rounded-xl shadow-md
      "
                  >
                    <SelectItem value="comptant" className="dark:text-slate-100">
                      Comptant
                    </SelectItem>
                    <SelectItem value="leasing" className="dark:text-slate-100">
                      Leasing
                    </SelectItem>
                    <SelectItem value="lld" className="dark:text-slate-100">
                      LLD
                    </SelectItem>
                    <SelectItem value="mise_a_disposition" className="dark:text-slate-100">
                      Mise à disposition
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderFinancingFields()}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insurance_provider" className="dark:text-slate-300">Assureur</Label>
                  <Input
                    id="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={(e) => handleInputChange("insurance_provider", e.target.value)}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="insurance_expiry" className="dark:text-slate-300">Échéance assurance</Label>
                  <Input
                    id="insurance_expiry"
                    type="date"
                    value={formData.insurance_expiry}
                    onChange={(e) => handleInputChange("insurance_expiry", e.target.value)}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
                </div>
              </div>

              <div>
                <Label htmlFor="registration_expiry" className="dark:text-slate-300">Échéance carte grise</Label>
                <Input
                  id="registration_expiry"
                  type="date"
                  value={formData.registration_expiry}
                  onChange={(e) => handleInputChange("registration_expiry", e.target.value)}
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />
              </div>
            </TabsContent>

            <TabsContent value="charges" className="space-y-4 pt-4">
              <Card className="bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg dark:text-white">Charges mensuelles</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addMonthlyCharge} className="bg-background px-3 text-sm font-medium rounded-3xl inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-9 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.monthly_charges.map((charge, index) =>
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 bg-white/30 dark:bg-slate-700/30 rounded-lg">
                      <div className="col-span-12 sm:col-span-4">
                        <Label className="text-sm dark:text-slate-300">Libellé</Label>
                        <Input
                          value={charge.label}
                          onChange={(e) => updateMonthlyCharge(index, "label", e.target.value)}
                          placeholder="Libellé"
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-md" />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <Label className="text-sm dark:text-slate-300">Montant ({currencySymbol})</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={charge.amount}
                          onChange={(e) => updateMonthlyCharge(index, "amount", parseFloat(e.target.value))}
                          placeholder="0"
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-md" />
                      </div>
                      <div className="col-span-5 sm:col-span-4">
                        <Label className="text-sm dark:text-slate-300">Note</Label>
                        <Input
                          value={charge.note}
                          onChange={(e) => updateMonthlyCharge(index, "note", e.target.value)}
                          placeholder="Note optionnelle"
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-md" />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMonthlyCharge(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {formData.monthly_charges.length === 0 &&
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4">
                      Aucune charge mensuelle définie
                    </p>
                  }
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-4 pt-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  📢 Publiez ce véhicule sur notre marketplace publique pour recevoir des demandes de location directement.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/40 dark:bg-slate-800/40 rounded-xl border border-white/20 dark:border-slate-700/20">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Publier sur la Marketplace</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      Rendez ce véhicule visible publiquement sur EasyGarage Marketplace.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.published_on_marketplace}
                  onCheckedChange={(checked) => handleInputChange("published_on_marketplace", checked)}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>

              {formData.published_on_marketplace && (
                <>
                  <div>
                    <Label htmlFor="marketplace_city" className="dark:text-slate-300">Ville *</Label>
                    <Input
                      id="marketplace_city"
                      value={formData.marketplace_city}
                      onChange={(e) => handleInputChange("marketplace_city", e.target.value)}
                      placeholder="Paris, Lyon, Marseille..."
                      required={formData.published_on_marketplace}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Ville où le véhicule est disponible
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="marketplace_description" className="dark:text-slate-300">Description publique</Label>
                    <Textarea
                      id="marketplace_description"
                      value={formData.marketplace_description}
                      onChange={(e) => handleInputChange("marketplace_description", e.target.value)}
                      rows={4}
                      placeholder="Décrivez votre véhicule pour les clients potentiels..."
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                    />
                  </div>

                  {/* Galerie photos marketplace */}
                  <div>
                    <Label className="dark:text-slate-300 mb-3 block">Galerie photos (jusqu'à 10)</Label>

                    {/* Images existantes */}
                    {formData.marketplace_images && formData.marketplace_images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {formData.marketplace_images.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-600"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              onClick={() => removeMarketplaceImage(index)}
                              className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bouton d'ajout */}
                    {(!formData.marketplace_images || formData.marketplace_images.length < 10) && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleMarketplaceImageUpload}
                          className="hidden"
                          id="marketplace-images-upload"
                          disabled={uploadingImageIndex !== null}
                        />
                        <label htmlFor="marketplace-images-upload">
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            {uploadingImageIndex !== null ? (
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Upload en cours...</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Upload className="w-8 h-8 text-slate-400" />
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ajouter des photos</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Cliquez pour sélectionner plusieurs images
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                  {formData.marketplace_images?.length || 0}/10 photos
                                </p>
                              </div>
                            )}
                          </div>
                        </label>
                      </>
                    )}
                  </div>

                  <div>
                    <Label className="dark:text-slate-300 mb-2 block">Équipements</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'gps', label: 'GPS' },
                        { value: 'bluetooth', label: 'Bluetooth' },
                        { value: 'climatisation', label: 'Climatisation' },
                        { value: 'siege_chauffant', label: 'Sièges chauffants' },
                        { value: 'toit_ouvrant', label: 'Toit ouvrant' },
                        { value: 'camera_recul', label: 'Caméra de recul' },
                        { value: 'regulateur_vitesse', label: 'Régulateur de vitesse' },
                        { value: 'jantes_alu', label: 'Jantes alu' }
                      ].map(feature => (
                        <label key={feature.value} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.marketplace_features?.includes(feature.value) || false}
                            onChange={(e) => {
                              const features = formData.marketplace_features || [];
                              if (e.target.checked) {
                                handleInputChange("marketplace_features", [...features, feature.value]);
                              } else {
                                handleInputChange("marketplace_features", features.filter(f => f !== feature.value));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300">{feature.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/20 dark:border-slate-700/20">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full dark:text-white dark:hover:bg-slate-700">
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving || uploadingImageIndex !== null} className="rounded-full">
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
