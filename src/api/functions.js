import { base44 } from './base44Client';


export const createStripeCheckout = base44.functions.createStripeCheckout;

export const stripeWebhook = base44.functions.stripeWebhook;

export const getOrganizationUsers = base44.functions.getOrganizationUsers;

export const sendContractEmail = base44.functions.sendContractEmail;

export const sendCheckOutEmail = base44.functions.sendCheckOutEmail;

export const sendInvitationEmail = base44.functions.sendInvitationEmail;

export const sendOnboardingEmail = base44.functions.sendOnboardingEmail;

export const cronOnboarding = base44.functions.cronOnboarding;

export const cronWeeklyTip = base44.functions.cronWeeklyTip;

export const unsubscribe = base44.functions.unsubscribe;

export const trackEvent = base44.functions.trackEvent;

export const getPublicVehicles = base44.functions.getPublicVehicles;

export const checkVehicleAvailability = base44.functions.checkVehicleAvailability;

export const getGarageVehicles = base44.functions.getGarageVehicles;

export const getVehicleBookings = base44.functions.getVehicleBookings;

