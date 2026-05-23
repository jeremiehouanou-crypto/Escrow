import { useEffect, useState, useRef } from 'react';
import { Send, CheckCircle, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Dispute {
  id: string; escrow_id: string; opened_by: string; reason: string;
  status: string; admin_note?: string; admin_decision?: string;
  buyer_amount?: number; seller_amount?: number;
  created_at: string; resolved_at?: string;
  escrow?: { description: string; currency: string; amount_crypto: number; buyer_id: string; seller_id: string };
  opener?: { username: string };
}

interface DisputeMessage {
  id: string; sender_id: string; content: string; is_admin_message: boolean;
  created_at: string; sender?: { username: string };
}

const statusBadge: Record<string, string> = {
  open: 'badge-warning', under_review: 'badge-accent', resolved: 'badge-success',
};

export default function AdminDisputes() {
  const { user: admin } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [decision, setDecision] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [buyerAmount, setBuyerAmount] = useState('');
  const [sellerAmount, setSellerAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('open');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadDisputes(); }, [filter]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadDisputes() {
    const query = supabase.from('disputes')
      .select('*, escrow:escrow_id(description, currency, amount_crypto, buyer_id, seller_id), opener:opened_by(username)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query.eq('status', filter);
    const { data } = await query;
    if (data) setDisputes(data as Dispute[]);
  }

  async function selectDispute(d: Dispute) {
    setSelected(d);
    setAdminNote(d.admin_note || '');
    setDecision(d.admin_decision || '');
    const { data } = await supabase.from('dispute_messages')
      .select('*, sender:sender_id(username)')
      .eq('dispute_id', d.id).order('created_at', { ascending: true });
    if (data) setMessages(data as DisputeMessage[]);
  }

  async function sendAdminMessage() {
    if (!newMsg.trim() || !selected) return;
    await supabase.from('dispute_messages').insert({ dispute_id: selected.id, sender_id: admin!.id, content: newMsg.trim(), is_admin_message: true });
    setNewMsg('');
    selectDispute(selected);
  }

  async function resolveDispute(resolution: 'refund_buyer' | 'release_seller' | 'split') {
    if (!selected) return;
    setActionLoading(true);
    const escrow = selected.escrow as unknown as { currency: string; amount_crypto: number; buyer_id: string; seller_id: string };

    if (resolution === 'refund_buyer') {
      const { data: w } = await supabase.from('wallets').select('available_balance, escrow_balance').eq('user_id', escrow.buyer_id).eq('currency', escrow.currency).maybeSingle();
      await supabase.from('wallets').update({ available_balance: (w?.available_balance || 0) + escrow.amount_crypto, escrow_balance: Math.max(0, (w?.escrow_balance || 0) - escrow.amount_crypto) }).eq('user_id', escrow.buyer_id).eq('currency', escrow.currency);
    } else if (resolution === 'release_seller') {
      const { data: sw } = await supabase.from('wallets').select('available_balance').eq('user_id', escrow.seller_id).eq('currency', escrow.currency).maybeSingle();
      await supabase.from('wallets').update({ available_balance: (sw?.available_balance || 0) + escrow.amount_crypto }).eq('user_id', escrow.seller_id).eq('currency', escrow.currency);
      const { data: bw } = await supabase.from('wallets').select('escrow_balance').eq('user_id', escrow.buyer_id).eq('currency', escrow.currency).maybeSingle();
      await supabase.from('wallets').update({ escrow_balance: Math.max(0, (bw?.escrow_balance || 0) - escrow.amount_crypto) }).eq('user_id', escrow.buyer_id).eq('currency', escrow.currency);
    } else if (resolution === 'split') {
      const bAmt = parseFloat(buyerAmount) || 0;
      const sAmt = parseFloat(sellerAmount) || 0;
      if (bAmt > 0) {
        const { data: bw } = await supabase.from('wallets').select('available_balance, escrow_balance').eq('user_id', escrow.buyer_id).eq('currency', escrow.currency).maybeSingle();
        await supabase.from('wallets').update({ available_balance: (bw?.available_balance || 0) + bAmt, escrow_balance: Math.max(0, (bw?.escrow_balance || 0) - escrow.amount_crypto) }).eq('user_id', escrow.buyer_id).eq('currency', escrow.currency);
      }
      if (sAmt > 0) {
        const { data: sw } = await supabase.from('wallets').select('available_balance').eq('user_id', escrow.seller_id).eq('currency', escrow.currency).maybeSingle();
        await supabase.from('wallets').update({ available_balance: (sw?.available_balance || 0) + sAmt }).eq('user_id', escrow.seller_id).eq('currency', escrow.currency);
      }
    }

    await supabase.from('disputes').update({
      status: 'resolved', admin_decision: decision,
      admin_note: adminNote, resolved_by: admin!.id,
      resolved_at: new Date().toISOString(),
      buyer_amount: resolution === 'split' ? parseFloat(buyerAmount) : undefined,
      seller_amount: resolution === 'split' ? parseFloat(sellerAmount) : undefined,
    }).eq('id', selected.id);

    const escrowStatus = resolution === 'refund_buyer' ? 'refunded' : 'completed';
    await supabase.from('escrow_transactions').update({ status: escrowStatus, resolved_at: new Date().toISOString() }).eq('id', selected.escrow_id);

    await supabase.from('notifications').insert([
      { user_id: escrow.buyer_id, type: 'dispute_resolved', title: 'Dispute Resolved', message: `Admin decision: ${decision}`, link: `/escrow/${selected.escrow_id}` },
      { user_id: escrow.seller_id, type: 'dispute_resolved', title: 'Dispute Resolved', message: `Admin decision: ${decision}`, link: `/escrow/${selected.escrow_id}` },
    ]);

    await supabase.from('admin_logs').insert({ admin_id: admin!.id, action: `Resolved dispute ${selected.id} — ${resolution}`, target_type: 'dispute', target_id: selected.id });

    setSelected(null);
    setActionLoading(false);
    loadDisputes();
  }

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Dispute Management</h1>
        <p>Review and resolve platform disputes</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'open', 'under_review', 'resolved'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {disputes.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
              <p style={{ color: 'var(--text-muted)' }}>No {filter !== 'all' ? filter : ''} disputes</p>
            </div>
          ) : disputes.map(d => {
            const escrow = d.escrow as unknown as { description: string; currency: string; amount_crypto: number };
            return (
              <div key={d.id} className="card" onClick={() => selectDispute(d)} style={{ cursor: 'pointer', border: selected?.id === d.id ? '2px solid var(--accent)' : '1px solid var(--border)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{d.id.slice(0, 8)}</span>
                  <span className={`badge ${statusBadge[d.status] || 'badge-muted'}`}>{d.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>{escrow?.description || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {escrow?.amount_crypto} {escrow?.currency?.replace('_', ' ')} · Opened by @{(d.opener as unknown as { username: string })?.username}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(d.created_at).toLocaleDateString()}</div>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Dispute #{selected.id.slice(0, 8)}</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, fontSize: '0.75rem', textTransform: 'uppercase' }}>Reason</div>
              <div style={{ color: 'var(--text-primary)' }}>{selected.reason}</div>
            </div>

            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Messages</div>
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 220, background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.875rem' }}>
              {messages.map(msg => {
                const isAdmin = msg.is_admin_message;
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isAdmin ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: isAdmin ? 'var(--warning)' : 'var(--text-muted)', marginBottom: 3 }}>
                      {isAdmin ? 'Admin' : (msg.sender as unknown as { username: string })?.username} · {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                    <div className={`message-bubble ${isAdmin ? 'own' : 'other'}`} style={isAdmin ? { background: 'var(--warning)', color: '#fff' } : undefined}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input type="text" className="input" placeholder="Send admin message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendAdminMessage()} />
              <button onClick={sendAdminMessage} className="btn btn-primary" style={{ flexShrink: 0 }}><Send size={16} /></button>
            </div>

            {selected.status !== 'resolved' && (
              <>
                <hr className="divider" />
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem', fontSize: '0.875rem' }}>Admin Decision</div>
                <div className="form-group">
                  <label className="label">Decision Summary</label>
                  <textarea className="input" rows={2} value={decision} onChange={e => setDecision(e.target.value)} placeholder="Describe the resolution decision..." style={{ resize: 'vertical' }} />
                </div>
                <div className="form-group">
                  <label className="label">Note (optional)</label>
                  <input type="text" className="input" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Internal note..." />
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Split amounts (for partial resolution)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input type="number" className="input" placeholder="Buyer amount" value={buyerAmount} onChange={e => setBuyerAmount(e.target.value)} min="0" step="any" />
                  <input type="number" className="input" placeholder="Seller amount" value={sellerAmount} onChange={e => setSellerAmount(e.target.value)} min="0" step="any" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button onClick={() => resolveDispute('refund_buyer')} className="btn btn-warning btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading || !decision}>
                    Refund Buyer
                  </button>
                  <button onClick={() => resolveDispute('release_seller')} className="btn btn-success btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading || !decision}>
                    <CheckCircle size={14} /> Release Seller
                  </button>
                  <button onClick={() => resolveDispute('split')} className="btn btn-primary btn-sm" style={{ justifyContent: 'center' }} disabled={actionLoading || !decision || (!buyerAmount && !sellerAmount)}>
                    Split
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
