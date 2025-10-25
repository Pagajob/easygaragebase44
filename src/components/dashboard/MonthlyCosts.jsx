
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, Car, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getOrganizationCurrency } from "../utils/formatters";

import VehicleChargeModal from "./VehicleChargeModal";

export default function MonthlyCosts({
  vehicles,
  fixedCharges,
  isLoading,
  onVehicleUpdate
}) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const [currency, setCurrency] = useState('EUR'); // Initialize with a default currency

  // Charger la devise
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  // Calculer toutes les charges mensuelles des véhicules
  const vehicleCharges = vehicles.flatMap((vehicle) => {
    const charges = [];

    // Charges mensuelles définies
    const monthlyCharges = vehicle.monthly_charges || [];
    monthlyCharges.forEach((charge) => {
      charges.push({
        ...charge,
        source: 'vehicle',
        vehicle_id: vehicle.id,
        vehicle_name: `${vehicle.make} ${vehicle.model}`,
        vehicle_plate: vehicle.plate
      });
    });

    // Ajouter l'assurance mensuelle si définie
    if (vehicle.monthly_insurance && vehicle.monthly_insurance > 0) {
      charges.push({
        label: "Assurance",
        amount: vehicle.monthly_insurance,
        note: "Coût d'assurance mensuel",
        source: 'vehicle',
        vehicle_id: vehicle.id,
        vehicle_name: `${vehicle.make} ${vehicle.model}`,
        vehicle_plate: vehicle.plate
      });
    }

    // Ajouter le loyer pour leasing
    if (vehicle.financing_type === 'leasing' && vehicle.monthly_payment && vehicle.monthly_payment > 0) {
      charges.push({
        label: "Loyer Leasing",
        amount: vehicle.monthly_payment,
        note: "Loyer mensuel du leasing",
        source: 'vehicle',
        vehicle_id: vehicle.id,
        vehicle_name: `${vehicle.make} ${vehicle.model}`,
        vehicle_plate: vehicle.plate
      });
    }

    // Ajouter le loyer pour LLD
    if (vehicle.financing_type === 'lld' && vehicle.monthly_rent && vehicle.monthly_rent > 0) {
      charges.push({
        label: "Loyer LLD",
        amount: vehicle.monthly_rent,
        note: "Loyer mensuel de la LLD",
        source: 'vehicle',
        vehicle_id: vehicle.id,
        vehicle_name: `${vehicle.make} ${vehicle.model}`,
        vehicle_plate: vehicle.plate
      });
    }

    return charges;
  });

  // Formater les charges fixes avec source
  const formattedFixedCharges = (fixedCharges || []).map((charge) => ({
    label: charge.label,
    amount: charge.amount,
    note: charge.category,
    source: 'fixed',
    id: charge.id
  }));

  // Combiner toutes les charges
  const allCharges = [...vehicleCharges, ...formattedFixedCharges];

  const totalMonthly = allCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

  const handleChargeClick = (charge) => {
    if (charge.source === 'vehicle') {
      const vehicle = vehicles.find((v) => v.id === charge.vehicle_id);
      setSelectedVehicle(vehicle);
      setShowModal(true);
    }
    // Les charges fixes ne sont pas cliquables (on pourrait rediriger vers la page charges fixes)
  };

  if (isLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="w-5 h-5" />
            Coûts mensuels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
            {[1, 2, 3].map((i) =>
            <div key={i} className="flex-shrink-0 w-[280px] snap-start">
                <Skeleton className="h-24 rounded-xl" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <>
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 dark:text-slate-900">💸
Coûts mensuels

            </CardTitle>
            <Badge className="bg-green-100 text-green-800 rounded-full whitespace-nowrap px-3 py-1 text-sm">
              {formatCurrency(totalMonthly, currency)}/mois
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {allCharges.length === 0 ?
          <div className="text-center py-8 text-slate-500">
              <Euro className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium dark:text-black mb-">Aucune charge définie</p>
              <p className="text-sm mt-1 dark:text-black mb-">Ajoutez des charges mensuelles</p>
            </div> :

          <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400">
                {allCharges.map((charge, index) =>
              <div
                key={`${charge.source}-${index}`}
                className="flex-shrink-0 w-[280px] snap-start">

                    <div
                  onClick={() => handleChargeClick(charge)}
                  className={`flex items-center justify-between p-4 bg-white/40 border border-white/20 rounded-xl hover:shadow-md transition-all h-full ${
                  charge.source === 'vehicle' ? 'cursor-pointer group' : ''}`
                  }>

                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="bg-slate-200 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0">
                          {charge.source === 'vehicle' ?
                      <Car className="w-5 h-5 text-green-600" /> :

                      <Euro className="w-5 h-5 text-blue-600" />
                      }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {formatCurrency(charge.amount, currency)} • {charge.label}
                          </p>
                          {charge.source === 'vehicle' ?
                      <>
                              <p className="text-xs text-slate-500 truncate dark:text-slate-800 mb-">
                                {charge.vehicle_name}
                              </p>
                              <p className="text-xs text-slate-400 truncate dark:text-slate-500 mb-">
                                {charge.vehicle_plate}
                              </p>
                            </> :

                      <p className="text-xs text-slate-500 truncate">
                              Charge fixe{charge.note ? ` • ${charge.note}` : ''}
                            </p>
                      }
                          {charge.note && charge.source === 'vehicle' &&
                      <p className="text-xs text-slate-400 truncate mt-1 dark:text-slate-600 mb-">
                              {charge.note}
                            </p>
                      }
                        </div>
                      </div>
                      {charge.source === 'vehicle' &&
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 flex-shrink-0 ml-2" />
                  }
                    </div>
                  </div>
              )}
              </div>
              
              {allCharges.length > 1 &&
            <div className="text-center mt-2">
                  <span className="text-xs text-slate-400 dark:text-slate-800 mb-">← Faites glisser pour voir plus →</span>
                </div>
            }
              
              <div className="bg-blue-100 mt-4 p-3 rounded-[100px] border border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-green-900">Total annuel estimé</span>
                  <span className="text-blue-800 text-lg font-bold">
                    {formatCurrency(totalMonthly * 12, currency)}
                  </span>
                </div>
              </div>
            </div>
          }
        </CardContent>
      </Card>

      {showModal && selectedVehicle &&
      <VehicleChargeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onSave={onVehicleUpdate} />

      }
    </>);

}