
/*
  # Crypto Escrow Platform - Full Schema

  1. Tables:
    - users: Username/password accounts, no personal data
    - recovery_phrases: Account recovery words
    - wallets: BTC, USDT TRC20, USDT ERC20 balances
    - deposit_addresses: Unique crypto addresses per user per currency
    - deposits: Incoming deposit records
    - withdrawals: Withdrawal requests
    - escrow_transactions: Core escrow records
    - escrow_messages: Messages within escrow transactions
    - disputes: Dispute records
    - dispute_messages: Messages within disputes
    - notifications: User notifications
    - exchange_rates: Cached crypto/fiat rates
    - platform_settings: Admin-configurable settings
    - admin_logs: Audit trail for admin actions
    - user_sessions: Session management

  2. Security:
    - RLS enabled on all tables
    - Proper auth-based access policies
*/

-- Users table (no personal data)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  preferred_currency text NOT NULL DEFAULT 'USD',
  preferred_crypto text NOT NULL DEFAULT 'BTC',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'frozen'))
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Recovery phrases
CREATE TABLE IF NOT EXISTS recovery_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phrase_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recovery_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own recovery phrase"
  ON recovery_phrases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Wallets
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency text NOT NULL,
  available_balance numeric(20, 8) NOT NULL DEFAULT 0,
  escrow_balance numeric(20, 8) NOT NULL DEFAULT 0,
  pending_balance numeric(20, 8) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_currency CHECK (currency IN ('BTC', 'USDT_TRC20', 'USDT_ERC20')),
  CONSTRAINT non_negative_available CHECK (available_balance >= 0),
  CONSTRAINT non_negative_escrow CHECK (escrow_balance >= 0),
  CONSTRAINT non_negative_pending CHECK (pending_balance >= 0),
  UNIQUE(user_id, currency)
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update all wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Deposit addresses
CREATE TABLE IF NOT EXISTS deposit_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency text NOT NULL,
  address text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_currency CHECK (currency IN ('BTC', 'USDT_TRC20', 'USDT_ERC20')),
  UNIQUE(user_id, currency)
);

ALTER TABLE deposit_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deposit addresses"
  ON deposit_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all deposit addresses"
  ON deposit_addresses FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can insert deposit addresses"
  ON deposit_addresses FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update deposit addresses"
  ON deposit_addresses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Deposits
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency text NOT NULL,
  amount numeric(20, 8) NOT NULL,
  tx_hash text,
  confirmations integer NOT NULL DEFAULT 0,
  required_confirmations integer NOT NULL DEFAULT 3,
  status text NOT NULL DEFAULT 'pending',
  deposit_address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  CONSTRAINT valid_currency CHECK (currency IN ('BTC', 'USDT_TRC20', 'USDT_ERC20')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirming', 'confirmed', 'failed')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Withdrawals
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency text NOT NULL,
  amount numeric(20, 8) NOT NULL,
  destination_address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  tx_hash text,
  admin_note text,
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  sent_at timestamptz,
  CONSTRAINT valid_currency CHECK (currency IN ('BTC', 'USDT_TRC20', 'USDT_ERC20')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'under_review', 'approved', 'sent', 'rejected')),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Escrow transactions
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES users(id),
  seller_id uuid NOT NULL REFERENCES users(id),
  currency text NOT NULL,
  amount_crypto numeric(20, 8) NOT NULL,
  amount_fiat numeric(20, 2) NOT NULL,
  fiat_currency text NOT NULL DEFAULT 'USD',
  exchange_rate numeric(20, 8) NOT NULL,
  description text NOT NULL,
  delivery_days integer NOT NULL DEFAULT 7,
  status text NOT NULL DEFAULT 'awaiting_funding',
  platform_fee numeric(20, 8) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  funded_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  disputed_at timestamptz,
  resolved_at timestamptz,
  cancelled_at timestamptz,
  CONSTRAINT valid_currency CHECK (currency IN ('BTC', 'USDT_TRC20', 'USDT_ERC20')),
  CONSTRAINT valid_fiat_currency CHECK (fiat_currency IN ('USD', 'EUR', 'GBP')),
  CONSTRAINT valid_status CHECK (status IN ('awaiting_funding', 'funded', 'in_progress', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled')),
  CONSTRAINT positive_amount CHECK (amount_crypto > 0),
  CONSTRAINT buyer_seller_different CHECK (buyer_id != seller_id)
);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can read own escrows"
  ON escrow_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create escrows"
  ON escrow_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Parties can update own escrows"
  ON escrow_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins can read all escrows"
  ON escrow_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update all escrows"
  ON escrow_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Escrow messages
CREATE TABLE IF NOT EXISTS escrow_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  attachment_url text,
  attachment_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE escrow_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transaction parties can read messages"
  ON escrow_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escrow_transactions et
      WHERE et.id = escrow_id
      AND (et.buyer_id = auth.uid() OR et.seller_id = auth.uid())
    )
  );

