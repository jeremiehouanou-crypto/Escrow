import { useEffect, useState } from 'react';
import { ArrowDownToLine, Copy, CheckCircle, Info } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Currency } from '../lib/supabase';

const currencies: Currency[] = ['BTC', 'USDT_TRC20', 'USDT_ERC20'];
const currencyInfo: Record<Currency, { label: string; network: string; confirmations: number; icon: string }> = {
  BTC: { label: 'Bitcoin', network: 'Bitcoin Network', confirmations: 3, icon: '₿' },
  USDT_TRC20: { label: 'USDT TRC20', network: 'TRON Network', confirmations: 12, icon: '₮' },
  USDT_ERC20: { label: 'USDT ERC20', network: 'Ethereum Network', confirmations: 12, icon: '₮' },
};

export default function DepositPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Currency>('BTC');
  const [copied, setCopied] = useState(false);
  const [deposits, setDeposits] = useState<{ id: string; currency: string; amount: number; status: string; created_at: string }[]>([]);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    const [addrRes, depRes] = await Promise.all([
      supabase.from('deposit_addresses').select('currency, address').eq('user_id', user!.id),
      supabase.from('deposits').select('id, currency, amount, status, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (addrRes.data) {
      const map: Record<string, string> = {};
      addrRes.data.forEach((a: { currency: string; address: string }) => { map[a.currency] = a.address; });
      setAddresses(map);
    }
    if (depRes.data) setDeposits(depRes.data);
  }

  function copy() {
    const addr = addresses[selected];
    if (!addr) return;
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const addr = addresses[selected];
  const info = currencyInfo[selected];

  const statusBadge: Record<string, string> = {
    pending: 'badge-muted', confirming: 'badge-warning', confirmed: 'badge-success', failed: 'badge-danger',
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Deposit</h1>
        <p>Send cryptocurrency to your wallet</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div>
          {/* Currency selector */}
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Select Currency</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currencies.map(c => {
                const ci = currencyInfo[c];
                return (
                  <button
                    key={c}
                    onClick={() => setSelected(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.875rem', borderRadius: 10,
                      background: selected === c ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                      border: `2px solid ${selected === c ? 'var(--accent)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}
                  >
                    <div className={`crypto-icon ${c === 'BTC' ? 'crypto-btc' : 'crypto-usdt'}`}>{ci.icon}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{ci.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ci.network}</div>
                    </div>
                    {selected === c && <CheckCircle size={18} color="var(--accent)" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deposit info */}
          <div className="card">
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              Deposit {info.label}
            </div>

            {addr ? (
              <>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1.25rem', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Your {selected} Address</div>
                  <code style={{ fontSize: '0.8rem', color: 'var(--text-primary)', wordBreak: 'break-all', lineHeight: 1.5, display: 'block', marginBottom: '0.875rem' }}>
                    {addr}
                  </code>
                  <button onClick={copy} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {copied ? <><CheckCircle size={16} /> Copied!</> : <><Copy size={16} /> Copy Address</>}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { label: 'Network', value: info.network },
                    { label: 'Confirmations Required', value: `${info.confirmations} confirmations` },
                    { label: 'Minimum Deposit', value: selected === 'BTC' ? '0.0001 BTC' : '10 USDT' },
                    { label: 'Processing Time', value: 'Automatic after confirmations' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="alert alert-info">
                <Info size={16} style={{ flexShrink: 0 }} />
                No deposit address assigned yet. The platform admin assigns addresses from the admin panel. Please check back shortly.
              </div>
            )}

            <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              Only send {info.label} to this address. Sending any other cryptocurrency may result in permanent loss.
            </div>
          </div>
        </div>

        {/* Deposit history */}
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', fontSize: '1.125rem' }}>Recent Deposits</div>
          {deposits.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <ArrowDownToLine size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)' }}>No deposits yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Currency</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {deposits.map(d => (
                    <tr key={d.id}>
                      <td>{d.currency.replace('_', ' ')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{Number(d.amount).toFixed(8)}</td>
                      <td><span className={`badge ${statusBadge[d.status] || 'badge-muted'}`}>{d.status}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
