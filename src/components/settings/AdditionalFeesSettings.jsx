
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, DollarSign, Fuel, Clock, Wrench, Sparkles } from "lucide-react";
import { filterByOrganization, getCurrentOrganizationId } from "../utils/multiTenant";
import { formatCurrency, getCurrencySymbol, invalidateCurrencyCache } from "../utils/formatters"; // Added import

const DEFAULT_FEES = [
{
  type: "carburant",
  label: "Carburant (par litre)",
  amount: 2.0,
  unit: "par litre",
  enabled: true,
  icon: "Fuel"
},
{
  type: "retard",
  label: "Retard (par tranche de 30min)",
  amount: 15.0,
  unit: "par 30min",
  enabled: true,
  icon: "Clock"
},
{
  type: "jante",
  label: "Jante abîmée",
  amount: 150.0,
  unit: "par jante",
  enabled: true,
  icon: "Wrench"
},
{
  type: "nettoyage",
  label: "Nettoyage intérieur",
  amount: 50.0,
  unit: "forfait",
  enabled: true,
  icon: "Sparkles"
}];


const getFeeIcon = (type) => {
  switch (type) {
    case "carburant":return Fuel;
    case "retard":return Clock;
    case "jante":return Wrench;
    case "nettoyage":return Sparkles;
    default:return DollarSign;
  }
};

