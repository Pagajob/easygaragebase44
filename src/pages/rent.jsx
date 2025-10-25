
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Car,
  Mail,
  Filter,
  X,
  ArrowUpDown,
  Sparkles,
  Zap,
  Gauge,
  Fuel,
  Info
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { estimatePrice } from "../components/utils/pricing";
import DateTimePicker from "../components/shared/DateTimePicker";
import { addHours } from "date-fns";

export default function RentPage() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [priceEstimation, setPriceEstimation] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });

  useEffect(() => {
    loadVehicles();
  }, [pagination.page]);

  useEffect(() => {
    if (startDate && endDate) {
      const estimation = estimatePrice({
        price_day: 0, // Not used for global estimation label, `estimatePrice` should handle this internally for the display logic
        price_weekend: 0,
        startDate,
        endDate
      });
      setPriceEstimation(estimation);
    } else {
      setPriceEstimation(null);
    }
  }, [startDate, endDate]);

  const loadVehicles = async (city = selectedCity, start = startDate, end = endDate, page = pagination.page) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit
      });
      if (city) params.append('city', city);
      if (start) params.append('start', start.toISOString());
      if (end) params.append('end', end.toISOString());
      
      const result = await fetch(`/api/functions/getPublicVehicles?${params.toString()}`);
      const data = await result.json();

      setVehicles(data.vehicles || []);
      setPagination(data.pagination || { page: 1, limit: 12, total: 0, pages: 1 });
    } catch (error) {
      console.error("Erreur lors du chargement des véhicules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadVehicles(selectedCity, startDate, endDate, 1);
  };
  
  const handleStartDateChange = (date) => {
    setStartDate(date);
    // Auto-set end date to be 2 days after start date if not set or before start date
    if (!endDate || endDate <= date) {
      setEndDate(addHours(date, 48));
    }
  };

  const renderHeader = () => (
    <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-3">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png" alt="EasyGarage Logo" className="w-10 h-10 rounded-lg shadow-md" />
          <div>
            <h1 className="text-white font-bold text-2xl">EasyGarage Marketplace</h1>
            <p className="text-purple-200/70 text-sm">Trouvez le véhicule parfait pour votre prochain trajet.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {renderHeader()}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-transparent backdrop-blur-0 border-0 p-4 rounded-full mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ville */}
            <div className="relative md:col-span-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Ville"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="pl-12 h-14 rounded-full border-2 bg-white/20 dark:bg-slate-800/50 dark:border-white/10 text-base"
              />
            </div>

            {/* Dates */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
  <DateTimePicker 
    date={startDate} 
    setDate={handleStartDateChange} 
    label="Départ" 
    minDate={new Date()}
    className="rounded-full"
  />
  <DateTimePicker 
    date={endDate} 
    setDate={setEndDate} 
    label="Retour"
    minDate={startDate || new Date()}
    className="rounded-full"
  />
</div>

            {/* Bouton recherche */}
            <Button
              onClick={handleSearch}
              className="h-14 md:col-span-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/30 transition-all"
            >
              <Search className="w-5 h-5 mr-2" />
              Rechercher
            </Button>
          </div>
          {priceEstimation && (
            <div className="bg-slate-700/50 p-3 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <span className="text-white font-medium">Estimation pour {priceEstimation.days} jours:</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-purple-600/30 text-purple-200 border-0">{priceEstimation.strategyLabel}</Badge>
                <span className="font-bold text-lg text-white">{priceEstimation.total}€</span>
                <span className="text-slate-400">({priceEstimation.perDay}€/j)</span>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Sorting */}
        {/* There were no explicit filters/sorting components in the original code,
            only a comment placeholder. Keeping it as a comment for future implementation. */}
        
        {/* Liste des véhicules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="bg-slate-800/50 border border-white/10 rounded-3xl overflow-hidden">
                <Skeleton className="h-56 w-full bg-white/10" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                  <Skeleton className="h-8 w-1/3 bg-white/10" />
                </CardContent>
              </Card>
            ))
          ) : vehicles.length > 0 ? (
            vehicles.map((vehicle) => {
              const estimation = startDate && endDate ? estimatePrice({ 
                  price_day: vehicle.daily_price_eur, 
                  price_weekend: vehicle.price_weekend, 
                  startDate, 
                  endDate 
              }) : null;

              return (
              <Link key={vehicle.id} to={createPageUrl(`RentDetail?id=${vehicle.id}`)}>
                <Card className="bg-slate-800/50 border border-white/10 rounded-3xl overflow-hidden group transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={vehicle.cover_image_url} alt={vehicle.public_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 right-3">
                      {vehicle.available === false ? (
                         <Badge className="bg-red-500/80 backdrop-blur-md text-white border-0">Indisponible</Badge>
                      ) : (
                        <Badge className="bg-green-500/80 backdrop-blur-md text-white border-0">Disponible</Badge>
                      )}
                    </div>
                     {vehicle.organization_logo && (
                        <img src={vehicle.organization_logo} alt="Logo loueur" className="absolute bottom-3 left-3 w-10 h-10 rounded-full object-cover border-2 border-white/20 shadow-lg"/>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-white truncate">{vehicle.public_title}</h3>
                        <p className="text-sm text-purple-300/80 flex items-center gap-1">
                          <MapPin className="w-3 h-3"/>{vehicle.city}
                        </p>
                      </div>
                      {vehicle.horsepower && (
                         <Badge variant="secondary" className="bg-white/10 text-slate-300 border-0 flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-yellow-400" /> {vehicle.horsepower} ch
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4">
                      {estimation ? (
                        <>
                          <div className="flex items-baseline gap-2">
                             <p className="text-2xl font-bold text-white">{estimation.total}€</p>
                             <p className="text-sm text-slate-400">pour {estimation.days} jours</p>
                          </div>
                          <Badge variant="secondary" className="mt-1 bg-indigo-500/20 text-indigo-300 border-0">{estimation.strategyLabel}</Badge>
                        </>
                      ) : (
                        <p className="text-2xl font-bold text-white">{vehicle.daily_price_eur}€ <span className="text-base font-normal text-slate-400">/ jour</span></p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Car className="w-20 h-20 mx-auto text-purple-400/30 mb-4" />
              <h3 className="text-xl font-bold text-white">Aucun véhicule trouvé</h3>
              <p className="text-purple-200/60">Essayez d'ajuster vos critères de recherche.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
             <div className="flex justify-center mt-12">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <Button 
                        key={page}
                        variant={pagination.page === page ? 'default' : 'ghost'}
                        onClick={() => setPagination(prev => ({...prev, page}))}
                        className="rounded-lg mx-1"
                    >
                        {page}
                    </Button>
                ))}
            </div>
        )}
      </main>
    </div>
  );
}
