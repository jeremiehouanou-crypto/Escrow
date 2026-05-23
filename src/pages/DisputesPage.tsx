import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Dispute {
  id: string; escrow_id: string; opened_by: string; reason: string;
  status: string; admin_decision?: string; admin_note?: string;
  created_at: string; resolved_at?: string;
  escrow?: { description: string; currency: string; amount_crypto: number; buyer_id: string; seller_id: string };
  opener?: { username: string };
}

interface DisputeMessage {
  id: string; dispute_id: string; sender_id: string; content: string;
  is_admin_message: boolean; created_at: string; sender?: { username: string };
}

const statusBadge: Record<string, string> = {
  open: 'badge-warning', under_review: 'badge-accent', resolved: 'badge-success',
};

export default function DisputesPage() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [messages, setMessages] = useState<DisputeMessage[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (user) loadDisputes(); }, [user]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadDisputes() {
    const { data } = await supabase
      .from('disputes')
      .select('*, escrow:escrow_id(description, currency, amount_crypto, buyer_id, seller_id), opener:opened_by(username)')
      .or(`escrow_id.in.(${await getMyEscrowIds()})`)
      .order('created_at', { ascending: false });
    if (data) setDisputes(data as Dispute[]);
    setLoading(false);
  }

  async function getMyEscrowIds(): Promise<string> {
    const { data } = await supabase.from('escrow_transactions').select('id').or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
    if (!data || data.length === 0) return "''";
    return data.map((e: { id: string }) => `${e.id}`).join(',');
  }

  async function loadMessages(disputeId: string) {
    const { data } = await supabase.from('dispute_messages')
      .select('*, sender:sender_id(username)')
      .eq('dispute_id', disputeId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as DisputeMessage[]);
  }

  async function selectDispute(dispute: Dispute) {
    setSelected(dispute);
    await loadMessages(dispute.id);
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected) return;
    await supabase.from('dispute_messages').insert({ dispute_id: selected.id, sender_id: user!.id, content: newMsg.trim() });
    setNewMsg('');
    loadMessages(selected.id);
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Dispute Center</h1>
        <p>Manage and track your dispute cases</p>
      </div>

      {disputes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No disputes</h3>
          <p style={{ color: 'var(--text-muted)' }}>No disputes have been opened on your escrows</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: '1.5rem' }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {disputes.map(d => {
              const escrow = d.escrow as unknown as { description: string; currency: string; amount_crypto: number };
              return (
                <div
                  key={d.id}
                  className="card"
                  onClick={() => selectDispute(d)}
                  style={{ cursor: 'pointer', border: selected?.id === d.id ? '2px solid var(--accent)' : '1px solid var(--border)', padding: '1rem' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{d.id.slice(0, 8)}</span>
                    <span className={`badge ${statusBadge[d.status] || 'badge-muted'}`}>{d.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                    {escrow?.description || 'Escrow dispute'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{escrow?.amount_crypto} {escrow?.currency?.replace('_', ' ')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(d.created_at).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          {selected && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Dispute #{selected.id.slice(0, 8)}</h3>
                <span className={`badge ${statusBadge[selected.status] || 'badge-muted'}`}>{selected.status.replace('_', ' ')}</span>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Reason</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{selected.reason}</div>
              </div>

              {selected.admin_decision && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                  <div>
                    <strong>Admin Decision:</strong> {selected.admin_decision}
                    {selected.admin_note && <div style={{ marginTop: 4 }}>{selected.admin_note}</div>}
                  </div>
                </div>
              )}

              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Messages</div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', maxHeight: 300, minHeight: 150, background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.875rem' }}>
                {messages.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>No messages yet</div>}
                {messages.map(msg => {
                  const isOwn = msg.sender_id === user?.id;
                  const senderName = msg.is_admin_message ? 'Admin' : (msg.sender as unknown as { username: string })?.username || '—';
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      <div style={{ fontSize: '0.7rem', color: msg.is_admin_message ? 'var(--warning)' : 'var(--text-muted)', marginBottom: 3 }}>
                        {senderName} · {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`} style={msg.is_admin_message ? { background: 'var(--warning-dim)', color: 'var(--warning)' } : undefined}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {selected.status !== 'resolved' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="input" placeholder="Add evidence or message..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
                  <button onClick={sendMessage} className="btn btn-primary" style={{ flexShrink: 0 }}><Send size={16} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
