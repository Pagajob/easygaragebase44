
import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";

// Lazy load des modals
const VehicleModal = lazy(() => import("../components/vehicles/VehicleModal"));
const UpgradeModal = lazy(() => import("../components/shared/UpgradeModal"));

import VehiclesList from "../components/vehicles/VehiclesList";
import VehicleFilters from "../components/vehicles/VehicleFilters";
import { checkLimit, incrementCounter, decrementCounter } from "../components/utils/subscriptionLimits";

export default function VehiclesPage() {
  const queryClient = useQueryClient();
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    financing: "all"
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Utiliser React Query avec des temps de cache plus longs
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => filterByOrganization('Vehicle'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const orgId = await getCurrentOrganizationId();
      if (!orgId) {
        const orgs = await base44.entities.Organization.list();
        return orgs.length > 0 ? orgs[0] : null;
      }
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs.length > 0 ? orgs[0] : null;
    },
    staleTime: 60 * 60 * 1000,
    cacheTime: 24 * 60 * 60 * 1000,
    refetchInterval: false
  });

  const saveVehicleMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Si c'est une création, vérifier les limites
      if (!id) {
        const limitCheck = checkLimit(organization, 'vehicles');
        if (!limitCheck.canAdd) {
          throw new Error('LIMIT_REACHED');
        }
      }
      
      const orgId = await getCurrentOrganizationId();
      const result = id 
        ? await base44.entities.Vehicle.update(id, data) 
        : await base44.entities.Vehicle.create({
            ...data,
            organization_id: orgId
          });
      
      // Si création réussie, incrémenter le compteur
      if (!id && result) {
        await incrementCounter(base44, organization, 'vehicles');
        // Recharger l'organization
        queryClient.invalidateQueries({ queryKey: ['organization'] });
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate and refetch vehicles
      setShowModal(false);
      setSelectedVehicle(null);
    },
    onError: (error) => {
      if (error.message === 'LIMIT_REACHED') {
        setShowModal(false); // Close the vehicle modal
        setShowUpgradeModal(true); // Open the upgrade modal
      } else {
        console.error("Erreur lors de la sauvegarde:", error);
      }
    }
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Vehicle.delete(id);
      // Décrémenter le compteur
      await decrementCounter(base44, organization, 'vehicles');
      // Recharger l'organization
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] }); // Invalidate and refetch vehicles
    },
    onError: (error) => {
        console.error("Erreur lors de la suppression:", error);
    }
  });

  const applyFilters = useCallback(() => {
    let filtered = [...vehicles];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(vehicle =>
        vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filters.status !== "all") {
      filtered = filtered.filter(vehicle => vehicle.status === filters.status);
    }

    // Filtre par financement
    if (filters.financing !== "all") {
      filtered = filtered.filter(vehicle => vehicle.financing_type === filters.financing);
    }

    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSaveVehicle = async (vehicleData) => {
    saveVehicleMutation.mutate({
      id: selectedVehicle?.id,
      data: vehicleData
    });
  };

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const handleAddVehicle = () => {
    // Vérifier les limites avant d'ouvrir le modal
    const limitCheck = checkLimit(organization, 'vehicles');
    if (!limitCheck.canAdd) {
      setShowUpgradeModal(true);
      return;
    }
    
    setSelectedVehicle(null);
    setShowModal(true);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Véhicules</h2>
        <p className="text-slate-500 text-sm">
          Gérez votre parc ({vehicles.length} véhicules)
          {organization && !checkLimit(organization, 'vehicles').unlimited && (
            <span className="ml-2 text-xs">
              • {vehicles.length}/{checkLimit(organization, 'vehicles').limit} utilisés
            </span>
          )}
        </p>
      </div>

      {/* Add Button */}
      <Button 
        onClick={handleAddVehicle}
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/30"
        size="lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Ajouter un véhicule
      </Button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 rounded-xl bg-white/50 border border-white/20 focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <VehicleFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      <VehiclesList
        vehicles={filteredVehicles}
        isLoading={isLoading || saveVehicleMutation.isPending || deleteVehicleMutation.isPending} // Show loading state during mutations too
        onEdit={handleEditVehicle}
        onDelete={handleDeleteVehicle}
      />

      <Suspense fallback={<div />}>
        {showModal && (
          <VehicleModal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setSelectedVehicle(null);
            }}
            vehicle={selectedVehicle}
            onSave={handleSaveVehicle}
          />
        )}
      </Suspense>

      <Suspense fallback={<div />}>
        {showUpgradeModal && (
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            limitType="vehicles"
            currentPlan={organization?.subscription_plan || 'free'}
          />
        )}
      </Suspense>
    </div>
  );
}
