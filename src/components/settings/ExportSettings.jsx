import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Table,
  Calendar } from
"lucide-react";
import { base44 } from "@/api/base44Client";
import { filterByOrganization } from "../utils/multiTenant";

export default function ExportSettings() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (type) => {
    setIsExporting(true);

    try {
      let data = [];
      let filename = "";

      switch (type) {
        case "vehicles":
          const vehicles = await filterByOrganization('Vehicle');
          data = vehicles.map((v) => ({
            "Immatriculation": v.plate,
            "Marque": v.make,
            "Modèle": v.model,
            "Année": v.year,
            "Motorisation": v.fuel_type,
            "Kilométrage": v.mileage,
            "Statut": v.status,
            "Financement": v.financing_type,
            "Assureur": v.insurance_provider,
            "Échéance assurance": v.insurance_expiry
          }));
          filename = "vehicules.csv";
          break;

        case "clients":
          const clients = await filterByOrganization('Client');
          data = clients.map((c) => ({
            "Type": c.type,
            "Nom": c.name,
            "Société": c.company_name || "",
            "Email": c.email,
            "Téléphone": c.phone || "",
            "Adresse": c.address || "",
            "SIRET": c.siret || "",
            "Permis": c.license_number || ""
          }));
          filename = "clients.csv";
          break;

        case "reservations":
          const reservations = await filterByOrganization('Reservation');
          const vehiclesForReservations = await filterByOrganization('Vehicle');
          const clientsForReservations = await filterByOrganization('Client');

          data = reservations.map((r) => {
            const vehicle = vehiclesForReservations.find((v) => v.id === r.vehicle_id);
            const client = clientsForReservations.find((c) => c.id === r.client_id);
            return {
              "ID": r.id,
              "Client": client?.name || "",
              "Véhicule": vehicle ? `${vehicle.make} ${vehicle.model}` : "",
              "Immatriculation": vehicle?.plate || "",
              "Date début": r.start_date,
              "Date fin": r.end_date,
              "Statut": r.status,
              "Tarif": r.estimated_price || 0,
              "Lieu prise en charge": r.pickup_location || "",
              "Notes": r.notes || ""
            };
          });
          filename = "reservations.csv";
          break;
      }

      // Conversion en CSV
      const headers = Object.keys(data[0] || {});
      const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ?
        `"${value}"` :
        value;
      }).join(','))].
      join('\n');

      // Téléchargement
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export des données");
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
  {
    id: "vehicles",
    title: "Véhicules",
    description: "Export de tous vos véhicules",
    icon: FileText
  },
  {
    id: "clients",
    title: "Clients",
    description: "Export de votre base clients",
    icon: Table
  },
  {
    id: "reservations",
    title: "Réservations",
    description: "Export de vos réservations",
    icon: Calendar
  }];


  return (
    <div className="space-y-6">
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📤</span>
            Exports de données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card key={option.id} className="bg-white/50 border-white/40">
                  <CardContent className="p-4 text-center">
                    <Icon className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                    <h3 className="font-semibold mb-2">{option.title}</h3>
                    <p className="text-sm text-slate-600 mb-4">{option.description}</p>
                    <Button
                      onClick={() => handleExport(option.id)}
                      disabled={isExporting}
                      className="w-full rounded-full">

                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? "Export..." : "Exporter CSV"}
                    </Button>
                  </CardContent>
                </Card>);

            })}
          </div>
        </CardContent>
      </Card>

      {/* Informations sur les exports */}
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">À propos des exports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Format CSV</h4>
            <p className="flex items-center justify-between dark:text-slate-100 ">Les données sont exportées au format CSV (valeurs séparées par des virgules) compatible avec Excel et Google Sheets.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Encodage</h4>
            <p className="flex items-center justify-between dark:text-slate-100 dark:text-slate-100 ">L'encodage UTF-8 est utilisé pour préserver les caractères spéciaux et accents français.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Données incluses</h4>
            <p className="flex items-center justify-between dark:text-slate-100 dark:text-slate-100 dark:text-slate-100 ">Seules vos données sont incluses dans l'export. Les données des autres utilisateurs ne sont pas accessibles.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Sécurité</h4>
            <p className="flex items-center justify-between dark:text-slate-100">Assurez-vous de sécuriser les fichiers exportés car ils contiennent des informations sensibles de votre entreprise.</p>
          </div>
        </CardContent>
      </Card>
    </div>);

}