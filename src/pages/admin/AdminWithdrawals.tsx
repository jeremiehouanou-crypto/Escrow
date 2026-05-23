import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Withdrawal {
  id: string; user_id: string; currency: string; amount: number;
  destination_address: string; status: string; admin_note?: string;
  created_at: string; user?: { username: string };
}

export default function AdminWithdrawals() {
  const { user: admin } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [note, setNote] = useState('');
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadWithdrawals(); }, [statusFilter]);

  async function loadWithdrawals() {
    const query = supabase.from('withdrawals').select('*, user:user_id(username)').order('created_at', { ascending: false });
    if (statusFilter !== 'all') query.eq('status', statusFilter);
    const { data } = await query;
    if (data) setWithdrawals(data as Withdrawal[]);
    setLoading(false);
  }

  async function updateStatus(id: string, userId: string, status: string, adminNote?: string, txHashVal?: string) {
    setActionLoading(true);
    const updates: Record<string, string> = { status };
    if (adminNote) updates.admin_note = adminNote;
    if (txHashVal) updates.tx_hash = txHashVal;
    if (status === 'approved') updates.reviewed_at = new Date().toISOString();
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    updates.reviewed_by = admin!.id;

    await supabase.from('withdrawals').update(updates).eq('id', id);

    const notifType = status === 'rejected' ? 'withdrawal_rejected' : 'withdrawal_approved';
    await supabase.from('notifications').insert({
      user_id: userId,
      type: notifType,
      title: status === 'rejected' ? 'Withdrawal Rejected' : status === 'sent' ? 'Withdrawal Sent' : 'Withdrawal Approved',
      message: status === 'rejected' ? `Your withdrawal was rejected. ${adminNote || ''}` : status === 'sent' ? `Your withdrawal has been sent. Tx: ${txHashVal || 'N/A'}` : 'Your withdrawal has been approved and is being processed.',
    });

    if (status === 'rejected') {
      // Refund to user wallet
      const { data: w } = await supabase.from('withdrawals').select('amount, currency').eq('id', id).maybeSingle();
      if (w) {
        const { data: wallet } = await supabase.from('wallets').select('available_balance').eq('user_id', userId).eq('currency', w.currency).maybeSingle();
        await supabase.from('wallets').update({ available_balance: (wallet?.available_balance || 0) + w.amount }).eq('user_id', userId).eq('currency', w.currency);
      }
    }

    await supabase.from('admin_logs').insert({ admin_id: admin!.id, action: `Updated withdrawal ${id} to ${status}`, target_type: 'withdrawal', target_id: id });

    setSelected(null); setNote(''); setTxHash('');
    loadWithdrawals();
    setActionLoading(false);
  }

  const statusBadge: Record<string, string> = {
    pending: 'badge-muted', under_review: 'badge-warning',
    approved: 'badge-accent', sent: 'badge-success', rejected: 'badge-danger',
  };

  if (loading) return <AdminLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Withdrawal Management</h1>
        <p>Review and process user withdrawals</p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'pending', 'under_review', 'approved', 'sent', 'rejected'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No {statusFilter !== 'all' ? statusFilter : ''} withdrawals found</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>User</th><th>Currency</th><th>Amount</th><th>Address</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {withdrawals.map(w => {
                const usr = w.user as unknown as { username: string };
                return (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{usr?.username || '—'}</td>
                    <td>{w.currency.replace('_', ' ')}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{Number(w.amount).toFixed(8)}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{w.destination_address.slice(0, 14)}...</td>
                    <td><span className={`badge ${statusBadge[w.status] || 'badge-muted'}`}>{w.status.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button onClick={() => { setSelected(w); setNote(w.admin_note || ''); }} className="btn btn-sm btn-secondary">
                          <Eye size={12} /> Review
                        </button>
                        {w.status === 'pending' && (
                          <>
                            <button onClick={() => updateStatus(w.id, w.user_id, 'approved')} className="btn btn-sm btn-success" disabled={actionLoading}>
                              <CheckCircle size={12} />
                            </button>
                            <button onClick={() => updateStatus(w.id, w.user_id, 'rejected')} className="btn btn-sm btn-danger" disabled={actionLoading}>
                              <XCircle size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Review modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Review Withdrawal</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'User', value: `@${(selected.user as unknown as { username: string })?.username}` },
                { label: 'Currency', value: selected.currency.replace('_', ' ') },
                { label: 'Amount', value: `${Number(selected.amount).toFixed(8)} ${selected.currency}` },
                { label: 'Address', value: selected.destination_address },
                { label: 'Status', value: selected.status },
                { label: 'Submitted', value: new Date(selected.created_at).toLocaleString() },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: item.label === 'Address' || item.label === 'Amount' ? 'monospace' : undefined, fontSize: item.label === 'Address' ? '0.75rem' : undefined, wordBreak: 'break-all' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="label">Admin Note</label>
              <textarea className="input" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note..." style={{ resize: 'vertical' }} />
            </div>

            {['approved', 'sent'].includes(selected.status) && (
              <div className="form-group">
                <label className="label">Transaction Hash (for sent)</label>
                <input type="text" className="input" value={txHash} onChange={e => setTxHash(e.target.value)} placeholder="0x..." />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {selected.status === 'pending' && (
                <button onClick={() => updateStatus(selected.id, selected.user_id, 'under_review', note)} className="btn btn-warning btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading}>
                  Under Review
                </button>
              )}
              {['pending', 'under_review'].includes(selected.status) && (
                <button onClick={() => updateStatus(selected.id, selected.user_id, 'approved', note)} className="btn btn-success btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading}>
                  <CheckCircle size={14} /> Approve
                </button>
              )}
              {selected.status === 'approved' && (
                <button onClick={() => updateStatus(selected.id, selected.user_id, 'sent', note, txHash)} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading}>
                  Mark Sent
                </button>
              )}
              {!['rejected', 'sent'].includes(selected.status) && (
                <button onClick={() => updateStatus(selected.id, selected.user_id, 'rejected', note)} className="btn btn-danger btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading}>
                  <XCircle size={14} /> Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
