
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  Car,
  Mail,
  Fuel,
  Gauge,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Zap,
  Info,
  GitCommitHorizontal,
  Sun,
  Snowflake,
  Music,
  Camera,
  CircleUser,
  Star,
  Building,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { estimatePrice } from "../components/utils/pricing";
import DateTimePicker from "../components/shared/DateTimePicker";
import VehicleAvailabilityCalendar from '../components/shared/VehicleAvailabilityCalendar'; // New import

export default function RentDetailPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const vehicleId = params.get('id');

  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [availabilityResult, setAvailabilityResult] = useState(null);
  const [priceEstimation, setPriceEstimation] = useState(null);

  useEffect(() => {
    if (vehicleId) {
      loadVehicle();
    } else {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (startDate && endDate && vehicle) {
      setAvailabilityResult(null); // Reset previous check
      const estimation = estimatePrice({
        price_day: vehicle.daily_price_eur,
        price_weekend: vehicle.price_weekend,
        startDate: startDate,
        endDate: endDate,
      });
      setPriceEstimation(estimation);
      checkAvailability();
    } else {
      setPriceEstimation(null);
      setAvailabilityResult(null);
    }
  }, [startDate, endDate, vehicle]);
  
  const checkAvailability = async () => {
     if (!startDate || !endDate || !vehicle) return;
     const result = await fetch(`/api/functions/checkVehicleAvailability?vehicle_id=${vehicle.id}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
     const data = await result.json();
     setAvailabilityResult(data);
  };

  const loadVehicle = async () => {
    try {
      setIsLoading(true);
      
      const result = await fetch(`/api/functions/getPublicVehicles?id=${vehicleId}`);
      const data = await result.json();
      
      if (data.vehicles && data.vehicles.length > 0) {
        setVehicle(data.vehicles[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du véhicule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactGarage = () => {
    if (!vehicle) return;
    
    const subject = `Demande de location - ${vehicle.public_title}`;
    const dates = startDate && endDate 
      ? `\nDates souhaitées: ${format(startDate, "d MMM yyyy 'à' HH:mm", { locale: fr })} au ${format(endDate, "d MMM yyyy 'à' HH:mm", { locale: fr })}`
      : '';
    const body = `Bonjour,\n\nJe suis intéressé(e) par la location de votre ${vehicle.public_title} (${vehicle.year}).${dates}\n\nPourriez-vous me contacter pour discuter des disponibilités ?\n\nMerci,`;
    window.location.href = `mailto:${vehicle.organization.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&bcc=reservations@easygarage.fr`;
  };
  
  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (!endDate || endDate <= date) {
      setEndDate(addHours(date, 48));
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
           <Skeleton className="h-10 w-32 mb-8 bg-white/10" />
           <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-12">
                  <Skeleton className="h-96 w-full rounded-3xl bg-white/10" />
                  <Skeleton className="h-20 w-3/4 bg-white/10" />
                  <Skeleton className="h-40 w-full bg-white/10" />
              </div>
              <div className="lg:col-span-2">
                  <Skeleton className="h-96 w-full rounded-3xl bg-white/10" />
              </div>
           </div>
        </main>
      </div>
    );
  }

  if (!vehicle) {
    return (
       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Car className="w-24 h-24 mx-auto text-purple-400/30 my-8" />
          <h1 className="text-3xl font-bold mb-4">Véhicule non trouvé</h1>
          <p className="text-purple-200/70 mb-8">Désolé, le véhicule que vous cherchez n'est pas disponible ou n'existe pas.</p>
          <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
            <Link to={createPageUrl('rent')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour à la liste
            </Link>
          </Button>
        </main>
      </div>
    );
  }
  
  const fuelTypeLabels = {
    essence: "Essence",
    diesel: "Diesel",
    electrique: "Électrique",
    hybride: "Hybride",
    gpl: "GPL"
  };

  const featureLabels = {
    gps: { label: "GPS", icon: MapPin },
    bluetooth: { label: "Bluetooth", icon: Music },
    climatisation: { label: "Climatisation", icon: Snowflake },
    siege_chauffant: { label: "Sièges chauffants", icon: Sun },
    toit_ouvrant: { label: "Toit ouvrant", icon: GitCommitHorizontal },
    camera_recul: { label: "Caméra de recul", icon: Camera },
    regulateur_vitesse: { label: "Régulateur", icon: Gauge },
    jantes_alu: { label: "Jantes alu", icon: Star }
  };
  
  // Use the 'gallery' field provided by the backend. It's already a clean array.
  const imageGallery = vehicle.gallery || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {renderHeader()}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Button asChild variant="outline" className="rounded-full border-black/20 text-black hover:bg-black/10">
            <Link to={createPageUrl('rent')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Colonne de gauche : photos et détails */}
          <div className="lg:col-span-2 space-y-12">
            {/* Galerie d'images */}
            <div className="space-y-4">
              <div className="aspect-[16/10] bg-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black/30">
                {imageGallery.length > 0 ? (
                  <img
                    src={imageGallery[selectedImage] || imageGallery[0]}
                    alt={`${vehicle.public_title} - vue ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <Car className="w-24 h-24 text-slate-500" />
                  </div>
                )}
              </div>
              {imageGallery.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                  {imageGallery.slice(0, 5).map((imgUrl, index) => (
                    <button key={index} onClick={() => setSelectedImage(index)} className={`aspect-square rounded-2xl overflow-hidden ring-2 transition-all ${selectedImage === index ? 'ring-purple-500' : 'ring-transparent hover:ring-purple-500/50'}`}>
                      <img src={imgUrl} alt={`Miniature ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Titre et tags */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white">{vehicle.public_title}</h1>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="bg-slate-700/50 text-purple-300 border-purple-400/20 text-sm">
                  <MapPin className="w-4 h-4 mr-2" /> {vehicle.city}
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-purple-300 border-purple-400/20 text-sm">
                  <CalendarIcon className="w-4 h-4 mr-2" /> {vehicle.year}
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-purple-300 border-purple-400/20 text-sm">
                  <Fuel className="w-4 h-4 mr-2" /> {fuelTypeLabels[vehicle.fuel_type] || vehicle.fuel_type}
                </Badge>
                 <Badge variant="secondary" className="bg-slate-700/50 text-purple-300 border-purple-400/20 text-sm">
                  <Zap className="w-4 h-4 mr-2" /> {vehicle.horsepower} ch
                </Badge>
              </div>
            </div>

            {/* Description */}
            {vehicle.marketplace_description && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">À propos de ce véhicule</h3>
                <p className="text-slate-300 leading-relaxed">
                  {vehicle.marketplace_description}
                </p>
              </div>
            )}
            
            {/* Équipements */}
            {vehicle.marketplace_features && vehicle.marketplace_features.length > 0 && (
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Équipements</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {vehicle.marketplace_features.map((featureKey) => {
                    const feature = featureLabels[featureKey];
                    if (!feature) return null;
                    const Icon = feature.icon;
                    return (
                      <div key={featureKey} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-full border border-white/10">
                        <Icon className="w-5 h-5 text-purple-300" />
                        <span className="text-slate-200 text-sm">{feature.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conditions */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-white mb-4">Conditions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-slate-800/50 border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Caution</p>
                      <p className="text-xl font-bold text-white">{vehicle.deposit}€</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-slate-800/50 border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Âge minimum</p>
                      <p className="text-xl font-bold text-white">{vehicle.min_driver_age} ans</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-slate-800/50 border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Gauge className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Kilométrage</p>
                      <p className="text-xl font-bold text-white">
                        {vehicle.unlimited_km ? "Illimité" : `${vehicle.daily_km_included} km/j`}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-slate-800/50 border-white/10 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-purple-400" />
                    <div>
                      <p className="font-semibold text-slate-300">Permis</p>
                      <p className="text-xl font-bold text-white">{vehicle.min_license_years} ans min.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Colonne de droite : prix et réservation */}
          <div className="space-y-6"> 
             <Card className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/30">
                <CardContent className="p-6 space-y-4">
                  <div>
                     <p className="text-sm text-slate-400">À partir de</p>
                    <p className="text-4xl font-bold text-white">{vehicle.daily_price_eur}€<span className="text-lg font-normal text-slate-300">/jour</span></p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                     <DateTimePicker 
                      date={startDate}
                      setDate={handleStartDateChange}
                      label="Départ"
                      minDate={new Date()}
                    />
                    <DateTimePicker
                      date={endDate}
                      setDate={setEndDate}
                      label="Retour"
                      minDate={startDate ? addHours(startDate, 2) : new Date()}
                    />
                  </div>
                  
                  {priceEstimation && (
                    <div className="bg-slate-700/50 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-slate-300">Estimation ({priceEstimation.days} jours)</span>
                        <span className="text-2xl font-bold text-white">{priceEstimation.total}€</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <Badge variant="secondary" className="bg-purple-600/30 text-purple-200 border-0">{priceEstimation.strategyLabel}</Badge>
                        <span className="text-slate-400">{priceEstimation.perDay}€/jour</span>
                      </div>
                    </div>
                  )}

                  {availabilityResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${availabilityResult.available ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                      {availabilityResult.available ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      <span className="text-sm font-medium">
                        {availabilityResult.available ? 'Disponible sur ces dates' : 'Indisponible sur ces dates'}
                      </span>
                    </div>
                  )}

                  <Button 
                    size="lg" 
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/40"
                    onClick={handleContactGarage}
                    disabled={!availabilityResult?.available}
                  >
                    Contacter le garage
                  </Button>
                </CardContent>
              </Card>

              {/* Proposé par section */}
              {vehicle.organization && (
                <Card className="bg-slate-800/50 backdrop-blur-lg border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building className="w-5 h-5 text-purple-400" />
                      Proposé par
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      {vehicle.organization.logo_url ? (
                        <img src={vehicle.organization.logo_url} alt={`Logo de ${vehicle.organization.name}`} className="w-12 h-12 rounded-full object-cover border-2 border-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                          <CircleUser className="w-6 h-6 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-white">{vehicle.organization.name}</h3>
                      </div>
                    </div>
                    <Button onClick={handleContactGarage} className="w-full bg-purple-600 hover:bg-purple-700 rounded-full text-white">
                      <Mail className="w-4 h-4 mr-2" />
                      Contacter le garage
                    </Button>

                    {vehicle.organization.total_vehicles_count > 1 && (
                      <Button asChild variant="outline" className="w-full mt-3 rounded-full border-white/20 text-black hover:bg-white/10">
                        <Link to={createPageUrl(`Garage?id=${vehicle.organization.id}`)}>
                          <Building className="w-4 h-4 mr-2" />
                          Voir les {vehicle.organization.total_vehicles_count} véhicules du garage
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* NOUVEAU : Calendrier de disponibilités */}
              {vehicleId && (
                <div>
                  <VehicleAvailabilityCalendar vehicleId={vehicleId} />
                </div>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}
