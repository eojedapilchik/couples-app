import axios from 'axios';
import type {
  User,
  LoginRequest,
  LoginResponse,
  Card,
  CardCreate,
  CardListResponse,
  VoteRequest,
  CardCategory,
  Period,
  PeriodCreate,
  PeriodListResponse,
  Proposal,
  ProposalCreate,
  ProposalRespondRequest,
  ProposalListResponse,
  ProposalStatus,
  CreditBalance,
  CreditLedgerListResponse,
  PreferenceType,
} from './types';

// API base URL - use proxy in dev, direct in production
const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || 'Error de conexion';
    return Promise.reject(new Error(message));
  }
);

// Auth
export const authApi = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/auth/users');
    return data;
  },
  login: async (request: LoginRequest): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', request);
    return data;
  },
};

// Cards
export const cardsApi = {
  getCards: async (params?: {
    category?: CardCategory;
    user_id?: number;
    partner_id?: number;
    unvoted_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CardListResponse> => {
    const { data } = await api.get('/cards', { params });
    return data;
  },
  getCard: async (cardId: number): Promise<Card> => {
    const { data } = await api.get(`/cards/${cardId}`);
    return data;
  },
  createCard: async (card: CardCreate): Promise<Card> => {
    const { data } = await api.post('/cards', card);
    return data;
  },
  voteOnCard: async (
    cardId: number,
    userId: number,
    preference: PreferenceType
  ): Promise<void> => {
    await api.post(`/cards/${cardId}/vote`, { preference } as VoteRequest, {
      params: { user_id: userId },
    });
  },
  getLikedByBoth: async (user1Id: number, user2Id: number): Promise<Card[]> => {
    const { data } = await api.get('/cards/liked/both', {
      params: { user1_id: user1Id, user2_id: user2Id },
    });
    return data;
  },
};

// Periods
export const periodsApi = {
  getPeriods: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PeriodListResponse> => {
    const { data } = await api.get('/periods', { params });
    return data;
  },
  getActivePeriod: async (): Promise<Period | null> => {
    const { data } = await api.get('/periods/active');
    return data;
  },
  getPeriod: async (periodId: number): Promise<Period> => {
    const { data } = await api.get(`/periods/${periodId}`);
    return data;
  },
  createPeriod: async (period: PeriodCreate): Promise<Period> => {
    const { data } = await api.post('/periods', period);
    return data;
  },
  activatePeriod: async (periodId: number): Promise<Period> => {
    const { data } = await api.patch(`/periods/${periodId}/activate`);
    return data;
  },
  completePeriod: async (periodId: number): Promise<Period> => {
    const { data } = await api.patch(`/periods/${periodId}/complete`);
    return data;
  },
  getPeriodProposals: async (
    periodId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<ProposalListResponse> => {
    const { data } = await api.get(`/periods/${periodId}/proposals`, { params });
    return data;
  },
};

// Proposals
export const proposalsApi = {
  getProposals: async (params: {
    user_id: number;
    as_recipient?: boolean;
    status?: ProposalStatus;
    limit?: number;
    offset?: number;
  }): Promise<ProposalListResponse> => {
    const { data } = await api.get('/proposals', { params });
    return data;
  },
  getProposal: async (proposalId: number): Promise<Proposal> => {
    const { data } = await api.get(`/proposals/${proposalId}`);
    return data;
  },
  createProposal: async (
    proposal: ProposalCreate,
    userId: number
  ): Promise<Proposal> => {
    const { data } = await api.post('/proposals', proposal, {
      params: { user_id: userId },
    });
    return data;
  },
  respondToProposal: async (
    proposalId: number,
    userId: number,
    response: ProposalStatus,
    creditCost?: number
  ): Promise<Proposal> => {
    const body: ProposalRespondRequest = { response };
    if (creditCost !== undefined) {
      body.credit_cost = creditCost;
    }
    const { data } = await api.patch(
      `/proposals/${proposalId}/respond`,
      body,
      { params: { user_id: userId } }
    );
    return data;
  },
  markComplete: async (proposalId: number, userId: number): Promise<Proposal> => {
    const { data } = await api.patch(`/proposals/${proposalId}/complete`, null, {
      params: { user_id: userId },
    });
    return data;
  },
  confirmCompletion: async (
    proposalId: number,
    userId: number
  ): Promise<Proposal> => {
    const { data } = await api.patch(`/proposals/${proposalId}/confirm`, null, {
      params: { user_id: userId },
    });
    return data;
  },
};

// Credits
export const creditsApi = {
  getBalance: async (userId: number): Promise<CreditBalance> => {
    const { data } = await api.get('/credits/balance', {
      params: { user_id: userId },
    });
    return data;
  },
  getLedger: async (
    userId: number,
    params?: { limit?: number; offset?: number }
  ): Promise<CreditLedgerListResponse> => {
    const { data } = await api.get('/credits/ledger', {
      params: { user_id: userId, ...params },
    });
    return data;
  },
};

export default api;
