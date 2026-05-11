import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    LayoutDashboard, Shield, Bell, ChevronRight, LogOut, 
    User, Plus, ChevronsLeft, CircleUserRound, Grid2X2
} from 'lucide-react';
import { api } from '../../services/api';
import { fetchUserProfile, logout } from '../../store/slices/authSlice';
import { fetchWorkspaces } from '../../store/slices/workspaceSlice';

/* ─── Collabrix Brand Tokens ─────────────────────────────────────────────── */
const t = {
  navy:      "#0B1120",
  indigo:    "#4F6EF7",
  indigoBg:  "#EEF1FF",
  surface:   "#FFFFFF",
  bg:        "#F4F6FB",
  border:    "#E4E7F0",
  borderMid: "#D0D5E8",
  text:      "#1A2236",
  textSoft:  "#4B5568",
  muted:     "#8A94A6",
  danger:    "#E53E3E",
};

/* ─── Loading Screen ─────────────────────────────────────────────────────── */
const LoadingScreen = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: t.navy, gap: 16, fontFamily: "'DM Sans', sans-serif",
  }}>
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    `}</style>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: t.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark />
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>Collabrix</span>
    </div>
    <div style={{ width: 28, height: 28, border: '2.5px solid rgba(79,110,247,0.25)', borderTopColor: t.indigo, borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading your workspace…</span>
  </div>
);

/* ─── Logo Mark ──────────────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="7" height="7" rx="1.8" fill="rgba(255,255,255,0.9)"/>
      <rect x="11" y="2" width="7" height="7" rx="1.8" fill="rgba(255,255,255,0.5)"/>
      <rect x="2" y="11" width="7" height="7" rx="1.8" fill="rgba(255,255,255,0.5)"/>
      <rect x="11" y="11" width="7" height="7" rx="1.8" fill="rgba(255,255,255,0.9)"/>
    </svg>
  );
}

/* ─── Nav Item ───────────────────────────────────────────────────────────── */
function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9, textDecoration: 'none',
      fontSize: 13.5, fontWeight: active ? 600 : 500,
      color: active ? t.indigo : t.textSoft,
      background: active ? t.indigoBg : 'transparent',
      marginBottom: 2, transition: 'all 0.15s ease',
    }}>
      <span style={{ color: active ? t.indigo : t.muted, display: 'flex' }}>{icon}</span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{label}</span>
      {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.indigo, flexShrink: 0 }} />}
    </Link>
  );
}

/* ─── Main Layout ────────────────────────────────────────────────────────── */
export default function WorkspaceLayout() {
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { list: workspaces } = useSelector((state) => state.workspaces);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialData = async () => {
      try {
        if (!user) await dispatch(fetchUserProfile()).unwrap();
        await dispatch(fetchWorkspaces()).unwrap();
        const notifyRes = await api.get('notifications/');
        if (isMounted) {
          setUnreadCount(notifyRes.data.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error("Layout data fetch failed:", err);
        if (err.status === 401 || err.response?.status === 401) {
          dispatch(logout());
          navigate('/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchInitialData();
    return () => { isMounted = false; };
  }, [dispatch, navigate, isAuthenticated]);

  const handleLogout = async () => {
    try { await api.post('accounts/logout/'); } catch (e) { console.error("Logout failed", e); }
    finally { dispatch(logout()); navigate('/login'); }
  };

  const isActive = (path) => location.pathname === path;

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname === '/enable_Mfa') return 'Security Settings';
    if (location.pathname === '/profile') return 'Profile';
    if (location.pathname.includes('/workspace/create')) return 'Create Workspace';
    if (location.pathname.includes('/workspace/')) return 'Workspace View';
    return 'Collabrix';
  };

  if (loading && !user) return <LoadingScreen />;

  const avatarInitial = user?.username?.substring(0, 1).toUpperCase() || 'U';

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
      background: t.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .nav-item-hover:hover { background: ${t.indigoBg} !important; color: ${t.indigo} !important; }
        .icon-btn:hover { background: ${t.indigoBg} !important; border-color: ${t.indigo} !important; }
        .user-menu-item:hover { background: ${t.indigoBg} !important; }
        .logout-item:hover { background: #FFF5F5 !important; }
        .ws-item:hover { background: ${t.indigoBg} !important; }
      `}</style>

      {/* ── Sidebar ── */}
      <nav style={{
        width: sidebarCollapsed ? 0 : 260,
        minWidth: sidebarCollapsed ? 0 : 260,
        background: t.surface,
        borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.22s ease',
        overflow: 'hidden', zIndex: 90,
      }}>
        <div style={{ width: 260, display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Brand */}
          <div style={{
            padding: '18px 20px',
            borderBottom: `1px solid ${t.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: t.navy,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LogoMark />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: t.text, letterSpacing: '-0.3px' }}>Collabrix</p>
              <p style={{ margin: 0, fontSize: 11, color: t.muted }}>Workspace Platform</p>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 10px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 10px 8px' }}>Main</p>
            <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" active={isActive('/')} />
            <NavItem to="/profile" icon={<CircleUserRound size={16} />} label="Profile" active={isActive('/profile')} />
            <NavItem to="/enable_Mfa" icon={<Shield size={16} />} label="Security" active={isActive('/enable_Mfa')} />

            {/* Workspaces */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 10px 8px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>Workspaces</p>
                <Link to="/workspace/create" style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: t.indigoBg, color: t.indigo,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none', transition: 'background 0.15s',
                }}>
                  <Plus size={13} />
                </Link>
              </div>
              {workspaces.map(ws => (
                <NavItem
                  key={ws.id}
                  to={`/workspace/${ws.id}`}
                  icon={<Grid2X2 size={16} />}
                  label={ws.name}
                  active={location.pathname === `/workspace/${ws.id}`}
                />
              ))}
            </div>
          </div>

          {/* User menu */}
          <div style={{ padding: '10px', borderTop: `1px solid ${t.border}` }}>
            <div className="dropdown">
              <div data-bs-toggle="dropdown" style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                cursor: 'pointer', background: t.bg,
                border: `1px solid ${t.border}`,
                transition: 'background 0.15s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: t.indigoBg, color: t.indigo,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>{avatarInitial}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.username || 'Loading...'}
                  </p>
                </div>
                <ChevronRight size={14} color={t.muted} />
              </div>

              <ul className="dropdown-menu shadow border-0" style={{
                borderRadius: 12, padding: 6, minWidth: 200, fontSize: 13,
                border: `1px solid ${t.border}`,
              }}>
                <li><h6 className="dropdown-header" style={{ fontSize: 10, letterSpacing: '0.8px', color: t.muted }}>MY ACCOUNT</h6></li>
                <li>
                  <Link className="dropdown-item user-menu-item" to="/profile" style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', color: t.textSoft }}>
                    <User size={14} /> View Profile
                  </Link>
                </li>
                <li><hr className="dropdown-divider" style={{ margin: '4px 0', borderColor: t.border }} /></li>
                <li>
                  <button className="dropdown-item logout-item" onClick={handleLogout} style={{
                    borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', color: t.danger, fontWeight: 600,
                    width: '100%', textAlign: 'left', border: 'none', background: 'none',
                  }}>
                    <LogOut size={14} /> Log Out
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          height: 60, minHeight: 60,
          background: t.surface,
          borderBottom: `1px solid ${t.border}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px', gap: 16,
        }}>
          {/* Left: toggle + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="icon-btn"
              onClick={() => setSidebarCollapsed(p => !p)}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: `1px solid ${t.border}`, background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: t.muted, transition: 'all 0.15s',
              }}
            >
              <ChevronsLeft size={16} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            <nav aria-label="breadcrumb">
              <ol style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, padding: 0, listStyle: 'none' }}>
                <li>
                  <Link to="/" style={{ fontSize: 13, color: t.muted, textDecoration: 'none', fontWeight: 500 }}>Collabrix</Link>
                </li>
                <ChevronRight size={13} color={t.border} />
                <li style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{getPageTitle()}</li>
              </ol>
            </nav>
          </div>

          {/* Right: notifications + user chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="icon-btn"
              onClick={() => navigate('/notifications')}
              style={{
                width: 36, height: 36, borderRadius: 9,
                border: `1px solid ${t.border}`, background: t.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: t.muted, position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  minWidth: 18, height: 18, padding: '0 4px',
                  borderRadius: 10, background: t.danger, color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #fff',
                }}>{unreadCount}</span>
              )}
            </button>

            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: t.bg, border: `1px solid ${t.border}`,
                borderRadius: 9, padding: '4px 12px 4px 6px',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6,
                  background: t.indigoBg, color: t.indigo,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 11,
                }}>{avatarInitial}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: t.text }}>{user.username}</span>
                <LogOut
                  size={14}
                  style={{ cursor: 'pointer', color: t.danger, marginLeft: 4 }}
                  onClick={handleLogout}
                />
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: t.bg }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}