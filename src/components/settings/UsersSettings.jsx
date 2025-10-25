
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Mail,
  Plus,
  Trash2,
  Crown,
  User as UserIcon,
  Clock,
  Check,
  X,
  Loader2 } from
"lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
"@/components/ui/alert-dialog";
import { getCurrentOrganizationId, isCurrentUserAdmin } from "../utils/multiTenant";

export default function UsersSettings() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(""); // Renamed from inviteEmail
  const [role, setRole] = useState("user"); // Renamed from inviteRole
  const [userToDelete, setUserToDelete] = useState(null);
  const [inviteToDelete, setInviteToDelete] = useState(null);

  // Récupérer l'utilisateur actuel
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  // Récupérer l'organisation
  const { data: organization } = useQuery({
    queryKey: ['organization', currentUser?.organization_id],
    queryFn: async () => {
      if (!currentUser?.organization_id) return null;
      const orgs = await base44.entities.Organization.filter({ id: currentUser.organization_id });
      return orgs.length > 0 ? orgs[0] : null;
    },
    enabled: !!currentUser?.organization_id
  });

  // CORRECTION: Utiliser la fonction backend pour récupérer tous les utilisateurs
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['organizationUsers', currentUser?.organization_id],
    queryFn: async () => {
      if (!currentUser?.organization_id) return [];

      try {
        // Appeler la fonction backend qui utilise asServiceRole
        const response = await base44.functions.invoke('getOrganizationUsers');
        console.log("📊 Utilisateurs de l'organisation:", response.data);
        return response.data.users || [];
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        return [];
      }
    },
    enabled: !!currentUser?.organization_id,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Récupérer les invitations
  const { data: invitations = [], isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitations', currentUser?.organization_id],
    queryFn: async () => {
      if (!currentUser?.organization_id) return [];
      const invites = await base44.entities.Invitation.filter({
        organization_id: currentUser.organization_id,
        status: 'en_attente'
      });
      return invites;
    },
    enabled: !!currentUser?.organization_id
  });

  // Vérifier si l'utilisateur actuel est admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ['isAdmin'],
    queryFn: isCurrentUserAdmin
  });

  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, role }) => {
      const user = await base44.auth.me();

      if (!user.organization_id) {
        throw new Error("Vous devez appartenir à une organisation pour inviter des utilisateurs");
      }

      // Générer un token unique
      const token = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Créer l'invitation dans la base de données
      const invitation = await base44.entities.Invitation.create({
        organization_id: user.organization_id,
        email,
        role,
        token,
        status: 'en_attente',
        invited_by: user.email,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
      });

      // Envoyer l'email d'invitation via la fonction backend
      const emailResult = await base44.functions.invoke('sendInvitationEmail', {
        inviteeEmail: email,
        invitationToken: token,
        role
      });

      if (!emailResult.data.success) {
        throw new Error("Erreur lors de l'envoi de l'email d'invitation");
      }

      return invitation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setEmail("");
      setRole("user");
      // setShowInviteForm(false); // This state variable is not defined in the component
      alert("Invitation envoyée avec succès !");
    },
    onError: (error) => {
      console.error("Erreur lors de l'invitation:", error);
      alert(`Erreur lors de l'envoi de l'invitation: ${error.message}`);
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationUsers'] });
      setUserToDelete(null);
      alert("Utilisateur supprimé avec succès");
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression de l'utilisateur");
    }
  });

  const deleteInvitationMutation = useMutation({
    mutationFn: (inviteId) => base44.entities.Invitation.delete(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setInviteToDelete(null);
    }
  });

  const handleSendInvite = () => {// Renamed from handleInvite
    if (!email || !email.includes('@')) {// Use 'email' state
      alert("Veuillez entrer une adresse email valide");
      return;
    }

    // Vérifier si l'email est déjà invité
    const existingInvite = invitations?.find((inv) =>
    inv.email === email && inv.status === 'en_attente'
    );

    if (existingInvite) {
      alert('Cet email a déjà une invitation en attente');
      return;
    }

    // Vérifier si l'email est déjà un membre
    const existingMember = allUsers?.find((member) => member.email === email); // Use 'allUsers' as 'members'
    if (existingMember) {
      alert('Cet utilisateur fait déjà partie de l\'organisation');
      return;
    }

    sendInviteMutation.mutate({ email, role }); // Call new mutation and pass object
  };

  const getRoleBadge = (user) => {
    const isOwner = user.email === organization?.owner_email;

    if (isOwner) {
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
          <Crown className="w-3 h-3 mr-1" />
          Propriétaire
        </Badge>);

    }

    if (user.organization_role === 'admin') {
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
          Admin
        </Badge>);

    }

    return (
      <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-400 rounded-full">
        Agent
      </Badge>);

  };

  if (usersLoading || invitationsLoading) {
    return (
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gestion des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <>
      <Card className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
        <CardHeader className="pb-3">
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Formulaire d'invitation - seulement pour les admins */}
          {isAdmin &&
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-200">
                <Mail className="w-4 h-4" />
                Inviter un nouvel utilisateur
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,auto] gap-2">
                <Input
                type="email"
                placeholder="Email de l'utilisateur"
                value={email} // Use 'email' state
                onChange={(e) => setEmail(e.target.value)} // Use 'setEmail'
                className="bg-white/70 dark:bg-slate-800/70 border-blue-300 dark:border-blue-700"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendInvite(); // Call 'handleSendInvite'
                  }
                }} />

                <Select value={role} onValueChange={setRole}> {/* Use 'role' state and 'setRole' */}
                  <SelectTrigger className="w-full sm:w-32 bg-white/70 dark:bg-slate-800/70 border-blue-300 dark:border-blue-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                onClick={handleSendInvite} // Call 'handleSendInvite'
                disabled={sendInviteMutation.isPending} // Use 'sendInviteMutation.isPending'
                className="bg-blue-600 hover:bg-blue-700">

                  {sendInviteMutation.isPending ? // Use 'sendInviteMutation.isPending'
                <Loader2 className="w-4 h-4 animate-spin" /> :

                <>
                      <Plus className="w-4 h-4 mr-1" />
                      Inviter
                    </>
                }
                </Button>
              </div>
            </div>
          }

          {/* Liste des utilisateurs */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 dark:text-slate-200">Utilisateurs actifs

            </h3>
            {allUsers.length === 0 ?
            <p className="text-center text-slate-500 py-8 text-sm">
                Aucun utilisateur trouvé
              </p> :

            allUsers.map((user) => {
              const isOwner = user.email === organization?.owner_email;
              const isCurrentUserItem = user.email === currentUser?.email;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl hover:shadow-md transition-all">

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {user.full_name}
                          </p>
                          {getRoleBadge(user)}
                          {isCurrentUserItem &&
                        <Badge variant="outline" className="rounded-full text-xs">
                              Vous
                            </Badge>
                        }
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {isAdmin && !isOwner && !isCurrentUserItem &&
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setUserToDelete(user)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex-shrink-0">

                        <Trash2 className="w-4 h-4" />
                      </Button>
                  }
                  </div>);

            })
            }
          </div>

          {/* Liste des invitations en attente */}
          {invitations.length > 0 &&
          <div className="space-y-2">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 dark:text-slate-200">Invitations en attente

            </h3>
              {invitations.map((invite) =>
            <div
              key={invite.id}
              className="flex items-center justify-between p-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {invite.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Invité le {new Date(invite.created_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded-full flex-shrink-0">
                      En attente
                    </Badge>
                  </div>

                  {isAdmin &&
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setInviteToDelete(invite)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex-shrink-0 ml-2">

                      <X className="w-4 h-4" />
                    </Button>
              }
                </div>
            )}
            </div>
          }
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression d'utilisateur */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur {userToDelete?.full_name} ({userToDelete?.email})
              perdra l'accès à l'organisation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-red-600 hover:bg-red-700">

              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmation de suppression d'invitation */}
      <AlertDialog open={!!inviteToDelete} onOpenChange={() => setInviteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette invitation ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'invitation pour {inviteToDelete?.email} sera annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => inviteToDelete && deleteInvitationMutation.mutate(inviteToDelete.id)}
              className="bg-red-600 hover:bg-red-700">

              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);

}