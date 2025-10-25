
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Car,
  User,
  Trash2,
  Clock,
  FileText,
  ClipboardCheck,
  LogOut,
  Eye } from
"lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LoadingSpinner from "../shared/LoadingSpinner";
import { downloadCheckInReport } from "../checkin/CheckInReportGenerator";
import { generateCheckOutReportHTML } from "../checkout/CheckOutReportGenerator"; // Updated import
import { base44 } from "@/api/base44Client";

const statusColors = {
  brouillon: "bg-gray-100 text-gray-800",
  confirmee: "bg-blue-100 text-blue-800",
  annulee: "bg-red-100 text-red-800",
  a_checker: "bg-orange-100 text-orange-800",
  checked_in: "bg-green-100 text-green-800",
  terminee: "bg-slate-100 text-slate-800"
};

const statusLabels = {
  brouillon: "Brouillon",
  confirmee: "Confirmée",
  annulee: "Annulée",
  a_checker: "À checker",
  checked_in: "Checked-in",
  terminee: "Terminée"
};

export default function ReservationsList({
  reservations,
  vehicles,
  clients,
  checkIns,
  checkOuts,
  isLoading,
  onEdit,
  onDelete,
  onGenerateContract
}) {
  const getVehicle = (vehicleId) => vehicles.find((v) => v.id === vehicleId);
  const getClient = (clientId) => clients.find((c) => c.id === clientId);
  const getCheckIn = (reservationId) => checkIns?.find((ci) => ci.reservation_id === reservationId);
  const getCheckOut = (reservationId) => checkOuts?.find((co) => co.reservation_id === reservationId);
  const hasCheckIn = (reservationId) => !!getCheckIn(reservationId);
  const hasCheckOut = (reservationId) => !!getCheckOut(reservationId);

  const handleViewCheckIn = async (e, reservation) => {
    e.stopPropagation();

    try {
      const vehicle = getVehicle(reservation.vehicle_id);
      const client = getClient(reservation.client_id);
      const checkIn = getCheckIn(reservation.id);

      if (!checkIn) {
        alert("EDL de départ non trouvé");
        return;
      }

      // Charger l'organization
      const orgs = await base44.entities.Organization.filter({ id: reservation.organization_id });
      const organization = orgs.length > 0 ? orgs[0] : null;

      await downloadCheckInReport(reservation, vehicle, client, organization, checkIn);
    } catch (error) {
      console.error("Erreur lors de l'ouverture de l'EDL départ:", error);
      alert("Erreur lors de l'ouverture de l'EDL de départ");
    }
  };

  const handleViewCheckOut = async (e, reservation) => {
    e.stopPropagation();

    try {
      const vehicle = getVehicle(reservation.vehicle_id);
      const client = getClient(reservation.client_id);
      const checkIn = getCheckIn(reservation.id);
      const checkOut = getCheckOut(reservation.id);

      if (!checkOut) {
        alert("EDL de retour non trouvé");
        return;
      }

      // Charger l'organization
      const orgs = await base44.entities.Organization.filter({ id: reservation.organization_id });
      const organization = orgs.length > 0 ? orgs[0] : null;

      // Ouvrir l'HTML dans un nouvel onglet
      const html = generateCheckOutReportHTML(reservation, vehicle, client, organization, checkIn, checkOut);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      } else {
        alert("Veuillez autoriser les pop-ups pour visualiser l'EDL");
      }
    } catch (error) {
      console.error("[components/reservations/ReservationsList.js] Erreur lors de l'ouverture de l'EDL retour:", error);
      alert("Erreur lors de l'ouverture de l'EDL de retour");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardContent className="py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>);

  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2 dark:text-white mb-">Aucune réservation trouvée

        </h3>
        <p className="text-slate-500">
          Commencez par créer votre première réservation.
        </p>
      </div>);

  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => {
        const vehicle = getVehicle(reservation.vehicle_id);
        const client = getClient(reservation.client_id);
        const hasCheckedIn = hasCheckIn(reservation.id);
        const hasCheckedOut = hasCheckOut(reservation.id);

        return (
          <Card
            key={reservation.id}
            className="overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl cursor-pointer"
            onClick={() => onEdit(reservation)}>

            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Header avec infos principales */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                          {reservation.type === 'pret' ? '🤝' : '📋'} #{reservation.id.slice(-8)}
                        </h3>
                        <Badge className={`${statusColors[reservation.status]} rounded-full border-none text-xs px-2 py-0`}>
                          {statusLabels[reservation.status]}
                        </Badge>
                        {reservation.type === 'pret' &&
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full border-none text-xs px-2 py-0">
                            Prêt
                          </Badge>
                        }
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-900/50 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(reservation.id);
                    }}>

                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Détails */}
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{client?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Car className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{vehicle?.make} {vehicle?.model} ({vehicle?.plate})</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {format(parseISO(reservation.start_date), "d MMM", { locale: fr })} au{" "}
                      {format(parseISO(reservation.end_date), "d MMM yyyy", { locale: fr })}
                    </span>
                  </div>

                  {reservation.start_time &&
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span>{reservation.start_time}</span>
                    </div>
                  }
                </div>

                {/* Boutons d'action */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm" className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground px-3 rounded-full bg-white/50 dark:bg-slate-700/50 text-xs h-9 dark:text-slate-100"

                    onClick={(e) => {
                      e.stopPropagation();
                      onGenerateContract(reservation);
                    }}>

                    <FileText className="w-3 h-3 mr-1" />
                    Contrat
                  </Button>
                  
                  {/* Logique des boutons EDL */}
                  {!hasCheckedIn ?
                  // Pas encore d'EDL départ
                  <Link
                    to={createPageUrl(`CheckIn?reservation=${reservation.id}`)}
                    onClick={(e) => e.stopPropagation()}>

                      <Button
                      variant="outline"
                      size="sm" className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground px-3 rounded-full bg-white/50 dark:bg-slate-700/50 text-xs h-9 w-full dark:text-slate-100">


                        <ClipboardCheck className="w-3 h-3 mr-1" />
                        EDL départ
                      </Button>
                    </Link> :
                  !hasCheckedOut ?
                  // EDL départ fait, mais pas encore de retour
                  <Link
                    to={createPageUrl(`CheckOut?reservation=${reservation.id}`)}
                    onClick={(e) => e.stopPropagation()}>

                      <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 text-xs h-9 w-full">

                        <LogOut className="w-3 h-3 mr-1" />
                        EDL retour
                      </Button>
                    </Link> :

                  // Les deux EDL sont complétés - afficher les boutons de consultation
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                      <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs h-9 w-full"
                      onClick={(e) => handleViewCheckIn(e, reservation)}>

                        <Eye className="w-3 h-3 mr-1" />
                        EDL départ
                      </Button>
                      <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-xs h-9 w-full"
                      onClick={(e) => handleViewCheckOut(e, reservation)}>

                        <Eye className="w-3 h-3 mr-1" />
                        EDL retour
                      </Button>
                    </div>
                  }
                </div>
              </div>
            </CardContent>
          </Card>);

      })}
    </div>);

}