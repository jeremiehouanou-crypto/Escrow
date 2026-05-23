import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Plus, Filter } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, EscrowTransaction } from '../lib/supabase';

const statusColors: Record<string, string> = {
  awaiting_funding: 'badge-muted', funded: 'badge-accent', in_progress: 'badge-accent',
  delivered: 'badge-warning', completed: 'badge-success',
  disputed: 'badge-danger', refunded: 'badge-muted', cancelled: 'badge-muted',
};

export default function EscrowList() {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'buying' | 'selling'>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) loadEscrows(); }, [user]);

  async function loadEscrows() {
    const { data } = await supabase
      .from('escrow_transactions')
      .select('*, buyer:buyer_id(username), seller:seller_id(username)')
      .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
      .order('created_at', { ascending: false });
    if (data) setEscrows(data as EscrowTransaction[]);
    setLoading(false);
  }

  const filtered = escrows.filter(e => {
    if (filter === 'buying' && e.buyer_id !== user?.id) return false;
    if (filter === 'selling' && e.seller_id !== user?.id) return false;
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    return true;
  });

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Escrow Transactions</h1>
          <p>Manage your escrow agreements</p>
        </div>
        <Link to="/escrow/new" className="btn btn-primary"><Plus size={16} /> New Escrow</Link>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            {(['all', 'buying', 'selling'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <select
            className="input"
            style={{ width: 'auto', paddingTop: '0.375rem', paddingBottom: '0.375rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {['awaiting_funding','funded','in_progress','delivered','completed','disputed','refunded','cancelled'].map(s => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <ShieldCheck size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No escrows found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Create your first escrow transaction to get started</p>
          <Link to="/escrow/new" className="btn btn-primary"><Plus size={16} /> Create Escrow</Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Role</th>
                <th>Counterparty</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const isBuyer = e.buyer_id === user?.id;
                const other = isBuyer
                  ? (e.seller as unknown as { username: string })
                  : (e.buyer as unknown as { username: string });
                return (
                  <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/escrow/${e.id}`}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.id.slice(0, 8)}...</td>
                    <td>
                      <span className={`badge ${isBuyer ? 'badge-accent' : 'badge-success'}`}>
                        {isBuyer ? 'Buyer' : 'Seller'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{other?.username || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{e.amount_crypto} {e.currency.replace('_', ' ')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.amount_fiat} {e.fiat_currency}</div>
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                    <td><span className={`badge ${statusColors[e.status] || 'badge-muted'}`}>{e.status.replace(/_/g, ' ')}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
