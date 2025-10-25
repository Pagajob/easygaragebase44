import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VehicleFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: "all",
      financing: "all"
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
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectItem value="disponible">Disponible</SelectItem>
          <SelectItem value="loue">Loué</SelectItem>
          <SelectItem value="maintenance">Maintenance</SelectItem>
          <SelectItem value="hors_service">Hors service</SelectItem>
        </SelectContent>
      </Select>

      <Select 
        value={filters.financing} 
        onValueChange={(value) => handleFilterChange("financing", value)}
      >
        <SelectTrigger className="flex-1 h-12 rounded-xl bg-white/50 border border-white/20 focus:ring-2 focus:ring-blue-500">
          <SelectValue placeholder="Financement" />
        </SelectTrigger>
        <SelectContent className="bg-white/80 backdrop-blur-lg border-white/30">
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="comptant">Comptant</SelectItem>
          <SelectItem value="leasing">Leasing</SelectItem>
          <SelectItem value="lld">LLD</SelectItem>
          <SelectItem value="mise_a_disposition">Mise à dispo</SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          className="text-slate-500 hover:text-slate-700 rounded-full"
        >
          Effacer
        </Button>
      )}
    </div>
  );
}