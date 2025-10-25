import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Crown,
  Rocket,
  Building2
} from "lucide-react";
import { base44 } from "@/api/base44Client";

const MARKETPLACE_LIMITS = {
  free: { included: 0, price: 20, nextPlan: 'essentiel' },
  essentiel: { included: 0, price: 15, nextPlan: 'pro' },
  pro: { included: 1, price: 10, nextPlan: 'entreprise' },
  entreprise: { included: Infinity, price: 0, nextPlan: null }
};

const PLAN_NAMES = {
  free: 'Gratuit',
  essentiel: 'Essentiel',
  pro: 'Pro',
  entreprise: 'Entreprise'
};

const PLAN_ICONS = {
  free: Building2,
  essentiel: Building2,
  pro: Rocket,
  entreprise: Crown
};

export default function MarketplaceAddonModal({ 
  isOpen, 
  onClose, 
  currentPlan,
  publishedCount,
  onConfirmAddon,
  onUpgradePlan 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const limits = MARKETPLACE_LIMITS[currentPlan || 'free'];
  const willExceed = publishedCount >= limits.included;
  const extraVehicles = Math.max(0, publishedCount - limits.included + 1);
  const monthlyCost = extraVehicles * limits.price;

  const handleConfirmAddon = async () => {
    setIsProcessing(true);
    setSelectedOption('addon');
    try {
      await onConfirmAddon();
      onClose();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setSelectedOption('upgrade');
    try {
      await onUpgradePlan();
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  const nextPlanLimits = limits.nextPlan ? MARKETPLACE_LIMITS[limits.nextPlan] : null;
  const Icon = PLAN_ICONS[currentPlan] || Building2;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Publication sur la Marketplace
              </DialogTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Plan actuel : {PLAN_NAMES[currentPlan]}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info sur le plan actuel */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {limits.included === 0 
                      ? "Aucune annonce incluse dans votre plan"
                      : limits.included === Infinity
                      ? "Annonces illimitées incluses ✨"
                      : `${limits.included} annonce${limits.included > 1 ? 's' : ''} incluse${limits.included > 1 ? 's' : ''} dans votre plan`
                    }
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-200">
                    {publishedCount} véhicule{publishedCount > 1 ? 's' : ''} déjà publié{publishedCount > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {willExceed && limits.price > 0 && (
            <>
              {/* Option 1: Payer l'add-on */}
              <Card className="border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Option 1 : Add-on Marketplace</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Payez uniquement pour ce véhicule
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-0">
                      {limits.price}€/mois
                    </Badge>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Véhicules supplémentaires</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{extraVehicles}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Prix unitaire</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{limits.price}€/mois</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900 dark:text-white">Total mensuel</span>
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{monthlyCost}€</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleConfirmAddon}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-full"
                  >
                    {isProcessing && selectedOption === 'addon' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publication en cours...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmer et publier (+{monthlyCost}€/mois)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Option 2: Passer au plan supérieur */}
              {nextPlanLimits && (
                <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            Option 2 : Passer au plan {PLAN_NAMES[limits.nextPlan]}
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 text-xs">
                              RECOMMANDÉ
                            </Badge>
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Plus économique sur le long terme
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {nextPlanLimits.included === Infinity 
                            ? 'Annonces illimitées incluses'
                            : `${nextPlanLimits.included} annonce${nextPlanLimits.included > 1 ? 's' : ''} incluse${nextPlanLimits.included > 1 ? 's' : ''}`
                          }
                        </span>
                      </div>
                      {nextPlanLimits.price < limits.price && nextPlanLimits.price > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <span className="text-slate-700 dark:text-slate-300">
                            Véhicules supplémentaires à {nextPlanLimits.price}€/mois seulement
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          Toutes les fonctionnalités du plan {PLAN_NAMES[limits.nextPlan]}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleUpgrade}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full"
                    >
                      {isProcessing && selectedOption === 'upgrade' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Passer au plan {PLAN_NAMES[limits.nextPlan]}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Plan Entreprise - Illimité */}
          {limits.included === Infinity && (
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10">
              <CardContent className="p-5 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Annonces illimitées !
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Avec le plan Entreprise, vous pouvez publier autant de véhicules que vous le souhaitez sans frais supplémentaires.
                </p>
                <Button
                  onClick={handleConfirmAddon}
                  disabled={isProcessing}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Publier sur la marketplace
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}