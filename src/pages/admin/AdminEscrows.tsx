import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface Escrow {
  id: string; buyer_id: string; seller_id: string; currency: string;
  amount_crypto: number; amount_fiat: number; fiat_currency: string;
  status: string; created_at: string; description: string;
  buyer?: { username: string }; seller?: { username: string };
}

const statusColors: Record<string, string> = {
  awaiting_funding: 'badge-muted', funded: 'badge-accent', in_progress: 'badge-accent',
  delivered: 'badge-warning', completed: 'badge-success', disputed: 'badge-danger',
  refunded: 'badge-muted', cancelled: 'badge-muted',
};

export default function AdminEscrows() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEscrows(); }, [filter]);

  async function loadEscrows() {
    const query = supabase.from('escrow_transactions')
      .select('*, buyer:buyer_id(username), seller:seller_id(username)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') query.eq('status', filter);
    const { data } = await query;
    if (data) setEscrows(data as Escrow[]);
    setLoading(false);
  }

  if (loading) return <AdminLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Escrow Management</h1>
        <p>View and monitor all escrow transactions</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'funded', 'in_progress', 'delivered', 'completed', 'disputed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>ID</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Description</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {escrows.map(e => {
              const buyer = e.buyer as unknown as { username: string };
              const seller = e.seller as unknown as { username: string };
              return (
                <tr key={e.id} style={{ cursor: 'pointer' }} onClick={() => window.open(`/escrow/${e.id}`, '_blank')}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.id.slice(0, 8)}...</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{buyer?.username || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{seller?.username || '—'}</td>
                  <td>
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{e.amount_crypto} {e.currency.replace('_', ' ')}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.amount_fiat} {e.fiat_currency}</div>
                  </td>
                  <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{e.description}</td>
                  <td><span className={`badge ${statusColors[e.status] || 'badge-muted'}`}>{e.status.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
