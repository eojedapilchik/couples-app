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
  Tag,
  TagsGroupedResponse,
  Period,
  PeriodCreate,
  PeriodListResponse,
  Proposal,
  ProposalCreate,
  ProposalUpdate,
  ProposalRespondRequest,
  ProposalListResponse,
  ProposalStatus,
  CreditBalance,
  CreditLedgerListResponse,
  PreferenceType,
  PartnerVotesResponse,
  AdminResetResponse,
  CardContentUpdate,
  CardContentResponse,
  CardCreateAdmin,
  Grouping,
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
    const detail = error.response?.data?.detail;
    let message = 'Error de conexion';
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((item) => (typeof item === 'string' ? item : item?.msg || item?.message))
        .filter(Boolean)
        .join(', ') || message;
    } else if (detail) {
      message = JSON.stringify(detail);
    }
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

// Tags
export const tagsApi = {
  getTags: async (tagType?: string): Promise<Tag[]> => {
    const { data } = await api.get('/tags', { params: { tag_type: tagType } });
    return data;
  },
  getTagsGrouped: async (): Promise<TagsGroupedResponse> => {
    const { data } = await api.get('/tags/grouped');
    return data;
  },
};

// Groupings
export const groupingsApi = {
  getGroupings: async (): Promise<Grouping[]> => {
    const { data } = await api.get('/groupings');
    return data;
  },
};

// Cards
export const cardsApi = {
  getCards: async (params?: {
    category?: CardCategory;
    grouping_slug?: string;
    grouping_id?: number;
    user_id?: number;
    partner_id?: number;
    is_challenge?: boolean;
    tags?: string[];
    exclude_tags?: string[];
    unvoted_only?: boolean;
    voted_only?: boolean;
    locale?: string;
    limit?: number;
    offset?: number;
  }): Promise<CardListResponse> => {
    // Convert arrays to comma-separated strings for the API
    const queryParams: Record<string, unknown> = { ...params };
    if (params?.tags?.length) {
      queryParams.tags = params.tags.join(',');
    }
    if (params?.exclude_tags?.length) {
      queryParams.exclude_tags = params.exclude_tags.join(',');
    }
    const { data } = await api.get('/cards', { params: queryParams });
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
  deleteVote: async (
    cardId: number,
    userId: number
  ): Promise<void> => {
    await api.delete(`/cards/${cardId}/vote`, {
      params: { user_id: userId },
    });
  },
  getLikedByBoth: async (user1Id: number, user2Id: number): Promise<Card[]> => {
    const { data } = await api.get('/cards/liked/both', {
      params: { user1_id: user1Id, user2_id: user2Id },
    });
    return data;
  },
  getPartnerVotesGrouped: async (
    userId: number,
    partnerId: number,
    locale?: string
  ): Promise<PartnerVotesResponse> => {
    const { data } = await api.get('/cards/partner-votes', {
      params: { user_id: userId, partner_id: partnerId, locale },
    });
    return data;
  },

  // Admin methods
  getAllCardsForAdmin: async (
    userId: number,
    params?: { include_disabled?: boolean; limit?: number; offset?: number }
  ): Promise<CardListResponse> => {
    const { data } = await api.get('/cards/admin/all', {
      params: { user_id: userId, ...params },
    });
    return data;
  },

  toggleCardEnabled: async (
    cardId: number,
    enabled: boolean,
    userId: number
  ): Promise<{ id: number; is_enabled: boolean; message: string }> => {
    const { data } = await api.patch(`/cards/${cardId}/toggle`, null, {
      params: { enabled, user_id: userId },
    });
    return data;
  },

  bulkToggleCards: async (
    cardIds: number[],
    enabled: boolean,
    userId: number
  ): Promise<{ updated_count: number; is_enabled: boolean }> => {
    const { data } = await api.patch('/cards/admin/bulk-toggle', null, {
      params: { card_ids: cardIds, enabled, user_id: userId },
    });
    return data;
  },

  updateCardTags: async (
    cardId: number,
    tags: string[],
    intensity: string,
    userId: number
  ): Promise<Card> => {
    const { data } = await api.patch(
      `/cards/${cardId}/tags`,
      { tags, intensity },
      { params: { user_id: userId } }
    );
    return data;
  },

  getCardContent: async (
    cardId: number,
    locale: string,
    userId: number
  ): Promise<CardContentResponse> => {
    const { data } = await api.get(`/cards/${cardId}/content`, {
      params: { locale, user_id: userId },
    });
    return data;
  },

  updateCardContent: async (
    cardId: number,
    content: CardContentUpdate,
    userId: number
  ): Promise<{ id: number; locale: string; message: string }> => {
    const { data } = await api.patch(`/cards/${cardId}/content`, content, {
      params: { user_id: userId },
    });
    return data;
  },

  createCardAdmin: async (
    cardData: CardCreateAdmin,
    userId: number
  ): Promise<Card> => {
    const { data } = await api.post('/cards/admin/create', cardData, {
      params: { user_id: userId },
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
  updateProposal: async (
    proposalId: number,
    proposal: ProposalUpdate,
    userId: number
  ): Promise<Proposal> => {
    const { data } = await api.patch(`/proposals/${proposalId}`, proposal, {
      params: { user_id: userId },
    });
    return data;
  },
  deleteProposal: async (proposalId: number, userId: number): Promise<void> => {
    await api.delete(`/proposals/${proposalId}`, {
      params: { user_id: userId },
    });
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

// Admin
export const adminApi = {
  resetAll: async (userId: number): Promise<AdminResetResponse> => {
    const { data } = await api.post('/admin/reset', null, {
      params: { user_id: userId },
    });
    return data;
  },
};

export default api;
