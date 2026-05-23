import { useEffect, useState } from 'react';
import { Clock, Download } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type TabType = 'escrows' | 'deposits' | 'withdrawals';

const statusColors: Record<string, string> = {
  awaiting_funding: 'badge-muted', funded: 'badge-accent', in_progress: 'badge-accent',
  delivered: 'badge-warning', completed: 'badge-success', disputed: 'badge-danger',
  refunded: 'badge-muted', cancelled: 'badge-muted',
  pending: 'badge-muted', confirming: 'badge-warning', confirmed: 'badge-success', failed: 'badge-danger',
  under_review: 'badge-warning', approved: 'badge-accent', sent: 'badge-success', rejected: 'badge-danger',
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabType>('escrows');
  const [escrows, setEscrows] = useState<{ id: string; buyer: unknown; seller: unknown; currency: string; amount_crypto: number; status: string; created_at: string; buyer_id: string; seller_id: string }[]>([]);
  const [deposits, setDeposits] = useState<{ id: string; currency: string; amount: number; status: string; tx_hash?: string; created_at: string }[]>([]);
  const [withdrawals, setWithdrawals] = useState<{ id: string; currency: string; amount: number; status: string; destination_address: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadAll(); }, [user]);

  async function loadAll() {
    const [eRes, dRes, wRes] = await Promise.all([
      supabase.from('escrow_transactions').select('*, buyer:buyer_id(username), seller:seller_id(username)').or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`).order('created_at', { ascending: false }),
      supabase.from('deposits').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('withdrawals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    ]);
    if (eRes.data) setEscrows(eRes.data as typeof escrows);
    if (dRes.data) setDeposits(dRes.data as typeof deposits);
    if (wRes.data) setWithdrawals(wRes.data as typeof withdrawals);
    setLoading(false);
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Transaction History</h1>
          <p>Complete record of all your activity</p>
        </div>
      </div>

      <div className="tabs">
        {(['escrows', 'deposits', 'withdrawals'] as TabType[]).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {' '}
            <span style={{ fontSize: '0.7rem', marginLeft: 4, background: 'var(--bg-hover)', borderRadius: 999, padding: '0 6px' }}>
              {t === 'escrows' ? escrows.length : t === 'deposits' ? deposits.length : withdrawals.length}
            </span>
          </button>
        ))}
      </div>

      {tab === 'escrows' && (
        escrows.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}><Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} /><p style={{ color: 'var(--text-muted)' }}>No escrow history</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>ID</th><th>Role</th><th>Counterparty</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {escrows.map(e => {
                  const isBuyer = e.buyer_id === user?.id;
                  const other = isBuyer ? (e.seller as { username: string }) : (e.buyer as { username: string });
                  return (
                    <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/escrow/${e.id}`}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.id.slice(0, 8)}...</td>
                      <td><span className={`badge ${isBuyer ? 'badge-accent' : 'badge-success'}`}>{isBuyer ? 'Buyer' : 'Seller'}</span></td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{other?.username || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{e.amount_crypto} {e.currency.replace('_', ' ')}</td>
                      <td><span className={`badge ${statusColors[e.status] || 'badge-muted'}`}>{e.status.replace(/_/g, ' ')}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'deposits' && (
        deposits.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}><Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} /><p style={{ color: 'var(--text-muted)' }}>No deposit history</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Currency</th><th>Amount</th><th>Tx Hash</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id}>
                    <td>{d.currency.replace('_', ' ')}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(d.amount).toFixed(8)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.tx_hash ? `${d.tx_hash.slice(0, 10)}...` : '—'}</td>
                    <td><span className={`badge ${statusColors[d.status] || 'badge-muted'}`}>{d.status}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'withdrawals' && (
        withdrawals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}><Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} /><p style={{ color: 'var(--text-muted)' }}>No withdrawal history</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>Currency</th><th>Amount</th><th>Address</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id}>
                    <td>{w.currency.replace('_', ' ')}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{Number(w.amount).toFixed(8)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.destination_address.slice(0, 12)}...</td>
                    <td><span className={`badge ${statusColors[w.status] || 'badge-muted'}`}>{w.status.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </DashboardLayout>
  );
}
