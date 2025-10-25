
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Check, Loader2 } from "lucide-react";

const planLimits = {
  free: {
    name: "Free",
    vehicles: "1 véhicule",
    reservations: "3 réservations/mois",
    pdf: "3 documents/mois",
    users: "1 utilisateur",
    video: false,
    support: "Aucun support"
  },
  essentiel: {
    name: "Essentiel",
    vehicles: "5 véhicules",
    reservations: "30 réservations/mois",
    pdf: "30 documents/mois",
    users: "1 utilisateur",
    video: false,
    support: "Support email standard"
  },
  pro: {
    name: "Pro",
    vehicles: "15 véhicules",
    reservations: "100 réservations/mois",
    pdf: "Documents illimités",
    users: "3 utilisateurs",
    video: true,
    support: "Support prioritaire"
  },
  entreprise: {
    name: "Entreprise",
    vehicles: "100 véhicules",
    reservations: "Réservations illimitées",
    pdf: "Documents illimités",
    users: "Utilisateurs illimités",
    video: true,
    support: "Support premium avec SLA"
  }
};

export default function DowngradeConfirmModal({ isOpen, onClose, onConfirm, fromPlan, toPlan, isProcessing }) {
  const [isConfirming, setIsConfirming] = useState(false);
  
  const currentLimits = planLimits[fromPlan];
  const newLimits = planLimits[toPlan];

  if (!currentLimits || !newLimits) return null;

  const lostFeatures = [];
  
  // Comparer les fonctionnalités
  if (currentLimits.vehicles !== newLimits.vehicles) {
    lostFeatures.push({
      label: "Véhicules",
      before: currentLimits.vehicles,
      after: newLimits.vehicles
    });
  }
  
  if (currentLimits.reservations !== newLimits.reservations) {
    lostFeatures.push({
      label: "Réservations",
      before: currentLimits.reservations,
      after: newLimits.reservations
    });
  }
  
  if (currentLimits.pdf !== newLimits.pdf) {
    lostFeatures.push({
      label: "Documents PDF",
      before: currentLimits.pdf,
      after: newLimits.pdf
    });
  }
  
  if (currentLimits.users !== newLimits.users) {
    lostFeatures.push({
      label: "Utilisateurs",
      before: currentLimits.users,
      after: newLimits.users
    });
  }
  
  if (currentLimits.video && !newLimits.video) {
    lostFeatures.push({
      label: "Vidéo EDL",
      before: "Activée",
      after: "Désactivée"
    });
  }

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Erreur lors du downgrade:", error);
      // Optionally, add user-facing error feedback here
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Confirmer le changement de plan
                </DialogTitle>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Vous êtes sur le point de passer du plan <strong>{currentLimits.name}</strong> au plan <strong>{newLimits.name}</strong>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full flex-shrink-0 h-8 w-8"
              disabled={isConfirming}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Fonctionnalités perdues */}
          {lostFeatures.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Vous allez perdre l'accès à :
              </h3>
              <div className="space-y-3">
                {lostFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-4 h-4 text-orange-700 dark:text-orange-300" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white text-sm">
                        {feature.label}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="line-through">{feature.before}</span>
                        {" → "}
                        <span className="font-semibold text-orange-700 dark:text-orange-400">{feature.after}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informations importantes */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Check className="w-5 h-5" />
              À savoir
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Le changement sera effectif immédiatement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Si vous avez un abonnement payant, il sera annulé</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Aucun remboursement ne sera effectué pour la période en cours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Vous pourrez repasser à un plan supérieur à tout moment</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isConfirming}
              className="flex-1 rounded-full"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1 rounded-full bg-orange-600 hover:bg-orange-700"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Confirmer le changement"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
