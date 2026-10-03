/**
 * API Service Client for Upay AI Platform
 */
import {
  UserProfile,
  Case,
  Card,
  CardTransaction,
  CreditProfile,
  AIActivityLog,
  AppNotification
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    let msg = `Request failed: ${res.status}`;
    try {
      const parsed = JSON.parse(errorText);
      msg = parsed.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  
  return res.json();
}

export const api = {
  // Auth & Profile
  login: (phone = '01771449164', pin = '1234'): Promise<{ token: string; customer_id: string }> =>
    fetchJson('/auth/demo-login', { method: 'POST', body: JSON.stringify({ phone_number: phone, pin }) }),
  getProfile: (): Promise<UserProfile> => fetchJson<UserProfile>('/me'),
  getNotifications: (): Promise<AppNotification[]> => fetchJson<AppNotification[]>('/notifications'),

  // Smart Report & Cases
  classifyComplaint: (text: string): Promise<any> =>
    fetchJson('/reports/intelligence/classify', { method: 'POST', body: JSON.stringify({ text }) }),
  createReport: (complaint_text: string, category?: string): Promise<{ complaint_id: string; case_id: string; status: string; message: string }> =>
    fetchJson('/reports', { method: 'POST', body: JSON.stringify({ complaint_text, category }) }),
  getActiveCases: (): Promise<Case[]> => fetchJson<Case[]>('/reports/active'),
  getCaseDetail: (caseId: string): Promise<Case> => fetchJson<Case>(`/reports/${caseId}`),
  escalateCase: (caseId: string, reason: string): Promise<any> =>
    fetchJson(`/reports/${caseId}/escalate`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Smart Card
  getCards: (): Promise<Card[]> => fetchJson<Card[]>('/cards'),
  getCard: (cardId: string): Promise<Card> => fetchJson<Card>(`/cards/${cardId}`),
  updateCardSettings: (cardId: string, settings: any): Promise<Card> =>
    fetchJson<Card>(`/cards/${cardId}/settings`, { method: 'PATCH', body: JSON.stringify(settings) }),
  freezeCard: (cardId: string): Promise<Card> =>
    fetchJson<Card>(`/cards/${cardId}/freeze`, { method: 'POST' }),
  resetCardPin: (cardId: string, currentPin: string, newPin: string): Promise<any> =>
    fetchJson(`/cards/${cardId}/pin/reset-demo`, {
      method: 'POST',
      body: JSON.stringify({ current_pin: currentPin, new_pin: newPin })
    }),
  simulateCardTransaction: (payload: {
    card_id: string;
    amount_usd: number;
    merchant_name: string;
    channel?: string;
    country?: string;
    is_new_merchant?: number;
    is_new_device?: number;
  }): Promise<CardTransaction> => fetchJson<CardTransaction>('/cards/transactions/analyze', { method: 'POST', body: JSON.stringify(payload) }),
  getCardTransactions: (cardId: string): Promise<CardTransaction[]> => fetchJson<CardTransaction[]>(`/cards/${cardId}/transactions`),

  // Credit Readiness
  getCreditReadiness: (): Promise<CreditProfile> => fetchJson<CreditProfile>('/credit/readiness'),
  requestCreditReview: (): Promise<any> => fetchJson('/credit/review-request', { method: 'POST' }),

  // Voice AI
  startVoiceSession: (phone = '01771449164'): Promise<{ call_id: string; greeting: string; challenge_type: string; status: string }> =>
    fetchJson('/voice/session/start', { method: 'POST', body: JSON.stringify({ phone_number: phone }) }),
  verifyVoiceCaller: (payload: { call_id: string; father_name?: string; voice_pin?: string; account_suffix?: string }): Promise<any> =>
    fetchJson('/voice/verify', { method: 'POST', body: JSON.stringify(payload) }),
  executeVoiceTool: (payload: { call_id: string; tool_name: string; arguments?: any }): Promise<any> =>
    fetchJson('/voice/tools/execute', { method: 'POST', body: JSON.stringify(payload) }),
  getVoiceCallSummary: (callId: string): Promise<any> => fetchJson(`/voice/calls/${callId}/summary`),

  // AI Activity Logs
  getAuditLogs: (component?: string): Promise<AIActivityLog[]> =>
    fetchJson<AIActivityLog[]>(`/audit/logs${component ? `?component=${component}` : ''}`),
};
