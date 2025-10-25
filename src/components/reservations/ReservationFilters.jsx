
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReservationFilters({ filters, onFiltersChange, vehicles }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: "all",
      vehicle: "all"
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all");

  return (
    <div className="flex items-center gap-3">
      <Select 
        value={filters.status} 
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="flex-1 h-12 rounded-xl bg-white/50 border border-white/20 focus:ring-2 focus:ring-blue-500">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent className="bg-white/80 backdrop-blur-lg border-white/30">
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="brouillon">Brouillon</SelectItem>
          <SelectItem value="confirmee">Confirmée</SelectItem>
          <SelectItem value="a_checker">À checker</SelectItem>
          <SelectItem value="checked_in">Checked-in</SelectItem>
          <SelectItem value="annulee">Annulée</SelectItem>
          <SelectItem value="terminee">Terminée</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.vehicle} 
        onValueChange={(value) => handleFilterChange("vehicle", value)}
      >
        <SelectTrigger className="flex-1 h-12 rounded-xl bg-white/50 border border-white/20 focus:ring-2 focus:ring-blue-500">
          <SelectValue placeholder="Véhicule" />
        </SelectTrigger>
        <SelectContent className="bg-white/80 backdrop-blur-lg border-white/30">
          <SelectItem value="all">Tous</SelectItem>
          {vehicles.map(vehicle => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="text-slate-500 hover:text-slate-700 rounded-full px-3"
        >
          Effacer
        </Button>
      )}
    </div>
  );
}
