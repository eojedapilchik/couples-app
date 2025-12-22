/**
 * Centralized UI strings for i18n support
 *
 * All user-facing text should be defined here.
 * This makes it easy to:
 * 1. Change text in one place
 * 2. Add multi-language support later
 * 3. Avoid magic strings throughout the codebase
 */

import { APP_CONFIG } from './app';

const { name: CURRENCY, nameLower: CURRENCY_LOWER } = APP_CONFIG.currency;

export const STRINGS = {
  // Common
  common: {
    loading: 'Cargando...',
    error: 'Error',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Volver',
    next: 'Siguiente',
    yes: 'Si',
    no: 'No',
    maybeLater: 'Despues',
  },

  // Currency-related
  currency: {
    name: CURRENCY,
    nameLower: CURRENCY_LOWER,
    weekly: `${CURRENCY_LOWER} semanales`,
    perWeek: `${CURRENCY_LOWER}/semana`,
    suggested: (amount: number) => `${amount} ${CURRENCY_LOWER} sugeridos`,
    cost: (amount: number) => `${amount} ${CURRENCY_LOWER}`,
    costQuestion: `Cuantos ${CURRENCY_LOWER} le costara?`,
    youDecideCost: (partnerName: string) =>
      `Tu decides cuantos ${CURRENCY_LOWER} le costara a ${partnerName} este reto.`,
    partnerWillDecide: `Tu pareja decidira cuantos ${CURRENCY_LOWER} te costara (1-7)`,
    onCompletionEarn: `Al completar, tu ganaras estos ${CURRENCY_LOWER}`,
    granted: `${CURRENCY} otorgados`,
    earnExtra: `Ganar ${CURRENCY_LOWER} extra`,
    howMany: `Cuantos ${CURRENCY_LOWER}?`,
  },

  // Home page
  home: {
    title: 'Inicio',
    currencyLabel: CURRENCY,
    weeklyCurrency: (amount: number) => `${amount} ${CURRENCY_LOWER} semanales`,
  },

  // Proposals/Retos
  proposals: {
    title: 'Retos',
    received: 'Recibidos',
    sent: 'Enviados',
    noReceived: 'No hay retos recibidos',
    noSent: 'No hay retos enviados',
    accepted: (cost: number) => `Aceptado! Le costara ${cost} ${CURRENCY_LOWER}`,
    rejected: 'Rechazado',
    markedForLater: 'Marcado para despues',
    markedComplete: 'Marcado como completado',
    confirmed: `Confirmado! ${CURRENCY} otorgados`,
    propose: 'Proponer un Reto',
    createCustom: 'Crear reto personalizado',
    orChooseFromCards: 'o elige de cartas favoritas',
    noBothLiked: 'No hay cartas que les gusten a ambos.',
    voteFirst: 'Voten en las cartas primero!',
    noActivePeriod: 'No hay periodo activo. Crea uno primero.',
    noActivePeriodOrPartner: 'No hay periodo activo o pareja',
    sentMessages: {
      simple: 'Reto simple enviado!',
      guided: 'Reto guiado enviado!',
      custom: 'Reto personalizado enviado!',
    },
  },

  // Period
  period: {
    title: 'Periodo',
    weeklyCurrency: `${CURRENCY} Semanales`,
    currencyPerWeek: (amount: number) => `${amount} ${CURRENCY_LOWER}/semana`,
  },

  // Reports
  reports: {
    title: 'Reportes',
    currencyHistory: `Historial de ${CURRENCY}`,
    ledgerTypes: {
      weekly_base_grant: `${CURRENCY} semanales`,
      proposal_cost: 'Costo de propuesta',
      completion_reward: 'Recompensa por completar',
      initial_grant: `${CURRENCY} iniciales`,
    },
  },

  // Card library
  cardLibrary: {
    currencySuggested: (category: string, value: number) =>
      `${category} | ${value} ${CURRENCY_LOWER} sugeridos`,
  },

  // Game card
  gameCard: {
    currencyValue: (value: number) => `${value}`,
  },

  // Challenge wizard (already has its own STRINGS, but currency parts should use this)
  challengeWizard: {
    venusNote: `Tu pareja decidira cuantos ${CURRENCY_LOWER} te costara (1-7)`,
    rewardCredits: CURRENCY,
    rewardCreditsDesc: `Ganar ${CURRENCY_LOWER} extra`,
  },
} as const;

export default STRINGS;
