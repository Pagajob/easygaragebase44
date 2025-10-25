import { base44 } from "@/api/base44Client";

/**
 * Valide un ID d'organisation
 */
const isValidOrganizationId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  // Un ID Base44 valide fait généralement plus de 10 caractères
  if (id.length < 10) return false;
  
  // Vérifier si c'est juste "aaaa" ou similaire (IDs de test invalides)
  if (/^([a-z])\1+$/.test(id)) return false;
  
  return true;
};

/**
 * Récupère l'organization_id de l'utilisateur actuel
 */
export const getCurrentOrganizationId = async () => {
  try {
    const user = await base44.auth.me();
    
    // Validation de l'ID d'organisation
    if (!user.organization_id) {
      return null;
    }
    
    if (!isValidOrganizationId(user.organization_id)) {
      console.warn("⚠️ ID d'organisation invalide:", user.organization_id);
      return null;
    }
    
    return user.organization_id;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'organization_id:", error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur a accès au multi-tenant
 * Redirige vers l'onboarding si nécessaire
 */
export const checkOrganizationAccess = async () => {
  try {
    const user = await base44.auth.me();
    
    // Exception pour l'utilisateur legacy
    if (user.email === 'pagajobteam@gmail.com') {
      return { hasAccess: true, organizationId: null, isLegacy: true };
    }
    
    if (!user.organization_id || !isValidOrganizationId(user.organization_id)) {
      // Rediriger vers l'onboarding
      window.location.href = "/Onboarding";
      return { hasAccess: false, organizationId: null };
    }
    
    return { hasAccess: true, organizationId: user.organization_id, isLegacy: false };
  } catch (error) {
    console.error("Erreur lors de la vérification d'accès:", error);
    return { hasAccess: false, organizationId: null };
  }
};

/**
 * Filtre les entités par organization_id
 */
export const filterByOrganization = async (entityName, additionalFilters = {}) => {
  const user = await base44.auth.me();
  
  // Exception pour l'utilisateur legacy
  if (user.email === 'pagajobteam@gmail.com') {
    // Pour l'utilisateur legacy, récupérer toutes les entités sans organization_id OU avec l'ancien format
    const allEntities = await base44.entities[entityName].list();
    return allEntities.filter(entity => !entity.organization_id || entity.organization_id === 'legacy');
  }
  
  const organizationId = user.organization_id;
  
  if (!organizationId || !isValidOrganizationId(organizationId)) {
    throw new Error("Organization ID manquant ou invalide. Redirection vers l'onboarding nécessaire.");
  }
  
  return base44.entities[entityName].filter({
    organization_id: organizationId,
    ...additionalFilters
  });
};

/**
 * Crée une entité avec l'organization_id automatique
 */
export const createWithOrganization = async (entityName, data) => {
  const organizationId = await getCurrentOrganizationId();
  
  if (!organizationId) {
    throw new Error("Organization ID manquant. Impossible de créer l'entité.");
  }
  
  return base44.entities[entityName].create({
    ...data,
    organization_id: organizationId
  });
};

/**
 * Vérifie si l'utilisateur actuel est admin de son organisation
 */
export const isCurrentUserAdmin = async () => {
  try {
    const user = await base44.auth.me();
    
    // Exception pour l'utilisateur legacy
    if (user.email === 'pagajobteam@gmail.com') {
      return true;
    }
    
    if (!user.organization_id || !isValidOrganizationId(user.organization_id)) {
      return false;
    }
    
    // Récupérer l'organisation
    try {
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      if (orgs.length === 0) {
        return false;
      }
      
      const org = orgs[0];
      
      // L'utilisateur est admin si son email correspond au owner_email
      return user.email === org.owner_email;
    } catch (error) {
      console.warn("⚠️ Impossible de récupérer l'organisation pour vérifier le rôle admin");
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la vérification du rôle admin:", error);
    return false;
  }
};