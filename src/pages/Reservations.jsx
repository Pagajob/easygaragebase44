
import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, List } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom"; // Added import

import ReservationsCalendar from "../components/reservations/ReservationsCalendar";
import ReservationsList from "../components/reservations/ReservationsList";
// Lazy load des modals
const ReservationModal = lazy(() => import("../components/reservations/ReservationModal"));
const UpgradeModal = lazy(() => import("../components/shared/UpgradeModal"));
import ReservationFilters from "../components/reservations/ReservationFilters";
import { generateContractHTML } from "../components/reservations/ContractGenerator";
import { generateLoanContract } from "../components/reservations/LoanContractGenerator";
import { checkLimit, incrementCounter, decrementCounter } from "../components/utils/subscriptionLimits";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";

// Helper function to create page URLs based on the outline's usage
const createPageUrl = (pathSegment) => `/${pathSegment}`;

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const [filteredReservations, setFilteredReservations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    vehicle: "all"
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("reservations_view") || "calendar";
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => filterByOrganization('Reservation'),
    staleTime: 2 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => filterByOrganization('Vehicle'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => filterByOrganization('Client'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => filterByOrganization('CheckIn'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false
  });

  const { data: checkOuts = [] } = useQuery({
    queryKey: ['checkOuts'],
    queryFn: () => filterByOrganization('CheckOut'),
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
    refetchInterval: false
  });

  const isLoading = reservationsLoading || vehiclesLoading || clientsLoading;

  const saveReservationMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      console.log("💾 Mutation appelée avec:", { id, hasData: !!data });

      if (!id) {
        const limitCheck = checkLimit(organization, 'reservations');
        if (!limitCheck.canAdd) {
          throw new Error('LIMIT_REACHED');
        }
      }

      const orgId = await getCurrentOrganizationId();
      const result = id ?
      await base44.entities.Reservation.update(id, data) :
      await base44.entities.Reservation.create({
        ...data,
        organization_id: orgId
      });

      console.log("✅ Mutation terminée, résultat:", result?.id);

      if (!id && result) {
        await incrementCounter(base44, organization, 'reservations');
        queryClient.invalidateQueries({ queryKey: ['organization'] });
      }

      return result;
    },
    onSuccess: () => {
      console.log("✅ onSuccess - Invalidation des queries");
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['checkIns'] });
      queryClient.invalidateQueries({ queryKey: ['checkOuts'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });

      setShowModal(false);
      setSelectedReservation(null);
    },
    onError: (error) => {
      console.error("❌ onError:", error);
      if (error.message === 'LIMIT_REACHED') {
        setShowModal(false);
        setShowUpgradeModal(true);
      } else {
        console.error("Erreur lors de la sauvegarde:", error);
        alert("Erreur lors de la sauvegarde de la réservation.");
      }
    }
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (reservationId) => {
      await base44.entities.Reservation.delete(reservationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['checkIns'] });
      queryClient.invalidateQueries({ queryKey: ['checkOuts'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de la réservation.");
    }
  });

  const applyFilters = useCallback(() => {
    let filtered = [...reservations];

    if (searchTerm) {
      filtered = filtered.filter((reservation) => {
        const vehicle = vehicles.find((v) => v.id === reservation.vehicle_id);
        const client = clients.find((c) => c.id === reservation.client_id);
        return (
          vehicle?.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle?.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      });
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((reservation) => reservation.status === filters.status);
    }

    if (filters.vehicle !== "all") {
      filtered = filtered.filter((reservation) => reservation.vehicle_id === filters.vehicle);
    }

    // NOUVEAU: Trier par date de départ (plus proche en premier)
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateA.getTime() - dateB.getTime(); // Ordre croissant (plus proche d'abord)
    });

    setFilteredReservations(filtered);
  }, [reservations, vehicles, clients, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSaveReservation = (reservationData) => {
    console.log("📝 handleSaveReservation appelé");

    // Protection supplémentaire contre les doubles appels
    if (saveReservationMutation.isLoading) {
      console.log("⚠️ Mutation déjà en cours, appel ignoré");
      return;
    }

    saveReservationMutation.mutate({
      id: selectedReservation?.id,
      data: reservationData
    });
  };

  const handleEditReservation = (reservation) => {
    setSelectedReservation(reservation);
    setShowModal(true);
  };

  const handleDeleteReservation = (reservationId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette réservation ?")) {
      deleteReservationMutation.mutate(reservationId);
    }
  };

  const handleGenerateContract = (reservation) => {
    const limitCheck = checkLimit(organization, 'pdf');
    if (!limitCheck.canAdd) {
      setShowUpgradeModal(true);
      return;
    }

    const vehicle = vehicles.find((v) => v.id === reservation.vehicle_id);
    const client = clients.find((c) => c.id === reservation.client_id);

    if (!vehicle || !client) {
      alert("Impossible de générer le contrat : véhicule ou client introuvable");
      return;
    }

    const reservationWithSignatures = {
      ...reservation,
      owner_signature: reservation.owner_signature || '',
      client_signature: reservation.client_signature || '',
      signed_at: reservation.signed_at || null
    };

    let contractHtml;
    // Define additionalFees (assuming empty array for now)
    const additionalFees = []; // Placeholder, if real fees are needed, they should be fetched or passed

    if (reservation.type === 'pret') {
      contractHtml = generateLoanContract(
        reservationWithSignatures,
        vehicle,
        client,
        organization
      );
    } else {
      contractHtml = generateContractHTML(
        reservationWithSignatures,
        vehicle,
        client,
        organization,
        additionalFees
      );
    }

    // CORRECTION: Ouvrir dans le navigateur
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(contractHtml);
      newWindow.document.close();
    } else {
      alert("Veuillez autoriser les pop-ups pour visualiser le contrat");
    }

    incrementCounter(base44, organization, 'pdf');
    queryClient.invalidateQueries({ queryKey: ['organization'] });
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    localStorage.setItem("reservations_view", value);
  };

  const handleAddReservation = () => {
    const limitCheck = checkLimit(organization, 'reservations');
    if (!limitCheck.canAdd) {
      setShowUpgradeModal(true);
      return;
    }

    setSelectedReservation(null);
    setShowModal(true);
  };

  const handleViewCheckOut = (reservation) => {
    // CORRECTION: Rediriger vers la page ViewCheckOut au lieu d'ouvrir une pop-up
    window.location.href = `/view-check-out?reservationId=${reservation.id}`;
  };

  const handleViewCheckIn = (reservation) => {
    // CORRECTION: Rediriger vers ViewCheckIn au lieu d'ouvrir une pop-up
    const checkIn = checkIns.find((ci) => ci.reservation_id === reservation.id);
    if (checkIn) {
      // Using 'view-check-in' for consistency with 'view-check-out'
      window.location.href = createPageUrl(`view-check-in?id=${checkIn.id}`);
    } else {
      alert("Aucun état des lieux d'entrée trouvé pour cette réservation."); // Corrected message for CheckIn
    }
  };

  const confirmedCount = reservations.filter((r) => r.status === 'confirmee').length;
  const pendingCount = reservations.filter((r) => r.status === 'brouillon').length;
  const todayCount = reservations.filter((r) => {
    const today = new Date().toISOString().split('T')[0];
    return r.start_date === today;
  }).length;

  return (
    <div className="p-4 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Réservations</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Planifiez et gérez ({reservations.length} total)
          {organization && !checkLimit(organization, 'reservations').unlimited &&
          <span className="ml-2 text-xs">
              • {checkLimit(organization, 'reservations').current}/{checkLimit(organization, 'reservations').limit} ce mois
            </span>
          }
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm">
          <span className="text-green-600 dark:text-green-400 font-medium">{confirmedCount} confirmées</span>
          <span className="text-orange-600 dark:text-orange-400 font-medium">{pendingCount} brouillons</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">{todayCount} aujourd'hui</span>
        </div>
      </div>

      <Button
        onClick={handleAddReservation}
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/30"
        size="lg">

        <Plus className="w-5 h-5 mr-2" />
        Nouvelle réservation
      </Button>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Rechercher par véhicule ou client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/20 focus-visible:ring-2 focus-visible:ring-blue-500" />

      </div>

      <ReservationFilters
        filters={filters}
        onFiltersChange={setFilters}
        vehicles={vehicles} />


      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-white/40 text-muted-foreground rounded-[100px] h-10 items-center justify-center grid w-full grid-cols-2 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20">
          <TabsTrigger value="calendar" className="px-3 py-1.5 text-sm font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-100 data-[state=active]:shadow-md">
            <Calendar className="w-4 h-4 mr-2" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="list" className="px-3 py-1.5 text-sm font-medium rounded-[100px] inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 dark:text-slate-100 data-[state=active]:shadow-md">
            <List className="w-4 h-4 mr-2" />
            Liste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <ReservationsCalendar
            reservations={filteredReservations}
            vehicles={vehicles}
            clients={clients}
            isLoading={isLoading}
            onEdit={handleEditReservation}
            onAdd={handleAddReservation} />

        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <ReservationsList
            reservations={filteredReservations}
            vehicles={vehicles}
            clients={clients}
            checkIns={checkIns}
            checkOuts={checkOuts}
            isLoading={isLoading}
            onEdit={handleEditReservation}
            onDelete={handleDeleteReservation}
            onGenerateContract={handleGenerateContract}
            onViewCheckOut={handleViewCheckOut}
            onViewCheckIn={handleViewCheckIn} // NEW: Pass handleViewCheckIn as a prop
          />

        </TabsContent>
      </Tabs>

      <Suspense fallback={<div />}>
        {showModal &&
        <ReservationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedReservation(null);
          }}
          reservation={selectedReservation}
          vehicles={vehicles}
          clients={clients}
          onSave={handleSaveReservation} />

        }
      </Suspense>

      <Suspense fallback={<div />}>
        {showUpgradeModal &&
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType="reservations"
          currentPlan={organization?.subscription_plan || 'free'} />

        }
      </Suspense>
    </div>);

}
