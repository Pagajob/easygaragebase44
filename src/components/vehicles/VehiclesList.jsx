import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Edit,
  Trash2,
  Calendar,
  Gauge,
  Fuel,
  AlertTriangle,
  ChevronRight,
  History
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { filterByOrganization, getCurrentOrganizationId } from "../utils/multiTenant";
import { formatCurrency, getOrganizationCurrency, getCurrencySymbol } from "../utils/formatters";
import { base44 } from '@/api/base44Client';

import VehicleHistoryModal from "./VehicleHistoryModal";
import LoadingSpinner from "../shared/LoadingSpinner";
import MarketplaceAddonModal from "./MarketplaceAddonModal";

const statusColors = {
  disponible: "bg-green-100 text-green-800",
  loue: "bg-blue-100 text-blue-800",
  maintenance: "bg-orange-100 text-orange-800",
  hors_service: "bg-red-100 text-red-800"
};

const financingLabels = {
  comptant: "Comptant",
  leasing: "Leasing",
  lld: "LLD",
  mise_a_disposition: "Mise à disposition"
};

export default function VehiclesList({ vehicles, isLoading, onEdit, onDelete }) {
  const queryClient = useQueryClient();
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState(null);
  const [currency, setCurrency] = useState('EUR');
  const [publishingVehicleId, setPublishingVehicleId] = useState(null);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState(null);

  // Charger la devise une seule fois
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  // Charger les données UNIQUEMENT si le modal historique est ouvert
  // Avec des staleTime et cacheTime élevés pour éviter trop de requêtes
  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => filterByOrganization('Reservation'),
    enabled: !!selectedVehicleForHistory,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 heure
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => filterByOrganization('CheckIn'),
    enabled: !!selectedVehicleForHistory,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: checkOuts = [] } = useQuery({
    queryKey: ['checkOuts'],
    queryFn: () => filterByOrganization('CheckOut'),
    enabled: !!selectedVehicleForHistory,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => filterByOrganization('Client'),
    enabled: !!selectedVehicleForHistory,
    staleTime: 30 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Charger l'organisation avec cache long
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const orgId = await getCurrentOrganizationId();
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs.length > 0 ? orgs[0] : null;
    },
    staleTime: 60 * 60 * 1000, // 1 heure
    cacheTime: 24 * 60 * 60 * 1000, // 24 heures
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ vehicleId, publish }) => {
      const updateData = {
        published_on_marketplace: publish
      };
      
      if (publish) {
        updateData.marketplace_published_at = new Date().toISOString();
      }
      
      return await base44.entities.Vehicle.update(vehicleId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setPublishingVehicleId(null);
      setPendingVehicle(null);
      setShowMarketplaceModal(false);
    },
    onError: (error) => {
      console.error("Erreur lors de la publication:", error);
      alert("Erreur lors de la publication sur la marketplace");
      setPublishingVehicleId(null);
      setPendingVehicle(null);
      setShowMarketplaceModal(false);
    }
  });

  const handleTogglePublish = async (vehicle, checked) => {
    setPublishingVehicleId(vehicle.id);
    
    // Vérifier que les champs requis sont remplis
    if (checked && (!vehicle.marketplace_city || !vehicle.price_24h)) {
      alert("Veuillez remplir la ville et le prix avant de publier sur la marketplace");
      setPublishingVehicleId(null);
      return;
    }

    // Si on dépublie, pas besoin de modal
    if (!checked) {
      togglePublishMutation.mutate({ vehicleId: vehicle.id, publish: false });
      return;
    }

    // Vérifier les limites du plan
    if (organization) {
      const publishedCount = vehicles.filter(v => v.published_on_marketplace && v.id !== vehicle.id).length;
      const plan = organization.subscription_plan || 'free';
      
      const limits = {
        free: 0,
        essentiel: 0,
        pro: 1,
        entreprise: Infinity
      };

      // Si on dépasse le quota, afficher le modal
      if (publishedCount >= limits[plan]) {
        setPendingVehicle(vehicle);
        setShowMarketplaceModal(true);
        setPublishingVehicleId(null);
        return;
      }
    }

    // Si dans le quota, publier directement
    togglePublishMutation.mutate({ vehicleId: vehicle.id, publish: true });
  };

  const handleConfirmAddon = async () => {
    if (pendingVehicle) {
      await togglePublishMutation.mutateAsync({ 
        vehicleId: pendingVehicle.id, 
        publish: true 
      });
    }
  };

  const handleUpgradePlan = () => {
    // Rediriger vers la page d'abonnement
    window.location.href = createPageUrl('Subscription');
  };

  const checkDocumentExpiry = (vehicle) => {
    const now = new Date();
    const insuranceExpired = vehicle.insurance_expiry && isPast(parseISO(vehicle.insurance_expiry));
    const registrationExpired = vehicle.registration_expiry && isPast(parseISO(vehicle.registration_expiry));
    return insuranceExpired || registrationExpired;
  };

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardContent className="py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2 dark:text-white">Aucun véhicule trouvé</h3>
        <p className="text-slate-500">
          Commencez par ajouter votre premier véhicule à votre parc.
        </p>
      </div>
    );
  }

  const publishedCount = vehicles.filter(v => v.published_on_marketplace).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => {
          const hasExpiredDocs = checkDocumentExpiry(vehicle);

          return (
            <Card
              key={vehicle.id}
              className="overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)}>
                <CardContent className="p-5 cursor-pointer">
                  {vehicle.photo_url ? (
                    <div className="relative h-48 mb-4 rounded-xl overflow-hidden">
                      <img
                        src={vehicle.photo_url}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className={`${statusColors[vehicle.status]} shadow-lg`}>
                          {vehicle.status}
                        </Badge>
                      </div>
                      {vehicle.published_on_marketplace && (
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
                            📢 Marketplace
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 mb-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl flex items-center justify-center">
                      <Car className="w-16 h-16 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {vehicle.plate}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {vehicle.year}
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        {vehicle.mileage?.toLocaleString('fr-FR')} km
                      </div>
                      <div className="flex items-center gap-1">
                        <Fuel className="w-4 h-4" />
                        {vehicle.fuel_type}
                      </div>
                    </div>

                    {vehicle.price_24h > 0 && (
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Prix/jour</span>
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(vehicle.price_24h, currency)}
                          </span>
                        </div>
                      </div>
                    )}

                    {hasExpiredDocs && (
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Documents expirés</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Link>

              {/* Actions (outside the Link to allow separate interactions) */}
              <div className="flex flex-col gap-3 px-5 pb-5 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={vehicle.published_on_marketplace || false}
                      onChange={(e) => handleTogglePublish(vehicle, e.target.checked)}
                      disabled={publishingVehicleId === vehicle.id}
                      className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span>Publier sur marketplace</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-full bg-white/50 border-slate-300/70"
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit(vehicle);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedVehicleForHistory(vehicle);
                    }}
                    title="Historique"
                  >
                    <History className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-100/50"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(vehicle.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal historique */}
      {selectedVehicleForHistory && 
        <VehicleHistoryModal
          isOpen={true}
          vehicle={selectedVehicleForHistory}
          reservations={reservations}
          checkIns={checkIns}
          checkOuts={checkOuts}
          clients={clients}
          onClose={() => setSelectedVehicleForHistory(null)}
        />
      }

      {/* Modal add-on marketplace */}
      {showMarketplaceModal && pendingVehicle && organization && (
        <MarketplaceAddonModal
          isOpen={showMarketplaceModal}
          onClose={() => {
            setShowMarketplaceModal(false);
            setPendingVehicle(null);
            setPublishingVehicleId(null);
          }}
          currentPlan={organization.subscription_plan || 'free'}
          publishedCount={publishedCount}
          onConfirmAddon={handleConfirmAddon}
          onUpgradePlan={handleUpgradePlan}
        />
      )}
    </>
  );
}