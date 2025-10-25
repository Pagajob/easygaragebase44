import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Car, Calendar, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

export default function CheckOutStep1({ reservation, vehicle, client, checkIn, onNext }) {
  if (!reservation || !vehicle || !client || !checkIn) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Chargement des informations...</p>
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Informations EDL de départ */}
      <Card className="rounded-lg bg-green-50/70 text-card-foreground rounded-xl border backdrop-blur-lg border-green-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="w-5 h-5" />
            EDL de départ effectué
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-800">
          <p>✓ Kilométrage départ: {checkIn.mileage_start?.toLocaleString() || 0} km</p>
          <p>✓ Carburant départ: {checkIn.fuel_level}</p>
          <p>✓ {checkIn.photos?.length || 0} photos prises</p>
          <p>✓ {checkIn.damages?.length || 0} défaut(s) signalé(s)</p>
        </CardContent>
      </Card>

      {/* Informations client */}
      <Card className="rounded-lg bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <p className="text-slate-600 text-sm">{client.email}</p>
              <p className="text-slate-600 text-sm">{client.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations véhicule */}
      <Card className="rounded-lg bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Véhicule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-32 h-24 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              {vehicle.photo_url ?
              <img src={vehicle.photo_url} alt="Véhicule" className="w-full h-full object-cover" /> :

              <Car className="w-12 h-12 text-slate-400" />
              }
            </div>
            <div>
              <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
              <p className="text-slate-600 font-mono">{vehicle.plate}</p>
              <p className="text-slate-500 text-sm mt-1">
                {vehicle.year} • {vehicle.fuel_type}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations réservation */}
      <Card className="rounded-x bg-white/70 text-card-foreground rounded-xl border backdrop-blur-lg border-white/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Période de location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>
              Du {format(parseISO(reservation.start_date), "d MMMM yyyy", { locale: fr })}
              {reservation.end_date && ` au ${format(parseISO(reservation.end_date), "d MMMM yyyy", { locale: fr })}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Bouton suivant */}
      <Button
        onClick={onNext}
        className="w-full rounded-full shadow-lg"
        size="lg">

        Commencer l'EDL de retour
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>);

}