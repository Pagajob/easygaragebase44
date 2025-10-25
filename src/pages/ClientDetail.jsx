
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  History,
  Euro,
  Edit,
  Calendar,
  Trash2, // Added from outline
  AlertTriangle // Added from outline
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatEuro } from "../components/utils/formatters";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant"; // Added from outline

import ClientModal from "../components/clients/ClientModal";
import LoadingSpinner from "../components/shared/LoadingSpinner";

export default function ClientDetailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Added from outline
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Added for delete confirmation

  // Use a local error state, which will be set by onError callbacks from useQuery
  const [error, setError] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  // SÉCURITÉ: Charger le client avec vérification d'organization
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) {
        setError("Aucun client spécifié"); // Set local error
        throw new Error("ID client manquant");
      }

      const currentOrgId = await getCurrentOrganizationId();
      // Use base44.entities.Client.filter for consistency and safety.
      // This implicitly filters by organization if the backend supports it,
      // or we'll filter manually after.
      const clients = await base44.entities.Client.filter({ id: clientId });

      if (clients.length === 0) {
        setError("Client non trouvé"); // Set local error
        throw new Error("Client non trouvé");
      }

      const foundClient = clients[0];

      // SÉCURITÉ: Vérifier que le client appartient à l'organisation de l'utilisateur
      if (foundClient.organization_id !== currentOrgId) {
        setError("Accès non autorisé à ce client."); // Set local error
        throw new Error("Accès non autorisé");
      }

      return foundClient;
    },
    enabled: !!clientId, // Only run query if clientId exists
    retry: false, // Do not retry on error, especially for auth errors
    onError: (err) => {
      console.error("Erreur lors du chargement du client:", err);
      // Set the error state based on the specific message or a generic one
      let errorMessage = err.message || "Une erreur inattendue est survenue.";
      if (errorMessage.includes("ID client manquant") || errorMessage.includes("Client non trouvé")) {
        // If it's a "not found" or "missing ID" error, set a user-friendly message and navigate
        setError(errorMessage);
        setTimeout(() => navigate(createPageUrl("Clients")), 2000);
      } else if (errorMessage.includes("Accès non autorisé")) {
        // For unauthorized access
        setError("Vous n'êtes pas autorisé à voir ce client.");
      } else {
        setError(errorMessage); // Catch other unexpected errors
      }
    }
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['reservationsForClient', clientId], // More specific key for client's reservations
    queryFn: async () => {
      // Fetch all reservations for the current organization, then filter by this client
      const orgReservations = await filterByOrganization('Reservation');
      return orgReservations.filter((r) => r.client_id === clientId);
    },
    enabled: !!client, // Only fetch reservations if client data is available
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'], // Vehicles might be shared or independent of specific client
    queryFn: () => filterByOrganization('Vehicle'),
    enabled: !!client, // Only fetch vehicles if client data is available
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const updateClientMutation = useMutation({
    mutationFn: async (clientData) => {
      // SÉCURITÉ: Vérifier à nouveau l'organization_id avant la mise à jour
      const currentOrgId = await getCurrentOrganizationId();
      if (client.organization_id !== currentOrgId) {
        throw new Error("Accès non autorisé à ce client.");
      }
      return base44.entities.Client.update(clientId, clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Invalidate general clients list too
      setShowEditModal(false);
    },
    onError: (err) => {
      console.error("Erreur lors de la sauvegarde du client:", err);
      setError(err.message || "Impossible de sauvegarder le client.");
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: async () => {
      // SÉCURITÉ: Vérifier à nouveau l'organization_id avant la suppression
      const currentOrgId = await getCurrentOrganizationId();
      if (client.organization_id !== currentOrgId) {
        throw new Error("Accès non autorisé à ce client.");
      }
      return base44.entities.Client.delete(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] }); // Invalidate general clients list
      navigate(createPageUrl("Clients")); // Navigate after successful deletion
    },
    onError: (err) => {
      console.error("Erreur lors de la suppression du client:", err);
      setError(err.message || "Impossible de supprimer le client.");
    }
  });

  // Replaces the old handleSaveClient
  const handleSaveClient = (clientData) => {
    updateClientMutation.mutate(clientData);
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model}` : "Véhicule inconnu";
  };

  // Statistiques - these depend on `reservations` which is now from useQuery
  const completedReservations = reservations.filter((r) => r.status === 'terminee' || r.status === 'checked_in');
  const totalSpent = completedReservations.reduce((sum, r) => sum + (r.estimated_price || 0), 0);

  // Loading state
  if (clientLoading || reservationsLoading || vehiclesLoading) {// Check all loading states
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>);

  }

  // Error handling from useQuery, including unauthorized access
  if (error || !client) {// if client is null and not loading, it means it wasn't found or access denied
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Erreur de chargement</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error || "Client non trouvé ou accès refusé."}</p>
            <Link to={createPageUrl("Clients")}>
              <Button>Retour aux clients</Button>
            </Link>
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to={createPageUrl("Clients")}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex gap-2"> {/* Group buttons */}
            <Button
              onClick={() => setShowEditModal(true)}
              size="sm"
              className="rounded-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">

              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              size="sm"
              variant="destructive"
              className="rounded-full">

              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        {/* Card 1: Nom et documents */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                {client.type === 'particulier' ?
                <User className="w-8 h-8 text-white" /> :

                <Building className="w-8 h-8 text-white" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {client.name}
                </h1>
                {client.company_name &&
                <p className="text-slate-600 dark:text-slate-400 truncate">{client.company_name}</p>
                }
                <Badge className={`mt-2 rounded-full ${
                client.type === 'particulier' ?
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`
                }>
                  {client.type === 'particulier' ? 'Particulier' : 'Professionnel'}
                </Badge>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-3 mt-4">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Documents</p>

              <div className="grid grid-cols-2 gap-3">
                {/* Pièce d'identité */}
                {client.id_photo_url ?
                <button
                  onClick={() => setSelectedImage({ url: client.id_photo_url, title: "Pièce d'identité" })}
                  className="relative group overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all">

                    <img
                    src={client.id_photo_url}
                    alt="Pièce d'identité"
                    className="w-full h-32 object-cover" />

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium">Pièce d'identité</p>
                      {client.id_document &&
                    <p className="text-white/80 text-xs truncate">{client.id_document}</p>
                    }
                    </div>
                  </button> :

                <div className="h-32 bg-slate-100 dark:bg-slate-700/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Aucune pièce d'identité</p>
                  </div>
                }

                {/* Permis de conduire */}
                {client.license_photo_url ?
                <button
                  onClick={() => setSelectedImage({ url: client.license_photo_url, title: "Permis de conduire" })}
                  className="relative group overflow-hidden rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all">

                    <img
                    src={client.license_photo_url}
                    alt="Permis de conduire"
                    className="w-full h-32 object-cover" />

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium">Permis de conduire</p>
                      {client.license_number &&
                    <p className="text-white/80 text-xs truncate">{client.license_number}</p>
                    }
                    </div>
                  </button> :

                <div className="h-32 bg-slate-100 dark:bg-slate-700/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center">
                    <CreditCard className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Aucun permis</p>
                  </div>
                }
              </div>

              {client.license_date &&
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Permis obtenu le {format(parseISO(client.license_date), 'dd/MM/yyyy', { locale: fr })}
                </p>
              }
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Informations de contact */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">Informations de contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-[100px] flex items-center gap-3 dark:bg-slate-700/50">
              <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {client.phone || "Non renseigné"}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-[100px] flex items-center gap-3 dark:bg-slate-700/50">
              <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                <p className="font-medium text-slate-900 dark:text-white truncate">
                  {client.email}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-[100px] flex items-start gap-3 dark:bg-slate-700/50">
              <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">Adresse</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {client.address || "Non renseignée"}
                </p>
              </div>
            </div>

            {client.type === 'professionnel' && client.siret &&
            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-purple-600 dark:text-purple-400">SIRET</p>
                  <p className="font-mono font-semibold text-purple-900 dark:text-purple-200">
                    {client.siret}
                  </p>
                </div>
              </div>
            }
          </CardContent>
        </Card>

        {/* Card 3: Notes */}
        {client.notes &&
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">
                {client.notes}
              </p>
            </CardContent>
          </Card>
        }

        {/* Card 4: Statistiques */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="font-semibold tracking-tight text-lg dark:text-slate-100">Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => navigate(createPageUrl("Reservations"))} className="bg-blue-50 p-4 rounded-[100px] w-full flex items-center justify-between dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">


              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                    {completedReservations.length}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Locations effectuées
                  </p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-blue-500 rotate-180" />
            </button>

            <div className="bg-green-50 p-4 rounded-[100px] flex items-center justify-between dark:bg-green-900/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Euro className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                    {formatEuro(totalSpent)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Total dépensé
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3 text-center rounded-[100px] dark:bg-slate-700/50">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {reservations.filter((r) => r.status === 'confirmee').length}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Confirmées
                </p>
              </div>
              <div className="bg-slate-50 p-3 text-center rounded-[100px] dark:bg-slate-700/50">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {reservations.filter((r) => r.status === 'annulee').length}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Annulées
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal d'édition */}
      <ClientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={client}
        onSave={handleSaveClient} />

      {/* Modal de confirmation de suppression (added) */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <CardHeader>
            <CardTitle>Supprimer le client?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Êtes-vous sûr de vouloir supprimer "{client?.name}" ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteClientMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteClientMutation.isPending}>

                {deleteClientMutation.isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </CardContent>
        </DialogContent>
      </Dialog>

      {/* Modal d'affichage d'image */}
      {selectedImage &&
      <Dialog open={true} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-0">
            <div className="relative">
              <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">

                <span className="text-white text-2xl">×</span>
              </button>
              <div className="p-4">
                <h3 className="text-white text-lg font-semibold mb-4">{selectedImage.title}</h3>
                <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg" />

              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    </div>);

}