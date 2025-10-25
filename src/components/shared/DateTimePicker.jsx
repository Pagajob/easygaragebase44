import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, set, isBefore, startOfMinute } from "date-fns";
import { fr } from "date-fns/locale";

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = ['00', '15', '30', '45'];

const getInitialDate = (date, minDate) => {
  const initial = date || minDate || new Date();
  // If no specific date is passed, set the default time to 18:00
  if (!date) {
    initial.setHours(18, 0, 0, 0);
  }
  return initial;
};

export default function DateTimePicker({ date, setDate, label, minDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(getInitialDate(date, minDate));

  useEffect(() => {
    setTempDate(getInitialDate(date, minDate));
  }, [date, minDate]);

  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) return;
    const newDate = set(selectedDate, {
      hours: tempDate.getHours(),
      minutes: tempDate.getMinutes(),
    });
    setTempDate(newDate);
  };

  const handleTimeChange = (type, value) => {
    const newDate = set(tempDate, { [type]: parseInt(value) });
    setTempDate(newDate);
  };

  const handleConfirm = () => {
    let finalDate = tempDate;
    if (minDate && isBefore(finalDate, minDate)) {
      finalDate = minDate;
    }
    setDate(startOfMinute(finalDate));
    setIsOpen(false);
  };

  const currentMinutes = tempDate.getMinutes();
  const selectedMinute = minutes.includes(currentMinutes.toString().padStart(2, '0')) 
    ? currentMinutes.toString().padStart(2, '0') 
    : '00';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-14 rounded-full border-2 border-slate-200 bg-white/20 dark:bg-slate-800/50 dark:border-white/10 hover:border-purple-500 transition-colors justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-3 h-5 w-5 text-slate-400 dark:text-purple-300" />
          {date ? (
            <span className="text-slate-900 dark:text-white">
              {format(date, "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </span>
          ) : (
            <span className="text-slate-400">{label}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white/20 dark:bg-slate-900/90 backdrop-blur-xl border-white/30 dark:border-slate-700 rounded-xl">
        <Calendar
          mode="single"
          selected={tempDate}
          onSelect={handleDateSelect}
          locale={fr}
          weekStartsOn={1}
          disabled={minDate ? { before: new Date(minDate.getTime() - 86400000) } : undefined} // Allow selecting today even if minDate is today
          className="dark:text-white"
        />
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
             <Clock className="w-5 h-5 text-slate-500 dark:text-purple-300" />
             <p className="text-sm font-medium text-slate-700 dark:text-white">Heure de {label.toLowerCase().includes('départ') ? 'départ' : 'retour'}</p>
          </div>
          <div className="flex gap-2">
            <Select
              value={tempDate.getHours().toString().padStart(2, '0')}
              onValueChange={(value) => handleTimeChange('hours', value)}
            >
              <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {hours.map(hour => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select
              value={selectedMinute}
              onValueChange={(value) => handleTimeChange('minutes', value)}
            >
              <SelectTrigger className="dark:bg-slate-800 dark:border-slate-600 dark:text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {minutes.map(minute => <SelectItem key={minute} value={minute}>{minute}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleConfirm} className="w-full mt-4 rounded-xl">Valider</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}