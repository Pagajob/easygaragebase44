
// Limites par plan
export const PLAN_LIMITS = {
  free: {
    vehicles: 1,
    reservations_per_month: 3,
    pdf_per_month: 3,
    users: 1,
    video_edl: false,
    storage_days: 0
  },
  essentiel: {
    vehicles: 5,
    reservations_per_month: 30,
    pdf_per_month: 30,
    users: 1,
    video_edl: false,
    storage_days: 0
  },
  pro: {
    vehicles: 15,
    reservations_per_month: 100,
    pdf_per_month: Infinity,
    users: 3,
    video_edl: true,
    storage_days: 1
  },
  entreprise: {
    vehicles: 100,
    reservations_per_month: Infinity,
    pdf_per_month: Infinity,
    users: Infinity,
    video_edl: true,
    storage_days: 3
  }
};

export const checkLimit = (organization, limitType) => {
  const plan = organization?.subscription_plan || 'free';
  const limits = PLAN_LIMITS[plan];

  switch (limitType) {
    case 'vehicles':
      return {
        canAdd: (organization?.vehicles_count || 0) < limits.vehicles,
        current: organization?.vehicles_count || 0,
        limit: limits.vehicles,
        unlimited: limits.vehicles === Infinity
      };

    case 'reservations':
      return {
        canAdd: (organization?.reservations_count_month || 0) < limits.reservations_per_month,
        current: organization?.reservations_count_month || 0,
        limit: limits.reservations_per_month,
        unlimited: limits.reservations_per_month === Infinity
      };

    case 'pdf':
      return {
        canAdd: (organization?.pdf_count_month || 0) < limits.pdf_per_month,
        current: organization?.pdf_count_month || 0,
        limit: limits.pdf_per_month,
        unlimited: limits.pdf_per_month === Infinity
      };

    case 'video_edl':
      return {
        canUse: limits.video_edl,
        available: limits.video_edl
      };

    default:
      return { canAdd: true, current: 0, limit: Infinity, unlimited: true };
  }
};

export const incrementCounter = async (base44, organization, counterType) => {
  if (!organization) return;

  const updates = {};
  
  switch (counterType) {
    case 'vehicles':
      updates.vehicles_count = (organization.vehicles_count || 0) + 1;
      break;
    case 'reservations':
      updates.reservations_count_month = (organization.reservations_count_month || 0) + 1;
      break;
    case 'pdf':
      updates.pdf_count_month = (organization.pdf_count_month || 0) + 1;
      break;
  }

  if (Object.keys(updates).length > 0) {
    await base44.entities.Organization.update(organization.id, updates);
  }
};

export const decrementCounter = async (base44, organization, counterType) => {
  if (!organization) return;

  const updates = {};
  
  switch (counterType) {
    case 'vehicles':
      // Seul les véhicules peuvent être décrémentés
      updates.vehicles_count = Math.max(0, (organization.vehicles_count || 0) - 1);
      break;
    // Les réservations et PDF ne sont JAMAIS décrémentés
    // car ils comptent le nombre total créé ce mois, pas le nombre actuel
  }

  if (Object.keys(updates).length > 0) {
    await base44.entities.Organization.update(organization.id, updates);
  }
};
