import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientFilters({ filters, onFiltersChange }) {
  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      type: "all"
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "all");

  return (
    <div className="flex items-center gap-3">
      <Select 
        value={filters.type} 
        onValueChange={(value) => handleFilterChange("type", value)}
      >
        <SelectTrigger className="flex-1 h-12 rounded-xl bg-white/50 border border-white/20 focus:ring-2 focus:ring-blue-500">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent className="bg-white/80 backdrop-blur-lg border-white/30">
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="particulier">Particuliers</SelectItem>
          <SelectItem value="professionnel">Professionnels</SelectItem>
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