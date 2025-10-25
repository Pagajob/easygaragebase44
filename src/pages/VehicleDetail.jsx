
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Car,
  Calendar,
  Gauge,
  Fuel,
  Edit, // Used for the "Modifier" button
  Trash2,
  Euro,
  AlertTriangle, // New icon for error display
  FileText,
  Clock // Used for history related buttons
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatEuro } from "../components/utils/formatters";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant"; // New imports for multi-tenancy utilities

import VehicleChargeModal from "../components/dashboard/VehicleChargeModal";
import VehicleHistoryModal from "../components/vehicles/VehicleHistoryModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import VehicleModal from "../components/vehicles/VehicleModal";

const statusColors = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  loue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  hors_service: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const statusLabels = {
  disponible: "Disponible",
  loue: "Loué",
  maintenance: "Maintenance",
  hors_service: "Hors service",
  pending: "En attente",
  confirmed: "Confirmée",
  cancelled: "Annulée",
  completed: "Terminée",
};

const financingLabels = {
  comptant: "Comptant",
  leasing: "Leasing",
  lld: "LLD",
  mise_a_disposition: "Mise à disposition"
};

export default function VehicleDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showChargeModal, setShowChargeModal] = useState(false); // Kept as per button in the HTML structure in outline
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false); // Renamed from showVehicleModal
  const [error, setError] = useState(null); // New state for multi-tenancy errors

  const urlParams = new URLSearchParams(window.location.search);
  const vehicleId = urlParams.get('id');

  // SÉCURITÉ: Charger le véhicule avec vérification d'organization
  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) throw new Error("ID véhicule manquant");
      
      const currentOrgId = await getCurrentOrganizationId();
      const vehicles = await base44.entities.Vehicle.filter({ id: vehicleId });
      
      if (vehicles.length === 0) {
        throw new Error("Véhicule non trouvé");
      }
      
      const fetchedVehicle = vehicles[0];
      
      // SÉCURITÉ: Vérifier que le véhicule appartient à l'organisation de l'utilisateur
      if (fetchedVehicle.organization_id !== currentOrgId) {
        throw new Error("Accès non autorisé: Ce véhicule n'appartient pas à votre organisation.");
      }
      
      return fetchedVehicle;
    },
    enabled: !!vehicleId,
    retry: false, // Do not retry on multi-tenancy access errors
    onError: (err) => {
      console.error("Erreur lors du chargement du véhicule:", err);
      setError(err.message); // Set the error state for display
    }
  });

  const { data: reservations = [], isLoading: isLoadingReservations } = useQuery({
    queryKey: ['reservations', vehicleId],
    queryFn: () => filterByOrganization('Reservation', { vehicle_id: vehicleId }), // Filter by organization and vehicle_id
    enabled: !!vehicle, // Only fetch if vehicle is loaded and authorized
  });

  const { data: checkIns = [], isLoading: isLoadingCheckIns } = useQuery({
    queryKey: ['checkIns', vehicleId],
    queryFn: () => filterByOrganization('CheckIn', { vehicle_id: vehicleId }), // Filter by organization and vehicle_id
    enabled: !!vehicle,
  });

  const { data: checkOuts = [], isLoading: isLoadingCheckOuts } = useQuery({
    queryKey: ['checkOuts', vehicleId],
    queryFn: () => filterByOrganization('CheckOut', { vehicle_id: vehicleId }), // Filter by organization and vehicle_id
    enabled: !!vehicle,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => filterByOrganization('Client'), // Filter by organization
    enabled: !!vehicle,
  });

  // Combine loading states for all queries
  const isLoading = vehicleLoading || isLoadingReservations || isLoadingCheckIns || isLoadingCheckOuts || isLoadingClients;

  const updateVehicleMutation = useMutation({
    mutationFn: async (data) => {
      // SÉCURITÉ: Vérifier à nouveau l'organization_id avant la mise à jour
      const currentOrgId = await getCurrentOrganizationId();
      if (vehicle.organization_id !== currentOrgId) {
        throw new Error("Accès non autorisé: Vous ne pouvez pas modifier un véhicule hors de votre organisation.");
      }
      return base44.entities.Vehicle.update(vehicleId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] }); // Invalidate specific vehicle query
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate general vehicles list
      setShowEditModal(false);
    },
    onError: (err) => {
      console.error("Erreur lors de la sauvegarde:", err);
      setError(err.message);
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      // SÉCURITÉ: Vérifier à nouveau l'organization_id avant la suppression
      const currentOrgId = await getCurrentOrganizationId();
      if (vehicle.organization_id !== currentOrgId) {
        throw new Error("Accès non autorisé: Vous ne pouvez pas supprimer un véhicule hors de votre organisation.");
      }
      return base44.entities.Vehicle.delete(vehicleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate cache after delete
      navigate(createPageUrl("Vehicles"));
    },
    onError: (err) => {
      console.error("Erreur lors de la suppression:", err);
      setError(err.message);
    }
  });

  const handleChargeUpdate = async (chargeData) => {
    try {
      // SÉCURITÉ: Vérifier à nouveau l'organization_id avant la mise à jour des coûts
      const currentOrgId = await getCurrentOrganizationId();
      if (vehicle.organization_id !== currentOrgId) {
        throw new Error("Accès non autorisé: Vous ne pouvez pas modifier les coûts d'un véhicule hors de votre organisation.");
      }
      if (vehicleId) {
        await base44.entities.Vehicle.update(vehicleId, chargeData);
        queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
        setShowChargeModal(false);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour des coûts:", err);
      setError(err.message);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      deleteVehicleMutation.mutate();
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleViewCheckIn = (reservation) => {
    // CORRECTION: Rediriger vers ViewCheckIn au lieu d'ouvrir une pop-up
    const checkIn = checkIns.find((ci) => ci.reservation_id === reservation.id);
    if (checkIn) {
      window.location.href = createPageUrl(`ViewCheckIn?id=${checkIn.id}`);
    } else {
      alert("Aucun état des lieux de départ trouvé pour cette réservation");
    }
  };

  const handleViewCheckOut = (reservation) => {
    // CORRECTION: Rediriger vers la page ViewCheckOut au lieu d'ouvrir une pop-up
    // The previous implementation was already correctly navigating to a page, not opening a modal.
    // However, to be consistent with ViewCheckIn, we should find the specific checkOut ID.
    const checkOut = checkOuts.find((co) => co.reservation_id === reservation.id);
    if (checkOut) {
      window.location.href = createPageUrl(`ViewCheckOut?id=${checkOut.id}`);
    } else {
      alert("Aucun état des lieux de retour trouvé pour cette réservation");
    }
  };

  // Effect to handle missing vehicleId or vehicle not found after data loading, or unauthorized access
  useEffect(() => {
    if (vehicleId && !vehicle && !vehicleLoading && !error) { // If vehicleId exists but vehicle is null and no specific error
      setTimeout(() => {
        navigate(createPageUrl("Vehicles"));
      }, 2000);
    } else if (!vehicleId && !vehicleLoading && !error) { // If no vehicleId at all
      setTimeout(() => {
        navigate(createPageUrl("Vehicles"));
      }, 2000);
    }
  }, [vehicleId, vehicle, vehicleLoading, error, navigate]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Display specific error for unauthorized access or other API errors caught by onError
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Accès refusé</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Link to={createPageUrl("Vehicles")}>
              <Button>Retour aux véhicules</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generic vehicle not found if no vehicle and no specific error.
  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Véhicule non trouvé</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Le véhicule spécifié n'existe pas ou n'est plus disponible.</p>
            <Link to={createPageUrl("Vehicles")}>
              <Button>Retour aux véhicules</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderFinancingInfo = () => {
    switch (vehicle.financing_type) {
      case "comptant":
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Prix d'achat</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.purchase_price || 0)}</span>
            </div>
            {vehicle.purchase_date &&
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Date d'achat</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(vehicle.purchase_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            }
          </div>
        );
      case "leasing":
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Apport initial</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.down_payment || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Mensualités</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.monthly_payment || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Valeur résiduelle</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.residual_value || 0)}</span>
            </div>
          </div>
        );
      case "lld":
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Loyer mensuel</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.monthly_rent || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Caution déposée</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.deposit_paid || 0)}</span>
            </div>
          </div>
        );
      case "mise_a_disposition":
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Propriétaire</span>
              <span className="font-semibold text-slate-900 dark:text-white">{vehicle.owner_name || "—"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Prix reversé 24H</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.owner_price_24h || 0)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400">Prix reversé Weekend</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.owner_price_weekend || 0)}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="rounded-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 rounded-full text-white"
            >
              <Edit className="w-4 h-4 mr-2" /> {/* Changed from Pencil to Edit */}
              Modifier
            </Button>
          </div>

          {/* 1. Photo + Titre + Immat + Carburant */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {/* Photo */}
              <div className="w-full h-48 bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden">
                {vehicle.photo_url ?
                  <img
                    src={vehicle.photo_url}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                    loading="lazy" /> :
                  <Car className="w-20 h-20 text-slate-400" />
                }
              </div>

              {/* Infos principales */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                      {vehicle.make} {vehicle.model}
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-mono">{vehicle.plate}</p>
                  </div>
                  <Badge className={`${statusColors[vehicle.status]} rounded-full border-none`}>
                    {statusLabels[vehicle.status] || vehicle.status} {/* Use statusLabels for display */}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{vehicle.year}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Fuel className="w-4 h-4" />
                    <span className="capitalize">{vehicle.fuel_type}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Informations générales */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Kilométrage journalier</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {vehicle.unlimited_km ? "Illimité" : `${vehicle.daily_km_included || 200} km/jour`}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Assurance mensuelle</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.monthly_insurance || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400">Type de financement</span>
                <span className="font-semibold text-slate-900 dark:text-white">{financingLabels[vehicle.financing_type]}</span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Exigences conducteur */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Exigences conducteur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Âge minimal</span>
                <span className="font-semibold text-slate-900 dark:text-white">{vehicle.min_driver_age || 21} ans</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400">Années de permis requises</span>
                <span className="font-semibold text-slate-900 dark:text-white">{vehicle.min_license_years || 2} ans</span>
              </div>
            </CardContent>
          </Card>

          {/* 4. Tarification */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Tarification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Prix de base (24H)</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.price_24h || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Prix Weekend (48H)</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.price_weekend || 0)}</span>
              </div>
              {!vehicle.unlimited_km &&
                <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Prix du km suppl.</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.price_per_extra_km?.toFixed(2) || '1.00'} €</span>
                </div>
              }
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Caution de départ</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.deposit || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-600 dark:text-slate-400">Caution RSV</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatEuro(vehicle.deposit_rsv || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* 5. Informations sur le financement */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Financement : {financingLabels[vehicle.financing_type]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderFinancingInfo()}

              {/* Boutons d'action */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete} className="bg-red-700 text-red-200 px-3 text-xs font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input h-9 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Supprimer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChargeModal(true)} className="bg-transparent px-3 text-xs font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-9">
                  <Euro className="w-3.5 h-3.5 mr-1" />
                  Coûts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="bg-background px-3 text-xs font-medium rounded-[100px] justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-9 flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Historique des réservations */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Calendar className="w-5 h-5" />
                  Historique des réservations
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistoryModal(true)}
                  className="text-blue-600 hover:text-blue-700 rounded-full"
                >
                  Voir tout
                  {/* Removed ChevronRight as it's not in the new imports list */}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Aucune réservation pour ce véhicule.</p>
              ) : (
                <div className="space-y-3">
                  {reservations.slice(0, 5).map((reservation) => {
                    const client = clients.find(c => c.id === reservation.client_id);
                    const checkIn = checkIns.find(ci => ci.reservation_id === reservation.id);
                    const checkOut = checkOuts.find(co => co.reservation_id === reservation.id);

                    return (
                      <div
                        key={reservation.id}
                        className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-700/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 dark:text-white">{client?.name || "Client inconnu"}</p>
                            <Badge className={`${statusColors[reservation.status]} border-none`}>
                              {statusLabels[reservation.status] || reservation.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Du {format(parseISO(reservation.start_date), "d MMM", { locale: fr })} au {format(parseISO(reservation.end_date), "d MMM yyyy", { locale: fr })}
                          </p>
                          {reservation.estimated_price && (
                            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {formatEuro(reservation.estimated_price)}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                          {checkIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full h-8 px-3 text-xs"
                              onClick={() => handleViewCheckIn(reservation)}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              EDL départ
                            </Button>
                          )}
                          {checkOut && (
                            // Changed to use handleViewCheckOut for direct navigation
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full h-8 px-3 text-xs"
                              onClick={() => handleViewCheckOut(reservation)}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              EDL retour
                            </Button>
                          )}
                          <Link to={createPageUrl(`ViewContract?reservation=${reservation.id}`)}>
                            <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs">
                              <FileText className="w-3 h-3 mr-1" />
                              Contrat
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton historique en bas */}
          <Button
            variant="outline"
            onClick={() => setShowHistoryModal(true)}
            className="w-full rounded-xl">
            <Clock className="w-4 h-4 mr-2" /> {/* Changed from History to Clock */}
            Voir l'historique complet
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showChargeModal &&
        <VehicleChargeModal
          isOpen={showChargeModal}
          onClose={() => setShowChargeModal(false)}
          vehicle={vehicle}
          onSave={handleChargeUpdate}
        />
      }

      {showHistoryModal &&
        <VehicleHistoryModal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          vehicle={vehicle}
          reservations={reservations}
          checkIns={checkIns}
          checkOuts={checkOuts}
          clients={clients}
        />
      }

      {showEditModal && ( // Uses showEditModal
        <VehicleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          vehicle={vehicle}
          onSave={updateVehicleMutation.mutate} // Calls the mutation
        />
      )}
    </>
  );
}
