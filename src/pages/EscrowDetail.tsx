import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, CheckCircle, AlertTriangle, Package, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, EscrowTransaction } from '../lib/supabase';

const statusOrder = ['awaiting_funding','funded','in_progress','delivered','completed'];

interface Message {
  id: string; sender_id: string; content: string;
  created_at: string; sender?: { username: string };
}

export default function EscrowDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (id && user) loadData(); }, [id, user]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadData() {
    const [escrowRes, msgRes] = await Promise.all([
      supabase.from('escrow_transactions')
        .select('*, buyer:buyer_id(username), seller:seller_id(username)')
        .eq('id', id).maybeSingle(),
      supabase.from('escrow_messages')
        .select('*, sender:sender_id(username)')
        .eq('escrow_id', id).order('created_at', { ascending: true }),
    ]);
    if (!escrowRes.data) { navigate('/escrow'); return; }
    setEscrow(escrowRes.data as EscrowTransaction);
    if (msgRes.data) setMessages(msgRes.data as Message[]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!newMsg.trim() || !id) return;
    await supabase.from('escrow_messages').insert({ escrow_id: id, sender_id: user!.id, content: newMsg.trim() });
    setNewMsg('');
    loadData();
  }

  async function markDelivered() {
    setActionLoading(true);
    await supabase.from('escrow_transactions').update({ status: 'delivered', delivered_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('notifications').insert({
      user_id: escrow!.buyer_id, type: 'delivery_marked',
      title: 'Delivery Marked', message: 'The seller has marked the order as delivered. Please confirm receipt.',
      link: `/escrow/${id}`,
    });
    setActionLoading(false); loadData();
  }

  async function releaseEscrow() {
    setActionLoading(true);
    // Credit seller
    const { data: sellerWallet } = await supabase.from('wallets').select('available_balance').eq('user_id', escrow!.seller_id).eq('currency', escrow!.currency).maybeSingle();
    const sellerAmount = escrow!.amount_crypto;
    await supabase.from('wallets').update({ available_balance: (sellerWallet?.available_balance || 0) + sellerAmount }).eq('user_id', escrow!.seller_id).eq('currency', escrow!.currency);

    // Reduce buyer escrow balance
    const { data: buyerWallet } = await supabase.from('wallets').select('escrow_balance').eq('user_id', escrow!.buyer_id).eq('currency', escrow!.currency).maybeSingle();
    await supabase.from('wallets').update({ escrow_balance: Math.max(0, (buyerWallet?.escrow_balance || 0) - sellerAmount) }).eq('user_id', escrow!.buyer_id).eq('currency', escrow!.currency);

    await supabase.from('escrow_transactions').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);

    await supabase.from('notifications').insert([
      { user_id: escrow!.seller_id, type: 'escrow_released', title: 'Payment Released', message: `${sellerAmount.toFixed(8)} ${escrow!.currency} has been credited to your wallet.`, link: `/escrow/${id}` },
      { user_id: escrow!.buyer_id, type: 'escrow_released', title: 'Escrow Completed', message: 'The escrow has been successfully completed.', link: `/escrow/${id}` },
    ]);

    setActionLoading(false); loadData();
  }

  async function openDispute() {
    if (!disputeReason.trim()) return;
    setActionLoading(true);
    await supabase.from('disputes').insert({ escrow_id: id, opened_by: user!.id, reason: disputeReason });
    await supabase.from('escrow_transactions').update({ status: 'disputed', disputed_at: new Date().toISOString() }).eq('id', id);
    const other = user!.id === escrow!.buyer_id ? escrow!.seller_id : escrow!.buyer_id;
    await supabase.from('notifications').insert([
      { user_id: other, type: 'dispute_opened', title: 'Dispute Opened', message: 'A dispute has been opened on one of your escrow transactions.', link: `/escrow/${id}` },
    ]);
    setShowDisputeForm(false);
    setActionLoading(false); loadData();
  }

  if (loading || !escrow) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
    </DashboardLayout>
  );

  const isBuyer = escrow.buyer_id === user?.id;
  const isSeller = escrow.seller_id === user?.id;
  const buyer = escrow.buyer as unknown as { username: string };
  const seller = escrow.seller as unknown as { username: string };
  const currentStep = statusOrder.indexOf(escrow.status);
  const canRelease = isBuyer && ['delivered', 'in_progress', 'funded'].includes(escrow.status);
  const canDeliver = isSeller && ['funded', 'in_progress'].includes(escrow.status);
  const canDispute = (isBuyer || isSeller) && ['funded', 'in_progress', 'delivered'].includes(escrow.status);
  const canMessage = ['funded', 'in_progress', 'delivered', 'disputed'].includes(escrow.status);

  const statusColors: Record<string, string> = {
    awaiting_funding: 'badge-muted', funded: 'badge-accent', in_progress: 'badge-accent',
    delivered: 'badge-warning', completed: 'badge-success', disputed: 'badge-danger',
    refunded: 'badge-muted', cancelled: 'badge-muted',
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Escrow #{escrow.id.slice(0, 8)}</h1>
            <p>{escrow.description}</p>
          </div>
          <span className={`badge ${statusColors[escrow.status]}`} style={{ fontSize: '0.875rem', padding: '0.375rem 0.875rem' }}>
            {escrow.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Timeline */}
      {!['disputed', 'refunded', 'cancelled'].includes(escrow.status) && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="timeline">
            {statusOrder.map((s, i) => (
              <div key={s} className="timeline-step">
                <div className={`timeline-dot ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
                  {i < currentStep ? <CheckCircle size={14} /> : i + 1}
                </div>
                <div className="timeline-label">{s.replace(/_/g, ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {escrow.status === 'disputed' && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          This escrow is under dispute. An admin will review and resolve it. Check the Disputes section for updates.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Escrow details */}
        <div>
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Transaction Details</h3>
            {[
              { label: 'Buyer', value: `@${buyer?.username || '—'}` },
              { label: 'Seller', value: `@${seller?.username || '—'}` },
              { label: 'Amount', value: `${escrow.amount_crypto} ${escrow.currency.replace('_', ' ')}` },
              { label: 'Fiat Value', value: `${escrow.amount_fiat} ${escrow.fiat_currency}` },
              { label: 'Platform Fee', value: `${escrow.platform_fee} ${escrow.currency.replace('_', ' ')}` },
              { label: 'Delivery Days', value: `${escrow.delivery_days} days` },
              { label: 'Created', value: new Date(escrow.created_at).toLocaleString() },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="card">
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Actions</h3>
            {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            {canDeliver && (
              <button onClick={markDelivered} className="btn btn-warning" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }} disabled={actionLoading}>
                <Package size={16} /> Mark as Delivered
              </button>
            )}

            {canRelease && (
              <button onClick={releaseEscrow} className="btn btn-success" style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }} disabled={actionLoading}>
                <ShieldCheck size={16} /> Release Payment to Seller
              </button>
            )}

            {canDispute && !showDisputeForm && (
              <button onClick={() => setShowDisputeForm(true)} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
                <AlertTriangle size={16} /> Open Dispute
              </button>
            )}

            {showDisputeForm && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="label">Dispute Reason</label>
                <textarea className="input" rows={3} placeholder="Describe the issue..." value={disputeReason} onChange={e => setDisputeReason(e.target.value)} style={{ resize: 'vertical', marginBottom: '0.75rem' }} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setShowDisputeForm(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                  <button onClick={openDispute} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} disabled={actionLoading || !disputeReason.trim()}>
                    Submit Dispute
                  </button>
                </div>
              </div>
            )}

            {escrow.status === 'completed' && (
              <div className="alert alert-success">
                <CheckCircle size={16} style={{ flexShrink: 0 }} />
                This escrow has been completed successfully.
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {canMessage && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Messages</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 320 }}>
              {messages.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No messages yet.</div>}
              {messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                const senderName = (msg.sender as unknown as { username: string })?.username || '—';
                return (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 3 }}>
                      {isOwn ? 'You' : senderName} · {new Date(msg.created_at).toLocaleTimeString()}
                    </div>
                    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>{msg.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text" className="input" placeholder="Type a message..."
                value={newMsg} onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="btn btn-primary" style={{ flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
