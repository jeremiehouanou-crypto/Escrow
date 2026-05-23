import { useEffect, useState } from 'react';
import { ArrowUpFromLine, Clock, Info } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Currency } from '../lib/supabase';

const currencies: Currency[] = ['BTC', 'USDT_TRC20', 'USDT_ERC20'];
const currencyLabels: Record<string, string> = {
  BTC: 'Bitcoin (BTC)', USDT_TRC20: 'USDT TRC20', USDT_ERC20: 'USDT ERC20',
};

interface Withdrawal {
  id: string; currency: Currency; amount: number;
  destination_address: string; status: string; created_at: string; admin_note?: string;
}

export default function WithdrawPage() {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<Currency>('BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [wallets, setWallets] = useState<Record<string, number>>({});
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [wRes, wdRes] = await Promise.all([
      supabase.from('wallets').select('currency, available_balance').eq('user_id', user!.id),
      supabase.from('withdrawals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (wRes.data) {
      const map: Record<string, number> = {};
      wRes.data.forEach((w: { currency: string; available_balance: number }) => { map[w.currency] = w.available_balance; });
      setWallets(map);
    }
    if (wdRes.data) setWithdrawals(wdRes.data as Withdrawal[]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('Enter a valid amount.'); return; }
    const avail = wallets[currency] || 0;
    if (amt > avail) { setError(`Insufficient balance. Available: ${avail.toFixed(8)} ${currency}`); return; }
    if (!address.trim()) { setError('Enter a valid wallet address.'); return; }
    setLoading(true);

    const { error: insertError } = await supabase.from('withdrawals').insert({
      user_id: user!.id, currency, amount: amt, destination_address: address.trim(),
    });

    if (insertError) {
      setError('Failed to submit withdrawal. Please try again.');
    } else {
      // Deduct from available balance
      await supabase.from('wallets')
        .update({ available_balance: avail - amt })
        .eq('user_id', user!.id).eq('currency', currency);

      await supabase.from('notifications').insert({
        user_id: user!.id, type: 'admin_action',
        title: 'Withdrawal Submitted',
        message: `Your withdrawal of ${amt} ${currency} is pending review.`,
      });

      setSuccess('Withdrawal submitted successfully. Processing within 4 hours.');
      setAmount(''); setAddress('');
      loadData();
    }
    setLoading(false);
  }

  const statusBadge: Record<string, string> = {
    pending: 'badge-muted', under_review: 'badge-warning',
    approved: 'badge-accent', sent: 'badge-success', rejected: 'badge-danger',
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Withdraw</h1>
        <p>Request a cryptocurrency withdrawal</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>New Withdrawal</div>

            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Currency</label>
                <select className="input" value={currency} onChange={e => setCurrency(e.target.value as Currency)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {currencies.map(c => (
                    <option key={c} value={c}>{currencyLabels[c]} — Available: {(wallets[c] || 0).toFixed(8)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Amount</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" className="input" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00000000" min="0" step="any" required
                  />
                  <button
                    type="button"
                    onClick={() => setAmount((wallets[currency] || 0).toString())}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'var(--accent-dim)', color: 'var(--accent)', border: 'none', borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    MAX
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Available: {(wallets[currency] || 0).toFixed(8)} {currency}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Destination Wallet Address</label>
                <input
                  type="text" className="input" value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Enter your wallet address..." required
                />
              </div>

              <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
                <Clock size={16} style={{ flexShrink: 0 }} />
                Withdrawals are processed within 4 hours. Funds are immediately moved to withdrawal hold upon submission.
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowUpFromLine size={16} /> Submit Withdrawal</>}
              </button>
            </form>
          </div>

          <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
            <Info size={16} style={{ flexShrink: 0 }} />
            Double-check your withdrawal address. Transactions on the blockchain are irreversible.
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.125rem' }}>Withdrawal History</div>
          {withdrawals.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <ArrowUpFromLine size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No withdrawals yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {withdrawals.map(w => (
                <div key={w.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{w.amount} {w.currency.replace('_', ' ')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
                        To: {w.destination_address.slice(0, 12)}...{w.destination_address.slice(-6)}
                      </div>
                    </div>
                    <span className={`badge ${statusBadge[w.status] || 'badge-muted'}`}>{w.status.replace('_', ' ')}</span>
                  </div>
                  {w.admin_note && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>Note: {w.admin_note}</div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(w.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
