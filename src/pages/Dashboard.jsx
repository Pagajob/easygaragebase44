
import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Car,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus } from
"lucide-react";
import { format, isToday, isPast, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, formatNumber, getOrganizationCurrency } from "../components/utils/formatters";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";

import StatsCard from "../components/dashboard/StatsCard";
import TodayTasks from "../components/dashboard/TodayTasks";
import TodayDepartures from "../components/dashboard/TodayDepartures";
import MonthlyCosts from "../components/dashboard/MonthlyCosts";
import RecentActivity from "../components/dashboard/RecentActivity";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { checkLimit, incrementCounter } from "../components/utils/subscriptionLimits";
import OneTimeFees from "../components/dashboard/OneTimeFees";

// Lazy load des modals lourds
const ReservationModal = lazy(() => import("../components/reservations/ReservationModal"));
const VehicleModal = lazy(() => import("../components/vehicles/VehicleModal"));
const ClientModal = lazy(() => import("../components/clients/ClientModal"));
const UpgradeModal = lazy(() => import("../components/shared/UpgradeModal"));

export default function Dashboard() {
  const queryClient = useQueryClient();

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalType, setUpgradeModalType] = useState('reservations');

  const [currency, setCurrency] = useState('EUR');

  // Optimisation: select uniquement les données nécessaires
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => filterByOrganization('Vehicle'),
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => filterByOrganization('Client'),
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => filterByOrganization('Reservation'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: checkIns = [], isLoading: checkInsLoading } = useQuery({
    queryKey: ['checkIns'],
    queryFn: () => filterByOrganization('CheckIn'),
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: checkOuts = [], isLoading: checkOutsLoading } = useQuery({
    queryKey: ['checkOuts'],
    queryFn: () => filterByOrganization('CheckOut'),
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: fixedCharges = [], isLoading: fixedChargesLoading } = useQuery({
    queryKey: ['fixedCharges'],
    queryFn: () => filterByOrganization('FixedCharge'),
    staleTime: 30 * 60 * 1000,
    cacheTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: oneTimeFees = [], isLoading: oneTimeFeesLoading } = useQuery({
    queryKey: ['oneTimeFees'],
    queryFn: () => filterByOrganization('OneTimeFee'),
    staleTime: 15 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  const { data: organization, isLoading: organizationLoading } = useQuery({
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false
  });

  // Charger la devise
  useEffect(() => {
    const loadCurrency = async () => {
      if (organization) {
        const curr = await getOrganizationCurrency(organization);
        setCurrency(curr);
      }
    };
    loadCurrency();
  }, [organization]);

  const isLoading = vehiclesLoading || clientsLoading || reservationsLoading ||
  checkInsLoading || checkOutsLoading || fixedChargesLoading || organizationLoading || oneTimeFeesLoading;

  // Memoization des mutations
  const saveReservationMutation = useMutation({
    mutationFn: async (data) => {
      if (!organization) {
        throw new Error('Organization not loaded yet.');
      }
      const limitCheck = checkLimit(organization, 'reservations');
      if (!limitCheck.canAdd) {
        throw new Error('LIMIT_REACHED');
      }

      const orgId = await getCurrentOrganizationId();
      const result = await base44.entities.Reservation.create({
        ...data,
        organization_id: orgId
      });
      await incrementCounter(base44, organization, 'reservations');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowReservationModal(false);
    },
    onError: (error) => {
      if (error.message === 'LIMIT_REACHED') {
        setShowReservationModal(false);
        setUpgradeModalType('reservations');
        setShowUpgradeModal(true);
      } else {
        console.error("Erreur lors de la sauvegarde:", error);
      }
    }
  });

  const saveVehicleMutation = useMutation({
    mutationFn: async (data) => {
      if (!organization) {
        throw new Error('Organization not loaded yet.');
      }
      const limitCheck = checkLimit(organization, 'vehicles');
      if (!limitCheck.canAdd) {
        throw new Error('LIMIT_REACHED');
      }

      const orgId = await getCurrentOrganizationId();
      const result = await base44.entities.Vehicle.create({
        ...data,
        organization_id: orgId
      });
      await incrementCounter(base44, organization, 'vehicles');
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setShowVehicleModal(false);
    },
    onError: (error) => {
      if (error.message === 'LIMIT_REACHED') {
        setShowVehicleModal(false);
        setUpgradeModalType('vehicles');
        setShowUpgradeModal(true);
      } else {
        console.error("Erreur lors de la sauvegarde:", error);
      }
    }
  });

  const saveClientMutation = useMutation({
    mutationFn: async (data) => {
      const orgId = await getCurrentOrganizationId();
      return await base44.entities.Client.create({
        ...data,
        organization_id: orgId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowClientModal(false);
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  });

  // Mutation pour sauvegarder un frais ponctuel
  const saveOneTimeFeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const orgId = await getCurrentOrganizationId();
      if (id) {
        return await base44.entities.OneTimeFee.update(id, data);
      } else {
        return await base44.entities.OneTimeFee.create({
          ...data,
          organization_id: orgId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oneTimeFees'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  });

  // Mutation pour supprimer un frais ponctuel
  const deleteOneTimeFeeMutation = useMutation({
    mutationFn: (id) => base44.entities.OneTimeFee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['oneTimeFees'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
    }
  });

  const handleVehicleUpdate = async (vehicleId, data) => {
    try {
      await base44.entities.Vehicle.update(vehicleId, data);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const handleAddReservation = () => {
    if (!organization) {
      console.warn("Organization not loaded yet, cannot check limits.");
      return;
    }
    const limitCheck = checkLimit(organization, 'reservations');
    if (!limitCheck.canAdd) {
      setUpgradeModalType('reservations');
      setShowUpgradeModal(true);
      return;
    }
    setShowReservationModal(true);
  };

  const handleAddVehicle = () => {
    if (!organization) {
      console.warn("Organization not loaded yet, cannot check limits.");
      return;
    }
    const limitCheck = checkLimit(organization, 'vehicles');
    if (!limitCheck.canAdd) {
      setUpgradeModalType('vehicles');
      setShowUpgradeModal(true);
      return;
    }
    setShowVehicleModal(true);
  };

  const handleSaveOneTimeFee = async (id, data) => {
    await saveOneTimeFeeMutation.mutateAsync({ id, data });
  };

  const handleDeleteOneTimeFee = async (id) => {
    await deleteOneTimeFeeMutation.mutateAsync(id);
  };

  // Memoization des calculs
  const { monthlyRevenue, monthlyCharges, ownerPayments, monthlyProfit } = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const revenue = reservations
      .filter((r) => {
        if (r.status === 'annulee') return false;
        const startDate = parseISO(r.start_date);
        return startDate >= monthStart && startDate <= monthEnd;
      })
      .reduce((sum, r) => sum + (r.estimated_price || 0), 0);

    const vehicleCharges = vehicles.reduce((sum, v) => {
      let total = 0;

      const charges = v.monthly_charges || [];
      total += charges.reduce((s, c) => s + (c.amount || 0), 0);

      if (v.monthly_insurance && v.monthly_insurance > 0) {
        total += v.monthly_insurance;
      }

      if (v.financing_type === 'leasing' && v.monthly_payment) {
        total += v.monthly_payment;
      }

      if (v.financing_type === 'lld' && v.monthly_rent) {
        total += v.monthly_rent;
      }

      return sum + total;
    }, 0);

    const fixedChargesTotal = fixedCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    // NOUVEAU: Ajouter les frais ponctuels du mois en cours
    const oneTimeFeesTotal = oneTimeFees
      .filter((fee) => {
        // Ensure fee.date exists and is a valid string
        if (!fee.date) return false;
        const feeDate = parseISO(fee.date);
        // Check if feeDate is a valid date object
        if (isNaN(feeDate.getTime())) return false;
        return feeDate >= monthStart && feeDate <= monthEnd;
      })
      .reduce((sum, fee) => sum + (fee.amount || 0), 0);

    const charges = vehicleCharges + fixedChargesTotal + oneTimeFeesTotal;

    // CORRECTION: Utiliser directement owner_payment des réservations
    const payments = reservations
      .filter((r) => {
        if (r.status === 'annulee') return false;
        const startDate = parseISO(r.start_date);
        const isInCurrentMonth = startDate >= monthStart && startDate <= monthEnd;

        // Vérifier que le véhicule est en mise à disposition
        const vehicle = vehicles.find((v) => v.id === r.vehicle_id);
        return isInCurrentMonth && vehicle?.financing_type === 'mise_a_disposition';
      })
      .reduce((sum, r) => sum + (r.owner_payment || 0), 0);

    const profit = revenue - charges - payments;

    return {
      monthlyRevenue: revenue,
      monthlyCharges: charges,
      ownerPayments: payments,
      monthlyProfit: profit
    };
  }, [reservations, vehicles, fixedCharges, oneTimeFees]); // Ajouter oneTimeFees aux dépendances

  return (
    <div className="p-4 space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent mb-2">
          Tableau de bord
        </h2>
        <p className="text-slate-600 text-sm font-medium dark:text-slate-300">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <Button
        onClick={handleAddReservation}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 h-14 text-lg font-semibold"
        size="lg">

        <Plus className="w-6 h-6 mr-2" />
        Nouvelle réservation
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-[100px] glass-card shine-effect">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-[10px] text-slate-500 font-medium dark:text-slate-100">Revenus du mois</p>
                <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  {isLoading ? '-' : formatCurrency(monthlyRevenue, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-[100px] glass-card shine-effect">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📉</span>
              <div>
                <p className="text-[10px] text-slate-500 font-medium dark:text-slate-100">Charges du mois</p>
                <p className="text-xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
                  {isLoading ? '-' : formatCurrency(monthlyCharges, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {ownerPayments > 0 &&
        <div className="p-3 rounded-[100px] glass-card shine-effect">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">🤝</span>
                <div>
                  <p className="text-[10px] text-slate-500 font-medium">Reversé propriétaires</p>
                  <p className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                    {isLoading ? '-' : formatCurrency(ownerPayments, currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        }

        <div className="p-3 rounded-[100px] glass-card shine-effect">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📈</span>
              <div>
                <p className="text-[10px] text-slate-500 font-medium dark:text-slate-100">Bénéfice du mois</p>
                <p className={`text-xl font-bold bg-gradient-to-r ${
                monthlyProfit >= 0 ?
                'from-indigo-600 to-indigo-500' :
                'from-rose-600 to-rose-500'} bg-clip-text text-transparent`
                }>
                  {isLoading ? '-' : formatCurrency(monthlyProfit, currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <TodayDepartures
          reservations={reservations}
          vehicles={vehicles}
          clients={clients}
          checkIns={checkIns}
          isLoading={isLoading} />


        <TodayTasks
          reservations={reservations}
          vehicles={vehicles}
          clients={clients}
          isLoading={isLoading} />


        <RecentActivity
          reservations={reservations}
          checkIns={checkIns}
          vehicles={vehicles}
          clients={clients}
          isLoading={isLoading} />


        <div className="glass-card rounded-3xl p-5 shine-effect">
          <CardHeader className="px-0 pt-0 pb-3">
            <CardTitle className="tracking-tight text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent dark:text-slate-100">Accès rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-0 pb-0">
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-indigo-700 dark:text-indigo-300 transition-colors duration-200"
              onClick={handleAddVehicle}>

              <Car className="w-5 h-5 mr-3 text-indigo-500" />
              <span className="text-base font-medium">Ajouter un véhicule</span>
              <ArrowRight className="w-5 h-5 ml-auto text-indigo-500" />
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-indigo-700 dark:text-indigo-300 transition-colors duration-200"
              onClick={() => setShowClientModal(true)}>

              <Users className="w-5 h-5 mr-3 text-indigo-500" />
              <span className="text-base font-medium">Nouveau client</span>
              <ArrowRight className="w-5 h-5 ml-auto text-indigo-500" />
            </Button>
            <Link to={createPageUrl("FixedCharges")}>
              <Button variant="ghost" className="w-full justify-start hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-indigo-700 dark:text-indigo-300 transition-colors duration-200">
                <span className="text-xl mr-3 text-indigo-500">€</span>
                <span className="text-base font-medium">Mes charges fixes</span>
                <ArrowRight className="w-5 h-5 ml-auto text-indigo-500" />
              </Button>
            </Link>
          </CardContent>
        </div>

        <MonthlyCosts
          vehicles={vehicles}
          fixedCharges={fixedCharges}
          isLoading={isLoading}
          onVehicleUpdate={handleVehicleUpdate} />

        <OneTimeFees
          fees={oneTimeFees}
          vehicles={vehicles}
          isLoading={oneTimeFeesLoading}
          currency={currency}
          onSave={handleSaveOneTimeFee}
          onDelete={handleDeleteOneTimeFee}
        />
      </div>

      {/* Lazy loaded modals with Suspense */}
      <Suspense fallback={<div />}>
        {showReservationModal &&
        <ReservationModal
          isOpen={showReservationModal}
          onClose={() => setShowReservationModal(false)}
          reservation={null}
          vehicles={vehicles}
          clients={clients}
          onSave={(data) => saveReservationMutation.mutate(data)} />

        }
      </Suspense>

      <Suspense fallback={<div />}>
        {showVehicleModal &&
        <VehicleModal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          vehicle={null}
          onSave={(data) => saveVehicleMutation.mutate(data)} />

        }
      </Suspense>

      <Suspense fallback={<div />}>
        {showClientModal &&
        <ClientModal
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
          client={null}
          onSave={(data) => saveClientMutation.mutate(data)} />

        }
      </Suspense>

      <Suspense fallback={<div />}>
        {showUpgradeModal &&
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType={upgradeModalType}
          currentPlan={organization?.subscription_plan || 'free'} />

        }
      </Suspense>
    </div>);

}
