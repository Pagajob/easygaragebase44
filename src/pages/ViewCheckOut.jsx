import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Calendar, Car, User, Gauge, Fuel,
  Image as ImageIcon, AlertTriangle, TrendingUp, DollarSign
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency, getOrganizationCurrency } from "../components/utils/formatters";

export default function ViewCheckOut() {
  const navigate = useNavigate();
  const [checkOut, setCheckOut] = useState(null);
  const [checkIn, setCheckIn] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  // Filtre générique par org
  const filterEntitiesByOrganization = async (entityName, orgId) => {
    if (!orgId) return [];
    return base44.entities[entityName].filter({ organization_id: orgId });
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const checkOutId = urlParams.get("id");
      if (!checkOutId) {
        setError("Aucun état des lieux spécifié");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const currentOrgId = await base44.auth.getCurrentOrganizationId?.();
      if (!currentOrgId) {
        setError("Impossible de déterminer l'organisation actuelle. Veuillez vous reconnecter.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const checkOuts = await base44.entities.CheckOut.filter({ id: checkOutId });
      if (checkOuts.length === 0) {
        setError("État des lieux de retour non trouvé");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const foundCheckOut = checkOuts[0];
      if (foundCheckOut.organization_id !== currentOrgId) {
        setError("Accès non autorisé à cet état des lieux.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const [allCheckIns, allReservations, allVehicles, allClients] = await Promise.all([
        filterEntitiesByOrganization("CheckIn", currentOrgId),
        filterEntitiesByOrganization("Reservation", currentOrgId),
        filterEntitiesByOrganization("Vehicle", currentOrgId),
        filterEntitiesByOrganization("Client", currentOrgId),
      ]);

      const foundReservation = allReservations.find(r => r.id === foundCheckOut.reservation_id);
      const foundCheckIn = allCheckIns.find(ci => ci.reservation_id === foundCheckOut.reservation_id);

      if (!foundReservation || foundReservation.organization_id !== currentOrgId) {
        setError("Réservation liée introuvable ou non autorisée.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }
      if (!foundCheckIn || foundCheckIn.organization_id !== currentOrgId) {
        setError("État des lieux de départ lié introuvable ou non autorisé.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      const foundVehicle = allVehicles.find(v => v.id === foundReservation.vehicle_id);
      const foundClient = allClients.find(c => c.id === foundReservation.client_id);
      if (!foundVehicle || !foundClient) {
        setError("Impossible de charger le véhicule ou le client.");
        setTimeout(() => navigate(createPageUrl("Reservations")), 2000);
        return;
      }

      setReservation(foundReservation);
      setCheckIn(foundCheckIn);
      setCheckOut(foundCheckOut);
      setVehicle(foundVehicle);
      setClient(foundClient);
    } catch (e) {
      console.error("Erreur lors du chargement:", e);
      setError("Erreur lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Erreur</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
            <Link to={createPageUrl("Reservations")}><Button className="rounded-full min-h-[44px]">Retour aux réservations</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!checkOut || !checkIn || !reservation || !vehicle || !client) return null;

  // Calculs
  const kmDifference = (checkOut.mileage_end || 0) - (checkIn.mileage_start || 0);
  const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || "18:00"}`);
  const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || "18:00"}`);
  const hours = Math.max(0, differenceInHours(endDateTime, startDateTime));
  const rentalDays = Math.max(1, Math.ceil(hours / 24));

  const includedKm = rentalDays * (vehicle.daily_km_included || 200);
  const extraKm = Math.max(0, kmDifference - includedKm);
  const extraKmCost = extraKm * (vehicle.price_per_extra_km || 1.0);

  const totalAdditionalFees = checkOut.additionalFees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
  const totalCost = (reservation.estimated_price || 0) + extraKmCost + totalAdditionalFees;

  return (
    <div
      className="
        min-h-screen p-3 sm:p-4
        pt-[env(safe-area-inset-top)] pb-[calc(env(safe-area-inset-bottom)+16px)]
        bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50
        dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900
      "
    >
      <div className="max-w-4xl mx-auto">
        {/* Retour sticky */}
        <div className="sticky top-[env(safe-area-inset-top)] z-20 -mx-3 sm:mx-0 mb-3">
          <div className="px-3 sm:px-0 backdrop-blur-md bg-background/40">
            <Button
              onClick={() => window.history.back()}
              variant="ghost"
              size="sm"
              className="h-11 px-3 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
          </div>
        </div>

        {/* Titre / date */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg mb-4 rounded-2xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg text-center text-slate-900 dark:text-slate-100">
              État des lieux de retour
            </CardTitle>
            <div className="mt-2 flex items-center justify-center">
              <Badge className="rounded-full whitespace-nowrap px-2.5 py-1 text-[11px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                Effectué le {format(parseISO(checkOut.performed_at), "d MMM yyyy à HH:mm", { locale: fr })}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Infos réservation */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg mb-4 rounded-2xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">Informations de la location</CardTitle>
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
                <p className="font-semibold text-slate-900 dark:text-slate-100">{vehicle?.make} {vehicle?.model} — {vehicle?.plate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Période</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {format(parseISO(reservation.start_date), "d MMM", { locale: fr })} au{" "}
                  {format(parseISO(reservation.end_date), "d MMM yyyy", { locale: fr })} ({rentalDays} jour{rentalDays>1?'s':''})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kilométrage */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg mb-4 rounded-2xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-5 h-5" />
              Kilométrage
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Départ</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{(checkIn.mileage_start||0).toLocaleString()} km</p>
              </div>
              <div className="p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Retour</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{(checkOut.mileage_end||0).toLocaleString()} km</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-center">
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-1">Parcouru</p>
                <p className="font-semibold text-blue-700 dark:text-blue-300">{kmDifference.toLocaleString()} km</p>
              </div>
            </div>

            {extraKm > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-700/60 rounded-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-200">Dépassement kilométrique</p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Inclus : {includedKm.toLocaleString()} km • Dépassement : {extraKm.toLocaleString()} km
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-600 dark:text-red-300">{formatCurrency(extraKmCost, currency)}</p>
                    <p className="text-[11px] text-red-500 dark:text-red-400">
                      {formatCurrency(vehicle.price_per_extra_km || 0, currency)}/km
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carburant */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg mb-4 rounded-2xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Fuel className="w-5 h-5" />
              Niveau de carburant
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Départ</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{checkIn.fuel_level}</p>
              </div>
              <div className="p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Retour</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{checkOut.fuel_level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos */}
        {checkOut.photos?.length > 0 && (
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg mb-4 rounded-2xl">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <ImageIcon className="w-5 h-5" />
                Photos ({checkOut.photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {checkOut.photos.map((photo, i) => (
                  <div key={i} className="relative">
                    <img
                      src={photo.url}
                      alt={photo.label || `Photo ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="aspect-[4/3] w-full object-cover rounded-xl border border-white/40 dark:border-slate-700/40"
                    />
                    {photo.label && (
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[11px] px-2 py-1 rounded-b-xl">
                        {photo.label}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Nouveaux dégâts */}
        {checkOut.damages?.length > 0 && (
          <Card className="bg-red-50/60 dark:bg-red-950/40 backdrop-blur-md border-red-200/60 dark:border-red-700/60 shadow-lg mb-4 rounded-2xl">
            <CardHeader className="p-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertTriangle className="w-5 h-5" />
                Nouveaux dégâts signalés ({checkOut.damages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {checkOut.damages.map((damage, index) => (
                  <details key={index} className="rounded-xl bg-white/70 dark:bg-slate-700/70 border border-red-200 dark:border-red-700/60 p-3">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{damage.type} — {damage.location}</span>
                      <Badge className={`rounded-full text-[11px] whitespace-nowrap ${
                        damage.severity === "leger"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                          : damage.severity === "moyen"
                          ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                      }`}>
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

        {/* Récapitulatif financier */}
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border-white/30 dark:border-slate-700/30 shadow-lg rounded-2xl">
          <CardHeader className="p-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <DollarSign className="w-5 h-5" />
              Récapitulatif financier
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Tarif location</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {formatCurrency(reservation.estimated_price || 0, currency)}
              </span>
            </div>

            {extraKm > 0 && (
              <div className="flex justify-between text-sm text-orange-700 dark:text-orange-400">
                <span>Kilomètres supplémentaires ({extraKm.toLocaleString()} km)</span>
                <span className="font-semibold whitespace-nowrap">{formatCurrency(extraKmCost, currency)}</span>
              </div>
            )}

            {checkOut.additionalFees?.map((fee, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">{fee.label}</span>
                <span className="font-semibold whitespace-nowrap">{formatCurrency(fee.amount || 0, currency)}</span>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between">
              <span className="font-bold text-lg">TOTAL</span>
              <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                {formatCurrency(totalCost, currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
