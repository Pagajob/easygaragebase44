import { base44 } from "@/api/base44Client";

// Cache pour la devise de l'organisation
let cachedCurrency = null;
let cacheTime = null;
const CACHE_DURATION = 60 * 1000; // 1 minute

/**
 * Valide un ID d'organisation
 */
const isValidOrganizationId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  // Un ID Base44 valide fait généralement plus de 10 caractères
  // et ne contient pas que des lettres minuscules répétées
  if (id.length < 10) return false;
  
  // Vérifier si c'est juste "aaaa" ou similaire (IDs de test invalides)
  if (/^([a-z])\1+$/.test(id)) return false;
  
  return true;
};

/**
 * Récupère la devise de l'organisation courante
 */
export const getOrganizationCurrency = async () => {
  // Utiliser le cache si disponible et récent
  if (cachedCurrency && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return cachedCurrency;
  }

  try {
    const user = await base44.auth.me();
    
    // Si pas d'organization_id, retourner EUR par défaut
    if (!user?.organization_id) {
      cachedCurrency = 'EUR';
      cacheTime = Date.now();
      return 'EUR';
    }

    // Valider l'ID avant de faire la requête
    if (!isValidOrganizationId(user.organization_id)) {
      console.warn("⚠️ ID d'organisation invalide détecté:", user.organization_id);
      cachedCurrency = 'EUR';
      cacheTime = Date.now();
      return 'EUR';
    }

    // Tenter de récupérer l'organisation
    try {
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      
      if (orgs.length > 0 && orgs[0].currency) {
        cachedCurrency = orgs[0].currency;
        cacheTime = Date.now();
        return orgs[0].currency;
      }
      
      // Organisation trouvée mais pas de devise définie
      cachedCurrency = 'EUR';
      cacheTime = Date.now();
      return 'EUR';
    } catch (filterError) {
      // Si l'organisation n'existe pas ou autre erreur, retourner EUR
      console.warn("⚠️ Organisation introuvable pour l'ID:", user.organization_id);
      cachedCurrency = 'EUR';
      cacheTime = Date.now();
      return 'EUR';
    }
  } catch (error) {
    // Erreur générale - ne pas logger pour ne pas polluer la console
    cachedCurrency = 'EUR';
    cacheTime = Date.now();
    return 'EUR';
  }
};

/**
 * Invalide le cache de la devise (à appeler après modification)
 */
export const invalidateCurrencyCache = () => {
  cachedCurrency = null;
  cacheTime = null;
};

/**
 * Retourne le symbole de la devise
 */
export const getCurrencySymbol = (currency) => {
  switch (currency) {
    case 'CHF':
      return 'CHF';
    case 'EUR':
    default:
      return '€';
  }
};

/**
 * Formate un montant avec la devise de l'organisation
 * @param {number} amount - Le montant à formatter
 * @param {string} currency - La devise (optionnel, sera récupéré si non fourni)
 * @returns {string} - Le montant formaté (ex: "16 000€" ou "16 000 CHF")
 */
export const formatCurrency = (amount, currency = null) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency ? `0 ${getCurrencySymbol(currency)}` : "0€";
  }
  
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  
  const symbol = currency ? getCurrencySymbol(currency) : '€';
  
  // Pour CHF, mettre le symbole après avec un espace
  // Pour EUR, mettre € collé
  if (currency === 'CHF') {
    return `${formatted} ${symbol}`;
  } else {
    return `${formatted}${symbol}`;
  }
};

/**
 * Formate un montant en euros (deprecated, utiliser formatCurrency)
 * @deprecated Utilisez formatCurrency à la place
 */
export const formatEuro = (amount) => {
  return formatCurrency(amount, 'EUR');
};

/**
 * Formate un nombre avec séparateur de milliers
 * @param {number} num - Le nombre à formatter
 * @returns {string} - Le nombre formaté (ex: "16 000")
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }
  
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};