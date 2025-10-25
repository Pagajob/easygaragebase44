import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Calendar, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  confirmee: "bg-blue-100 text-blue-800",
  checked_in: "bg-green-100 text-green-800",
  annulee: "bg-red-100 text-red-800",
  brouillon: "bg-gray-100 text-gray-800"
};

export default function RecentActivity({
  reservations,
  checkIns,
  vehicles,
  clients,
  isLoading
}) {
  const getVehicle = (vehicleId) => vehicles.find((v) => v.id === vehicleId);
  const getClient = (clientId) => clients.find((c) => c.id === clientId);

  // Combine and sort recent activities
  const recentActivities = [
  ...reservations.slice(0, 10).map((r) => ({
    type: 'reservation',
    id: r.id,
    date: r.created_date,
    reservation: r
  })),
  ...checkIns.slice(0, 10).map((c) => ({
    type: 'checkin',
    id: c.id,
    date: c.performed_at || c.created_date,
    checkIn: c
  }))].
  sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Activité récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {[1, 2, 3].map((i) =>
            <div key={i} className="flex-shrink-0 w-[280px] snap-start">
                <div className="flex items-center space-x-3 p-4 bg-white/30 border border-white/20 rounded-xl">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 dark:text-slate-900">🕤
Activité récente

        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ?
        <div className="text-center py-6 text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p className="mb- mb- mb- mb- mb- mb- text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 dark:text-slate-900">Aucune activité récente</p>
          </div> :

        <div className="relative">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
              {recentActivities.map((activity) => {
              if (activity.type === 'reservation') {
                const vehicle = getVehicle(activity.reservation.vehicle_id);
                const client = getClient(activity.reservation.client_id);

                return (
                  <div key={activity.id} className="flex-shrink-0 w-[280px] snap-start">
                      <div className="flex items-start space-x-3 p-4 bg-white/40 border border-white/20 rounded-xl hover:shadow-md transition-shadow h-full">
                        <div className="bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            Nouvelle réservation
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {client?.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {vehicle?.make} {vehicle?.model}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                            variant="secondary"
                            className={`${statusColors[activity.reservation.status]} rounded-full px-2 py-0.5 text-xs`}>

                              {activity.reservation.status}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {format(parseISO(activity.date), "d MMM HH:mm", { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>);

              } else {
                const reservation = reservations.find((r) => r.id === activity.checkIn.reservation_id);
                const vehicle = reservation ? getVehicle(reservation.vehicle_id) : null;
                const client = reservation ? getClient(reservation.client_id) : null;

                return (
                  <div key={activity.id} className="flex-shrink-0 w-[280px] snap-start">
                      <div className="bg-white/40 pt-4 pr-4 pb-4 pl-4 rounded-xl flex items-start space-x-3 border border-white/20 hover:shadow-md transition-shadow h-full">
                        <div className="bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            Check-in effectué
                          </p>
                          <p className="text-sm text-slate-500 truncate">
                            {client?.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {vehicle?.make} {vehicle?.model}
                          </p>
                          <span className="text-xs text-slate-400 block mt-2 dark:text-black mb-">
                            {format(parseISO(activity.date), "d MMM HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>);

              }
            })}
            </div>
            {recentActivities.length > 1 &&
          <div className="text-center mt-2">
                <span className="text-xs text-slate-400 dark:text-black mb-">← Faites glisser pour voir plus →</span>
              </div>
          }
          </div>
        }
      </CardContent>
    </Card>);

}