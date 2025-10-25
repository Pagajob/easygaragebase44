
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, ArrowLeft, Euro } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatEuro } from "../components/utils/formatters";

import FixedChargeModal from "../components/fixedcharges/FixedChargeModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";

const categoryColors = {
  loyer: "bg-purple-100 text-purple-800",
  assurance: "bg-blue-100 text-blue-800",
  abonnement: "bg-green-100 text-green-800",
  maintenance: "bg-orange-100 text-orange-800",
  personnel: "bg-pink-100 text-pink-800",
  autre: "bg-slate-100 text-slate-800"
};

const categoryLabels = {
  loyer: "Loyer",
  assurance: "Assurance",
  abonnement: "Abonnement",
  maintenance: "Maintenance",
  personnel: "Personnel",
  autre: "Autre"
};

export default function FixedChargesPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState(null);

  const queryClient = useQueryClient();

  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['fixedCharges'],
    queryFn: () => filterByOrganization('FixedCharge'),
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const saveFixedChargeMutation = useMutation({
    mutationFn: async (payload) => {// payload will contain { id, data }
      const orgId = await getCurrentOrganizationId();
      if (payload.id) {
        return await base44.entities.FixedCharge.update(payload.id, payload.data);
      } else {
        return await base44.entities.FixedCharge.create({
          ...payload.data,
          organization_id: orgId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fixedCharges'] });
      setShowModal(false);
      setSelectedCharge(null);
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  });

  const handleSaveCharge = (chargeData) => {
    saveFixedChargeMutation.mutate({
      id: selectedCharge?.id,
      data: chargeData
    });
  };

  const handleDeleteCharge = async (chargeId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette charge ?")) {
      try {
        await base44.entities.FixedCharge.delete(chargeId);
        queryClient.invalidateQueries({ queryKey: ['fixedCharges'] });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const totalMonthly = charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  const totalYearly = totalMonthly * 12;

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl("Dashboard")}>
          <Button variant="ghost" size="icon" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10 rounded-full dark:text-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Charges fixes</h1>
          <p className="text-slate-500 text-sm dark:text-slate-400">Gérez vos charges fixes mensuelles</p>
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-blue-50/50 text-card-foreground rounded-xl border shadow-sm backdrop-blur-lg border-blue-200/50">
          <CardContent className="p-4 rounded-[14px]">
            <p className="text-sm text-blue-600 mb-1 dark:text-blue-200">Coût mensuel</p>
            <p className="text-3xl font-bold text-blue-900">{formatEuro(totalMonthly)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 text-card-foreground rounded-xl border shadow-sm backdrop-blur-lg border-green-200/50">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 mb-1 dark:text-green-200">Coût annuel</p>
            <p className="text-3xl font-bold text-green-900">{formatEuro(totalYearly)}</p>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={() => setShowModal(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
        size="lg">

        <Plus className="w-5 h-5 mr-2" />
        Ajouter une charge fixe
      </Button>

      {/* Liste des charges */}
      <Card className="bg-white/40 text-card-foreground rounded-xl backdrop-blur-lg border border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Toutes les charges ({charges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ?
          <div className="py-8">
              <LoadingSpinner />
            </div> :
          charges.length === 0 ?
          <div className="text-center py-12">
              <Euro className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Aucune charge fixe
              </h3>
              <p className="text-slate-500 mb-4 dark:text-slate-100">Commencez par ajouter vos charges fixes mensuelles

            </p>
            </div> :

          <div className="space-y-3">
              {charges.map((charge) =>
            <div
              key={charge.id}
              className="flex items-center justify-between p-4 bg-white/40 border border-white/20 rounded-xl hover:shadow-md transition-shadow">

                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="bg-slate-200 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <Euro className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {charge.label}
                        </h3>
                        <Badge className={`${categoryColors[charge.category]} rounded-full text-xs`}>
                          {categoryLabels[charge.category]}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatEuro(charge.amount)} <span className="text-sm text-slate-500 dark:text-slate-900">/mois</span>
                      </p>
                      {charge.notes &&
                  <p className="text-xs text-slate-500 mt-1 truncate">
                          {charge.notes}
                        </p>
                  }
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedCharge(charge);
                    setShowModal(true);
                  }}
                  className="rounded-full">

                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCharge(charge.id)}
                  className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-100/50">

                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>

      <FixedChargeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedCharge(null);
        }}
        charge={selectedCharge}
        onSave={handleSaveCharge} />

    </div>);

}