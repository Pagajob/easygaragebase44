import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
  startOfDay
} from 'date-fns';
import { fr } from 'date-fns/locale';

export default function VehicleAvailabilityCalendar({ vehicleId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      if (!vehicleId) return;
      
      setIsLoading(true);
      try {
        const response = await base44.functions.invoke('getVehicleBookings', { vehicleId });
        setBookings(response.data.bookings || []);
      } catch (error) {
        console.error('Erreur lors du chargement des réservations:', error);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, [vehicleId]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Vérifier si une date est réservée
  const isDateBooked = (date) => {
    const dayStart = startOfDay(date);
    return bookings.some(booking => {
      const bookingStart = startOfDay(parseISO(booking.start));
      const bookingEnd = startOfDay(parseISO(booking.end));
      return isWithinInterval(dayStart, { start: bookingStart, end: bookingEnd });
    });
  };

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Jours de la semaine
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Obtenir le jour de la semaine (0 = dimanche, ajuster pour lundi = 0)
  const getWeekDay = (date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };

  // Padding pour aligner les jours
  const startPadding = getWeekDay(monthStart);
  const paddingDays = Array(startPadding).fill(null);

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 backdrop-blur-lg border border-white/10">
        <CardHeader>
          <CardTitle className="text-white"></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            Chargement...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/50 backdrop-blur-lg border border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <CalendarIcon className="w-5 h-5" />
            Dispo
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white font-medium min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="text-white hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* En-têtes des jours */}
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-slate-400 py-2"
            >
              {day}
            </div>
          ))}

          {/* Padding pour aligner les jours */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} />
          ))}

          {/* Jours du mois */}
          {days.map((day) => {
            const isBooked = isDateBooked(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm
                  ${isBooked 
                    ? 'bg-red-500/20 text-red-400 line-through cursor-not-allowed' 
                    : 'bg-white/5 text-white hover:bg-white/10'
                  }
                  ${isToday && !isBooked ? 'ring-2 ring-purple-500' : ''}
                  ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                `}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500/20 rounded border border-red-500/50"></div>
            <span className="text-slate-400">Réservé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/5 rounded border border-white/20"></div>
            <span className="text-slate-400">Disponible</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}