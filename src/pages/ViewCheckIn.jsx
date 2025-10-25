
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Calendar, Car, User, Gauge, Fuel,
  Image as ImageIcon, AlertTriangle, DollarSign
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getOrganizationCurrency } from "../components/utils/formatters";
import { getCurrentOrganizationId } from "../components/utils/multiTenant"; // UTILISER L'IMPORT EXISTANT

export default function ViewCheckIn() {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState("EUR");

  // Charger la devise
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  const filterByOrganization = useCallback(async (entityName, orgId) => {
    if (!orgId) {
      console.warn(`Attempted to filter ${entityName} without an organization ID.`);
      return [];
    }
    const entityClient = base44.entities[entityName];
    if (!entityClient || typeof entityClient.filter !== "function") {
      console.error(`Entity client for ${entityName} not found or filter method missing.`);
      return [];
    }
    return entityClient.filter({ organization_id: orgId });
  }, []);

  useEffect(() => {
    loadCheckIn();
  }, []);

  const loadCheckIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const checkInId = urlParams.get("id");
      if (!checkInId) {
        setError("Aucun état des lieux spécifié");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const currentOrgId = await getCurrentOrganizationId();
      if (!currentOrgId) {
        setError("Impossible de déterminer l'organisation actuelle. Accès refusé.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const checkIns = await base44.entities.CheckIn.filter({ id: checkInId });
      if (checkIns.length === 0) {
        setError("État des lieux non trouvé");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }
      const foundCheckIn = checkIns[0];

      if (foundCheckIn.organization_id !== currentOrgId) {
        setError("Accès non autorisé à cet état des lieux.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const [reservations, vehicles, clients] = await Promise.all([
        filterByOrganization("Reservation", currentOrgId),
        filterByOrganization("Vehicle", currentOrgId),
        filterByOrganization("Client", currentOrgId)
      ]);

      const foundReservation = reservations.find((r) => r.id === foundCheckIn.reservation_id);

      // Handle cases where reservation might not be found or vehicle/client might be null
      if (!foundReservation) {
        setError("Réservation associée non trouvée.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      if (foundReservation.organization_id !== currentOrgId) {
        setError("Accès non autorisé à la réservation associée.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const foundVehicle = foundReservation ? vehicles.find((v) => v.id === foundReservation.vehicle_id) : null;
      const foundClient = foundReservation ? clients.find((c) => c.id === foundReservation.client_id) : null;

      setCheckIn(foundCheckIn);
      setReservation(foundReservation);
      setVehicle(foundVehicle);
      setClient(foundClient);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      setError("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md w-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 rounded-2xl">
          <CardContent className="p-6 text-center">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Erreur</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
            <Link to={createPageUrl("Reservations")}>
              <Button className="min-h-[44px] rounded-full">Retour aux réservations</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-4">
      {/* NEW: Bouton retour mobile */}
      <div className="max-w-4xl mx-auto mb-4 md:hidden">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="w-full rounded-full bg-white/80 backdrop-blur-sm"
        >
          ← Retour
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        {checkIn && reservation && vehicle && client && (
          <div className="space-y-6">
            {/* NEW: Bouton retour desktop */}
            <div className="hidden md:block">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                className="rounded-full"
              >
                ← Retour
              </Button>
            </div>

            {/* Titre / date */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg rounded-2xl">
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg text-center text-slate-900 dark:text-slate-100">
                  État des lieux de départ
                </CardTitle>
                <div className="mt-2 flex items-center justify-center">
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-full whitespace-nowrap px-2.5 py-1 text-[11px]">
                    Effectué le {format(parseISO(checkIn.performed_at), "d MMM yyyy à HH:mm", { locale: fr })}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Récapitulatif location */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg rounded-2xl">
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <DollarSign className="w-5 h-5" />
                  Récapitulatif location
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Tarif</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(reservation.estimated_price || 0, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Caution de départ</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatCurrency(vehicle.deposit || 0, currency)}
                  </span>
                </div>
                {vehicle.deposit_rsv > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Caution RSV</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatCurrency(vehicle.deposit_rsv, currency)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Infos réservation */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg rounded-2xl">
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  Informations de la location
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Client</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{client?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Véhicule</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {vehicle?.make} {vehicle?.model} — {vehicle?.plate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Période</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {format(parseISO(reservation.start_date), "d MMM", { locale: fr })} au{" "}
                      {format(parseISO(reservation.end_date), "d MMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* État du véhicule */}
            <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg rounded-2xl">
              <CardHeader className="p-4">
                <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  État du véhicule au départ
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                    <Gauge className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Kilométrage</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {checkIn.mileage_start?.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl">
                    <Fuel className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Carburant</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{checkIn.fuel_level}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            {checkIn.photos && checkIn.photos.length > 0 && (
              <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg rounded-2xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <ImageIcon className="w-5 h-5" />
                    Photos ({checkIn.photos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {checkIn.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.url}
                          alt={photo.label || `Photo ${index + 1}`}
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 640px) 50vw, 33vw"
                          className="aspect-[4/3] w-full object-cover rounded-xl border border-white/40 dark:border-slate-700/40"
                        />
                        {photo.label && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[11px] px-2 py-1 rounded-b-xl">
                            {photo.label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dégâts signalés */}
            {checkIn.damages && checkIn.damages.length > 0 && (
              <Card className="bg-red-50/60 dark:bg-red-950/50 backdrop-blur-md border-red-200/40 dark:border-red-700/40 shadow-lg rounded-2xl">
                <CardHeader className="p-4">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertTriangle className="w-5 h-5" />
                    Dégâts signalés ({checkIn.damages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {checkIn.damages.map((damage, index) => (
                      <details
                        key={index}
                        className="rounded-xl bg-white/70 dark:bg-slate-700/70 border border-red-200 dark:border-red-700/60 p-3"
                      >
                        <summary className="flex items-center justify-between cursor-pointer">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {damage.type} — {damage.location}
                          </span>
                          <Badge
                            className={`rounded-full text-[11px] whitespace-nowrap ${
                              damage.severity === "leger"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                : damage.severity === "moyen"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                            }`}
                          >
                            {damage.severity}
                          </Badge>
                        </summary>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{damage.description}</p>
                      </details>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
