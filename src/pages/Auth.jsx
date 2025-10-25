
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createPageUrl } from "@/utils";

const EASYGARAGE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68da84aca844db7bb5ada5ae/478ef86e1_Icon-macOS-Default-1024x10242x.png";

export default function AuthPage() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isProcessingInvite, setIsProcessingInvite] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    checkAuthAndInvite();
  }, []);

  const checkAuthAndInvite = async () => {
    try {
      console.log("=== DÉBUT CHECK AUTH AND INVITE ===");
      
      // Récupérer le token d'invitation depuis l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const inviteToken = urlParams.get('invite');
      
      console.log("Token d'invitation dans l'URL:", inviteToken);

      // Vérifier si l'utilisateur est déjà authentifié
      const isAuthenticated = await base44.auth.isAuthenticated();
      console.log("Est authentifié:", isAuthenticated);
      
      if (isAuthenticated) {
        const user = await base44.auth.me();
        console.log("Utilisateur connecté:", user.email, "organization_id:", user.organization_id);
        
        // PRIORITÉ 1: Vérifier d'abord s'il y a un token en attente dans sessionStorage
        const pendingToken = sessionStorage.getItem('pending_invite_token');
        console.log("Token en attente dans sessionStorage:", pendingToken);
        
        if (pendingToken) {
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
          // Traiter l'invitation en attente
          await processInvitation(user, pendingToken);
          return;
        }
        
        // PRIORITÉ 2: Token dans l'URL
        if (inviteToken) {
          // Nettoyer l'URL
          window.history.replaceState({}, document.title, window.location.pathname);
          await processInvitation(user, inviteToken);
          return;
        }
        
        // PRIORITÉ 3: Pas d'invitation, redirection normale
        if (!user.organization_id) {
          console.log("Pas d'organisation -> Onboarding");
          window.location.href = createPageUrl("Onboarding");
        } else {
          console.log("A une organisation -> Page d'accueil");
          window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
        }
      } else {
        // Pas authentifié
        console.log("Utilisateur non authentifié");
        
        if (inviteToken) {
          // Stocker le token dans sessionStorage pour le récupérer après login
          sessionStorage.setItem('pending_invite_token', inviteToken);
          console.log("✅ Token stocké dans sessionStorage:", inviteToken);
        }
        
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      setError("Erreur lors de la vérification de l'authentification");
      setIsCheckingAuth(false);
    }
  };

  const processInvitation = async (user, token) => {
    setIsProcessingInvite(true);
    console.log("=== TRAITEMENT INVITATION ===");
    console.log("Token:", token);
    console.log("Utilisateur:", user.email, "ID:", user.id);
    console.log("Organization actuelle:", user.organization_id);
    
    try {
      // Récupérer l'invitation
      const invitations = await base44.entities.Invitation.filter({ token });
      console.log("Nombre d'invitations trouvées:", invitations.length);
      
      if (invitations.length === 0) {
        console.error("❌ Aucune invitation trouvée avec ce token");
        setError("Invitation invalide ou expirée");
        setIsProcessingInvite(false);
        
        setTimeout(() => {
          if (!user.organization_id) {
            window.location.href = createPageUrl("Onboarding");
          } else {
            window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
          }
        }, 3000);
        return;
      }

      const invitation = invitations[0];
      console.log("Invitation trouvée:", {
        id: invitation.id,
        email: invitation.email,
        organization_id: invitation.organization_id,
        role: invitation.role, // NOUVEAU: Ajout du rôle
        status: invitation.status,
        expires_at: invitation.expires_at
      });

      // Vérifier si l'invitation est toujours valide
      if (invitation.status !== 'en_attente') {
        console.error("❌ Invitation déjà utilisée ou expirée");
        setError("Cette invitation a déjà été utilisée ou est expirée");
        setIsProcessingInvite(false);
        
        setTimeout(() => {
          if (!user.organization_id) {
            window.location.href = createPageUrl("Onboarding");
          } else {
            window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
          }
        }, 3000);
        return;
      }

      // Vérifier la date d'expiration
      if (invitation.expires_at) {
        const expiryDate = new Date(invitation.expires_at);
        if (expiryDate < new Date()) {
          console.error("❌ Invitation expirée");
          setError("Cette invitation a expiré");
          setIsProcessingInvite(false);
          
          setTimeout(() => {
            if (!user.organization_id) {
              window.location.href = createPageUrl("Onboarding");
            } else {
              window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
            }
          }, 3000);
          return;
        }
      }

      console.log("✅ Invitation valide, mise à jour de l'utilisateur...");
      console.log("Organization ID de l'invitation:", invitation.organization_id);

      // Mettre à jour l'utilisateur avec l'organization_id ET le rôle agent
      await base44.auth.updateMe({
        organization_id: invitation.organization_id,
        organization_role: "agent" // NOUVEAU: Les invités sont des agents
      });

      console.log("✅ Utilisateur mis à jour avec organization_id:", invitation.organization_id, "et rôle: agent");

      // Vérifier que la mise à jour a fonctionné
      const updatedUser = await base44.auth.me();
      console.log("Utilisateur après mise à jour:", {
        email: updatedUser.email,
        organization_id: updatedUser.organization_id,
        organization_role: updatedUser.organization_role
      });

      if (updatedUser.organization_id !== invitation.organization_id) {
        console.error("❌ ERREUR: organization_id n'a pas été mis à jour correctement!");
        console.error("Attendu:", invitation.organization_id);
        console.error("Obtenu:", updatedUser.organization_id);
        throw new Error("La mise à jour de l'organization_id a échoué");
      }

      console.log("✅ Organisation mise à jour avec succès");

      // Marquer l'invitation comme acceptée
      await base44.entities.Invitation.update(invitation.id, {
        status: 'acceptee'
      });

      console.log("✅ Invitation marquée comme acceptée");

      // Nettoyer le sessionStorage
      sessionStorage.removeItem('pending_invite_token');
      console.log("✅ SessionStorage nettoyé");

      // Message de succès
      setSuccessMessage("Invitation acceptée ! Bienvenue dans l'équipe. Redirection...");

      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        console.log("Redirection vers la page d'accueil");
        // Forcer un rechargement complet pour s'assurer que toutes les données sont à jour
        window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
      }, 2000);

    } catch (error) {
      console.error("❌ Erreur lors du traitement de l'invitation:", error);
      setError("Erreur lors du traitement de l'invitation: " + error.message);
      setIsProcessingInvite(false);
      
      // Rediriger après erreur
      setTimeout(() => {
        if (!user.organization_id) {
          window.location.href = createPageUrl("Onboarding");
        } else {
          window.location.href = "/"; // MODIFIÉ: Redirection vers la racine
        }
      }, 3000);
    }
  };

  const handleLogin = () => {
    // Construire l'URL de retour
    const returnUrl = window.location.href;
    console.log("=== CONNEXION ===");
    console.log("ReturnUrl:", returnUrl);
    console.log("Token en attente:", sessionStorage.getItem('pending_invite_token'));
    base44.auth.redirectToLogin(returnUrl);
  };

  if (isCheckingAuth || isProcessingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-lg border-white/40 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={EASYGARAGE_LOGO} 
                alt="EasyGarage" 
                className="w-20 h-20 rounded-2xl shadow-lg"
              />
            </div>
            
            {successMessage ? (
              <>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-semibold text-green-900 mb-2">
                  Succès !
                </p>
                <p className="text-slate-600">{successMessage}</p>
              </>
            ) : (
              <>
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-slate-600">
                  {isProcessingInvite ? "Traitement de votre invitation..." : "Vérification..."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md bg-white/70 backdrop-blur-lg border-white/40 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={EASYGARAGE_LOGO} 
                alt="EasyGarage" 
                className="w-20 h-20 rounded-2xl shadow-lg"
              />
            </div>
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
            <p className="text-lg font-semibold text-red-900 mb-2">
              Erreur
            </p>
            <p className="text-slate-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = createPageUrl("Dashboard")} className="w-full rounded-full">
              Retour au Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPendingInvite = sessionStorage.getItem('pending_invite_token');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-lg border-white/40 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img 
              src={EASYGARAGE_LOGO} 
              alt="EasyGarage" 
              className="w-20 h-20 rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {hasPendingInvite ? "Rejoignez l'équipe" : "Bienvenue sur EasyGarage"}
          </CardTitle>
          <p className="text-slate-600 mt-2">
            {hasPendingInvite 
              ? "Vous avez été invité à rejoindre une organisation" 
              : "Gérez votre parc de véhicules en toute simplicité"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleLogin}
            className="w-full h-12 text-lg rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {hasPendingInvite ? "Accepter l'invitation" : "Se connecter / S'inscrire"}
          </Button>
          
          {hasPendingInvite && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900 font-medium text-center">
                ✨ Après connexion, vous aurez accès aux données partagées de l'organisation
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
