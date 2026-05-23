import { useEffect, useState } from 'react';
import { Search, UserX, UserCheck, DollarSign, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserRow {
  id: string; username: string; role: string; status: string;
  created_at: string; last_login?: string;
}

export default function AdminUsers() {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustCurrency, setAdjustCurrency] = useState('BTC');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data as UserRow[]);
    setLoading(false);
  }

  async function updateStatus(userId: string, status: string) {
    setActionLoading(true);
    await supabase.from('users').update({ status }).eq('id', userId);
    await supabase.from('admin_logs').insert({ admin_id: adminUser!.id, action: `Set user status to ${status}`, target_type: 'user', target_id: userId });
    loadUsers();
    setActionLoading(false);
    setFeedback(`User status updated to ${status}`);
  }

  async function adjustBalance() {
    if (!selectedUser || !adjustAmount) return;
    setActionLoading(true);
    const amt = parseFloat(adjustAmount);
    const { data: wallet } = await supabase.from('wallets').select('available_balance').eq('user_id', selectedUser.id).eq('currency', adjustCurrency).maybeSingle();
    const current = wallet?.available_balance || 0;
    const newBalance = adjustType === 'credit' ? current + amt : Math.max(0, current - amt);
    await supabase.from('wallets').update({ available_balance: newBalance }).eq('user_id', selectedUser.id).eq('currency', adjustCurrency);
    await supabase.from('admin_logs').insert({ admin_id: adminUser!.id, action: `${adjustType} ${amt} ${adjustCurrency} to/from ${selectedUser.username}`, target_type: 'user', target_id: selectedUser.id, details: { amount: amt, currency: adjustCurrency, type: adjustType } });
    await supabase.from('notifications').insert({ user_id: selectedUser.id, type: 'admin_action', title: 'Balance Adjusted', message: `Admin ${adjustType}ed ${amt} ${adjustCurrency} on your account.` });
    setAdjustAmount('');
    setActionLoading(false);
    setFeedback('Balance adjusted successfully');
    setSelectedUser(null);
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AdminLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage platform users and their balances</p>
      </div>

      {feedback && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          {feedback}
          <button onClick={() => setFeedback('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={14} /></button>
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" style={{ paddingLeft: '2.25rem' }} placeholder="Search by username or ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{u.username}</div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{u.id.slice(0, 12)}...</div>
                </td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-warning' : 'badge-muted'}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'suspended' ? 'badge-danger' : 'badge-warning'}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={{ fontSize: '0.8rem' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                    {u.status === 'active' ? (
                      <button onClick={() => updateStatus(u.id, 'suspended')} className="btn btn-sm btn-danger" disabled={actionLoading || u.id === adminUser?.id}>
                        <UserX size={12} /> Suspend
                      </button>
                    ) : (
                      <button onClick={() => updateStatus(u.id, 'active')} className="btn btn-sm btn-success" disabled={actionLoading}>
                        <UserCheck size={12} /> Activate
                      </button>
                    )}
                    <button onClick={() => setSelectedUser(u)} className="btn btn-sm btn-secondary">
                      <DollarSign size={12} /> Balance
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Balance adjust modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedUser(null)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Adjust Balance — @{selectedUser.username}</h3>
              <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="label">Currency</label>
              <select className="input" value={adjustCurrency} onChange={e => setAdjustCurrency(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="USDT_TRC20">USDT TRC20</option>
                <option value="USDT_ERC20">USDT ERC20</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">Amount</label>
              <input type="number" className="input" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="0.00000000" min="0" step="any" />
            </div>

            <div className="form-group">
              <label className="label">Type</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setAdjustType('credit')} className={`btn btn-sm ${adjustType === 'credit' ? 'btn-success' : 'btn-ghost'}`} style={{ flex: 1, justifyContent: 'center' }}>Credit</button>
                <button onClick={() => setAdjustType('debit')} className={`btn btn-sm ${adjustType === 'debit' ? 'btn-danger' : 'btn-ghost'}`} style={{ flex: 1, justifyContent: 'center' }}>Debit</button>
              </div>
            </div>

            <button onClick={adjustBalance} className={`btn ${adjustType === 'credit' ? 'btn-success' : 'btn-danger'}`} style={{ width: '100%', justifyContent: 'center' }} disabled={actionLoading || !adjustAmount}>
              {actionLoading ? <span className="spinner" /> : `${adjustType.charAt(0).toUpperCase() + adjustType.slice(1)} Balance`}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
