
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Euro } from "lucide-react";
import { getCurrencySymbol, getOrganizationCurrency } from "../utils/formatters";

export default function FixedChargeModal({ isOpen, onClose, charge, onSave }) {
  const [formData, setFormData] = useState({
    label: "",
    amount: 0,
    category: "autre",
    notes: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState('EUR'); // Initialize with a default value

  // Charger la devise
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []); // Empty dependency array means this runs once on mount

  const currencySymbol = getCurrencySymbol(currency);

  useEffect(() => {
    if (charge) {
      setFormData({
        label: charge.label || "",
        amount: charge.amount || 0,
        category: charge.category || "autre",
        notes: charge.notes || ""
      });
    } else {
      setFormData({
        label: "",
        amount: 0,
        category: "autre",
        notes: ""
      });
    }
  }, [charge, isOpen]);

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
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold leading-none tracking-tight dark:text-slate-100">
            {charge ? "Modifier la charge" : "Ajouter une charge fixe"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="label" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Libellé *</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => handleInputChange("label", e.target.value)}
              required
              placeholder="Ex: Loyer du local"
              className="mt-1" />

          </div>

          <div>
            <Label htmlFor="amount" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Montant mensuel ({currencySymbol}) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", parseFloat(e.target.value))}
              required
              placeholder="0.00"
              className="mt-1" />

          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}>

              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loyer">Loyer</SelectItem>
                <SelectItem value="assurance">Assurance</SelectItem>
                <SelectItem value="abonnement">Abonnement</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="personnel">Personnel</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-slate-100">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              placeholder="Notes supplémentaires..."
              className="mt-1" />

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 dark:text-slate-100">
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10">
              <Euro className="w-4 h-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);

}