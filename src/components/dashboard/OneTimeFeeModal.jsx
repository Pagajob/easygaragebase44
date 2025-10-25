import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OneTimeFeeModal({ isOpen, onClose, fee, vehicles, onSave }) {
  const [formData, setFormData] = useState({
    label: "",
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    vehicle_id: "",
    category: "autre",
    notes: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (fee) {
      setFormData(fee);
    } else {
      setFormData({
        label: "",
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        vehicle_id: "",
        category: "autre",
        notes: ""
      });
    }
  }, [fee, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl border-white/30 dark:border-slate-700/30 rounded-2xl shadow-2xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold dark:text-white">
            {fee ? "Modifier le frais" : "Ajouter un frais ponctuel"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Card className="bg-white/40 text-card-foreground rounded-xl border shadow-sm dark:bg-slate-800/40 border-white/20 dark:border-slate-700/20">
            <CardHeader>
              <CardTitle className="text-lg dark:text-white">Informations du frais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="label" className="dark:text-slate-300">Libellé *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => handleInputChange("label", e.target.value)}
                  required
                  placeholder="Ex: Réparation pneu"
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount" className="dark:text-slate-300">Montant (€) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", parseFloat(e.target.value))}
                    required
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="date" className="dark:text-slate-300">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                    required
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category" className="dark:text-slate-300">Catégorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 rounded-xl shadow-md">
                    <SelectItem value="reparation">Réparation</SelectItem>
                    <SelectItem value="entretien">Entretien</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vehicle_id" className="dark:text-slate-300">Véhicule associé (optionnel)</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => handleInputChange("vehicle_id", value)}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg">
                    <SelectValue placeholder="Aucun véhicule" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 rounded-xl shadow-md">
                    <SelectItem value={null}>Aucun véhicule</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes" className="dark:text-slate-300">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  rows={3}
                  placeholder="Informations complémentaires..."
                  className="bg-white/50 dark:bg-slate-700/50 border-slate-300/50 dark:border-slate-600/50 rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/20 dark:border-slate-700/20">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-full dark:text-white dark:hover:bg-slate-700">
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving} className="rounded-full">
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}