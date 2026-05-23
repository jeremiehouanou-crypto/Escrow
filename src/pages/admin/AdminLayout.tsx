import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ArrowUpFromLine, ShieldCheck,
  AlertTriangle, Settings, FileText, LogOut, Shield
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const adminNav = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: ArrowUpFromLine, label: 'Withdrawals', path: '/admin/withdrawals' },
  { icon: ShieldCheck, label: 'Escrows', path: '/admin/escrows' },
  { icon: AlertTriangle, label: 'Disputes', path: '/admin/disputes' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
  { icon: FileText, label: 'Logs', path: '/admin/logs' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || user.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex' }}>
      {/* Admin sidebar */}
      <aside style={{ width: 260, minHeight: '100vh', background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Shield size={22} color="var(--accent)" />
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>
              ANOW
            </span>
          </div>
          <div style={{ background: 'var(--warning-dim)', border: '1px solid var(--warning)', borderRadius: 6, padding: '0.375rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <Shield size={12} color="var(--warning)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase' }}>Admin Panel</span>
          </div>
        </div>

        <div style={{ padding: '1rem 0', flex: 1 }}>
          {adminNav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`sidebar-item ${active ? 'active' : ''}`}>
                <Icon size={18} />{item.label}
              </Link>
            );
          })}
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{user.username}</div>
          <button onClick={toggleTheme} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '0.3rem', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '2rem', minWidth: 0, overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
}
