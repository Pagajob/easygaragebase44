import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
"@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Download, AlertTriangle, Loader2, FileText, Mail } from "lucide-react";
import { differenceInHours, parseISO } from "date-fns";
import { generateCheckOutReportHTML } from "./CheckOutReportGenerator";
import { formatCurrency, formatNumber, getOrganizationCurrency } from "../utils/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle } from
"@/components/ui/card";

export default function CheckOutCompleteModal({
  client,
  reservation,
  vehicle,
  organization,
  checkInData,
  checkOutData,
  onClose
}) {
  const [isSending, setIsSending] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [currency, setCurrency] = useState('EUR');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Load the organization's currency
  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await getOrganizationCurrency();
      setCurrency(curr);
    };
    loadCurrency();
  }, []);

  const handleClose = async () => {
    setIsSending(true);

    await queryClient.invalidateQueries({ queryKey: ['reservations'] });
    await queryClient.invalidateQueries({ queryKey: ['checkIns'] });
    await queryClient.invalidateQueries({ queryKey: ['checkOuts'] });
    await queryClient.invalidateQueries({ queryKey: ['vehicles'] });

    await queryClient.refetchQueries({ queryKey: ['reservations'] });
    await queryClient.refetchQueries({ queryKey: ['checkOuts'] });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    navigate(createPageUrl("Reservations"));
  };

  const handleDownloadReport = async () => {
    setIsSending(true);
    try {
      if (!reservation || !vehicle || !client || !organization || !checkInData || !checkOutData) {
        throw new Error("Données manquantes pour générer le rapport");
      }

      // Ouvrir l'HTML dans un nouvel onglet au lieu de télécharger un PDF
      const html = generateCheckOutReportHTML(reservation, vehicle, client, organization, checkInData, checkOutData);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      } else {
        alert("Veuillez autoriser les pop-ups pour visualiser l'EDL");
      }

      await handleClose();
    } catch (error) {
      console.error("❌ Erreur lors de l'ouverture du document:", error);
      alert("Une erreur est survenue lors de l'ouverture de l'EDL de retour");
      setIsSending(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      if (!reservation || !vehicle || !client || !organization || !checkInData || !checkOutData) {
        throw new Error("Données manquantes pour générer le rapport");
      }

      // Générer le HTML de l'EDL de retour
      const checkOutHtml = generateCheckOutReportHTML(reservation, vehicle, client, organization, checkInData, checkOutData);

      // Envoyer par email via la fonction backend
      const response = await base44.functions.invoke('sendCheckOutEmail', {
        reservationId: reservation.id,
        clientEmail: client.email,
        checkOutHtml: checkOutHtml,
        subject: `État des lieux de retour - ${vehicle.make} ${vehicle.model}`
      });

      if (response.data.success) {
        alert(`✅ EDL de retour envoyé avec succès à ${client.email} !\n\nLe client a reçu son état des lieux par email depuis contrats@easygarage.fr`);
        await handleClose();
      } else {
        throw new Error("Échec de l'envoi");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      const errorMessage = error.response?.data?.error || error.message;
      alert(`❌ Erreur lors de l'envoi de l'email.\n\n${errorMessage}\n\nVous pouvez ouvrir l'EDL et l'envoyer manuellement.`);
      setIsSendingEmail(false);
    }
  };

  // Calculer les km parcourus et surcoût éventuel
  const kmStart = checkInData?.mileage_start || 0;
  const kmEnd = checkOutData?.mileage_end || 0;
  const kmDifference = kmEnd - kmStart;

  // CORRECTION: 24h = 1 jour, 24h01 = 2 jours
  const startDateTime = parseISO(`${reservation.start_date}T${reservation.start_time || '18:00'}`);
  const endDateTime = parseISO(`${reservation.end_date}T${reservation.end_time || '18:00'}`);
  const hours = differenceInHours(endDateTime, startDateTime);
  const rentalDays = hours > 0 ? Math.ceil(hours / 24) : 1;

  const includedKm = vehicle?.unlimited_km ? 999999 : rentalDays * (vehicle?.daily_km_included || 200);
  const extraKm = vehicle?.unlimited_km ? 0 : Math.max(0, kmDifference - includedKm);
  const extraKmCost = extraKm * (vehicle?.price_per_extra_km || 1.00);

  const hasNewDamages = checkOutData?.damages && checkOutData.damages.length > 0;

  return (
    <Dialog open={true} onOpenChange={(open) => {if (!open && !isSending) handleClose();}}>
      <DialogContent className="max-w-[calc(100vw-2rem)] w-full sm:max-w-md bg-white/90 backdrop-blur-xl border-white/40 rounded-2xl">
        <DialogHeader>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-slate-900">
            EDL de retour complété !
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Résumé kilométrage */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Kilométrage parcouru</span>
              <span className="font-bold text-slate-900">{formatNumber(kmDifference)} km</span>
            </div>
            {!vehicle?.unlimited_km &&
            <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Durée de location</span>
                  <span className="font-semibold text-slate-900">{rentalDays} jour{rentalDays > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Inclus dans la location</span>
                  <span className="font-semibold text-slate-900">{formatNumber(includedKm)} km</span>
                </div>
              </>
            }
          </div>

          {extraKm > 0 &&
          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700">
              <CardHeader className="pb-3">
                <CardTitle className="font-semibold tracking-tight text-lg flex items-center gap-2 text-orange-900 dark:text-orange-800">Kilomètres supplémentaires


              </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="flex justify-between text-sm">
                  <span>Kilomètres inclus</span>
                  <span className="font-semibold">{includedKm.toLocaleString('fr-FR')} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Kilomètres parcourus</span>
                  <span className="font-semibold">{kmDifference.toLocaleString('fr-FR')} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dépassement</span>
                  <span className="font-semibold text-orange-700 dark:text-orange-500">
                    +{extraKm.toLocaleString('fr-FR')} km
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-orange-200 dark:border-orange-700 mt-2">
                  <span>Coût supplémentaire</span>
                  <span className="font-bold text-lg text-orange-900 dark:text-orange-800">
                    {formatCurrency(extraKmCost, currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          }

          {/* Nouveaux dégâts */}
          {hasNewDamages &&
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-orange-900 font-semibold mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Nouveaux dégâts constatés ({checkOutData.damages.length})</span>
              </div>
              <p className="text-xs text-orange-700">
                Des frais supplémentaires peuvent s'appliquer selon les dégâts constatés.
              </p>
            </div>
          }
        </div>

        <DialogFooter className="mt-6">
          <div className="space-y-3 w-full">
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || isSending}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-full">

              {isSendingEmail ?
              <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi en cours...
                </> :

              <>
                  <Mail className="w-4 h-4 mr-2" />
                  Envoyer l'EDL par email
                </>
              }
            </Button>

            <Button
              onClick={handleDownloadReport}
              disabled={isSending || isSendingEmail}
              variant="outline"
              className="w-full rounded-full">

              {isSending ?
              <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Ouverture...
                </> :

              <>
                  <FileText className="w-4 h-4 mr-2" />
                  Ouvrir l'EDL de retour
                </>
              }
            </Button>

            <Button
              onClick={handleClose}
              variant="ghost"
              disabled={isSending || isSendingEmail}
              className="w-full rounded-full">

              Fermer
            </Button>
          </div>
          <p className="text-xs text-center text-slate-500 mt-4 w-full">
            💡 Vous pourrez retrouver cet EDL à tout moment depuis la réservation
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}