export default function AdditionalFeesSettings() {
  const queryClient = useQueryClient();
  const [fees, setFees] = useState([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const { data: additionalFees = [], isLoading } = useQuery({
    queryKey: ['additionalFees'],
    queryFn: () => filterByOrganization('AdditionalFee')
  });

  // Récupérer l'organisation pour la devise
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user?.organization_id) return null;
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      return orgs.length > 0 ? orgs[0] : null;
    }
  });

  const currency = organization?.currency || 'EUR';
  const currencySymbol = getCurrencySymbol(currency);

  // Mutation pour mettre à jour la devise
  const updateCurrencyMutation = useMutation({
    mutationFn: async (newCurrency) => {
      if (!organization?.id) throw new Error("Organization not found");
      return await base44.entities.Organization.update(organization.id, {
        currency: newCurrency
      });
    },
    onSuccess: () => {
      invalidateCurrencyCache();
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      alert("Devise mise à jour avec succès !");
    },
    onError: (error) => {
      console.error("Erreur lors de la mise à jour de la devise:", error);
      alert("Erreur lors de la mise à jour de la devise");
    }
  });

  useEffect(() => {
    const initializeDefaultFees = async () => {
      if (isLoading || hasInitialized || isInitializing) return;

      if (additionalFees && additionalFees.length > 0) {
        setFees(additionalFees);
        setHasInitialized(true);
        return;
      }

      setIsInitializing(true);
      try {
        const orgId = await getCurrentOrganizationId();
        if (!orgId) {
          console.error("Organization ID manquant");
          setIsInitializing(false);
          return;
        }

        const createdFees = [];
        for (const defaultFee of DEFAULT_FEES) {
          const fee = await base44.entities.AdditionalFee.create({
            ...defaultFee,
            organization_id: orgId
          });
          createdFees.push(fee);
        }

        setFees(createdFees);
        setHasInitialized(true);
        queryClient.invalidateQueries({ queryKey: ['additionalFees'] });
      } catch (error) {
        console.error("Erreur lors de l'initialisation des frais:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeDefaultFees();
  }, [additionalFees, isLoading, hasInitialized, isInitializing, queryClient]);

  useEffect(() => {
    if (additionalFees && additionalFees.length > 0 && !isInitializing) {
      setFees(additionalFees);
      setHasInitialized(true);
    }
  }, [additionalFees, isInitializing]);

  const updateFeeMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await base44.entities.AdditionalFee.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalFees'] });
    }
  });

  const createFeeMutation = useMutation({
    mutationFn: async (data) => {
      const orgId = await getCurrentOrganizationId();
      return await base44.entities.AdditionalFee.create({
        ...data,
        organization_id: orgId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalFees'] });
    }
  });

  const deleteFeeMutation = useMutation({
    mutationFn: (id) => base44.entities.AdditionalFee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additionalFees'] });
    }
  });

  const handleFeeChange = (index, field, value) => {
    const updatedFees = [...fees];
    updatedFees[index] = {
      ...updatedFees[index],
      [field]: value
    };
    setFees(updatedFees);
  };

  const handleSaveFee = async (fee) => {
    if (fee.id) {
      await updateFeeMutation.mutateAsync({
        id: fee.id,
        data: {
          label: fee.label,
          amount: fee.amount,
          unit: fee.unit, // Unit is still sent even if not displayed as an editable input
          enabled: fee.enabled
        }
      });
    }
  };

  const handleAddCustomFee = async () => {
    const orgId = await getCurrentOrganizationId();
    const newFee = {
      type: "personnalise",
      label: "Nouveau frais",
      amount: 0,
      unit: "forfait",
      enabled: true,
      organization_id: orgId
    };

    await createFeeMutation.mutateAsync(newFee);
  };

  const handleDeleteFee = async (feeId) => {
    if (confirm("Supprimer ce frais ?")) {
      await deleteFeeMutation.mutateAsync(feeId);
    }
  };

  // The loading state here is just for additionalFees. We should also consider organization loading.
  if (isLoading || isInitializing) {
    return (
      <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            Frais supplémentaires
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">Chargement...</p>
        </CardContent>
      </Card>);

  }

  return (
    <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="font-semibold tracking-tight flex items-center gap-2 text-xl dark:text-slate-100">Frais supplémentaires


        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Devise */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5" />
              Devise
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Choisissez la devise utilisée dans toute l'application
            </p>
          </div>
          
          <div className="inline-flex items-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-white/40 dark:border-slate-700/40 rounded-[100px] p-1 shadow-sm">
            <button
              onClick={() => updateCurrencyMutation.mutate('EUR')}
              disabled={updateCurrencyMutation.isPending}
              className={`px-6 py-2 rounded-[100px] text-sm font-medium transition-all ${
              currency === 'EUR' ?
              'bg-blue-600 text-white shadow-md' :
              'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'}`
              }>

              <span className="flex items-center gap-2">
                <span className="text-lg">€</span>
                <span>Euro (EUR)</span>
              </span>
            </button>
            <button
              onClick={() => updateCurrencyMutation.mutate('CHF')}
              disabled={updateCurrencyMutation.isPending}
              className={`px-6 py-2 rounded-[100px] text-sm font-medium transition-all ${
              currency === 'CHF' ?
              'bg-blue-600 text-white shadow-md' :
              'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'}`
              }>

              <span className="flex items-center gap-2">
                <span className="text-lg font-bold">CHF</span>
                <span>Franc suisse</span>
              </span>
            </button>
          </div>
        </div>

        {/* Section Frais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Frais configurés
            </h3>
            <Button
              onClick={handleAddCustomFee}
              size="sm"
              variant="outline" className="bg-background px-3 text-sm font-medium rounded-xl inline-flex items-center justify-center whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-9 gap-2">


              <Plus className="w-4 h-4" />
              Ajouter un frais
            </Button>
          </div>

          {fees.length === 0 ?
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Aucun frais configuré</p>
            </div> :

          <div className="grid gap-3">
              {fees.map((fee, index) => {
              const Icon = getFeeIcon(fee.type);
              return (
                <div
                  key={fee.id || index}
                  className="bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl p-4">

                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-400">Libellé</Label>
                            <Input
                            value={fee.label}
                            onChange={(e) => handleFeeChange(index, 'label', e.target.value)}
                            onBlur={() => handleSaveFee(fee)}
                            className="h-9 bg-white dark:bg-slate-800" />

                          </div>

                          <div>
                            <Label className="text-xs text-slate-600 dark:text-slate-400">
                              Montant ({currencySymbol})
                            </Label>
                            <Input
                            type="number"
                            step="0.01"
                            value={fee.amount}
                            onChange={(e) => handleFeeChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            onBlur={() => handleSaveFee(fee)}
                            className="h-9 bg-white dark:bg-slate-800" />

                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch
                            checked={fee.enabled}
                            onCheckedChange={(checked) => {
                              handleFeeChange(index, 'enabled', checked);
                              handleSaveFee({ ...fee, enabled: checked });
                            }} />

                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {fee.enabled ? 'Actif' : 'Désactivé'}
                            </span>
                          </div>

                          {fee.type === 'personnalise' &&
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFee(fee.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">

                              <Trash2 className="w-4 h-4" />
                            </Button>
                        }
                        </div>
                      </div>
                    </div>
                  </div>);

            })}
            </div>
          }
        </div>
      </CardContent>
    </Card>);

}