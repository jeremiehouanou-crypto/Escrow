import { useEffect, useState } from 'react';
import { Users, ShieldCheck, ArrowUpFromLine, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { supabase } from '../../lib/supabase';

interface Stats {
  totalUsers: number; activeEscrows: number; pendingWithdrawals: number;
  openDisputes: number; totalEscrowVolume: number; completedEscrows: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, activeEscrows: 0, pendingWithdrawals: 0, openDisputes: 0, totalEscrowVolume: 0, completedEscrows: 0 });
  const [recentActivity, setRecentActivity] = useState<{ id: string; action: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    const [usersRes, escrowsRes, withdrawalsRes, disputesRes, logsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('escrow_transactions').select('id, status, amount_fiat'),
      supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('admin_logs').select('id, action, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const escrowData = escrowsRes.data || [];
    const activeEscrows = escrowData.filter((e: { status: string }) => ['funded', 'in_progress', 'delivered'].includes(e.status)).length;
    const completedEscrows = escrowData.filter((e: { status: string }) => e.status === 'completed').length;
    const totalVolume = escrowData.filter((e: { status: string }) => e.status === 'completed').reduce((sum: number, e: { amount_fiat: number }) => sum + (e.amount_fiat || 0), 0);

    setStats({
      totalUsers: usersRes.count || 0,
      activeEscrows,
      pendingWithdrawals: withdrawalsRes.count || 0,
      openDisputes: disputesRes.count || 0,
      totalEscrowVolume: totalVolume,
      completedEscrows,
    });

    if (logsRes.data) setRecentActivity(logsRes.data as typeof recentActivity);
    setLoading(false);
  }

  const statCards = [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, color: '#0ea5e9' },
    { icon: ShieldCheck, label: 'Active Escrows', value: stats.activeEscrows, color: '#10b981' },
    { icon: ArrowUpFromLine, label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: '#f59e0b' },
    { icon: AlertTriangle, label: 'Open Disputes', value: stats.openDisputes, color: '#ef4444' },
    { icon: TrendingUp, label: 'Completed Escrows', value: stats.completedEscrows, color: '#10b981' },
    { icon: Clock, label: 'Total Volume (USD)', value: `$${stats.totalEscrowVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#f59e0b' },
  ];

  if (loading) return <AdminLayout><div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" style={{ width: 32, height: 32 }} /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="page-header">
        <h1>Admin Overview</h1>
        <p>Platform health and activity at a glance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card" style={{ borderLeft: `3px solid ${card.color}` }}>
              <Icon size={20} color={card.color} />
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Recent Admin Activity</h3>
        {recentActivity.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem' }}>No recent activity</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentActivity.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{log.action}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
