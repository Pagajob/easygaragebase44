
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car,
  MapPin,
  Building,
  ChevronLeft,
  AlertTriangle,
  Fuel,
  Gauge,
  Calendar
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";

export default function GaragePage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const organizationId = params.get('id');

  const [organization, setOrganization] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (organizationId) {
      loadGarageData();
    } else {
      setError("Aucun garage spécifié.");
      setIsLoading(false);
    }
  }, [organizationId]);

  const loadGarageData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await base44.functions.invoke('getGarageVehicles', { id: organizationId });
      if (data.error) {
        setError(data.error);
      } else {
        setOrganization(data.organization);
        setVehicles(data.vehicles);
      }
    } catch (err) {
      setError("Une erreur est survenue lors du chargement des données du garage.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to={createPageUrl('rent')} className="flex items-center gap-3">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png" alt="EasyGarage Logo" className="w-8 h-8 rounded-lg shadow-md" />
          <span className="text-white font-bold text-xl">EasyGarage Marketplace</span>
        </Link>
      </div>
    </div>
  );

  const renderVehicleCard = (vehicle) => (
    <Card key={vehicle.id} className="bg-slate-800/50 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1">
      <Link to={createPageUrl(`RentDetail?id=${vehicle.id}`)}>
        <CardContent className="p-0">
          <div className="aspect-[16/10] bg-slate-700 overflow-hidden">
            {vehicle.cover_image_url ? (
              <img src={vehicle.cover_image_url} alt={vehicle.public_title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Car className="w-16 h-16 text-slate-500" />
              </div>
            )}
          </div>
          <div className="p-4 space-y-3">
            <h3 className="font-bold text-lg text-white truncate">{vehicle.public_title}</h3>
            <div className="flex items-center justify-between text-sm">
              <Badge variant="secondary" className="bg-slate-700/50 text-purple-300 border-purple-400/20">
                <Calendar className="w-3.5 h-3.5 mr-1.5" /> {vehicle.year}
              </Badge>
              <div className="text-right">
                <p className="font-bold text-xl text-white">{vehicle.daily_price_eur}€</p>
                <p className="text-xs text-slate-400">/ jour</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl bg-slate-800/50" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-800/30 rounded-2xl">
          <AlertTriangle className="w-16 h-16 text-orange-400 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops, une erreur !</h2>
          <p className="text-slate-400 max-w-md">{error}</p>
        </div>
      );
    }
    
    if (!organization) {
         return null; // Should be covered by error state
    }

    return (
      <>
        {/* Garage Header */}
        <div className="bg-slate-800/50 backdrop-blur-lg border border-white/10 p-6 rounded-3xl mb-8 flex flex-col sm:flex-row items-center gap-6">
          {organization.logo_url ? (
            <img src={organization.logo_url} alt={`Logo de ${organization.name}`} className="w-24 h-24 rounded-full object-cover border-4 border-slate-700 flex-shrink-0" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Building className="w-12 h-12 text-slate-500" />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold text-white mb-1">{organization.name}</h1>
            {organization.address && (
              <p className="flex items-center justify-center sm:justify-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-purple-300" />
                {organization.address}
              </p>
            )}
          </div>
           <Button asChild variant="outline" className="rounded-full border-white/20 text-black hover:bg-white/10 ml-auto flex-shrink-0 mt-4 sm:mt-0">
            <Link to={createPageUrl('rent')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour à la Marketplace
            </Link>
          </Button>
        </div>
        
        {/* Vehicle List */}
        {vehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map(renderVehicleCard)}
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center text-center py-20 bg-slate-800/30 rounded-2xl">
              <Car className="w-16 h-16 text-slate-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Aucun véhicule disponible</h2>
              <p className="text-slate-400 max-w-md">Ce garage ne propose aucun véhicule sur la marketplace pour le moment.</p>
            </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col">
      {renderHeader()}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}
