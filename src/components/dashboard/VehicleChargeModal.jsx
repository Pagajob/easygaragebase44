
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
import { Textarea } from "@/components/ui/textarea"; // Although not used in final code, keeping it from original import list.
import { Plus, Trash2, Euro } from "lucide-react";
import { formatCurrency, getOrganizationCurrency } from "../utils/formatters";

export default function VehicleChargeModal({ isOpen, onClose, vehicle, onSave }) {
  const [monthlyCharges, setMonthlyCharges] = useState(vehicle.monthly_charges || []);
  const [isSaving, setIsSaving] = useState(false);
  const [currency, setCurrency] = useState('EUR');

  // Charger la devise
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      if (curr) {
        setCurrency(curr);
      }
    };
    loadCurrency();
  }, []);

  const addCharge = () => {
    setMonthlyCharges([...monthlyCharges, { label: "", amount: 0, note: "" }]);
  };

  const removeCharge = (index) => {
    setMonthlyCharges(monthlyCharges.filter((_, i) => i !== index));
  };

  const updateCharge = (index, field, value) => {
    setMonthlyCharges(monthlyCharges.map((charge, i) =>
      i === index ? { ...charge, [field]: value } : charge
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(vehicle.id, { monthly_charges: monthlyCharges });
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const totalMonthly = monthlyCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0) +
    (vehicle.monthly_insurance || 0) +
    (vehicle.financing_type === 'leasing' ? (vehicle.monthly_payment || 0) : 0) +
    (vehicle.financing_type === 'lld' ? (vehicle.monthly_rent || 0) : 0);
  // totalYearly is now only calculated for display in the new "Total" section.

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            Charges mensuelles
            <p className="text-sm font-normal text-slate-500 mt-1">
              {vehicle.make} {vehicle.model} ({vehicle.plate})
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Total */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Total mensuel</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                  Soit {formatCurrency(totalMonthly * 12, currency)}/an
                </p>
              </div>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                {formatCurrency(totalMonthly, currency)}
              </p>
            </div>
          </div>

          {/* Liste des charges */}
          <div className="space-y-3">
            {monthlyCharges.map((charge, index) =>
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-white/50 border border-white/20 rounded-xl">
                <div className="col-span-4">
                  <Label className="text-xs">Libellé</Label>
                  <Input
                    value={charge.label}
                    onChange={(e) => updateCharge(index, "label", e.target.value)}
                    placeholder="Ex: Assurance"
                    className="mt-1 h-10" />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Montant ({currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={charge.amount}
                    onChange={(e) => updateCharge(index, "amount", parseFloat(e.target.value))}
                    placeholder="0.00"
                    className="mt-1 h-10" />
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={charge.note}
                    onChange={(e) => updateCharge(index, "note", e.target.value)}
                    placeholder="Optionnel"
                    className="mt-1 h-10" />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCharge(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50/50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addCharge} className="bg-background px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une charge
          </Button>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10">
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-[100px] inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-primary/90 h-10">
              <Euro className="w-4 h-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
