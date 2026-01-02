// Types mirrored from backend Pydantic schemas

// Enums
export type CardCategory = 'calientes' | 'romance' | 'risas' | 'otras';
export type TagType = 'category' | 'intensity' | 'subtag';
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
export type ChallengeType = 'simple' | 'guided' | 'custom';
export type RewardType = 'none' | 'credits' | 'coupon' | 'choose_next';
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

// Tag
export interface Tag {
  id: number;
  slug: string;
  name: string;
  tag_type: TagType;
  parent_slug?: string | null;
  display_order: number;
}

export interface TagsGroupedResponse {
  categories: Tag[];
  intensity: Tag[];
  subtags: Tag[];
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
  tags_list?: Tag[];
  source: CardSource;
  status: CardStatus;
  is_enabled: boolean;
  created_by_user_id?: number | null;
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
  challenge_type: ChallengeType;
  custom_title: string | null;
  custom_description: string | null;
  // Guided challenge fields
  why_proposing?: string | null;
  boundary?: string | null;
  // Custom challenge fields
  location?: string | null;
  duration?: string | null;
  boundaries_json?: string | null;
  reward_type?: RewardType | null;
  reward_details?: string | null;
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
  challenge_type?: ChallengeType;
  // Card-based OR custom
  card_id?: number | null;
  custom_title?: string | null;
  custom_description?: string | null;
  // Guided challenge fields
  why_proposing?: string | null;
  boundary?: string | null;
  // Custom challenge fields
  location?: string | null;
  duration?: string | null;
  boundaries_json?: string | null;
  reward_type?: RewardType | null;
  reward_details?: string | null;
}

export interface ProposalUpdate {
  custom_title?: string | null;
  custom_description?: string | null;
  why_proposing?: string | null;
  boundary?: string | null;
  location?: string | null;
  duration?: string | null;
  boundaries_json?: string | null;
  reward_type?: RewardType | null;
  reward_details?: string | null;
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

// Partner Votes (grouped by preference)
export interface PartnerVotesResponse {
  like: Card[];
  maybe: Card[];
  dislike: Card[];
  neutral: Card[];
  total_mutual: number;
}

// Admin
export interface AdminResetResponse {
  message: string;
  votes_deleted: number;
  proposals_deleted: number;
}

// Card Content Management
export interface CardContentUpdate {
  title: string;
  description: string;
  locale: string;
}

export interface CardContentResponse {
  id: number;
  title: string;
  description: string;
  locale: string;
  is_translation: boolean;
}

export interface CardCreateAdmin {
  title: string;
  description: string;
  title_es?: string | null;
  description_es?: string | null;
  tags: string[];
  intensity: string;
  category: CardCategory;
  spice_level: number;
  difficulty_level: number;
  credit_value: number;
}
