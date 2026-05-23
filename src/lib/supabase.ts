import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Currency = 'BTC' | 'USDT_TRC20' | 'USDT_ERC20';
export type FiatCurrency = 'USD' | 'EUR' | 'GBP';
export type EscrowStatus =
  | 'awaiting_funding'
  | 'funded'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'frozen';
  preferred_currency: FiatCurrency;
  preferred_crypto: Currency;
  created_at: string;
  last_login?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: Currency;
  available_balance: number;
  escrow_balance: number;
  pending_balance: number;
}

export interface EscrowTransaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  currency: Currency;
  amount_crypto: number;
  amount_fiat: number;
  fiat_currency: FiatCurrency;
  exchange_rate: number;
  description: string;
  delivery_days: number;
  status: EscrowStatus;
  platform_fee: number;
  created_at: string;
  funded_at?: string;
  delivered_at?: string;
  completed_at?: string;
  disputed_at?: string;
  resolved_at?: string;
  cancelled_at?: string;
  buyer?: { username: string };
  seller?: { username: string };
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  escrow_id: string;
  opened_by: string;
  reason: string;
  status: 'open' | 'under_review' | 'resolved';
  admin_decision?: string;
  admin_note?: string;
  buyer_amount?: number;
  seller_amount?: number;
  created_at: string;
  resolved_at?: string;
}
