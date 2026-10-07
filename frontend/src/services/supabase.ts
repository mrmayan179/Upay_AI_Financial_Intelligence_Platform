/**
 * Supabase Cloud Client for Upay AI Platform
 * Provides real-time subscriptions, cloud authentication, and database access.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cedgwabxochvsycsqdpm.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface SupabaseCloudStatus {
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  provider: string;
  project_url: string;
  project_ref: string;
  rest_api_active: boolean;
  jwks_active: boolean;
  latency_ms: number;
  secret_key_verified?: boolean;
}

/**
 * Checks connection health to Supabase Cloud directly from browser.
 */
export async function pingSupabaseCloud(): Promise<{ ok: boolean; latency_ms: number; error?: string }> {
  const start = performance.now();
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    const latency_ms = Math.round(performance.now() - start);
    return { ok: res.status < 500, latency_ms };
  } catch (err: any) {
    const latency_ms = Math.round(performance.now() - start);
    return { ok: false, latency_ms, error: err.message };
  }
}
