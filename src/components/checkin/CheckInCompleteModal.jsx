
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Loader2, Mail } from "lucide-react"; // Changed Check to CheckCircle, removed Download
import { downloadCheckInReport } from "./CheckInReportGenerator";
import { generateContractHTML } from "../reservations/ContractGenerator";
import { generateLoanContract } from "../reservations/LoanContractGenerator";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom"; // Added Link
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { filterByOrganization } from "../utils/multiTenant";
import { Card, CardContent } from "@/components/ui/card"; // Added Card and CardContent

export default function CheckInCompleteModal({ client, reservation, vehicle, organization, checkInData, onClose }) {
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); // Renamed to isOpening for semantic clarity based on new functionality
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // The previous handleClose logic (invalidation and navigation) is now expected to be handled
  // by the onClose prop passed from the parent component, as the modal explicitly uses onClose
  // for both Dialog's onOpenChange and the final close button.
  // The handleClose function previously defined here is removed.

  const handleSendEmail = async () => {
    setIsSending(true);
    try {
      // Récupérer les frais additionnels
      const additionalFees = await filterByOrganization('AdditionalFee');
      
      // Créer un objet réservation avec les signatures incluses
      const reservationWithSignatures = {
        ...reservation,
        owner_signature: checkInData.owner_signature,
        client_signature: checkInData.client_signature,
        signed_at: new Date().toISOString()
      };
      
      // CORRECTION: Générer le bon type de contrat selon le type de réservation
      let contractHtml;
      let subject;
      
      if (reservation.type === 'pret') {
        // Contrat de prêt
        contractHtml = generateLoanContract(
          reservationWithSignatures,
          vehicle,
          client,
          organization
        );
        subject = `Contrat de prêt - ${vehicle.make} ${vehicle.model}`;
      } else {
        // Contrat de location
        contractHtml = generateContractHTML(
          reservationWithSignatures,
          vehicle,
          client,
          organization,
          additionalFees
        );
        subject = `Contrat de location - ${vehicle.make} ${vehicle.model}`;
      }

      // Envoyer par email via la fonction backend
      const response = await base44.functions.invoke('sendContractEmail', {
        reservationId: reservation.id,
        clientEmail: client.email,
        contractHtml: contractHtml,
        subject: subject
      });

      if (response.data.success) {
        alert(`✅ Contrat envoyé avec succès à ${client.email} !\n\nLe client a reçu son contrat par email depuis contrats@easygarage.fr`);
      } else {
        throw new Error("Échec de l'envoi");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      const errorMessage = error.response?.data?.error || error.message;
      alert(`❌ Erreur lors de l'envoi de l'email.\n\n${errorMessage}\n\nVeuillez vérifier :\n- Que le domaine easygarage.fr est bien vérifié dans Resend\n- Que la clé API Resend est correctement configurée\n\nVous pouvez télécharger le contrat et l'envoyer manuellement.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // CORRECTION: Rediriger vers ViewCheckIn au lieu d'ouvrir une pop-up
      if (checkInData.id) {
        window.location.href = createPageUrl(`ViewCheckIn?id=${checkInData.id}`);
      } else {
        alert("Impossible d'ouvrir l'état des lieux : ID manquant");
        setIsDownloading(false); // Reset state if redirection doesn't happen
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture de l'état des lieux:", error);
      alert("Erreur lors de l'ouverture de l'état des lieux.");
      setIsDownloading(false); // Reset state on error
    }
    // If redirection is successful, component will unmount, no need to setIsDownloading(false)
  };

  return (
    <Dialog open={true} onOpenChange={onClose}> {/* Changed onOpenChange to use onClose prop */}
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40 rounded-2xl p-4 sm:p-6 shadow-2xl">
        <DialogHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Check-in terminé !
              </DialogTitle>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                L'état des lieux de départ a été enregistré avec succès.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Card className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border-white/30 dark:border-slate-700/30">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Client</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{client.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Véhicule</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {vehicle.make} {vehicle.model}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Immatriculation</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{vehicle.plate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full"
              size="lg"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ouverture...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Voir l'état des lieux
                </>
              )}
            </Button>

            <Button
              onClick={handleSendEmail}
              disabled={isSending}
              variant="outline"
              className="w-full rounded-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer le contrat par email
                </>
              )}
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full rounded-full"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
