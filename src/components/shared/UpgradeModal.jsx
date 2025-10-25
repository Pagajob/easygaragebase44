
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Crown, Rocket, Building2, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const plans = {
  essentiel: {
    name: "Essentiel",
    monthlyPrice: 29.99,
    annualPrice: 300,
    monthlyPriceId: "price_1SH8G5PzA2HP76zRkUx6so2k",
    annualPriceId: "price_1SIr9wPzA2HP76zRRhF0rJRb",
    icon: Building2,
    color: "blue",
    features: [
      "Jusqu'à 5 véhicules",
      "30 réservations / mois",
      "30 documents PDF / mois",
      "1 utilisateur"
    ]
  },
  pro: {
    name: "Pro",
    monthlyPrice: 59.99,
    annualPrice: 600,
    monthlyPriceId: "price_1SH8GwPzA2HP76zRpC0qPcVL",
    annualPriceId: "price_1SIrCmPzA2HP76zRMq8in24t",
    icon: Rocket,
    color: "purple",
    popular: true,
    features: [
      "Jusqu'à 15 véhicules",
      "100 réservations / mois",
      "PDF illimités",
      "Vidéo EDL activée",
      "Jusqu'à 3 utilisateurs"
    ]
  },
  entreprise: {
    name: "Entreprise",
    monthlyPrice: 99.99,
    annualPrice: 1000,
    monthlyPriceId: "price_1SH8HRPzA2HP76zRiKKKpy6e",
    annualPriceId: "price_1SIrDGPzA2HP76zRzSM01Xho",
    icon: Crown,
    color: "amber",
    features: [
      "Jusqu'à 100 véhicules",
      "Réservations illimitées",
      "PDF illimités",
      "Utilisateurs illimités",
      "Support premium"
    ]
  }
};

const limitMessages = {
  vehicles: {
    free: "Vous avez atteint la limite de 1 véhicule du plan gratuit.",
    essentiel: "Vous avez atteint la limite de 5 véhicules du plan Essentiel.",
    pro: "Vous avez atteint la limite de 15 véhicules du plan Pro."
  },
  reservations: {
    free: "Vous avez atteint la limite de 3 réservations par mois du plan gratuit.",
    essentiel: "Vous avez atteint la limite de 30 réservations par mois du plan Essentiel.",
    pro: "Vous avez atteint la limite de 100 réservations par mois du plan Pro."
  },
  pdf: {
    free: "Vous avez atteint la limite de 3 documents par mois du plan gratuit.",
    essentiel: "Vous avez atteint la limite de 30 documents par mois du plan Essentiel."
  },
  users: {
    free: "Vous avez atteint la limite de 1 utilisateur du plan gratuit.",
    essentiel: "Vous avez atteint la limite de 1 utilisateur du plan Essentiel.",
    pro: "Vous avez atteint la limite de 3 utilisateurs du plan Pro."
  }
};

const calculateSavings = (monthlyPrice, annualPrice) => {
  const yearlyMonthly = monthlyPrice * 12;
  const savings = Math.round(yearlyMonthly - annualPrice);
  const savingsPercent = Math.round((savings / yearlyMonthly) * 100);
  return { savings, savingsPercent };
};

export default function UpgradeModal({ isOpen, onClose, limitType, currentPlan }) {
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [error, setError] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  
  const message = limitMessages[limitType]?.[currentPlan] || "Vous avez atteint une limite de votre plan actuel.";
  
  const getRecommendedPlans = () => {
    if (currentPlan === 'free') {
      return ['essentiel', 'pro', 'entreprise'];
    } else if (currentPlan === 'essentiel') {
      return ['pro', 'entreprise'];
    } else if (currentPlan === 'pro') {
      return ['entreprise'];
    }
    return [];
  };

  const recommendedPlans = getRecommendedPlans();

  const handleChoosePlan = async (plan) => {
    setProcessingPlanId(plan.name);
    setError(null);
    
    try {
      const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
      const planKey = Object.keys(plans).find(key => plans[key].name === plan.name);
      
      const payload = {
        priceId: priceId,
        planId: planKey
      };
      
      const response = await base44.functions.invoke('createStripeCheckout', payload);

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("URL de paiement non reçue dans la réponse");
      }
    } catch (error) {
      console.error("Erreur dans handleChoosePlan:", error);
      
      let errorMessage = "Erreur lors de la création de la session de paiement.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setProcessingPlanId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1">
                Limite atteinte
              </DialogTitle>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                {message}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 mt-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Passez à un plan supérieur
            </h3>

            {/* Toggle Mensuel/Annuel */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 rounded-[100px] p-1">
              <span className={`text-xs font-semibold px-2 transition-colors ${!isAnnual ? 'text-indigo-600' : 'text-slate-500'}`}>
                Mensuel
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                className="scale-75 data-[state=checked]:bg-indigo-600"
              />
              <span className={`text-xs font-semibold px-2 transition-colors ${isAnnual ? 'text-indigo-600' : 'text-slate-500'}`}>
                Annuel
              </span>
              {isAnnual && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 text-[10px] px-2 py-0">
                  -17%
                </Badge>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="grid gap-3 sm:gap-4">
            {recommendedPlans.map((planKey) => {
              const plan = plans[planKey];
              const Icon = plan.icon;
              const isProcessing = processingPlanId === plan.name;
              const displayPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              const priceLabel = isAnnual ? '/an' : '/mois';
              
              const { savings, savingsPercent } = calculateSavings(plan.monthlyPrice, plan.annualPrice);

              return (
                <Card 
                  key={planKey}
                  className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-2 ${
                    plan.popular ? 'border-purple-400 dark:border-purple-600' : 'border-white/30 dark:border-slate-700/30'
                  } rounded-xl hover:shadow-lg transition-all relative overflow-hidden`}
                >
                  {isAnnual && (
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-0.5 text-[10px] font-semibold rounded-bl-lg flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Économisez {savings}€
                    </div>
                  )}
                  
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${
                            plan.color === 'blue' ? 'from-blue-500 to-blue-600' :
                            plan.color === 'purple' ? 'from-purple-500 to-purple-600' :
                            'from-amber-500 to-amber-600'
                          } rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                                {plan.name}
                              </h4>
                              {plan.popular && (
                                <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs">
                                  Populaire
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1">
                              <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white">
                                {displayPrice}€
                              </p>
                              <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400">
                                {priceLabel}
                              </span>
                            </div>
                            {isAnnual && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                Soit {(displayPrice / 12).toFixed(2)}€/mois · -{savingsPercent}%
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <span className="text-green-500 flex-shrink-0">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleChoosePlan(plan)}
                        disabled={isProcessing || processingPlanId !== null}
                        className={`w-full ${
                          plan.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                          plan.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                          'bg-amber-600 hover:bg-amber-700'
                        } rounded-full text-sm sm:text-base`}
                        size="sm"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirection...
                          </>
                        ) : (
                          "Choisir ce plan"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 text-center">
              💡 <strong>Besoin d'aide ?</strong> Notre équipe est là pour vous accompagner.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
