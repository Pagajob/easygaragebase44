
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Car, User, Clock, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, getDay, startOfWeek, endOfWeek, isWithinInterval, differenceInDays, addDays, isBefore, isAfter } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  brouillon: "bg-gray-400",
  confirmee: "bg-blue-500",
  annulee: "bg-red-400",
  a_checker: "bg-orange-500",
  checked_in: "bg-green-500",
  terminee: "bg-slate-400"
};

const statusLabels = {
  brouillon: "Brouillon",
  confirmee: "Confirmée",
  annulee: "Annulée",
  a_checker: "À checker",
  checked_in: "Checked-in",
  terminee: "Terminée"
};

export default function ReservationsCalendar({
  reservations,
  vehicles,
  clients,
  isLoading,
  onEdit,
  onAdd
}) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [expandedWeeks, setExpandedWeeks] = React.useState(new Set()); // New state to track expanded weeks

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  for (let i = 0; i < daysInMonth.length; i += 7) {
    weeks.push(daysInMonth.slice(i, i + 7));
  }

  const getVehicle = (vehicleId) => vehicles.find((v) => v.id === vehicleId);
  const getClient = (clientId) => clients.find((c) => c.id === clientId);

  const goToPreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
    setExpandedWeeks(new Set()); // Reset expanded weeks when changing month
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
    setExpandedWeeks(new Set()); // Reset expanded weeks when changing month
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setExpandedWeeks(new Set()); // Reset expanded weeks
  };

  // Function to toggle the expansion state of a week
  const toggleWeekExpansion = (weekIndex) => {
    setExpandedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekIndex)) {
        newSet.delete(weekIndex);
      } else {
        newSet.add(weekIndex);
      }
      return newSet;
    });
  };

  // Calculer les réservations qui s'étendent sur la période visible
  const getReservationBars = (week) => {
    const bars = [];

    reservations.forEach((reservation) => {
      const startDate = parseISO(reservation.start_date);
      const endDate = parseISO(reservation.end_date);
      const vehicle = getVehicle(reservation.vehicle_id);
      const client = getClient(reservation.client_id);

      // Vérifier si la réservation chevauche cette semaine
      const weekStart = week[0];
      const weekEnd = week[6];

      if (isAfter(startDate, weekEnd) || isBefore(endDate, weekStart)) {
        return; // Pas dans cette semaine
      }

      // Calculer la position et la largeur
      const barStart = isBefore(startDate, weekStart) ? 0 : week.findIndex((day) => isSameDay(day, startDate));
      const barEnd = isAfter(endDate, weekEnd) ? 6 : week.findIndex((day) => isSameDay(day, endDate));

      // Ensure barStart and barEnd are valid indices within the week (0-6)
      if (barStart === -1 || barEnd === -1) {
        // This case should ideally not happen if the reservation overlaps the week
        // but can be a safeguard for specific edge cases or date-fns behavior
        return;
      }

      const barWidth = barEnd - barStart + 1;

      bars.push({
        reservation,
        vehicle,
        client,
        startCol: barStart,
        width: barWidth,
        continuesPrevious: isBefore(startDate, weekStart),
        continuesNext: isAfter(endDate, weekEnd)
      });
    });

    return bars;
  };

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) =>
            <Skeleton key={i} className="h-24 rounded-lg" />
            )}
          </div>
        </CardContent>
      </Card>);

  }

  const MAX_VISIBLE_BARS = 2; // Nombre maximum de barres visibles par semaine
  const BAR_HEIGHT = 24; // Height of each reservation bar or expand/collapse button

  return (
    <Card className="text-card-foreground bg-transparent backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-full h-9 w-9 flex-shrink-0 dark:text-slate-100">


            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex flex-col items-center flex-1">
            <CardTitle className="tracking-tight text-lg font-bold text-center dark:text-slate-100">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday} className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground text-xs h-6 px-2 mt-1 rounded-full dark:text-slate-300">


              Aujourd'hui
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth} className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground rounded-full h-9 w-9 flex-shrink-0 dark:text-slate-100">


            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-2">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) =>
          <div key={i} className="text-center text-xs font-semibold text-slate-600 py-1">
              {day}
            </div>
          )}
        </div>

        {/* Grille du calendrier par semaine */}
        <div className="space-y-2">
          {weeks.map((week, weekIndex) => {
            const reservationBars = getReservationBars(week);
            const isExpanded = expandedWeeks.has(weekIndex);
            const displayedBars = isExpanded ? reservationBars : reservationBars.slice(0, MAX_VISIBLE_BARS);
            const hiddenCount = reservationBars.length - MAX_VISIBLE_BARS;

            // Calculate dynamic height for the overlay based on expanded state and number of reservations
            const overlayHeight = isExpanded ?
            reservationBars.length * BAR_HEIGHT + (reservationBars.length > MAX_VISIBLE_BARS ? BAR_HEIGHT : 0) // All bars + "Réduire" button if more than MAX_VISIBLE_BARS
            : MAX_VISIBLE_BARS * BAR_HEIGHT + (hiddenCount > 0 ? BAR_HEIGHT : 0); // MAX_VISIBLE_BARS + "+X autres" button if hiddenCount > 0

            return (
              <div
                key={weekIndex}
                className="relative"
                style={{
                  marginBottom: isExpanded && reservationBars.length > MAX_VISIBLE_BARS ?
                  `${(reservationBars.length - MAX_VISIBLE_BARS + 1) * BAR_HEIGHT}px` :
                  '0'
                }}>

                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-1">
                  {week.map((date, dayIndex) => {
                    const isToday = isSameDay(date, new Date());
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

                    return (
                      <div
                        key={date.toISOString()} className="h-20 p-1 border rounded-lg transition-all bg-slate-100/10 border-slate-300/40 hover:bg-white/70"







                        onClick={() => onAdd(date)}>

                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">








                          {format(date, 'd')}
                        </div>
                      </div>);

                  })}
                </div>

                {/* Barres de réservation en overlay */}
                <div
                  className="absolute top-6 left-0 right-0 pointer-events-none transition-all duration-300"
                  style={{
                    height: `${overlayHeight}px`,
                    zIndex: isExpanded ? 20 : 10
                  }}>

                  {displayedBars.map((bar, barIndex) =>
                  <div
                    key={bar.reservation.id}
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: `calc(${bar.startCol * (100 / 7)}% + 2px)`,
                      width: `calc(${bar.width * (100 / 7)}% - 4px)`,
                      top: `${barIndex * BAR_HEIGHT}px`,
                      height: `${BAR_HEIGHT - 4}px` // Subtract padding/margin to stack better
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(bar.reservation);
                    }}>

                      <div className="bg-blue-500 px-2 py-0.5 rounded-[100px] h-full shadow-sm flex items-center justify-between overflow-hidden group hover:shadow-md transition-shadow">
                        <span className="text-white text-[10px] font-semibold truncate leading-tight">
                          {bar.client?.name?.split(' ')[0]} - {bar.vehicle?.make} {bar.vehicle?.model}
                        </span>
                        {bar.reservation.start_time &&
                      <span className="text-white/90 text-[9px] ml-1 flex-shrink-0">
                            {bar.reservation.start_time.substring(0, 5)}
                          </span>
                      }
                      </div>
                    </div>
                  )}
                  
                  {/* Indicateur "+X autres" si plus de réservations et non étendu */}
                  {hiddenCount > 0 && !isExpanded &&
                  <div
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: '2px',
                      right: '2px',
                      top: `${MAX_VISIBLE_BARS * BAR_HEIGHT}px`, // Position after MAX_VISIBLE_BARS
                      height: `${BAR_HEIGHT - 4}px`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWeekExpansion(weekIndex);
                    }}>

                      <div className="bg-slate-300 px-2 py-0.5 rounded-[100px] h-full shadow-sm flex items-center justify-center hover:bg-slate-400 transition-colors">
                        <span className="text-slate-700 text-[10px] font-semibold">
                          +{hiddenCount} autre{hiddenCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  }
                  
                  {/* Bouton "Réduire" si étendu et qu'il y avait des réservations cachées */}
                  {isExpanded && reservationBars.length > MAX_VISIBLE_BARS &&
                  <div
                    className="absolute pointer-events-auto cursor-pointer"
                    style={{
                      left: '2px',
                      right: '2px',
                      top: `${reservationBars.length * BAR_HEIGHT}px`, // Position after all bars
                      height: `${BAR_HEIGHT - 4}px`
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWeekExpansion(weekIndex);
                    }}>

                      <div className="bg-slate-400 px-2 py-0.5 rounded-[100px] h-full shadow-sm flex items-center justify-center hover:bg-slate-500 transition-colors">
                        <span className="text-white text-[10px] font-semibold">
                          Réduire ▲
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>);

          })}
        </div>
        
        {/* Légende */}
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex flex-wrap gap-2 justify-center">
            <div className="flex items-center gap-1 text-[10px]">
              <div className="bg-blue-500 rounded-[100px] w-3 h-3" />
              <span className="text-slate-600 dark:text-slate-100">Confirmée</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="bg-green-500 rounded-[100px] w-3 h-3" />
              <span className="text-slate-600 dark:text-slate-100">Checked-in</span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <div className="bg-orange-500 rounded-[100px] w-3 h-3" />
              <span className="text-slate-600 dark:text-slate-100">À checker</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>);

}