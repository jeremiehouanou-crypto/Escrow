import { useState } from 'react';
import { Shield, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'escrow_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function AdminSetup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secret, setSecret] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (secret !== 'SETUP_ADMIN_2024') { setError('Invalid setup secret.'); return; }
    setLoading(true);
    const hash = await hashPassword(password);
    const { data: exists } = await supabase.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
    if (exists) {
      // Promote existing
      await supabase.from('users').update({ role: 'admin', password_hash: hash }).eq('username', username.toLowerCase());
    } else {
      await supabase.from('users').insert({ username: username.toLowerCase(), password_hash: hash, role: 'admin' });
      const { data: newUser } = await supabase.from('users').select('id').eq('username', username.toLowerCase()).maybeSingle();
      if (newUser) {
        await supabase.from('wallets').insert([
          { user_id: newUser.id, currency: 'BTC' },
          { user_id: newUser.id, currency: 'USDT_TRC20' },
          { user_id: newUser.id, currency: 'USDT_ERC20' },
        ]);
      }
    }
    setDone(true);
    setLoading(false);
  }

  if (done) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Admin Created!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You can now sign in with your admin credentials.</p>
        <a href="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Go to Login</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: 400, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Shield size={40} color="var(--warning)" style={{ margin: '0 auto 0.75rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Admin Setup</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>One-time admin account creation</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="label">Setup Secret</label>
              <input type="password" className="input" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Enter setup secret key" required />
            </div>
            <div className="form-group">
              <label className="label">Admin Username</label>
              <input type="text" className="input" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin_username" required />
            </div>
            <div className="form-group">
              <label className="label">Admin Password</label>
              <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password..." required minLength={8} />
            </div>
            <button type="submit" className="btn btn-warning" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Admin Account'}
            </button>
          </form>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
            Setup secret: <code style={{ color: 'var(--warning)' }}>SETUP_ADMIN_2024</code>
          </p>
        </div>
      </div>
    </div>
  );
}
