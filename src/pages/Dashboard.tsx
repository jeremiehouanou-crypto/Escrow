import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, TrendingUp, Clock, ArrowDownToLine, ArrowUpFromLine, Plus } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Wallet as WalletType, EscrowTransaction } from '../lib/supabase';

type Rate = { base_currency: string; quote_currency: string; rate: number };

export default function Dashboard() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [recentEscrows, setRecentEscrows] = useState<EscrowTransaction[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    const [walletsRes, escrowsRes, ratesRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user!.id),
      supabase.from('escrow_transactions')
        .select('*, buyer:buyer_id(username), seller:seller_id(username)')
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase.from('exchange_rates').select('*'),
    ]);
    if (walletsRes.data) setWallets(walletsRes.data as WalletType[]);
    if (escrowsRes.data) setRecentEscrows(escrowsRes.data as EscrowTransaction[]);
    if (ratesRes.data) setRates(ratesRes.data as Rate[]);
    setLoading(false);
  }

  const fiat = user?.preferred_currency || 'USD';
  const fiatSymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  const sym = fiatSymbols[fiat] || '$';

  function getRate(base: string): number {
    const r = rates.find(r => r.base_currency === base && r.quote_currency === fiat);
    return r?.rate || 0;
  }

  function totalBalanceUsd(): number {
    return wallets.reduce((sum, w) => {
      const base = w.currency === 'BTC' ? 'BTC' : 'USDT';
      return sum + (w.available_balance + w.escrow_balance + w.pending_balance) * getRate(base);
    }, 0);
  }

  const statusColors: Record<string, string> = {
    awaiting_funding: 'badge-muted',
    funded: 'badge-accent',
    in_progress: 'badge-accent',
    delivered: 'badge-warning',
    completed: 'badge-success',
    disputed: 'badge-danger',
    refunded: 'badge-muted',
    cancelled: 'badge-muted',
  };

  const currencyLabels: Record<string, string> = {
    BTC: 'Bitcoin',
    USDT_TRC20: 'USDT TRC20',
    USDT_ERC20: 'USDT ERC20',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Welcome back, {user?.username}</h1>
        <p>Here's an overview of your account activity</p>
      </div>

      {/* Total balance */}
      <div style={{
        background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
        borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Portfolio Value</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            {sym}{totalBalanceUsd().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>Across all currencies</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/deposit" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ArrowDownToLine size={16} /> Deposit
          </Link>
          <Link to="/withdraw" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ArrowUpFromLine size={16} /> Withdraw
          </Link>
        </div>
      </div>

      {/* Wallet cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {wallets.map(w => {
          const base = w.currency === 'BTC' ? 'BTC' : 'USDT';
          const rate = getRate(base);
          const Icon = w.currency === 'BTC' ? '₿' : '₮';
          return (
            <div key={w.id} className="stat-card" style={{ borderLeft: '3px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: 4 }}>
                <div className={`crypto-icon ${w.currency === 'BTC' ? 'crypto-btc' : 'crypto-usdt'}`}>{Icon}</div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{currencyLabels[w.currency]}</span>
              </div>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>{w.available_balance.toFixed(8)}</div>
              <div className="stat-label">{sym}{(w.available_balance * rate).toFixed(2)} available</div>
              {w.escrow_balance > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>+ {w.escrow_balance.toFixed(8)} in escrow</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: ShieldCheck, label: 'Active Escrows', value: recentEscrows.filter(e => ['funded', 'in_progress', 'delivered'].includes(e.status)).length, color: 'var(--accent)' },
          { icon: TrendingUp, label: 'Completed', value: recentEscrows.filter(e => e.status === 'completed').length, color: 'var(--success)' },
          { icon: Clock, label: 'Pending', value: recentEscrows.filter(e => e.status === 'awaiting_funding').length, color: 'var(--warning)' },
          { icon: Wallet, label: 'Total Trades', value: recentEscrows.length, color: 'var(--text-muted)' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="stat-card">
              <Icon size={20} color={item.color} />
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent escrows */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Escrows</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/escrow" className="btn btn-ghost btn-sm">View All</Link>
            <Link to="/escrow/new" className="btn btn-primary btn-sm"><Plus size={14} /> New Escrow</Link>
          </div>
        </div>

        {recentEscrows.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <ShieldCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No escrow transactions yet</p>
            <Link to="/escrow/new" className="btn btn-primary btn-sm"><Plus size={14} /> Create First Escrow</Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>With</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentEscrows.map(e => {
                  const isBuyer = e.buyer_id === user?.id;
                  const other = isBuyer ? (e.seller as unknown as { username: string }) : (e.buyer as unknown as { username: string });
                  return (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/escrow/${e.id}`}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{e.id.slice(0, 8)}...</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{other?.username || '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{isBuyer ? 'Buying' : 'Selling'}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.amount_crypto} {e.currency.replace('_', ' ')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.amount_fiat} {e.fiat_currency}</div>
                      </td>
                      <td><span className={`badge ${statusColors[e.status] || 'badge-muted'}`}>{e.status.replace(/_/g, ' ')}</span></td>
                      <td>{new Date(e.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exchange rates */}
      <div>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Live Rates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {rates.map(r => (
            <div key={`${r.base_currency}-${r.quote_currency}`} className="stat-card" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{r.base_currency}/{r.quote_currency}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {fiatSymbols[r.quote_currency] || ''}{Number(r.rate).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
