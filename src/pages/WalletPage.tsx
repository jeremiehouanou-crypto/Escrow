import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Wallet, Currency } from '../lib/supabase';

interface DepositAddress { currency: Currency; address: string; }

const currencyLabels: Record<string, string> = {
  BTC: 'Bitcoin (BTC)',
  USDT_TRC20: 'Tether USDT TRC20',
  USDT_ERC20: 'Tether USDT ERC20',
};

export default function WalletPage() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [wRes, aRes, rRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user!.id),
      supabase.from('deposit_addresses').select('currency, address').eq('user_id', user!.id),
      supabase.from('exchange_rates').select('*'),
    ]);
    if (wRes.data) setWallets(wRes.data as Wallet[]);
    if (aRes.data) setAddresses(aRes.data as DepositAddress[]);
    if (rRes.data) {
      const map: Record<string, number> = {};
      rRes.data.forEach((r: { base_currency: string; quote_currency: string; rate: number }) => {
        map[`${r.base_currency}_${r.quote_currency}`] = r.rate;
      });
      setRates(map);
    }
    setLoading(false);
  }

  const fiat = user?.preferred_currency || 'USD';
  const fiatSymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  const sym = fiatSymbols[fiat] || '$';

  function getRate(currency: Currency): number {
    const base = currency === 'BTC' ? 'BTC' : 'USDT';
    return rates[`${base}_${fiat}`] || 0;
  }

  function copyAddress(addr: string) {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  }

  const totalFiat = wallets.reduce((sum, w) => sum + (w.available_balance + w.escrow_balance) * getRate(w.currency), 0);

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Wallet</h1>
          <p>Manage your cryptocurrency balances</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/deposit" className="btn btn-primary btn-sm"><ArrowDownToLine size={14} /> Deposit</Link>
          <Link to="/withdraw" className="btn btn-ghost btn-sm"><ArrowUpFromLine size={14} /> Withdraw</Link>
          <button onClick={loadData} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Total */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--bg-card), var(--bg-hover))' }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Total Balance</div>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {sym}{totalFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 4 }}>Combined available + escrow</div>
      </div>

      {/* Wallet cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {wallets.map(w => {
          const rate = getRate(w.currency);
          const addr = addresses.find(a => a.currency === w.currency);
          return (
            <div key={w.id} className="card" style={{ borderTop: `3px solid ${w.currency === 'BTC' ? '#f7931a' : '#26a17b'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className={`crypto-icon ${w.currency === 'BTC' ? 'crypto-btc' : 'crypto-usdt'}`} style={{ width: 40, height: 40, fontSize: '1rem' }}>
                    {w.currency === 'BTC' ? '₿' : '₮'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{currencyLabels[w.currency]}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.currency}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Available', value: w.available_balance, color: 'var(--success)' },
                  { label: 'In Escrow', value: w.escrow_balance, color: 'var(--warning)' },
                  { label: 'Pending', value: w.pending_balance, color: 'var(--text-muted)' },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.625rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.625rem', fontWeight: 700, color: item.color, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.value.toFixed(6)}</div>
                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{sym}{(item.value * rate).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              {addr && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.875rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Deposit Address</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.4 }}>{addr.address}</code>
                    <button
                      onClick={() => copyAddress(addr.address)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === addr.address ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0, padding: 4 }}
                    >
                      {copied === addr.address ? <CheckCircle size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {!addr && (
                <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
                  Deposit address not yet assigned. Contact support or deposit once an address is configured.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Notice */}
      <div className="alert alert-warning">
        <ArrowDownToLine size={16} style={{ flexShrink: 0 }} />
        <div>
          <strong>Deposit Notice:</strong> Always send only the correct cryptocurrency to its corresponding address. Sending the wrong coin may result in permanent loss of funds.
          Confirmations required: BTC (3+), USDT (12+).
        </div>
      </div>
    </DashboardLayout>
  );
}
