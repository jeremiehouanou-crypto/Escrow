import { useState } from 'react';
import { User, Calendar, Settings, Save } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Currency, FiatCurrency } from '../lib/supabase';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [preferredCurrency, setPreferredCurrency] = useState<FiatCurrency>((user?.preferred_currency as FiatCurrency) || 'USD');
  const [preferredCrypto, setPreferredCrypto] = useState<Currency>((user?.preferred_crypto as Currency) || 'BTC');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function savePreferences() {
    setSaving(true);
    await supabase.from('users').update({ preferred_currency: preferredCurrency, preferred_crypto: preferredCrypto }).eq('id', user!.id);
    await refreshUser();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your account information and preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', maxWidth: 800 }}>
        {/* Account Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '3px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent)'
            }}>
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>@{user.username}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {user.role === 'admin' ? 'Administrator' : 'Member'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { icon: User, label: 'Username', value: user.username },
              { icon: Calendar, label: 'Member Since', value: new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { icon: Settings, label: 'Account Status', value: user.status.charAt(0).toUpperCase() + user.status.slice(1) },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  <Icon size={16} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="alert alert-info" style={{ marginTop: '1.25rem' }}>
            This platform collects no personal information. Your identity is your username only.
          </div>
        </div>

        {/* Preferences */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Preferences</h3>

          <div className="form-group">
            <label className="label">Display Currency</label>
            <select className="input" value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value as FiatCurrency)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">Preferred Cryptocurrency</label>
            <select className="input" value={preferredCrypto} onChange={e => setPreferredCrypto(e.target.value as Currency)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="USDT_TRC20">USDT TRC20</option>
              <option value="USDT_ERC20">USDT ERC20</option>
            </select>
          </div>

          <button onClick={savePreferences} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
            {saving ? <span className="spinner" /> : saved ? <><Save size={16} /> Saved!</> : <><Save size={16} /> Save Preferences</>}
          </button>

          <hr className="divider" />

          <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Security Notice</h4>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <p style={{ marginBottom: '0.5rem' }}>Your account is protected by your username and password. We strongly recommend:</p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Using a strong, unique password</li>
              <li>Keeping your recovery phrase safe offline</li>
              <li>Never sharing your login credentials</li>
              <li>Using this platform only on trusted devices</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
