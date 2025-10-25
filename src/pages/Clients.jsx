
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users, Building } from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { filterByOrganization, getCurrentOrganizationId } from "../components/utils/multiTenant";

import ClientsList from "../components/clients/ClientsList";
import ClientModal from "../components/clients/ClientModal";
import ClientFilters from "../components/clients/ClientFilters";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [filteredClients, setFilteredClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all"
  });

  // Utiliser React Query avec cache optimisé
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => filterByOrganization('Client'), // Modified to filter by organization
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const applyFilters = React.useCallback(() => {
    let filtered = [...clients];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type
    if (filters.type !== "all") {
      filtered = filtered.filter(client => client.type === filters.type);
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, filters]);

  // Apply filters whenever clients, searchTerm, or filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const saveClientMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const orgId = await getCurrentOrganizationId(); // Get current organization ID
      return id 
        ? await base44.entities.Client.update(id, data)
        : await base44.entities.Client.create({
            ...data,
            organization_id: orgId // Add organization_id for new clients
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      setSelectedClient(null);
    },
    onError: (error) => {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId) => {
      await base44.entities.Client.delete(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
    }
  });

  const handleSaveClient = async (clientData) => {
    saveClientMutation.mutate({
      id: selectedClient?.id,
      data: clientData
    });
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const particuliers = clients.filter(c => c.type === 'particulier').length;
  const professionnels = clients.filter(c => c.type === 'professionnel').length;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-text-2xl font-bold text-slate-900 dark:text-white mb-1">Clients</h2>
        <p className="text-slate-500 text-sm">
          Gérez votre base ({clients.length} clients)
        </p>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm">
          <div className="flex items-center gap-1 text-slate-600">
            <Users className="w-4 h-4" />
            {particuliers} particuliers
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <Building className="w-4 h-4" />
            {professionnels} pros
          </div>
        </div>
      </div>

      {/* Add Button */}
      <Button 
        onClick={() => {
          setSelectedClient(null);
          setShowModal(true);
        }}
        className="w-full bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/30"
        size="lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Ajouter un client
      </Button>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Rechercher par nom, email ou société..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 rounded-xl bg-white/50 border border-white/20 focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <ClientFilters 
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ClientsList
        clients={filteredClients}
        isLoading={isLoading}
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
      />

      <ClientModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        onSave={handleSaveClient}
      />
    </div>
  );
}
