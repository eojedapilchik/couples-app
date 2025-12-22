// Types mirrored from backend Pydantic schemas

// Enums
export type CardCategory = 'calientes' | 'romance' | 'risas' | 'otras';
export type CardSource = 'manual' | 'llm' | 'imported';
export type CardStatus = 'active' | 'archived';
export type PreferenceType = 'like' | 'dislike' | 'neutral' | 'maybe';
export type PeriodType = 'week' | 'month' | 'two_month';
export type PeriodStatus = 'setup' | 'active' | 'done';
export type ProposalStatus =
  | 'proposed'
  | 'accepted'
  | 'maybe_later'
  | 'rejected'
  | 'completed_pending_confirmation'
  | 'completed_confirmed'
  | 'expired';
export type LedgerType =
  | 'weekly_base_grant'
  | 'proposal_cost'
  | 'completion_reward'
  | 'admin_adjustment'
  | 'initial_grant';

// User
export interface User {
  id: number;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export interface LoginRequest {
  user_id: number;
  pin: string;
}

export interface LoginResponse {
  user: User;
  message: string;
}

// Card
export interface Card {
  id: number;
  title: string;
  description: string;
  category: CardCategory;
  spice_level: number;
  difficulty_level: number;
  credit_value: number;
  tags: string | null;
  source: CardSource;
  status: CardStatus;
  created_at: string;
  user_preference?: PreferenceType | null;
  partner_preference?: PreferenceType | null;
}

export interface CardCreate {
  title: string;
  description: string;
  category: CardCategory;
  spice_level?: number;
  difficulty_level?: number;
  credit_value?: number;
  tags?: string | null;
  source?: CardSource;
}

export interface CardListResponse {
  cards: Card[];
  total: number;
}

export interface VoteRequest {
  preference: PreferenceType;
}

// Period
export interface Period {
  id: number;
  period_type: PeriodType;
  status: PeriodStatus;
  start_date: string;
  end_date: string;
  weekly_base_credits: number;
  cards_to_play_per_week: number;
  created_at: string;
  current_week?: number | null;
  total_weeks?: number | null;
}

export interface PeriodCreate {
  period_type: PeriodType;
  start_date: string;
  weekly_base_credits?: number;
  cards_to_play_per_week?: number;
}

export interface PeriodListResponse {
  periods: Period[];
  total: number;
}

// Proposal
export interface Proposal {
  id: number;
  period_id: number;
  week_index: number;
  proposed_by_user_id: number;
  proposed_to_user_id: number;
  card_id: number | null;
  custom_title: string | null;
  custom_description: string | null;
  credit_cost: number | null;
  status: ProposalStatus;
  created_at: string;
  responded_at: string | null;
  completed_requested_at: string | null;
  completed_confirmed_at: string | null;
  card?: Card | null;
  proposed_by?: User | null;
  proposed_to?: User | null;
  display_title?: string | null;
  display_description?: string | null;
}

export interface ProposalCreate {
  proposed_to_user_id: number;
  period_id: number;
  week_index?: number;
  // Card-based OR custom
  card_id?: number | null;
  custom_title?: string | null;
  custom_description?: string | null;
}

export interface ProposalRespondRequest {
  response: ProposalStatus;
  credit_cost?: number; // Required when accepting (1-7)
}

export interface ProposalListResponse {
  proposals: Proposal[];
  total: number;
}

// Credit
export interface CreditBalance {
  user_id: number;
  balance: number;
}

export interface CreditLedgerEntry {
  id: number;
  user_id: number;
  period_id: number | null;
  proposal_id: number | null;
  type: LedgerType;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface CreditLedgerListResponse {
  entries: CreditLedgerEntry[];
  total: number;
  current_balance: number;
}

// Admin
export interface AdminResetResponse {
  message: string;
  votes_deleted: number;
  proposals_deleted: number;
}
