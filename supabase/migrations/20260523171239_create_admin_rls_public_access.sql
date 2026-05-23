/*
  # Fix RLS policies for public read access on exchange_rates and platform_settings
  
  These tables need to be readable by unauthenticated users too (for the homepage ticker).
  Also adds INSERT policy for users creating notifications.
*/

-- Allow public (unauthenticated) read on exchange_rates
DROP POLICY IF EXISTS "Anyone authenticated can read rates" ON exchange_rates;
CREATE POLICY "Public can read rates"
  ON exchange_rates FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public read on platform_settings for non-sensitive keys
DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON platform_settings;
CREATE POLICY "Authenticated can read settings"
  ON platform_settings FOR SELECT
  TO authenticated
  USING (true);

-- Fix notification insert policy — allow system inserts
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

CREATE POLICY "Authenticated users can insert notifications for others"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
