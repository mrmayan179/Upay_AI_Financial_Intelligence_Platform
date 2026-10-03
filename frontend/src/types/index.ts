export interface UserProfile {
  customer_id: string;
  display_name: string;
  phone_masked: string;
  raw_phone: string;
  account_number: string;
  account_balance_bdt: number;
  cash_reward_bdt: number;
  status: string;
}

export interface CaseEvent {
  event_id: string;
  case_id: string;
  timestamp: string;
  event_type: string;
  description: string;
  actor_type: string;
  actor_id: string;
}

export interface Case {
  case_id: string;
  complaint_id: string;
  case_title: string;
  category: string;
  priority: string;
  status: string;
  progress_percent: number;
  assigned_team: string;
  assigned_agent: string;
  ai_summary: string;
  escalation_level: number;
  created_at: string;
  updated_at: string;
  events?: CaseEvent[];
}

export interface Card {
  card_id: string;
  customer_id: string;
  card_type: string;
  card_title: string;
  card_number_masked: string;
  card_number_full: string;
  expiry_date: string;
  cvv: string;
  status: string;
  card_enabled: boolean;
  online_enabled: boolean;
  international_enabled: boolean;
  nfc_enabled: boolean;
  endorsement_usd: number;
  used_usd: number;
  available_usd: number;
}

export interface CardTransaction {
  transaction_id: string;
  card_id: string;
  amount_usd: number;
  amount_bdt: number;
  merchant_name: string;
  channel: string;
  risk_score: number;
  risk_level: string;
  decision: string;
  reasons: string[];
  status: string;
  created_at: string;
}

export interface CreditProfile {
  readiness_score: number;
  risk_probability: number;
  risk_category: string;
  suggested_limit_range_bdt: string;
  recommendation: string;
  disclaimer: string;
  positive_factors: string[];
  negative_factors: string[];
  review_status: string;
  review_requested: boolean;
  model_version: string;
}

export interface AIActivityLog {
  ai_log_id: string;
  correlation_id: string;
  customer_id?: string;
  component: string;
  action: string;
  tool_name: string;
  model_or_provider: string;
  model_version: string;
  result_status: string;
  latency_ms: number;
  details: Record<string, any>;
  created_at: string;
}

export interface AppNotification {
  notification_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  action_url: string;
  created_at: string;
}

export type Notification = AppNotification;
