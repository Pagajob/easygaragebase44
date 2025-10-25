
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";
import { useQueryClient } from "@tanstack/react-query";

import CheckOutStep1 from "../components/checkout/CheckOutStep1";
import CheckOutStep2 from "../components/checkout/CheckOutStep2";
import CheckOutStep3 from "../components/checkout/CheckOutStep3";
import CheckOutCompleteModal from "../components/checkout/CheckOutCompleteModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";

import { format, parseISO, differenceInHours } from "date-fns";

export default function CheckOutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [reservation, setReservation] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [checkIn, setCheckIn] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [error, setError] = useState(null);

  // New state variables for rental duration calculation
  const [rentalDays, setRentalDays] = useState(0);
  const [includedKm, setIncludedKm] = useState(0);

  const [checkOutData, setCheckOutData] = useState({
    performed_at: new Date().toISOString(),
    mileage_end: 0,
    fuel_level: "1/2",
    photos: [],
    damages: [],
    owner_signature: null,
    client_signature: null,
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  // New useEffect hook for calculating rental duration and included kilometers
  useEffect(() => {
    if (checkIn && vehicle && reservation) {// Keep checkIn and reservation
      if (!reservation.start_date || !reservation.end_date) {
        console.warn("Reservation dates are missing, cannot calculate rental duration.");
        return;
      }

      const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
      const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        console.error("Invalid start or end date/time for reservation.", reservation);
        return;
      }

      const hours = differenceInHours(endDateTime, startDateTime);

      // CORRECTION: 24h = 1 jour, 24h01 = 2 jours
      const calculatedRentalDays = hours > 0 ? Math.ceil(hours / 24) : 1;

      setRentalDays(calculatedRentalDays);

      if (vehicle.unlimited_km) {
        setIncludedKm(999999); // A large number to represent unlimited kilometers
      } else {
        const dailyKmIncluded = vehicle.daily_km_included || 200; // Default to 200km if not specified
        const included = calculatedRentalDays * dailyKmIncluded;
        setIncludedKm(included);
      }
    }
  }, [checkIn, vehicle, reservation]); // Dependencies for this effect

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const reservationId = urlParams.get('reservation');

      if (!reservationId) {
        setError("Aucune réservation spécifiée");
        setTimeout(() => {
          navigate(createPageUrl("Reservations"));
        }, 2000);
        return;
      }

      const [reservations, vehicles, clients, orgs, checkIns] = await Promise.all([
      filterByOrganization('Reservation'),
      filterByOrganization('Vehicle'),
      filterByOrganization('Client'),
      (async () => {
        const orgId = await getCurrentOrganizationId();
        return orgId ? await base44.entities.Organization.filter({ id: orgId }) : await base44.entities.Organization.list();
      })(),
      filterByOrganization('CheckIn')]
      );

      const foundReservation = reservations.find((r) => r.id === reservationId);
      if (!foundReservation) {
        setError("Réservation non trouvée");
        setTimeout(() => {
          navigate(createPageUrl("Reservations"));
        }, 2000);
        return;
      }

      const foundCheckIn = checkIns.find((ci) => ci.reservation_id === reservationId);
      if (!foundCheckIn) {
        setError("Aucun EDL de départ trouvé pour cette réservation");
        setTimeout(() => {
          navigate(createPageUrl("Reservations"));
        }, 2000);
        return;
      }

      const foundVehicle = vehicles.find((v) => v.id === foundReservation.vehicle_id);
      const foundClient = clients.find((c) => c.id === foundReservation.client_id);

      if (!foundVehicle || !foundClient) {
        setError("Données manquantes");
        return;
      }

      setReservation(foundReservation);
      setVehicle(foundVehicle);
      setClient(foundClient);
      setCheckIn(foundCheckIn);
      setOrganization(orgs[0] || null);

      // Initialiser le kilométrage avec celui du véhicule
      setCheckOutData((prev) => ({
        ...prev,
        mileage_end: foundVehicle.mileage || foundCheckIn.mileage_start || 0
      }));
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setError("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const orgId = await getCurrentOrganizationId();

      // Créer l'EDL de retour
      const checkOutRecord = await base44.entities.CheckOut.create({
        reservation_id: reservation.id,
        ...checkOutData,
        locked: true,
        organization_id: orgId
      });

      // Mettre à jour le véhicule
      if (checkOutData.damages.length > 0 && vehicle) {
        const existingDamages = vehicle.damages || [];
        await base44.entities.Vehicle.update(vehicle.id, {
          damages: [...existingDamages, ...checkOutData.damages],
          mileage: checkOutData.mileage_end,
          status: 'disponible'
        });
      } else if (vehicle) {
        await base44.entities.Vehicle.update(vehicle.id, {
          mileage: checkOutData.mileage_end,
          status: 'disponible'
        });
      }

      // Mettre à jour le statut de la réservation
      await base44.entities.Reservation.update(reservation.id, {
        status: "terminee"
      });

      // IMPORTANT: Invalider ET refetch immédiatement
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      await queryClient.invalidateQueries({ queryKey: ['checkIns'] });
      await queryClient.invalidateQueries({ queryKey: ['checkOuts'] });

      // Refetch immédiatement
      await queryClient.refetchQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['checkOuts'] });

      setShowCompleteModal(true);
    } catch (error) {
      console.error("Erreur lors de la finalisation:", error);
      setError("Erreur lors de la finalisation de l'EDL de retour");
    }
  };

  const updateCheckOutData = (data) => {
    setCheckOutData((prev) => ({
      ...prev,
      ...data
    }));
  };

  const progressPercentage = currentStep / 3 * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Chargement de l'état des lieux..." />
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <Link to={createPageUrl("Reservations")}>
              <Button>Retour aux réservations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="bg-transparent pb-24 p-4 rounded-[48px] min-h-screen">
  {/* Header */}
  <div className="max-w-2xl mx-auto mb-6">
    <Link to={createPageUrl("Reservations")}>
      <Button variant="ghost" size="sm" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 mb-4 dark:text-slate-100">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour aux réservations
      </Button>
    </Link>

    <Card className="bg-slate/30 text-card-foreground rounded-xl border backdrop-blur-lg border-black/30 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight text-center dark:text-slate-100">État des lieux de retour</CardTitle>
        <Progress value={progressPercentage} className="mt-4" />
      </CardHeader>
    </Card>
  </div>


      {/* Steps */}
      <div className="max-w-2xl mx-auto">
        {currentStep === 1 &&
        <CheckOutStep1
          reservation={reservation}
          vehicle={vehicle}
          client={client}
          checkIn={checkIn}
          onNext={handleNext} />

        }

        {currentStep === 2 &&
        <CheckOutStep2
          reservation={reservation}
          vehicle={vehicle}
          checkIn={checkIn}
          checkOutData={checkOutData}
          updateCheckOutData={updateCheckOutData}
          rentalDays={rentalDays} // Pass new prop
          includedKm={includedKm} // Pass new prop
          onNext={handleNext}
          onBack={handleBack} />

        }

        {currentStep === 3 &&
        <CheckOutStep3
          reservation={reservation}
          vehicle={vehicle}
          client={client}
          organization={organization}
          checkOutData={checkOutData}
          updateCheckOutData={updateCheckOutData}
          onBack={handleBack}
          onComplete={handleComplete} />

        }
      </div>

      {/* Modal de complétion */}
      {showCompleteModal &&
      <CheckOutCompleteModal
        client={client}
        reservation={reservation}
        vehicle={vehicle}
        organization={organization}
        checkInData={checkIn}
        checkOutData={checkOutData}
        onClose={() => navigate(createPageUrl("Reservations"))} />

      }
    </div>);

}