import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, User } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signUp: (username: string, password: string) => Promise<{ error: string | null; recoveryPhrase?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const WORDS = [
  'horse', 'moon', 'bridge', 'orange', 'river', 'tiger', 'glass', 'storm',
  'wolf', 'copper', 'forest', 'silver', 'cloud', 'falcon', 'winter', 'anchor',
  'crown', 'eagle', 'flame', 'garden', 'harbor', 'island', 'jungle', 'knight',
  'lemon', 'marble', 'noble', 'ocean', 'pillar', 'quartz', 'raven', 'shadow',
  'tower', 'ultra', 'vault', 'whale', 'xenon', 'yellow', 'zenith', 'amber',
  'brick', 'cedar', 'delta', 'ember', 'frost', 'gravel', 'hollow', 'ivory'
];

export function generateRecoveryPhrase(): string {
  const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 7).join(' ');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('anow_user_id');
    if (stored) {
      loadUser(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        localStorage.removeItem('anow_user_id');
        setUser(null);
      } else {
        setUser(data as User);
      }
    } catch {
      localStorage.removeItem('anow_user_id');
      setUser(null);
    }
    setLoading(false);
  }

  async function refreshUser() {
    if (!user) return;
    await loadUser(user.id);
  }

  async function signIn(username: string, password: string): Promise<{ error: string | null }> {
    try {
      const cleanUsername = username.toLowerCase().trim();
      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', cleanUsername)
        .eq('password_hash', passwordHash)
        .maybeSingle();

      if (error) {
        console.error('SignIn error:', error);
        return { error: 'Database error. Please try again.' };
      }

      if (!data) {
        return { error: 'Invalid username or password.' };
      }

      if (data.status === 'suspended') {
        return { error: 'Your account has been suspended.' };
      }

      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      localStorage.setItem('anow_user_id', data.id);
      setUser(data as User);
      return { error: null };
    } catch (err) {
      console.error('SignIn exception:', err);
      return { error: 'An error occurred. Please try again.' };
    }
  }

  async function signUp(username: string, password: string): Promise<{ error: string | null; recoveryPhrase?: string }> {
    try {
      const clean = username.toLowerCase().trim();

      if (clean.length < 3) return { error: 'Username must be at least 3 characters.' };
      if (!/^[a-z0-9_]+$/.test(clean)) return { error: 'Username may only contain letters, numbers, and underscores.' };
      if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', clean)
        .maybeSingle();

      if (existing) return { error: 'Username already taken.' };

      const passwordHash = await hashPassword(password);
      const recoveryPhrase = generateRecoveryPhrase();
      const phraseHash = await hashPassword(recoveryPhrase);

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ username: clean, password_hash: passwordHash })
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return { error: 'Failed to create account. Please try again.' };
      }

      if (!newUser) {
        return { error: 'Failed to create account. Please try again.' };
      }

      // Store recovery phrase hash
      const { error: phraseError } = await supabase.from('recovery_phrases').insert({
        user_id: newUser.id,
        phrase_hash: phraseHash,
      });

      if (phraseError) {
        console.error('Recovery phrase error:', phraseError);
      }

      // Create wallets
      const { error: walletError } = await supabase.from('wallets').insert([
        { user_id: newUser.id, currency: 'BTC', available_balance: 0, escrow_balance: 0, pending_balance: 0 },
        { user_id: newUser.id, currency: 'USDT_TRC20', available_balance: 0, escrow_balance: 0, pending_balance: 0 },
        { user_id: newUser.id, currency: 'USDT_ERC20', available_balance: 0, escrow_balance: 0, pending_balance: 0 },
      ]);

      if (walletError) {
        console.error('Wallet creation error:', walletError);
      }

      // Assign deposit addresses from platform settings
      try {
        const { data: settings } = await supabase
          .from('platform_settings')
          .select('key, value')
          .in('key', ['btc_deposit_address_pool', 'usdt_trc20_deposit_address', 'usdt_erc20_deposit_address']);

        if (settings && settings.length > 0) {
          const addresses = [];
          for (const s of settings) {
            if (s.value && s.value.trim() !== '') {
              const currency = s.key === 'btc_deposit_address_pool' ? 'BTC'
                : s.key === 'usdt_trc20_deposit_address' ? 'USDT_TRC20'
                : 'USDT_ERC20';
              addresses.push({ user_id: newUser.id, currency, address: s.value.trim() });
            }
          }
          if (addresses.length > 0) {
            await supabase.from('deposit_addresses').insert(addresses);
          }
        }
      } catch (addrErr) {
        console.error('Deposit address error:', addrErr);
      }

      localStorage.setItem('anow_user_id', newUser.id);
      setUser(newUser as User);
      return { error: null, recoveryPhrase };
    } catch (err) {
      console.error('SignUp exception:', err);
      return { error: 'An error occurred. Please try again.' };
    }
  }

  async function signOut() {
    localStorage.removeItem('anow_user_id');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'anow_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
