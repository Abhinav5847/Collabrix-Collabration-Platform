// src/components/WorkspaceLayout.jsx
import { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Shield, Bell, ChevronRight, LogOut,
    User, Settings, Plus, ChevronsLeft, Building2, CircleUserRound
} from 'lucide-react';
import { api } from '../../services/api';

export default function WorkspaceLayout() {
    const [workspaces, setWorkspaces] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (!token) { navigate('/login'); return; }

        const fetchInitialData = async () => {
            try {
                const [wsRes, userRes] = await Promise.all([
                    api.get('workspaces/'),
                    api.get('accounts/user/')
                ]);
                setWorkspaces(wsRes.data);
                setUser(userRes.data);
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('access');
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('access');
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const getPageTitle = () => {
        if (location.pathname === '/') return 'Dashboard';
        if (location.pathname === '/enable_Mfa') return 'Security Settings';
        if (location.pathname.includes('/workspace/create')) return 'Create Workspace';
        if (location.pathname.includes('/workspace/')) return 'Workspace';
        return 'Collabrix';
    };

    if (loading) return (
        <div style={{
            position: 'fixed', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#f8f9fa', gap: '12px'
        }}>
            <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e9ecef',
                borderTop: '3px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 0.75s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ color: '#6c757d', fontSize: '13px', fontWeight: 500 }}>Loading workspace…</span>
        </div>
    );

    const avatarInitial = user?.username?.substring(0, 1).toUpperCase() || 'U';

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f1f5f9', fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── LEFT RAIL: App / Workspace Switcher ── */}
            <aside style={{
                width: '64px', minWidth: '64px',
                background: '#0f172a',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '16px 0', gap: '8px',
                borderRight: '1px solid #1e293b',
                zIndex: 100
            }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', marginBottom: '8px' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        background: '#2563eb',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, color: '#fff', fontSize: '15px',
                        letterSpacing: '-0.5px',
                        boxShadow: '0 4px 12px rgba(37,99,235,0.4)'
                    }}>CX</div>
                </Link>

                {/* Divider */}
                <div style={{ width: '28px', height: '1px', background: '#1e293b', margin: '4px 0' }} />

                {/* Workspace Icons */}
                <div style={{ flex: 1, overflowY: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '0 10px' }}>
                    {workspaces.map(ws => {
                        const active = location.pathname.startsWith(`/workspace/${ws.id}`);
                        return (
                            <Link
                                key={ws.id}
                                to={`/workspace/${ws.id}`}
                                title={ws.name}
                                style={{
                                    width: '40px', height: '40px',
                                    borderRadius: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '12px', textDecoration: 'none',
                                    background: active ? '#2563eb' : '#1e293b',
                                    color: active ? '#fff' : '#94a3b8',
                                    border: active ? '1px solid #3b82f6' : '1px solid transparent',
                                    transition: 'all 0.15s ease',
                                    position: 'relative',
                                    flexShrink: 0
                                }}
                            >
                                {ws.name.substring(0, 2).toUpperCase()}
                                {active && (
                                    <div style={{
                                        position: 'absolute', left: '-10px', top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '3px', height: '20px',
                                        background: '#60a5fa', borderRadius: '0 3px 3px 0'
                                    }} />
                                )}
                            </Link>
                        );
                    })}

                    {/* Add Workspace */}
                    <Link
                        to="/workspace/create"
                        title="New Workspace"
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent',
                            border: '1.5px dashed #334155',
                            color: '#475569',
                            textDecoration: 'none',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#60a5fa'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#475569'; }}
                    >
                        <Plus size={16} />
                    </Link>
                </div>

                {/* Bottom: User Avatar */}
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                    <div
                        title={user?.username}
                        style={{
                            width: '36px', height: '36px',
                            borderRadius: '50%',
                            background: '#1d4ed8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: '13px',
                            cursor: 'default'
                        }}
                    >{avatarInitial}</div>
                </div>
            </aside>


            <nav style={{
                width: sidebarCollapsed ? '0px' : '240px',
                minWidth: sidebarCollapsed ? '0px' : '240px',
                background: '#ffffff',
                borderRight: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.2s ease, min-width 0.2s ease',
                overflow: 'hidden',
                zIndex: 90
            }}>
                <div style={{ width: '240px', display: 'flex', flexDirection: 'column', height: '100%' }}>

                    <div style={{
                        padding: '20px 20px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                        <Building2 size={18} color="#2563eb" strokeWidth={2} />
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#0f172a', letterSpacing: '-0.2px' }}>Collabrix</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>Workspace Platform</p>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>

                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 8px 8px', padding: 0 }}>Main</p>
                        <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" active={isActive('/')} />

                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '20px 8px 8px', padding: 0 }}>Administration</p>
                        <NavItem to="/enable_Mfa" icon={<Shield size={16} />} label="Security" active={isActive('/enable_Mfa')} />
                        <NavItem to="/profile" icon={<CircleUserRound size={16} />} label="Profile" active={isActive('/profile')} />
                        <NavItem to="/settings" icon={<Settings size={16} />} label="Settings" active={isActive('/settings')} />
                    </div>

                    <div style={{ padding: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <div className="dropdown">
                            <div
                                data-bs-toggle="dropdown"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 12px', borderRadius: '10px',
                                    cursor: 'pointer', transition: 'background 0.15s',
                                    background: '#f8fafc'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                            >
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    background: '#dbeafe', color: '#1d4ed8',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 700, fontSize: '13px', flexShrink: 0
                                }}>{avatarInitial}</div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {user?.username || 'User'}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Pro Plan</p>
                                </div>
                                <ChevronRight size={14} color="#94a3b8" />
                            </div>
                            <ul className="dropdown-menu shadow-lg border-0" style={{ borderRadius: '12px', padding: '6px', minWidth: '200px', fontSize: '13px' }}>
                                <li><h6 className="dropdown-header" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>MY ACCOUNT</h6></li>
                                <li>
                                    <Link className="dropdown-item" to="/profile" style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                                        <User size={14} /> View Profile
                                    </Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item" to="/settings" style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                                        <Settings size={14} /> Settings
                                    </Link>
                                </li>
                                <li><hr className="dropdown-divider" style={{ margin: '4px 0' }} /></li>
                                <li>
                                    <button className="dropdown-item text-danger" onClick={handleLogout}
                                        style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontWeight: 600, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <LogOut size={14} /> Log Out
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>


            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

                <header style={{
                    height: '60px', minHeight: '60px',
                    background: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 24px',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                        <button
                            onClick={() => setSidebarCollapsed(p => !p)}
                            style={{
                                width: '34px', height: '34px', borderRadius: '8px',
                                border: '1px solid #e2e8f0', background: 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#64748b',
                                transition: 'all 0.15s'
                            }}
                            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <ChevronsLeft size={16} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        <nav aria-label="breadcrumb">
                            <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, padding: 0, listStyle: 'none' }}>
                                <li>
                                    <Link to="/" style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>Collabrix</Link>
                                </li>
                                <ChevronRight size={13} color="#cbd5e1" />
                                <li style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{getPageTitle()}</li>
                            </ol>
                        </nav>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button style={{
                            width: '36px', height: '36px', borderRadius: '9px',
                            border: '1px solid #e2e8f0', background: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#64748b',
                            position: 'relative'
                        }}>
                            <Bell size={16} />
                            <span style={{
                                position: 'absolute', top: '7px', right: '7px',
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#ef4444', border: '1.5px solid #fff'
                            }} />
                        </button>

                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: '#f8fafc', border: '1px solid #e2e8f0',
                            borderRadius: '9px', padding: '4px 12px 4px 6px',
                            cursor: 'default'
                        }}>
                            <div style={{
                                width: '26px', height: '26px', borderRadius: '6px',
                                background: '#dbeafe', color: '#1d4ed8',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '11px'
                            }}>{avatarInitial}</div>
                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{user?.username || 'User'}</span>
                        </div>
                    </div>
                </header>

                <main style={{
                    flex: 1, overflowY: 'auto', padding: '28px 32px',
                    background: '#f1f5f9'
                }}>
                    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ── Reusable NavItem ── */
function NavItem({ to, icon, label, active }) {
    return (
        <Link
            to={to}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '9px',
                textDecoration: 'none', fontSize: '13.5px', fontWeight: active ? 600 : 500,
                color: active ? '#1d4ed8' : '#475569',
                background: active ? '#eff6ff' : 'transparent',
                marginBottom: '2px',
                transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}
        >
            <span style={{ color: active ? '#2563eb' : '#94a3b8', display: 'flex' }}>{icon}</span>
            {label}
            {active && <div style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />}
        </Link>
    );
}