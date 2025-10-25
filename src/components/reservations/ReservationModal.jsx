
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
import { differenceInDays, parseISO, getDay, differenceInHours } from "date-fns";
import { Plus, Check, Search, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

import ClientModal from "../clients/ClientModal";
import { formatCurrency, getOrganizationCurrency } from "../utils/formatters";

import { Switch } from "@/components/ui/switch";
import { Gauge } from "lucide-react";

export default function ReservationModal({
  isOpen,
  onClose,
  reservation,
  vehicles,
  clients,
  onSave
}) {
  const [formData, setFormData] = useState({
    type: "location",
    vehicle_id: "",
    client_id: "",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    pickup_location: "",
    return_location: "",
    status: "confirmee",
    estimated_price: 0,
    owner_payment: 0,
    agency_profit: 0,
    notes: "",
    unlimited_km: false, // NEW
    km_included: 0 // NEW
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [localClients, setLocalClients] = useState(clients);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [calculatedOwnerPayment, setCalculatedOwnerPayment] = useState(0);
  const [calculatedAgencyProfit, setCalculatedAgencyProfit] = useState(0);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);
  const [isOwnerPaymentManuallyEdited, setIsOwnerPaymentManuallyEdited] = useState(false);

  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  const [currency, setCurrency] = useState('EUR');

  // Charger la devise
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  useEffect(() => {
    if (reservation) {
      setFormData({
        ...reservation,
        unlimited_km: reservation.unlimited_km ?? false, // NEW
        km_included: reservation.km_included ?? 0 // NEW
      });
      const vehicle = vehicles.find((v) => v.id === reservation.vehicle_id);

      let initialCalculatedPrice = 0;
      let initialCalculatedOwnerPayment = 0;

      if (vehicle && reservation.start_date && reservation.end_date && reservation.type === 'location') {
        const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
        const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);
        const hours = differenceInHours(endDateTime, startDateTime);
        const days = Math.max(1, Math.ceil(hours / 24)); // Arrondi au jour supérieur, minimum 1 jour
        const startDay = getDay(parseISO(reservation.start_date));
        const isWeekend = days === 2 && (startDay === 5 || startDay === 6);

        if (isWeekend && vehicle.price_weekend) {
          initialCalculatedPrice = vehicle.price_weekend;
          if (vehicle.financing_type === 'mise_a_disposition' && vehicle.owner_price_weekend) {
            initialCalculatedOwnerPayment = vehicle.owner_price_weekend;
          }
        } else if (vehicle.price_24h) {
          initialCalculatedPrice = vehicle.price_24h * days;
          if (vehicle.financing_type === 'mise_a_disposition' && vehicle.owner_price_24h) {
            initialCalculatedOwnerPayment = vehicle.owner_price_24h * days;
          }
        }

        setCalculatedPrice(initialCalculatedPrice);
        setCalculatedOwnerPayment(initialCalculatedOwnerPayment);
        setCalculatedAgencyProfit(initialCalculatedPrice - initialCalculatedOwnerPayment);

        setIsPriceManuallyEdited(
          reservation.estimated_price !== initialCalculatedPrice
        );
        setIsOwnerPaymentManuallyEdited(
          vehicle.financing_type === 'mise_a_disposition' && reservation.owner_payment !== initialCalculatedOwnerPayment
        );
      } else {
        setCalculatedPrice(0);
        setCalculatedOwnerPayment(0);
        setCalculatedAgencyProfit(0);
        setIsPriceManuallyEdited(false);
        setIsOwnerPaymentManuallyEdited(false);
        if (reservation.type === 'pret' && (reservation.estimated_price !== 0 || reservation.owner_payment !== 0 || reservation.agency_profit !== 0)) {
          setFormData((prev) => ({ ...prev, estimated_price: 0, owner_payment: 0, agency_profit: 0 }));
        }
      }
    } else {
      setFormData({
        type: "location",
        vehicle_id: "",
        client_id: "",
        start_date: "",
        start_time: "18:00",
        end_date: "",
        end_time: "18:00",
        pickup_location: "",
        return_location: "",
        status: "confirmee",
        estimated_price: 0,
        owner_payment: 0,
        agency_profit: 0,
        notes: "",
        unlimited_km: false, // NEW
        km_included: 0 // NEW
      });
      setCalculatedPrice(0);
      setCalculatedOwnerPayment(0);
      setCalculatedAgencyProfit(0);
      setIsPriceManuallyEdited(false);
      setIsOwnerPaymentManuallyEdited(false);
    }
  }, [reservation, isOpen, vehicles]);

  useEffect(() => {
    if (formData.type === 'location') {
      calculatePriceAndPayments();
      calculateKmIncluded(); // NEW
    } else {
      setCalculatedPrice(0);
      setCalculatedOwnerPayment(0);
      setCalculatedAgencyProfit(0);
      setIsPriceManuallyEdited(false);
      setIsOwnerPaymentManuallyEdited(false);
      setFormData((prev) => ({
        ...prev,
        estimated_price: 0,
        owner_payment: 0,
        agency_profit: 0,
        unlimited_km: false, // Reset for non-location types
        km_included: 0 // Reset for non-location types
      }));
    }
  }, [formData.vehicle_id, formData.start_date, formData.end_date, formData.start_time, formData.end_time, formData.type, vehicles, formData.unlimited_km]); // Added unlimited_km to dependencies

  // NEW: Calculate included kilometers
  const calculateKmIncluded = () => {
    const vehicle = vehicles.find((v) => v.id === formData.vehicle_id);

    if (formData.type !== 'location' || !vehicle || !formData.start_date || !formData.end_date) {
      // Don't modify km_included if not a location or dates are missing
      return;
    }

    // Si km illimités activé, ne rien calculer pour km_included (it should be 0)
    if (formData.unlimited_km) {
      setFormData((prev) => ({
        ...prev,
        km_included: 0
      }));
      return;
    }

    const startDateTime = parseISO(`${formData.start_date}T${formData.start_time || '18:00'}`);
    const endDateTime = parseISO(`${formData.end_date}T${formData.end_time || '18:00'}`);
    const hours = differenceInHours(endDateTime, startDateTime);
    const days = Math.max(1, Math.ceil(hours / 24));

    // Calculer le kilométrage inclus
    const dailyKm = vehicle.daily_km_included || 0;
    const totalKm = dailyKm * days;

    // Only update if it's different to avoid unnecessary re-renders
    setFormData((prev) => {
      if (prev.km_included === totalKm) {
        return prev;
      }
      return {
        ...prev,
        km_included: totalKm
      }
    });
  };

  const calculatePriceAndPayments = () => {
    const vehicle = vehicles.find((v) => v.id === formData.vehicle_id);

    if (formData.type !== 'location' || !vehicle || !formData.start_date || !formData.end_date) {
      setCalculatedPrice(0);
      setCalculatedOwnerPayment(0);
      setCalculatedAgencyProfit(0);
      if (formData.type === 'location' && !isPriceManuallyEdited && !isOwnerPaymentManuallyEdited) {
        setFormData((prev) => ({ ...prev, estimated_price: 0, owner_payment: 0, agency_profit: 0 }));
      }
      return;
    }

    const startDateTime = parseISO(`${formData.start_date}T${formData.start_time || '18:00'}`);
    const endDateTime = parseISO(`${formData.end_date}T${formData.end_time || '18:00'}`);
    const hours = differenceInHours(endDateTime, startDateTime);
    const days = Math.max(1, Math.ceil(hours / 24)); // Arrondi au jour supérieur, minimum 1 jour

    const startDay = getDay(parseISO(formData.start_date));
    const isWeekend = days === 2 && (
    startDay === 5 ||
    startDay === 6);


    let price = 0;
    let ownerPayment = 0;

    if (isWeekend && vehicle.price_weekend) {
      price = vehicle.price_weekend;

      if (vehicle.financing_type === 'mise_a_disposition' && vehicle.owner_price_weekend !== undefined && vehicle.owner_price_weekend !== null) {
        ownerPayment = vehicle.owner_price_weekend;
      }
    } else if (vehicle.price_24h) {
      price = vehicle.price_24h * days;

      if (vehicle.financing_type === 'mise_a_disposition' && vehicle.owner_price_24h !== undefined && vehicle.owner_price_24h !== null) {
        ownerPayment = vehicle.owner_price_24h * days;
      }
    }

    setCalculatedPrice(price);
    setCalculatedOwnerPayment(ownerPayment);
    setCalculatedAgencyProfit(price - ownerPayment);

    setFormData((prev) => {
      let newEstimatedPrice = prev.estimated_price;
      let newOwnerPayment = prev.owner_payment;

      if (!isPriceManuallyEdited) {
        newEstimatedPrice = price;
      }
      const selectedVehicleInForm = vehicles.find((v) => v.id === prev.vehicle_id);
      if (selectedVehicleInForm?.financing_type === 'mise_a_disposition') {
        if (!isOwnerPaymentManuallyEdited) {
          newOwnerPayment = ownerPayment;
        }
      } else {
        newOwnerPayment = 0;
        if (isOwnerPaymentManuallyEdited) {
          setIsOwnerPaymentManuallyEdited(false);
        }
      }

      const newAgencyProfit = newEstimatedPrice - newOwnerPayment;

      return {
        ...prev,
        estimated_price: newEstimatedPrice,
        owner_payment: newOwnerPayment,
        agency_profit: newAgencyProfit
      };
    });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePriceChange = (value) => {
    const numValue = parseFloat(value) || 0;

    setIsPriceManuallyEdited(numValue.toFixed(2) !== calculatedPrice.toFixed(2));

    const newAgencyProfit = numValue - formData.owner_payment;

    setFormData((prev) => ({
      ...prev,
      estimated_price: numValue,
      agency_profit: newAgencyProfit
    }));
  };

  const handleOwnerPaymentChange = (value) => {
    const numValue = parseFloat(value) || 0;

    setIsOwnerPaymentManuallyEdited(numValue.toFixed(2) !== calculatedOwnerPayment.toFixed(2));

    const newAgencyProfit = formData.estimated_price - numValue;

    setFormData((prev) => ({
      ...prev,
      owner_payment: numValue,
      agency_profit: newAgencyProfit
    }));
  };

  // NEW: Handle unlimited km toggle
  const handleUnlimitedKmToggle = (checked) => {
    setFormData((prev) => ({
      ...prev,
      unlimited_km: checked,
      km_included: checked ? 0 : prev.km_included // Reset km_included if unlimited is checked
    }));
  };

  // NEW: Handle km_included manual change
  const handleKmIncludedChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      km_included: parseInt(value) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Protection contre les doubles soumissions
    if (isSaving) {
      console.log("⚠️ Soumission déjà en cours, ignorée");
      return;
    }

    console.log("🚀 Début de la soumission de la réservation");
    setIsSaving(true);

    try {
      await onSave(formData);
      console.log("✅ Réservation sauvegardée avec succès");
      // The parent component will call onClose, which triggers the useEffect to reset states including isSaving.
    } catch (error) {
      console.error("❌ Erreur lors de la sauvegarde:", error);
      // If saving fails, re-enable the button so the user can try again.
      setIsSaving(false);
    }
  };

  const handleCreateClient = async (clientData) => {
    try {
      const newClient = await base44.entities.Client.create(clientData);

      setLocalClients((prev) => [newClient, ...prev]);

      setFormData((prev) => ({
        ...prev,
        client_id: newClient.id
      }));

      setShowClientModal(false);
    } catch (error) {
      console.error("Erreur lors de la création du client:", error);
    }
  };

  const availableVehicles = vehicles.filter((v) => v.status === 'disponible');
  const filteredVehicles = availableVehicles.filter((v) => {
    if (!vehicleSearchTerm) return true;
    const searchLower = vehicleSearchTerm.toLowerCase();
    return (
      v.plate?.toLowerCase().includes(searchLower) ||
      v.make?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      `${v.make} ${v.model}`.toLowerCase().includes(searchLower));

  });

  const filteredClients = localClients.filter((c) => {
    if (!clientSearchTerm) return true;
    const searchLower = clientSearchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(searchLower) ||
      c.company_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower));

  });

  const handleVehicleSelect = (vehicleId) => {
    handleInputChange("vehicle_id", vehicleId);
    setVehicleSearchOpen(false);
    setVehicleSearchTerm("");
  };

  const handleClientSelect = (clientId) => {
    handleInputChange("client_id", clientId);
    setClientSearchOpen(false);
    setClientSearchTerm("");
  };

  const truncateText = (text, maxLength = 18) => {
    if (!text) return '';
    const stringText = String(text);
    return stringText.length > maxLength ? stringText.substring(0, maxLength - 3) + '...' : stringText;
  };

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
  const selectedClient = localClients.find((c) => c.id === formData.client_id);
  const isMiseADispo = selectedVehicle?.financing_type === 'mise_a_disposition';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isSaving) {// Only close if not saving
          onClose();
        }
      }}>
        <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-white/30 dark:border-slate-700/30 rounded-2xl shadow-2xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="tracking-tight text-2xl font-bold dark:text-slate-100">
              {reservation ? "Modifier la réservation" : "Nouvelle réservation"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Type de réservation avec boutons compacts */}
            <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">Type de réservation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-100/80 p-1 rounded-[100px] grid grid-cols-2 gap-1 dark:bg-slate-700/50">
                  <button
                    type="button"
                    onClick={() => handleInputChange("type", "location")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-[100px] transition-all duration-200 flex items-center justify-center gap-2 ${
                    formData.type === 'location' ?
                    'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' :
                    'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`
                    }>

                    <span className="text-lg">💰</span>
                    <span>Location</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInputChange("type", "pret")}
                    className={`px-4 py-2.5 text-sm font-semibold rounded-[100px] transition-all duration-200 flex items-center justify-center gap-2 ${
                    formData.type === 'pret' ?
                    'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' :
                    'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`
                    }>

                    <span className="text-lg">🤝</span>
                    <span>Prêt</span>
                  </button>
                </div>

                {formData.type === 'pret' &&
                <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                    <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
                      <span>💡</span>
                      <span>Le prêt est gratuit, aucun tarif ne sera calculé</span>
                    </p>
                  </div>
                }
              </CardContent>
            </Card>

            {/* Client et Véhicule */}
            <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">Client et véhicule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client avec recherche */}
                <div>
                  <Label htmlFor="client_id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Client *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setClientSearchOpen(!clientSearchOpen)}
                        className="bg-white/50 px-3 py-2 text-left rounded-[100px] w-full min-h-[2.5rem] dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 flex items-center justify-between hover:bg-white/70 dark:hover:bg-slate-700/70 transition-colors gap-2">

                        <div className="flex-1 min-w-0">
                          {selectedClient ?
                          <div className="min-w-0">
                              <div className="font-medium text-slate-900 dark:text-white truncate text-sm">
                                {truncateText(selectedClient.name, 25)}
                              </div>
                              {selectedClient.company_name &&
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {truncateText(selectedClient.company_name, 30)}
                                </div>
                            }
                            </div> :

                          <span className="text-slate-500 dark:text-slate-400 text-sm">Choisir un client</span>
                          }
                        </div>
                        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </button>

                      {clientSearchOpen &&
                      <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white/95 dark:bg-slate-800/95">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input
                              placeholder="Rechercher..."
                              value={clientSearchTerm}
                              onChange={(e) => setClientSearchTerm(e.target.value)}
                              className="pl-9 h-9 bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                              autoFocus
                              onClick={(e) => e.stopPropagation()} />

                              {clientSearchTerm &&
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setClientSearchTerm("");
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">

                                  <X className="w-4 h-4" />
                                </button>
                            }
                            </div>
                          </div>
                          <div className="overflow-y-auto">
                            {filteredClients.length > 0 ?
                          filteredClients.map((client) =>
                          <button
                            key={client.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientSelect(client.id);
                            }}
                            className={`w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
                            formData.client_id === client.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`
                            }>

                                  <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{client.name}</div>
                                  {client.company_name &&
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.company_name}</div>
                            }
                                </button>
                          ) :

                          <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucun client trouvé
                              </div>
                          }
                          </div>
                        </div>
                      }
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowClientModal(true)} className="bg-background text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-10 flex-shrink-0">


                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="vehicle_id" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Véhicule *</Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setVehicleSearchOpen(!vehicleSearchOpen)}
                      className="bg-white/50 px-3 py-2 text-left rounded-[100px] w-full min-h-[2.5rem] dark:bg-slate-700/50 border border-slate-300/50 dark:border-slate-600/50 flex items-center justify-between hover:bg-white/70 dark:hover:bg-slate-700/70 transition-colors gap-2">

                      <div className="flex-1 min-w-0">
                        {selectedVehicle ?
                        <div className="min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white truncate text-sm">
                              {truncateText(`${selectedVehicle.make} ${selectedVehicle.model}`, 25)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {selectedVehicle.plate}
                            </div>
                          </div> :

                        <span className="text-slate-500 dark:text-slate-400 text-sm">Choisir un véhicule</span>
                        }
                      </div>
                      <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>

                    {vehicleSearchOpen &&
                    <div className="absolute z-50 w-full mt-1 bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white/95 dark:bg-slate-800/95">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                            placeholder="Rechercher..."
                            value={vehicleSearchTerm}
                            onChange={(e) => setVehicleSearchTerm(e.target.value)}
                            className="pl-9 h-9 bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                            autoFocus
                            onClick={(e) => e.stopPropagation()} />

                            {vehicleSearchTerm &&
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehicleSearchTerm("");
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">

                                <X className="w-4 h-4" />
                              </button>
                          }
                          </div>
                        </div>
                        <div className="overflow-y-auto">
                          {filteredVehicles.length > 0 ?
                        filteredVehicles.map((vehicle) =>
                        <button
                          key={vehicle.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVehicleSelect(vehicle.id);
                          }}
                          className={`w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-b-0 ${
                          formData.vehicle_id === vehicle.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`
                          }>

                                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                  {vehicle.make} {vehicle.model}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{vehicle.plate}</div>
                              </button>
                        ) :

                        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                              Aucun véhicule disponible
                            </div>
                        }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates et heures */}
            <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">Période de {formData.type === 'location' ? 'location' : 'prêt'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Date de début *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange("start_date", e.target.value)}
                      required
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                      lang="fr-FR" />

                  </div>
                  <div>
                    <Label htmlFor="start_time" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Heure de début</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange("start_time", e.target.value)}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="end_date" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Date de fin *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange("end_date", e.target.value)}
                      required
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                      lang="fr-FR" />

                  </div>
                  <div>
                    <Label htmlFor="end_time" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Heure de fin</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange("end_time", e.target.value)}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

                  </div>
                </div>

                {/* Affichage du calcul de prix (uniquement pour les locations) */}
                {formData.type === 'location' && selectedVehicle && formData.start_date && formData.end_date &&
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Prix calculé automatiquement</p>
                        <p className="text-xs text-blue-500 dark:text-blue-400">
                          {(() => {
                          const startDateTime = parseISO(`${formData.start_date}T${formData.start_time || '18:00'}`);
                          const endDateTime = parseISO(`${formData.end_date}T${formData.end_time || '18:00'}`);
                          const hours = differenceInHours(endDateTime, startDateTime);
                          const days = Math.max(1, Math.ceil(hours / 24));
                          const startDay = getDay(parseISO(formData.start_date));
                          const isWeekend = days === 2 && (startDay === 5 || startDay === 6);

                          if (isWeekend && selectedVehicle.price_weekend) {
                            return `Forfait weekend`;
                          } else if (selectedVehicle.price_24h) {
                            return `${days}j × ${formatCurrency(selectedVehicle.price_24h, currency)}`;
                          }
                          return 'Tarif non configuré';
                        })()}
                        </p>
                        {isPriceManuallyEdited &&
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 leading-tight">
                            ⚠️ Prix modifié manuellement
                          </p>
                      }
                      </div>
                      <div className="flex-shrink-0">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(calculatedPrice, currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </CardContent>
            </Card>

            {/* NEW: Kilométrage inclus section - Only for locations */}
            {formData.type === 'location' && selectedVehicle && formData.start_date && formData.end_date && (
              <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100 flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Kilométrage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Toggle km illimités */}
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
                      onCheckedChange={handleUnlimitedKmToggle}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {/* Champ kilométrage inclus (si pas illimité) */}
                  {!formData.unlimited_km && (
                    <div>
                      <Label htmlFor="km_included" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">
                        Kilométrage inclus (km)
                      </Label>
                      <Input
                        id="km_included"
                        type="number"
                        value={formData.km_included}
                        onChange={(e) => handleKmIncludedChange(e.target.value)}
                        className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                        Calculé automatiquement : {selectedVehicle.daily_km_included || 0} km/jour × {(() => {
                          const startDateTime = parseISO(`${formData.start_date}T${formData.start_time || '18:00'}`);
                          const endDateTime = parseISO(`${formData.end_date}T${formData.end_time || '18:00'}`);
                          const hours = differenceInHours(endDateTime, startDateTime);
                          return Math.max(1, Math.ceil(hours / 24));
                        })()} jour(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lieux */}
            <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">Lieux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pickup_location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Lieu de prise en charge</Label>
                  <Input
                    id="pickup_location"
                    value={formData.pickup_location}
                    onChange={(e) => handleInputChange("pickup_location", e.target.value)}
                    placeholder="Adresse ou point de rencontre"
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

                </div>

                <div>
                  <Label htmlFor="return_location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Lieu de retour</Label>
                  <Input
                    id="return_location"
                    value={formData.return_location}
                    onChange={(e) => handleInputChange("return_location", e.target.value)}
                    placeholder="Adresse de retour (si différente)"
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

                </div>
              </CardContent>
            </Card>

            {/* Tarif et statut */}
            <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
              <CardHeader className="pb-0">
                <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">{formData.type === 'location' ? 'Tarif et statut' : 'Statut'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.type === 'location' &&
                <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="estimated_price" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm dark:text-slate-100">Tarif final (€)</Label>
                        <Input
                        id="estimated_price"
                        type="number"
                        step="0.01"
                        value={formData.estimated_price}
                        onChange={(e) => handlePriceChange(e.target.value)} className="bg-white/50 px-3 py-2 text-sm rounded-lg flex h-10 w-full border ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50" />


                        {isPriceManuallyEdited ?
                      <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 leading-tight">
                            Ajusté (auto: {formatCurrency(calculatedPrice, currency)})
                          </p> :

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                            Prix automatique
                          </p>
                      }
                      </div>

                      <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">
                        <Label htmlFor="status" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm dark:text-slate-100">Statut</Label>
                        <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange("status", value)}>

                          <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-white/30 dark:border-slate-700/30">
                            <SelectItem value="brouillon">Brouillon</SelectItem>
                            <SelectItem value="confirmee">Confirmée</SelectItem>
                            <SelectItem value="annulee">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Champ modifiable pour le montant reversé au propriétaire */}
                    {isMiseADispo && calculatedOwnerPayment > 0 &&
                  <div>
                        <Label htmlFor="owner_payment" className="font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-sm dark:text-slate-100">Montant reversé au propriétaire (€)</Label>
                        <Input
                      id="owner_payment"
                      type="number"
                      step="0.01"
                      value={formData.owner_payment}
                      onChange={(e) => handleOwnerPaymentChange(e.target.value)}
                      className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg text-sm" />

                        {isOwnerPaymentManuallyEdited ?
                    <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 leading-tight">
                            Ajusté (auto: {formatCurrency(calculatedOwnerPayment, currency)})
                          </p> :

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                            Montant automatique
                          </p>
                    }
                      </div>
                  }

                    {/* Affichage pour mise à disposition */}
                    {isMiseADispo && calculatedOwnerPayment > 0 &&
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                          <p className="font-semibold text-purple-900 dark:text-purple-200 text-xs">Mise à disposition</p>
                        </div>

                        <div className="space-y-2">
                          {/* Prix location */}
                          <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">💰</span>
                              <span className="text-xs text-slate-700 dark:text-slate-300">Prix location</span>
                            </div>
                            <span className="text-sm font-bold text-purple-900 dark:text-purple-200">{formatCurrency(formData.estimated_price, currency)}</span>
                          </div>

                          {/* Reversé proprio */}
                          <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">👤</span>
                              <span className="text-xs text-slate-700 dark:text-slate-300">Reversé proprio</span>
                            </div>
                            <span className="text-sm font-bold text-orange-900 dark:text-orange-200">{formatCurrency(formData.owner_payment, currency)}</span>
                          </div>

                          {/* Bénéfice */}
                          <div className="flex items-center justify-between bg-white/60 dark:bg-slate-800/40 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base">✨</span>
                              <span className="text-xs text-slate-700 dark:text-slate-300">Bénéfice agence</span>
                            </div>
                            <span className="text-sm font-bold text-green-900 dark:text-green-200">{formatCurrency(formData.agency_profit, currency)}</span>
                          </div>
                        </div>
                      </div>
                  }
                  </>
                }

                {formData.type === 'pret' &&
                <div>
  <Label
                    htmlFor="status"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">

    Statut
  </Label>

  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange("status", value)}>

    <SelectTrigger
                      className="
        bg-white/50 dark:bg-slate-700/50
        border border-slate-300/50 dark:border-slate-600/50
        rounded-lg px-4 py-2
        text-sm text-slate-700 dark:text-slate-100
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






      <SelectItem value="brouillon" className="dark:text-slate-100">
        Brouillon
      </SelectItem>
      <SelectItem value="confirmee" className="dark:text-slate-100">
        Confirmée
      </SelectItem>
      <SelectItem value="annulee" className="dark:text-slate-100">
        Annulée
      </SelectItem>
    </SelectContent>
  </Select>
                </div>
                }

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100 ">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    placeholder="Notes internes sur la réservation..."
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg" />

                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/20 dark:border-slate-700/20">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
                className="rounded-full dark:text-white dark:hover:bg-slate-700">

                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-full">

                {isSaving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de création de client */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        client={null}
        onSave={handleCreateClient} />
    </>
  );
}
