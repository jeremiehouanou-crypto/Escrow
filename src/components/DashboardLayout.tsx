import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, ArrowDownToLine, ArrowUpFromLine,
  ShieldCheck, AlertTriangle, Clock, Menu, X, User
} from 'lucide-react';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: ArrowDownToLine, label: 'Deposit', path: '/deposit' },
  { icon: ArrowUpFromLine, label: 'Withdraw', path: '/withdraw' },
  { icon: ShieldCheck, label: 'Escrow', path: '/escrow' },
  { icon: AlertTriangle, label: 'Disputes', path: '/disputes' },
  { icon: Clock, label: 'History', path: '/history' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setMobileSidebarOpen(v => !v)}
          style={{
            display: 'none', position: 'fixed', bottom: '1.5rem', right: '1.5rem',
            zIndex: 60, background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: '50%', width: 48, height: 48,
            cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(14,165,233,0.4)'
          }}
          className="mobile-fab"
        >
          {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${mobileSidebarOpen ? 'sidebar-open' : ''}`}>
          <div style={{ padding: '0 1.25rem 1.25rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--accent-dim)', border: '2px solid var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1rem', color: 'var(--accent)'
              }}>
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user.role === 'admin' ? 'Administrator' : 'Member'}
                </div>
              </div>
            </div>
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${active ? 'active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

          {user.role === 'admin' && (
            <>
              <div style={{ padding: '1rem 1.25rem 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Admin
              </div>
              <Link
                to="/admin"
                className={`sidebar-item ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
              >
                <LayoutDashboard size={18} />
                Admin Panel
              </Link>
            </>
          )}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '2rem', minWidth: 0, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
