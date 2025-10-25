import { differenceInHours, getDay } from 'date-fns';

/**
 * Estime le prix d'une location en fonction de sa durée et des tarifs du véhicule.
 * Applique une tarification dégressive pour les longues durées et une formule weekend.
 */
export const estimatePrice = ({ price_day, price_weekend, startDate, endDate }) => {
  if (!startDate || !endDate || !price_day || startDate >= endDate) {
    return null;
  }

  const hours = differenceInHours(endDate, startDate);
  if (hours <= 0) return null;
  
  const days = Math.ceil(hours / 24);
  const isPotentialWeekend = days === 2 && getDay(startDate) === 5; // Vendredi, 2 jours

  // --- EXCEPTION : FORMULE WEEKEND ---
  // Si un prix week-end est fourni et que la réservation correspond, on l'applique en priorité.
  if (isPotentialWeekend && price_weekend && price_weekend > 0) {
    return {
      total: Math.round(price_weekend),
      days: 2,
      strategyLabel: 'Formule Weekend',
      perDay: Math.round(price_weekend / 2)
    };
  }
  
  // --- NOUVELLE LOGIQUE DÉGRESSIVE ---
  let discount = 0;
  
  if (days >= 31) {
    discount = 0.35; // -35%
  } else if (days >= 26) { // 26 à 30 jours
    discount = 0.30; // -30%
  } else if (days >= 16) { // 16 à 25 jours
    discount = 0.25; // -25%
  } else if (days >= 6) { // 6 à 15 jours
    discount = 0.20; // -20%
  } else if (days >= 3) { // 3 à 5 jours
    discount = 0.15; // -15%
  } else if (days === 2) {
    discount = 0.05; // -5%
  }
  // Pour 1 jour, le discount reste à 0.
  
  const dailyRate = price_day * (1 - discount);
  const total = Math.round(dailyRate * days);

  // Fournir un retour détaillé pour affichage
  const strategyLabel = discount > 0 ? `Long séjour (-${Math.round(discount * 100)}%)` : 'Tarif standard';
  const perDay = Math.round(total / days);

  return {
    total,
    days,
    strategyLabel,
    perDay
  };
};