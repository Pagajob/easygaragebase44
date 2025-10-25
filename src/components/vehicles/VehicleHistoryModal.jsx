
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  User,
  FileText,
  Gauge,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

export default function VehicleHistoryModal({
  isOpen,
  onClose,
  vehicle,
  reservations: allReservations, // Use alias to avoid conflict if `reservations` is used internally
  checkIns,
  checkOuts,
  clients: allClients // Use alias to avoid conflict if `clients` is used internally
}) {
  // Filtrer les réservations pour ce véhicule uniquement
  const filteredReservations = allReservations?.filter((r) => r.vehicle_id === vehicle.id) || [];

  const getClient = (clientId) => allClients?.find((c) => c.id === clientId);

  // Prepare history items with associated check-ins/outs
  const historyItems = filteredReservations.map(reservation => {
    const associatedCheckIn = checkIns?.find(ci => ci.reservation_id === reservation.id);
    const associatedCheckOut = checkOuts?.find(co => co.reservation_id === reservation.id);
    return {
      reservation,
      checkIn: associatedCheckIn,
      checkOut: associatedCheckOut,
    };
  });

  // Sort by reservation start date, descending
  const sortedHistory = historyItems.sort((a, b) =>
    parseISO(b.reservation.start_date).getTime() - parseISO(a.reservation.start_date).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-slate-200">
          <DialogTitle className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Historique des locations
              </h2>
              <p className="text-sm text-slate-500">
                {vehicle.make} {vehicle.model} ({vehicle.plate})
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>Aucun historique disponible pour ce véhicule</p>
            </div>
          ) : (
            sortedHistory.map((item) => {
              const client = getClient(item.reservation.client_id);
              const checkIn = item.checkIn;
              const checkOut = item.checkOut;

              return (
                <Card key={item.reservation.id} className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/30 dark:border-slate-700/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {format(parseISO(item.reservation.start_date), "d MMM yyyy", { locale: fr })}
                            {" → "}
                            {format(parseISO(item.reservation.end_date), "d MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        {client && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <User className="w-4 h-4" />
                            <span>{client.name}</span>
                          </div>
                        )}
                        {item.reservation.type && (
                          <Badge className={`mt-2 ${
                            item.reservation.type === 'location'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100'
                              : 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'
                          }`}>
                            {item.reservation.type === 'location' ? 'Location' : 'Prêt'}
                          </Badge>
                        )}
                      </div>
                      <Badge className={`${
                        item.reservation.status === 'terminee' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100' :
                        item.reservation.status === 'checked_in' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100' :
                        item.reservation.status === 'confirmee' ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-100' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {item.reservation.status}
                      </Badge>
                    </div>

                    {/* Kilomètres */}
                    {(checkIn || checkOut) && (
                      <div className="flex items-center gap-4 mb-3 text-sm">
                        {checkIn && (
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-600 dark:text-slate-400">Départ: {checkIn.mileage_start?.toLocaleString()} km</span>
                          </div>
                        )}
                        {checkOut && (
                          <div className="flex items-center gap-2">
                            <Gauge className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-600 dark:text-slate-400">Retour: {checkOut.mileage_end?.toLocaleString()} km</span>
                          </div>
                        )}
                        {checkIn && checkOut && checkIn.mileage_start != null && checkOut.mileage_end != null && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">
                            +{(checkOut.mileage_end - checkIn.mileage_start).toLocaleString()} km
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                      <Link to={createPageUrl(`ViewContract?id=${item.reservation.id}`)}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Voir le contrat
                        </Button>
                      </Link>

                      {checkIn && (
                        <Link to={createPageUrl(`ViewCheckIn?id=${checkIn.id}`)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <ArrowDownCircle className="w-3 h-3 mr-1" />
                            EDL départ
                          </Button>
                        </Link>
                      )}

                      {checkOut && (
                        <Link to={createPageUrl(`ViewCheckOut?id=${checkOut.id}`)}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <ArrowUpCircle className="w-3 h-3 mr-1" />
                            EDL retour
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
