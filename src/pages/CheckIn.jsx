import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";

import CheckInStep1 from "../components/checkin/CheckInStep1";
import CheckInStep2 from "../components/checkin/CheckInStep2";
import CheckInStep3 from "../components/checkin/CheckInStep3";
import CheckInCompleteModal from "../components/checkin/CheckInCompleteModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";

export default function CheckInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [reservation, setReservation] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [error, setError] = useState(null);
  const [createdCheckIn, setCreatedCheckIn] = useState(null);

  const [checkInData, setCheckInData] = useState({
    performed_at: new Date().toISOString(),
    mileage_start: 0,
    fuel_level: "1/2",
    photos: [],
    damages: [],
    owner_signature: null,
    client_signature: null
  });

  useEffect(() => {
    loadData();
  }, []);

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

      const [reservations, vehicles, clients, orgs] = await Promise.all([
        filterByOrganization('Reservation'),
        filterByOrganization('Vehicle'),
        filterByOrganization('Client'),
        (async () => {
          const orgId = await getCurrentOrganizationId();
          return orgId ? base44.entities.Organization.filter({ id: orgId }) : base44.entities.Organization.list();
        })()
      ]);

      const foundReservation = reservations.find((r) => r.id === reservationId);
      if (!foundReservation) {
        setError("Réservation non trouvée");
        setTimeout(() => {
          navigate(createPageUrl("Reservations"));
        }, 2000);
        return;
      }

      const foundVehicle = vehicles.find((v) => v.id === foundReservation.vehicle_id);
      const foundClient = clients.find((c) => c.id === foundReservation.client_id);

      if (!foundVehicle) {
        setError("Véhicule non trouvé");
        return;
      }

      if (!foundClient) {
        setError("Client non trouvé");
        return;
      }

      setReservation(foundReservation);
      setVehicle(foundVehicle);
      setClient(foundClient);
      setOrganization(orgs[0] || null);

      if (foundVehicle) {
        setCheckInData((prev) => ({
          ...prev,
          mileage_start: foundVehicle.mileage || 0
        }));
      }
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

  const saveCheckInMutation = useMutation({
    mutationFn: async (checkInFormData) => {
      const orgId = await getCurrentOrganizationId();
      const result = await base44.entities.CheckIn.create({
        reservation_id: reservation.id,
        ...checkInFormData,
        locked: true,
        organization_id: orgId
      });

      setCreatedCheckIn(result);
      
      return result;
    },
    onSuccess: async (checkInRecord) => {
      if (vehicle) {
        const existingDamages = vehicle.damages || [];
        await base44.entities.Vehicle.update(vehicle.id, {
          damages: [
            ...existingDamages,
            ...checkInRecord.damages.map((d) => ({
              ...d,
              date_reported: new Date().toISOString()
            }))
          ],
          mileage: checkInRecord.mileage_start,
          status: "loue"
        });
      }

      await base44.entities.Reservation.update(reservation.id, {
        status: "checked_in",
        owner_signature: checkInRecord.owner_signature,
        client_signature: checkInRecord.client_signature,
        signed_at: new Date().toISOString()
      });

      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      await queryClient.invalidateQueries({ queryKey: ['checkIns'] });

      await queryClient.refetchQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['checkIns'] });

      setShowCompleteModal(true);
    },
    onError: (err) => {
      console.error("Erreur lors de la finalisation:", err);
      setError("Erreur lors de la finalisation de l'EDL: " + err.message);
    }
  });

  const handleComplete = async () => {
    saveCheckInMutation.mutate(checkInData);
  };

  const updateCheckInData = (data) => {
    setCheckInData((prev) => ({
      ...prev,
      ...data
    }));
  };

  const progressPercentage = currentStep / 3 * 100;

  if (isLoading || saveCheckInMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text={saveCheckInMutation.isPending ? "Finalisation de l'état des lieux..." : "Chargement de l'état des lieux..."} />
      </div>
    );
  }

  if (error || saveCheckInMutation.isError) {
    const displayError = error || saveCheckInMutation.error.message;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur</h2>
            <p className="text-slate-600 mb-4">{displayError}</p>
            <Link to={createPageUrl("Reservations")}>
              <Button>Retour aux réservations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto mb-6">
        <Link to={createPageUrl("Reservations")}>
          <Button variant="ghost" size="sm" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 mb-4 dark:text-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux réservations
          </Button>
        </Link>

        <Card className="bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">État des lieux de départ</CardTitle>
            
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                <span>Étape {currentStep} sur 3</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              
              <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className={`text-center ${currentStep >= 1 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  Informations
                </div>
                <div className={`text-center ${currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  État véhicule
                </div>
                <div className={`text-center ${currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>
                  Signatures
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="max-w-2xl mx-auto">
        {currentStep === 1 && (
          <CheckInStep1
            reservation={reservation}
            vehicle={vehicle}
            client={client}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <CheckInStep2
            reservation={reservation}
            vehicle={vehicle}
            checkInData={checkInData}
            updateCheckInData={updateCheckInData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <CheckInStep3
            reservation={reservation}
            vehicle={vehicle}
            client={client}
            organization={organization}
            checkInData={checkInData}
            updateCheckInData={updateCheckInData}
            onBack={handleBack}
            onComplete={handleComplete}
          />
        )}
      </div>

      {showCompleteModal && createdCheckIn && (
        <CheckInCompleteModal
          client={client}
          reservation={reservation}
          vehicle={vehicle}
          organization={organization}
          checkInData={createdCheckIn}
          onClose={() => {
            setShowCompleteModal(false);
            navigate(createPageUrl("Dashboard"));
          }}
        />
      )}
    </div>
  );
}