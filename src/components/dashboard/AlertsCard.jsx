
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Clock } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlertsCard({ vehicles, reservations, isLoading }) {
  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const alerts = [];

  // Documents expirés ou bientôt expirés
  vehicles.forEach(vehicle => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (vehicle.insurance_expiry) {
      const expiryDate = parseISO(vehicle.insurance_expiry);
      if (expiryDate < thirtyDaysFromNow) {
        alerts.push({
          type: 'document',
          severity: isPast(expiryDate) ? 'critical' : 'warning',
          title: 'Assurance expirée',
          subtitle: `${vehicle.make} ${vehicle.model} (${vehicle.plate})`,
          date: expiryDate
        });
      }
    }
    
    if (vehicle.registration_expiry) {
      const expiryDate = parseISO(vehicle.registration_expiry);
      if (expiryDate < thirtyDaysFromNow) {
        alerts.push({
          type: 'document',
          severity: isPast(expiryDate) ? 'critical' : 'warning', 
          title: 'Carte grise expirée',
          subtitle: `${vehicle.make} ${vehicle.model} (${vehicle.plate})`,
          date: expiryDate
        });
      }
    }
  });

  // Check-ins en retard
  reservations.forEach(reservation => {
    if (reservation.status === 'a_checker') {
      const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '00:00'}`);
      if (isPast(startDateTime)) {
        const vehicle = vehicles.find(v => v.id === reservation.vehicle_id);
        alerts.push({
          type: 'checkin',
          severity: 'critical',
          title: 'Check-in en retard',
          subtitle: vehicle ? `${vehicle.make} ${vehicle.model}` : 'Véhicule inconnu',
          date: startDateTime
        });
      }
    }
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'checkin':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Alertes ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <p>Aucune alerte</p>
            <p className="text-sm">Tout est en ordre !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-white/30 rounded-xl border border-white/20">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(alert.severity)}`}>
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {alert.title}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {alert.subtitle}
                  </p>
                  <span className="text-xs text-slate-400">
                    {format(alert.date, "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
