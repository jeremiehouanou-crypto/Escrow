import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Setting { key: string; value: string; description?: string; }

const settingLabels: Record<string, string> = {
  platform_name: 'Platform Name',
  platform_fee_percent: 'Platform Fee (%)',
  btc_confirmations_required: 'BTC Confirmations Required',
  usdt_confirmations_required: 'USDT Confirmations Required',
  withdrawal_processing_hours: 'Withdrawal Processing Hours',
  maintenance_mode: 'Maintenance Mode (true/false)',
  btc_deposit_address_pool: 'Platform BTC Deposit Address',
  usdt_trc20_deposit_address: 'Platform USDT TRC20 Deposit Address',
  usdt_erc20_deposit_address: 'Platform USDT ERC20 Deposit Address',
};

const rateKeys = [
  { base: 'BTC', quote: 'USD' }, { base: 'BTC', quote: 'EUR' }, { base: 'BTC', quote: 'GBP' },
  { base: 'USDT', quote: 'USD' }, { base: 'USDT', quote: 'EUR' }, { base: 'USDT', quote: 'GBP' },
];

export default function AdminSettings() {
  const { user: admin } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingRates, setSavingRates] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [settingsRes, ratesRes] = await Promise.all([
      supabase.from('platform_settings').select('*').order('key'),
      supabase.from('exchange_rates').select('*'),
    ]);
    if (settingsRes.data) setSettings(settingsRes.data as Setting[]);
    if (ratesRes.data) {
      const map: Record<string, string> = {};
      ratesRes.data.forEach((r: { base_currency: string; quote_currency: string; rate: number }) => {
        map[`${r.base_currency}_${r.quote_currency}`] = String(r.rate);
      });
      setRates(map);
    }
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  }

  async function saveSettings() {
    setSaving(true);
    for (const s of settings) {
      await supabase.from('platform_settings').update({ value: s.value, updated_at: new Date().toISOString(), updated_by: admin!.id }).eq('key', s.key);
    }
    await supabase.from('admin_logs').insert({ admin_id: admin!.id, action: 'Updated platform settings' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function saveRates() {
    setSavingRates(true);
    for (const rk of rateKeys) {
      const key = `${rk.base}_${rk.quote}`;
      const val = parseFloat(rates[key]);
      if (!isNaN(val) && val > 0) {
        await supabase.from('exchange_rates').update({ rate: val, updated_at: new Date().toISOString() }).eq('base_currency', rk.base).eq('quote_currency', rk.quote);
      }
    }
    await supabase.from('admin_logs').insert({ admin_id: admin!.id, action: 'Updated exchange rates' });
    setSavingRates(false);
  }

  async function assignAddressesToUsers() {
    // Assign platform addresses to all users who don't have them
    const { data: users } = await supabase.from('users').select('id').eq('role', 'user');
    const btcAddr = settings.find(s => s.key === 'btc_deposit_address_pool')?.value;
    const trc20Addr = settings.find(s => s.key === 'usdt_trc20_deposit_address')?.value;
    const erc20Addr = settings.find(s => s.key === 'usdt_erc20_deposit_address')?.value;

    if (!users || (!btcAddr && !trc20Addr && !erc20Addr)) return;

    for (const u of users) {
      const toInsert = [];
      if (btcAddr) {
        const { data: existing } = await supabase.from('deposit_addresses').select('id').eq('user_id', u.id).eq('currency', 'BTC').maybeSingle();
        if (!existing) toInsert.push({ user_id: u.id, currency: 'BTC', address: btcAddr });
      }
      if (trc20Addr) {
        const { data: existing } = await supabase.from('deposit_addresses').select('id').eq('user_id', u.id).eq('currency', 'USDT_TRC20').maybeSingle();
        if (!existing) toInsert.push({ user_id: u.id, currency: 'USDT_TRC20', address: trc20Addr });
      }
      if (erc20Addr) {
        const { data: existing } = await supabase.from('deposit_addresses').select('id').eq('user_id', u.id).eq('currency', 'USDT_ERC20').maybeSingle();
        if (!existing) toInsert.push({ user_id: u.id, currency: 'USDT_ERC20', address: erc20Addr });
      }
      if (toInsert.length > 0) {
        await supabase.from('deposit_addresses').insert(toInsert);
      }
    }
    alert('Deposit addresses assigned to all users!');
  }

  const cryptoSettings = settings.filter(s => ['btc_deposit_address_pool', 'usdt_trc20_deposit_address', 'usdt_erc20_deposit_address'].includes(s.key));
  const platformSettings = settings.filter(s => !['btc_deposit_address_pool', 'usdt_trc20_deposit_address', 'usdt_erc20_deposit_address'].includes(s.key));

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Platform Settings</h1>
        <p>Configure platform parameters and crypto addresses</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Platform settings */}
        <div className="card">
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>General Settings</h3>
          {platformSettings.map(s => (
            <div key={s.key} className="form-group">
              <label className="label">{settingLabels[s.key] || s.key}</label>
              <input type="text" className="input" value={s.value} onChange={e => updateSetting(s.key, e.target.value)} />
            </div>
          ))}
          <button onClick={saveSettings} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
            {saving ? <span className="spinner" /> : saved ? <><Save size={16} /> Saved!</> : <><Save size={16} /> Save Settings</>}
          </button>
        </div>

        {/* Crypto deposit addresses */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Deposit Addresses</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Set your platform's receiving addresses. Users will send deposits to these addresses.
            </p>
            {cryptoSettings.map(s => (
              <div key={s.key} className="form-group">
                <label className="label">{settingLabels[s.key] || s.key}</label>
                <input type="text" className="input" value={s.value} onChange={e => updateSetting(s.key, e.target.value)} placeholder="Enter wallet address..." style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={saveSettings} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} disabled={saving}>
                <Save size={14} /> Save Addresses
              </button>
              <button onClick={assignAddressesToUsers} className="btn btn-secondary btn-sm" style={{ justifyContent: 'center' }}>
                <RefreshCw size={14} /> Assign to All Users
              </button>
            </div>
          </div>

          {/* Exchange rates */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Exchange Rates</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              {rateKeys.map(rk => {
                const key = `${rk.base}_${rk.quote}`;
                return (
                  <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="label">{rk.base}/{rk.quote}</label>
                    <input type="number" className="input" value={rates[key] || ''} onChange={e => setRates(prev => ({ ...prev, [key]: e.target.value }))} placeholder="Rate" min="0" step="any" />
                  </div>
                );
              })}
            </div>
            <button onClick={saveRates} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} disabled={savingRates}>
              {savingRates ? <span className="spinner" /> : <><Save size={14} /> Update Rates</>}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
