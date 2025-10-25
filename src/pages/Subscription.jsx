
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Crown,
  Rocket,
  Building2,
  CheckCircle,
  Loader2,
  Sparkles,
  Calendar
} from "lucide-react";
import { getCurrentOrganizationId } from "../components/utils/multiTenant";
import LoadingSpinner from "../components/shared/LoadingSpinner";
import DowngradeConfirmModal from "../components/subscription/DowngradeConfirmModal";

const plans = {
  free: {
    name: "Gratuit",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: Building2,
    color: "slate",
    features: [
      "1 véhicule",
      "3 réservations / mois",
      "3 documents PDF / mois",
      "1 utilisateur"
    ]
  },
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

const calculateSavings = (monthlyPrice, annualPrice) => {
  const yearlyMonthly = monthlyPrice * 12;
  const savings = Math.round(yearlyMonthly - annualPrice);
  const savingsPercent = Math.round((savings / yearlyMonthly) * 100);
  return { savings, savingsPercent };
};

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const orgId = await getCurrentOrganizationId();
      if (!orgId) return null;
      const orgs = await base44.entities.Organization.filter({ id: orgId });
      return orgs.length > 0 ? orgs[0] : null;
    }
  });

  const handleChoosePlan = async (planKey) => {
    const plan = plans[planKey];
    const currentPlan = organization?.subscription_plan || 'free';

    // Vérifier si c'est un downgrade
    const planOrder = ['free', 'essentiel', 'pro', 'entreprise'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const newIndex = planOrder.indexOf(planKey);

    if (newIndex < currentIndex) {
      setSelectedPlan({ key: planKey, ...plan });
      setShowDowngradeModal(true);
      return;
    }

    // Continuer avec l'upgrade
    setProcessingPlanId(planKey);

    try {
      const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
      
      const response = await base44.functions.invoke('createStripeCheckout', {
        priceId: priceId,
        planId: planKey
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("URL de paiement non reçue");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la session:", error);
      alert("Erreur lors de la redirection vers le paiement. Veuillez réessayer.");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      return;
    }

    try {
      // TODO: Implémenter l'annulation via Stripe
      alert("Fonctionnalité à venir");
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      alert("Erreur lors de l'annulation de l'abonnement");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner text="Chargement de votre abonnement..." />
      </div>
    );
  }

  const currentPlan = organization?.subscription_plan || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Choisissez votre plan
          </h1>
          <p className="text-slate-600 text-lg mb-8">
            Des plans adaptés à chaque besoin, du particulier à l'entreprise
          </p>

          {/* Toggle Mensuel/Annuel */}
          <div className="inline-flex items-center gap-2 sm:gap-4 bg-white/70 backdrop-blur-lg border border-white/40 rounded-[100px] p-2 shadow-lg">
            <span className={`text-xs sm:text-sm font-semibold px-2 sm:px-4 transition-colors ${!isAnnual ? 'text-indigo-600' : 'text-slate-500'}`}>
              Mensuel
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-indigo-600"
            />
            <div className="flex items-center gap-1 sm:gap-2">
              <span className={`text-xs sm:text-sm font-semibold transition-colors ${isAnnual ? 'text-indigo-600' : 'text-slate-500'}`}>
                Annuel
              </span>
              <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Économisez jusqu'à 200€</span>
                <span className="sm:hidden"> jusqu'à -200€</span>
              </Badge>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(plans).filter(([key]) => key !== 'free').map(([planKey, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === planKey;
            const isProcessing = processingPlanId === planKey;
            const displayPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const priceLabel = isAnnual ? '/an' : '/mois';
            
            const { savings, savingsPercent } = calculateSavings(plan.monthlyPrice, plan.annualPrice);

            return (
              <Card
                key={planKey}
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-purple-400 shadow-2xl scale-105'
                    : 'border border-white/40 shadow-lg hover:shadow-xl'
                } bg-white/70 backdrop-blur-lg rounded-2xl`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 text-xs font-semibold rounded-bl-lg">
                    ⭐ POPULAIRE
                  </div>
                )}

                {isAnnual && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 text-xs font-semibold rounded-br-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Économisez {savings}€
                  </div>
                )}

                <CardHeader className="text-center pt-8 pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${
                    plan.color === 'blue' ? 'from-blue-500 to-blue-600' :
                    plan.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    'from-amber-500 to-amber-600'
                  } rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {displayPrice}€
                    </span>
                    <span className="text-slate-600 text-sm font-medium">{priceLabel}</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-emerald-600 font-semibold mt-2">
                      Soit {(displayPrice / 12).toFixed(2)}€/mois · Économie de {savingsPercent}%
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleChoosePlan(planKey)}
                    disabled={isCurrentPlan || isProcessing}
                    className={`w-full h-12 rounded-[100px] font-semibold text-base transition-all ${
                      isCurrentPlan
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : plan.color === 'blue'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/30'
                        : plan.color === 'purple'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/30'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Redirection...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Plan actuel
                      </>
                    ) : (
                      `Choisir ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Plan gratuit */}
        <Card className="bg-white/50 backdrop-blur-lg border border-white/40 rounded-2xl shadow-lg max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Plan Gratuit</h3>
                  <p className="text-sm text-slate-600">Idéal pour tester la plateforme</p>
                </div>
              </div>
              {currentPlan === 'free' && (
                <Badge className="bg-slate-200 text-slate-700 border-0">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Plan actuel
                </Badge>
              )}
            </div>
            <ul className="grid grid-cols-2 gap-3 mt-4">
              {plans.free.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-4">
            <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">💳 Comment fonctionne le paiement ?</h3>
                <p className="text-slate-600">
                  Le paiement est sécurisé par Stripe. Vous pouvez payer par carte bancaire. 
                  L'abonnement se renouvelle automatiquement à la fin de chaque période.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">📅 Puis-je changer de plan ?</h3>
                <p className="text-slate-600">
                  Oui, vous pouvez passer à un plan supérieur à tout moment. 
                  Le changement est immédiat et vous ne payez que la différence au prorata.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">💰 Pourquoi choisir l'abonnement annuel ?</h3>
                <p className="text-slate-600">
                  L'abonnement annuel vous permet d'économiser jusqu'à 17% par rapport au paiement mensuel. 
                  C'est l'option idéale si vous prévoyez d'utiliser EasyGarage sur le long terme.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-lg border border-white/40 rounded-xl">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">🔄 Puis-je annuler mon abonnement ?</h3>
                <p className="text-slate-600">
                  Oui, vous pouvez annuler à tout moment. Votre abonnement restera actif jusqu'à la fin de la période payée, 
                  puis vous serez automatiquement basculé sur le plan gratuit.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de downgrade */}
      {showDowngradeModal && selectedPlan && (
        <DowngradeConfirmModal
          isOpen={showDowngradeModal}
          onClose={() => {
            setShowDowngradeModal(false);
            setSelectedPlan(null);
          }}
          currentPlan={currentPlan}
          newPlan={selectedPlan}
          onConfirm={() => {
            setShowDowngradeModal(false);
            // TODO: Implémenter le downgrade
            alert("Fonctionnalité à venir");
          }}
        />
      )}
    </div>
  );
}
