/*
  # Fix INSERT policies for registration

  Users table needs public INSERT for anonymous registration.
  Also fixing recovery_phrases and wallets for registration flow.
*/

-- Allow anyone to insert a new user (registration)
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow insert on recovery_phrases for new users
CREATE POLICY "Users can insert recovery phrase"
  ON recovery_phrases FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow insert on wallets for new users
CREATE POLICY "Users can insert wallets"
  ON wallets FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow insert on deposit_addresses
CREATE POLICY "Users can insert deposit addresses"
  ON deposit_addresses FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
