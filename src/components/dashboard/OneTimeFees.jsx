import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "../utils/formatters";

import OneTimeFeeModal from "./OneTimeFeeModal";

export default function OneTimeFees({
  fees,
  vehicles,
  isLoading,
  currency,
  onSave,
  onDelete
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const getVehicle = (vehicleId) => vehicles.find((v) => v.id === vehicleId);

  const categoryColors = {
    reparation: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    entretien: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    autre: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
  };

  const categoryLabels = {
    reparation: "Réparation",
    entretien: "Entretien",
    autre: "Autre"
  };

  const handleSave = async (feeData) => {
    await onSave(selectedFee?.id, feeData);
    setShowModal(false);
    setSelectedFee(null);
  };

  const handleDelete = async (feeId) => {
    if (confirm("Supprimer ce frais ?")) {
      await onDelete(feeId);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💵 Frais ponctuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex-shrink-0 w-[280px]">
                <Skeleton className="h-24 rounded-xl" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalAmount = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);

  return (
    <>
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 dark:text-slate-900">
              💵 Frais ponctuels
            </CardTitle>
            <div className="flex items-center gap-2">
              {totalAmount > 0 && (
                <Badge className="bg-red-100 text-red-800 rounded-full whitespace-nowrap px-3 py-1 text-sm">
                  {formatCurrency(totalAmount, currency)} total
                </Badge>
              )}
              <Button
                onClick={() => {
                  setSelectedFee(null);
                  setShowModal(true);
                }}
                size="sm"
                className="bg-blue-600 text-primary-foreground p-0 text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-blue-700 h-8 w-8"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="font-medium dark:text-black mb-">Aucun frais ponctuel</p>
              <p className="text-sm mt-1 dark:text-black mb-">Ajoutez des frais exceptionnels</p>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
                {fees.map((fee) => {
                  const vehicle = fee.vehicle_id ? getVehicle(fee.vehicle_id) : null;

                  return (
                    <div
                      key={fee.id}
                      className="flex-shrink-0 w-[280px] snap-start"
                    >
                      <div
                        className="flex items-center justify-between p-4 bg-white/40 border border-white/20 rounded-xl hover:shadow-md transition-all h-full cursor-pointer group"
                        onClick={() => {
                          setSelectedFee(fee);
                          setShowModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="bg-slate-200 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                            {vehicle ? (
                              <Car className="w-5 h-5 text-red-600" />
                            ) : (
                              <span className="text-lg">💰</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {formatCurrency(fee.amount, currency)} • {fee.label}
                            </p>
                            <p className="text-xs text-slate-500 truncate dark:text-slate-800 mb-">
                              {format(parseISO(fee.date), "d MMM yyyy", { locale: fr })}
                            </p>
                            {vehicle && (
                              <p className="text-xs text-slate-400 truncate dark:text-slate-500 mb-">
                                {vehicle.make} {vehicle.model} - {vehicle.plate}
                              </p>
                            )}
                            <Badge className={`${categoryColors[fee.category]} text-xs mt-1`}>
                              {categoryLabels[fee.category]}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(fee.id);
                          }}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-full flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {fees.length > 1 && (
                <div className="text-center mt-2">
                  <span className="text-xs text-slate-400 dark:text-slate-800 mb-">
                    ← Faites glisser pour voir plus →
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <OneTimeFeeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedFee(null);
        }}
        fee={selectedFee}
        vehicles={vehicles}
        onSave={handleSave}
      />
    </>
  );
}