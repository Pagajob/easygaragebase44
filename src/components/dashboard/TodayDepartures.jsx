
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, User, Car, MapPin, ArrowRight } from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodayDepartures({
  reservations,
  vehicles,
  clients,
  checkIns,
  isLoading
}) {
  const todayDepartures = reservations.filter((r) =>
    isToday(parseISO(r.start_date)) &&
    r.status !== 'annulee' &&
    r.status !== 'checked_in' &&
    r.status !== 'terminee'
  );

  const getVehicle = (vehicleId) => vehicles.find((v) => v.id === vehicleId);
  const getClient = (clientId) => clients.find((c) => c.id === clientId);
  const getCheckInForReservation = (reservationId) =>
    checkIns?.find((ci) => ci.reservation_id === reservationId);

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Départs du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) =>
            <div key={i} className="flex items-center space-x-4 p-4 bg-white/30 border border-white/20 rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          )}
        </CardContent>
      </Card>);

  }

  return (
    <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-xl">🚀</span>
          Départs du jour ({todayDepartures.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayDepartures.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium dark:text-slate-800">Aucun départ aujourd'hui</p>
            <p className="text-sm mt-1 dark:text-slate-800">Pas de check-in prévu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayDepartures.map((reservation) => {
              const vehicle = getVehicle(reservation.vehicle_id);
              const client = getClient(reservation.client_id);
              const checkIn = getCheckInForReservation(reservation.id);

              return (
                <div key={reservation.id} className="flex items-center justify-between p-4 bg-white/40 border border-white/20 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {reservation.start_time || '9:00'}
                        </p>
                        {checkIn && (
                          <Badge className="bg-green-100 text-green-800 rounded-full text-xs">
                            Effectué
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="truncate">{client?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          <span className="truncate">{vehicle?.make} {vehicle?.model}</span>
                        </div>
                        {reservation.pickup_location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{reservation.pickup_location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {checkIn ? (
                    <Link to={createPageUrl(`ViewCheckIn?id=${checkIn.id}`)}>
                      <Button size="sm" variant="outline" className="rounded-full flex-shrink-0">
                        Voir EDL
                      </Button>
                    </Link>
                  ) : (
                    <Link to={createPageUrl(`CheckIn?reservation=${reservation.id}`)}>
                      <Button size="sm" className="rounded-full flex-shrink-0">
                        EDL départ
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
