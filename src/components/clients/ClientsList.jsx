
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Building,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Users } from
"lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "../shared/LoadingSpinner"; // New import

// A simple placeholder for createPageUrl.
// In a real application, this would likely be a utility function imported from a separate file
// or part of a routing setup (e.g., generating URLs for react-router or Next.js).
const createPageUrl = (path) => path;

export default function ClientsList({ clients, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <Card className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg">
        <CardContent className="py-12 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>);

  }

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2 dark:text-white mb-">Aucun client trouvé

        </h3>
        <p className="text-slate-500">
          Commencez par ajouter votre premier client.
        </p>
      </div>);

  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) =>
      <Card
        key={client.id}
        className="overflow-hidden bg-white/40 dark:bg-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
        onClick={() => window.location.href = createPageUrl(`ClientDetail?id=${client.id}`)}>

          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    {client.type === 'particulier' ?
                  <User className="w-5 h-5 text-slate-600" /> :

                  <Building className="w-5 h-5 text-slate-600" />
                  }
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight dark:text-slate-100">
                      {client.name}
                    </h3>
                    {client.company_name &&
                  <p className="text-slate-600 text-sm">
                        {client.company_name}
                      </p>
                  }
                  </div>
                </div>
              </div>
              <Badge className={`rounded-full border-none ${
            client.type === 'particulier' ?
            'bg-blue-100 text-blue-800' :
            'bg-purple-100 text-purple-800'}`
            }>
                {client.type === 'particulier' ? 'Particulier' : 'Professionnel'}
              </Badge>
            </div>

            {/* Informations de contact */}
            <div className="space-y-2.5 mb-5 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="truncate dark:text-slate-300">{client.email}</span>
              </div>

              {client.phone &&
            <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  <span className="font-bold text-slate-900 text-lg leading-tight dark:text-slate-300">{client.phone}</span>
                </div>
            }

              {client.address &&
            <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate text-xs dark:text-slate-300">{client.address}</span>
                </div>
            }
            </div>

            {/* Informations supplémentaires */}
            {client.type === 'professionnel' && client.siret &&
          <div className="mb-4 p-2 bg-purple-50/50 rounded-lg">
                <p className="text-xs text-purple-700 font-medium">
                  SIRET: {client.siret}
                </p>
              </div>
          }

            {/* Actions */}
            <div className="flex gap-3">
              <Button
              variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 flex-1 rounded-full bg-white/50 dark:bg-slate-700/50 border-slate-300/70 dark:border-slate-600/70 dark:text-slate-100"

              onClick={(e) => {
                e.stopPropagation(); // Prevent the Card's onClick from firing
                window.location.href = createPageUrl(`ClientDetail?id=${client.id}`);
              }}>

                <Edit className="w-4 h-4 mr-2" />
                Voir
              </Button>
              <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/30"
              onClick={(e) => {
                e.stopPropagation(); // Prevent the Card's onClick from firing
                onDelete(client.id);
              }}>

                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>);

}