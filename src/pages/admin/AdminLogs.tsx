import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface Log {
  id: string; action: string; target_type?: string; target_id?: string;
  details?: Record<string, unknown>; ip_address?: string; created_at: string;
  admin?: { username: string };
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 50;

  useEffect(() => { loadLogs(); }, [page]);

  async function loadLogs() {
    const { data } = await supabase.from('admin_logs')
      .select('*, admin:admin_id(username)')
      .order('created_at', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (data) setLogs(data as Log[]);
    setLoading(false);
  }

  if (loading) return <AdminLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Admin Logs</h1>
        <p>Audit trail of all administrative actions</p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No logs found</td></tr>
            ) : logs.map(log => {
              const admin = log.admin as unknown as { username: string };
              return (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{admin?.username || '—'}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{log.action}</td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {log.target_type && `${log.target_type}: `}{log.target_id?.slice(0, 12) || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} className="btn btn-ghost btn-sm" disabled={page === 0}>Previous</button>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0.375rem 0.75rem' }}>Page {page + 1}</span>
        <button onClick={() => setPage(p => p + 1)} className="btn btn-ghost btn-sm" disabled={logs.length < pageSize}>Next</button>
      </div>
    </AdminLayout>
  );
}