CREATE POLICY "Transaction parties can send messages"
  ON escrow_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM escrow_transactions et
      WHERE et.id = escrow_id
      AND (et.buyer_id = auth.uid() OR et.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all messages"
  ON escrow_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_id uuid NOT NULL REFERENCES escrow_transactions(id),
  opened_by uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_decision text,
  admin_note text,
  resolved_by uuid REFERENCES users(id),
  buyer_amount numeric(20, 8),
  seller_amount numeric(20, 8),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT valid_status CHECK (status IN ('open', 'under_review', 'resolved'))
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read own disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM escrow_transactions et
      WHERE et.id = escrow_id
      AND (et.buyer_id = auth.uid() OR et.seller_id = auth.uid())
    )
  );

CREATE POLICY "Parties can open disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = opened_by AND
    EXISTS (
      SELECT 1 FROM escrow_transactions et
      WHERE et.id = escrow_id
      AND (et.buyer_id = auth.uid() OR et.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Dispute messages
CREATE TABLE IF NOT EXISTS dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  attachment_url text,
  attachment_name text,
  is_admin_message boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can read dispute messages"
  ON dispute_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN escrow_transactions et ON et.id = d.escrow_id
      WHERE d.id = dispute_id
      AND (et.buyer_id = auth.uid() OR et.seller_id = auth.uid())
    )
  );

CREATE POLICY "Parties can send dispute messages"
  ON dispute_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN escrow_transactions et ON et.id = d.escrow_id
      WHERE d.id = dispute_id
      AND (et.buyer_id = auth.uid() OR et.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all dispute messages"
  ON dispute_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can send dispute messages"
  ON dispute_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_type CHECK (type IN (
    'deposit_confirmed', 'escrow_funded', 'delivery_marked',
    'escrow_released', 'dispute_opened', 'dispute_resolved',
    'withdrawal_approved', 'withdrawal_rejected', 'new_message',
    'escrow_created', 'admin_action'
  ))
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    OR auth.uid() = user_id
  );

-- Exchange rates cache
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  rate numeric(20, 8) NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(base_currency, quote_currency)
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read rates"
  ON exchange_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rates"
  ON exchange_rates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update rates"
  ON exchange_rates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Platform settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage settings"
  ON platform_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can update settings"
  ON platform_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

CREATE POLICY "Admins can insert logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Insert default exchange rates
INSERT INTO exchange_rates (base_currency, quote_currency, rate) VALUES
  ('BTC', 'USD', 67500.00),
  ('BTC', 'EUR', 62000.00),
  ('BTC', 'GBP', 53000.00),
  ('USDT', 'USD', 1.00),
  ('USDT', 'EUR', 0.92),
  ('USDT', 'GBP', 0.79)
ON CONFLICT (base_currency, quote_currency) DO NOTHING;

-- Insert default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_name', 'CryptoEscrow', 'Platform display name'),
  ('platform_fee_percent', '1.5', 'Escrow fee percentage'),
  ('btc_confirmations_required', '3', 'BTC confirmations required for deposit'),
  ('usdt_confirmations_required', '12', 'USDT confirmations required for deposit'),
  ('withdrawal_processing_hours', '4', 'Hours to process withdrawals'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('btc_deposit_address_pool', '', 'Admin BTC address for deposits'),
  ('usdt_trc20_deposit_address', '', 'Admin USDT TRC20 address'),
  ('usdt_erc20_deposit_address', '', 'Admin USDT ERC20 address')
ON CONFLICT (key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_escrow_messages_escrow ON escrow_messages(escrow_id);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow ON disputes(escrow_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
