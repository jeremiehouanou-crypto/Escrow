import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Sun, Moon, Bell, ChevronDown, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, Notification } from '../lib/supabase';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="nav">
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', height: 64, gap: '1rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginRight: 'auto' }}>
          <Shield size={24} color="var(--accent)" />
          <span style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ANOW
          </span>
        </Link>

        {!user && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to="/faq" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', padding: '0.5rem' }}>FAQ</Link>
            <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        )}

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Notifications */}
            <div className="dropdown" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                style={{ position: 'relative', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.375rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-dot" />}
              </button>
              {showNotifs && (
                <div className="dropdown-menu" style={{ minWidth: 320, maxHeight: 400, overflowY: 'auto' }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No notifications</div>
                  ) : notifications.map(n => (
                    <div
                      key={n.id}
                      className="dropdown-item"
                      style={{ padding: '0.75rem 1rem', alignItems: 'flex-start', flexDirection: 'column', gap: 4, background: n.is_read ? undefined : 'var(--accent-dim)' }}
                      onClick={() => { if (n.link) navigate(n.link); setShowNotifs(false); }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.message}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.375rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User menu */}
            <div className="dropdown" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.375rem 0.75rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.username}</span>
                <ChevronDown size={14} color="var(--text-muted)" />
              </button>
              {showUserMenu && (
                <div className="dropdown-menu">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                  )}
                  <Link to="/dashboard" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <User size={16} /> Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <Settings size={16} /> Settings
                  </Link>
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
                  <button className="dropdown-item danger" onClick={handleSignOut} style={{ width: '100%' }}>
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!user && (
          <button
            onClick={toggleTheme}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '0.375rem', cursor: 'pointer', display: 'flex', color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>
    </nav>
  );
}
