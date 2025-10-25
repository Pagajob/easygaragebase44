
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
// Removed useQuery as data fetching is now handled by useEffect and useState
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Loader2, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { filterByOrganization } from "../components/utils/multiTenant";
import { useNavigate } from "react-router-dom"; // Added for programmatic navigation

export default function ViewContractPage() {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // State variables for the contract data
  const [reservation, setReservation] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [client, setClient] = useState(null);
  const [organizationData, setOrganizationData] = useState(null); // To store the current organization's data

  // State for UI loading, error handling, and PDF generation status
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper function to get the current user's organization ID
  const getCurrentOrganizationId = async () => {
    const user = await base44.auth.me();
    return user?.organization_id;
  };

  // Main data loading function
  const loadData = async () => {
    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const reservationId = urlParams.get('id'); // Changed from 'reservation' to 'id' as per outline

      if (!reservationId) {
        setError("Aucune réservation spécifiée dans l'URL.");
        setTimeout(() => navigate("/reservations"), 2000); // Redirect to reservations list
        return;
      }

      // SÉCURITÉ: Vérifier l'organization_id de l'utilisateur actuel
      const currentOrgId = await getCurrentOrganizationId();
      if (!currentOrgId) {
        setError("Impossible de déterminer votre organisation. Accès refusé.");
        setTimeout(() => navigate("/"), 2000); // Redirect to a more general page (e.g., home or login)
        return;
      }
      
      // Fetch the specific reservation directly by ID
      const reservations = await base44.entities.Reservation.filter({ id: reservationId });
      
      if (reservations.length === 0) {
        setError("Réservation non trouvée.");
        setTimeout(() => navigate("/reservations"), 2000);
        return;
      }
      
      const foundReservation = reservations[0];
      
      // SÉCURITÉ: Vérifier que la réservation appartient à l'organisation de l'utilisateur
      if (foundReservation.organization_id !== currentOrgId) {
        setError("Accès non autorisé à cette réservation.");
        setTimeout(() => navigate("/reservations"), 2000);
        return;
      }

      // Fetch related data (vehicles, clients, and the organization itself)
      // filterByOrganization is assumed to internally handle fetching data for the current user's organization
      const [allVehicles, allClients, orgs] = await Promise.all([
        filterByOrganization('Vehicle'), // Fetches vehicles for the current user's organization
        filterByOrganization('Client'),  // Fetches clients for the current user's organization
        base44.entities.Organization.filter({ id: currentOrgId }) // Fetches the specific organization details
      ]);

      const foundVehicle = allVehicles.find(v => v.id === foundReservation.vehicle_id);
      const foundClient = allClients.find(c => c.id === foundReservation.client_id);
      const foundOrganization = orgs.length > 0 ? orgs[0] : null;

      if (!foundVehicle || !foundClient || !foundOrganization) {
          setError("Données associées manquantes (véhicule, client ou organisation).");
          setTimeout(() => navigate("/reservations"), 2000);
          return;
      }

      // Update state with fetched data
      setReservation(foundReservation);
      setVehicle(foundVehicle);
      setClient(foundClient);
      setOrganizationData(foundOrganization);

    } catch (err) {
      console.error("Erreur lors du chargement des données du contrat:", err);
      setError("Une erreur inattendue est survenue lors du chargement des données.");
      setTimeout(() => navigate("/reservations"), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect hook to run data loading once on component mount
  useEffect(() => {
    loadData();
  }, []); // Empty dependency array ensures it runs only once

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Ensure all necessary data is available before invoking the PDF generation function
      if (!reservation || !vehicle || !client) {
        console.error("Impossible de générer le PDF: données de réservation, véhicule ou client manquantes.");
        setError("Impossible de générer le PDF: données manquantes.");
        return;
      }

      const response = await base44.functions.invoke('generateContract', {
        reservationId: reservation.id,
        vehicleId: vehicle.id,
        clientId: client.id
      });

      // Assuming the 'generateContract' function returns a response object with a 'data' property containing the PDF content
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Construct a user-friendly and safe filename
      const clientNameForFilename = client.name ? client.name.replace(/\s+/g, '-') : 'client-inconnu';
      const vehiclePlateForFilename = vehicle.plate || 'vehicule-inconnu';
      a.download = `contrat-${vehiclePlateForFilename}-${clientNameForFilename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url); // Clean up the object URL
      a.remove(); // Remove the temporary anchor element
    } catch (err) {
      console.error("Erreur lors de la génération du PDF:", err);
      setError("Erreur lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // --- Conditional Rendering based on component state ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-800">{error}</p>
            <Button
              onClick={() => navigate("/reservations")} // Redirect to reservations list on error
              className="mt-4 rounded-full"
            >
              Retour aux réservations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback check if data is still null after loading (should ideally be caught by error state)
  if (!reservation || !vehicle || !client) {
    return (
      <div className="p-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center">
            <p className="text-red-800">Contrat introuvable ou données associées manquantes après chargement.</p>
            <Button
              onClick={() => navigate("/reservations")}
              className="mt-4 rounded-full"
            >
              Retour aux réservations
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contractType = reservation.type === 'pret' ? 'prêt' : 'location';

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)} // Navigates back to the previous page in history
          className="rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="bg-blue-600 hover:bg-blue-700 rounded-full"
        >
          {isGeneratingPDF ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </>
          )}
        </Button>
      </div>

      {/* Title Section */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Contrat de {contractType}
        </h1>
        <p className="text-slate-600">
          {vehicle.make} {vehicle.model} - {client.name}
        </p>
      </div>

      {/* Reservation Details Card */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Détails de la réservation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Date de début</p>
              <p className="font-semibold">
                {format(parseISO(reservation.start_date), "d MMMM yyyy", { locale: fr })}
              </p>
              {reservation.start_time && (
                <p className="text-sm text-slate-600">{reservation.start_time}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-slate-500">Date de fin</p>
              <p className="font-semibold">
                {format(parseISO(reservation.end_date), "d MMMM yyyy", { locale: fr })}
              </p>
              {reservation.end_time && (
                <p className="text-sm text-slate-600">{reservation.end_time}</p>
              )}
            </div>
          </div>

          {reservation.pickup_location && (
            <div>
              <p className="text-sm text-slate-500">Lieu de prise en charge</p>
              <p className="font-semibold">{reservation.pickup_location}</p>
            </div>
          )}

          {reservation.return_location && (
            <div>
              <p className="text-sm text-slate-500">Lieu de retour</p>
              <p className="font-semibold">{reservation.return_location}</p>
            </div>
          )}

          {reservation.type === 'location' && (
            <div>
              <p className="text-sm text-slate-500">Tarif</p>
              <p className="text-2xl font-bold text-blue-600">
                {reservation.estimated_price}€
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Information Card */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Marque/Modèle</span>
            <span className="font-semibold">{vehicle.make} {vehicle.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Immatriculation</span>
            <span className="font-semibold">{vehicle.plate}</span>
          </div>
          {vehicle.vin && (
            <div className="flex justify-between">
              <span className="text-slate-600">VIN</span>
              <span className="font-semibold text-sm">{vehicle.vin}</span>
            </div>
          )}
          {vehicle.year && (
            <div className="flex justify-between">
              <span className="text-slate-600">Année</span>
              <span className="font-semibold">{vehicle.year}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Information Card */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-600">Nom</span>
            <span className="font-semibold">{client.name}</span>
          </div>
          {client.company_name && (
            <div className="flex justify-between">
              <span className="text-slate-600">Entreprise</span>
              <span className="font-semibold">{client.company_name}</span>
            </div>
          )}
          {client.email && (
            <div className="flex justify-between">
              <span className="text-slate-600">Email</span>
              <span className="font-semibold text-sm">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex justify-between">
              <span className="text-slate-600">Téléphone</span>
              <span className="font-semibold">{client.phone}</span>
            </div>
          )}
          {client.address && (
            <div className="flex justify-between">
              <span className="text-slate-600">Adresse</span>
              <span className="font-semibold text-sm text-right">{client.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signatures Card */}
      {(reservation.owner_signature || reservation.client_signature) && (
        <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reservation.owner_signature && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Signature du loueur</p>
                  <div className="border border-slate-300 rounded-lg p-2 bg-white">
                    <img
                      src={reservation.owner_signature}
                      alt="Signature loueur"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                </div>
              )}
              {reservation.client_signature && (
                <div>
                  <p className="text-sm text-slate-600 mb-2">Signature du client</p>
                  <div className="border border-slate-300 rounded-lg p-2 bg-white">
                    <img
                      src={reservation.client_signature}
                      alt="Signature client"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
            {reservation.signed_at && (
              <p className="text-sm text-slate-500 mt-4 text-center">
                Signé le {format(parseISO(reservation.signed_at), "d MMMM yyyy à HH:mm", { locale: fr })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes Card */}
      {reservation.notes && (
        <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 whitespace-pre-wrap">{reservation.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
