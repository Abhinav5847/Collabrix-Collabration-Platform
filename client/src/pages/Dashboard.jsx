// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, LayoutGrid, Clock, Users, FolderOpen } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
    const [workspaces, setWorkspaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('workspaces/')
            .then(res => { setWorkspaces(res.data); setLoading(false); })
            .catch(err => { console.error(err); setLoading(false); });
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '12px' }}>
            <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb',
                borderRadius: '50%', animation: 'spin 0.75s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Loading workspaces…</span>
        </div>
    );

    const stats = [
        { label: 'Total Workspaces', value: workspaces.length, icon: <LayoutGrid size={18} />, color: '#2563eb', bg: '#eff6ff' },
        { label: 'Active Members', value: workspaces.reduce((a, ws) => a + (ws.member_count || 0), 0), icon: <Users size={18} />, color: '#0891b2', bg: '#ecfeff' },
        { label: 'Recent Activity', value: workspaces.filter(ws => ws.updated_at).length, icon: <Clock size={18} />, color: '#7c3aed', bg: '#f5f3ff' },
    ];

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px' }}>Dashboard</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>Manage your workspaces and team collaboration.</p>
                </div>
                <Link
                    to="/workspace/create"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '7px',
                        padding: '9px 18px', borderRadius: '9px',
                        background: '#2563eb', color: '#fff',
                        fontSize: '13.5px', fontWeight: 600,
                        textDecoration: 'none', border: 'none',
                        boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
                        transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
                >
                    <Plus size={16} /> New Workspace
                </Link>
            </div>

            {/* ── Stats Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {stats.map((s, i) => (
                    <div key={i} style={{
                        background: '#fff', borderRadius: '12px',
                        border: '1px solid #e2e8f0', padding: '18px 20px',
                        display: 'flex', alignItems: 'center', gap: '14px'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '10px',
                            background: s.bg, color: s.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>{s.icon}</div>
                        <div>
                            <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{s.value}</p>
                            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Section Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderOpen size={16} color="#64748b" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                        Your Workspaces
                    </span>
                    <span style={{
                        background: '#f1f5f9', color: '#64748b',
                        fontSize: '11px', fontWeight: 600,
                        padding: '2px 8px', borderRadius: '20px', border: '1px solid #e2e8f0'
                    }}>{workspaces.length}</span>
                </div>
            </div>

            {/* ── Workspace Grid ── */}
            {workspaces.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
                    {workspaces.map((ws) => (
                        <WorkspaceCard key={ws.id} ws={ws} />
                    ))}
                </div>
            ) : (
                <EmptyState />
            )}
        </div>
    );
}

/* ── Workspace Card ── */
function WorkspaceCard({ ws }) {
    const [hovered, setHovered] = useState(false);
    const initials = ws.name.substring(0, 2).toUpperCase();
    const colors = ['#2563eb', '#0891b2', '#7c3aed', '#059669', '#dc2626', '#d97706'];
    const color = colors[ws.name.charCodeAt(0) % colors.length];

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: '#fff', borderRadius: '12px',
                border: `1px solid ${hovered ? '#bfdbfe' : '#e2e8f0'}`,
                padding: '20px', display: 'flex', flexDirection: 'column',
                gap: '14px', transition: 'all 0.15s ease',
                boxShadow: hovered ? '0 4px 16px rgba(37,99,235,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'default'
            }}
        >
            {/* Card Top */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: color + '18', color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '14px', flexShrink: 0,
                    border: `1px solid ${color}22`
                }}>{initials}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '14.5px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ws.name}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ws.description || 'No description provided.'}
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#f1f5f9' }} />

            {/* Card Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '22px', height: '22px', borderRadius: '6px',
                        background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Users size={12} color="#64748b" />
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                        {ws.owner_name || 'Owner'}
                    </span>
                </div>

                <Link
                    to={`/workspace/${ws.id}`}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '6px 12px', borderRadius: '7px',
                        background: hovered ? '#2563eb' : '#f8fafc',
                        color: hovered ? '#fff' : '#2563eb',
                        fontSize: '12.5px', fontWeight: 600,
                        textDecoration: 'none',
                        border: `1px solid ${hovered ? '#2563eb' : '#dbeafe'}`,
                        transition: 'all 0.15s ease'
                    }}
                >
                    Open <ArrowRight size={13} />
                </Link>
            </div>
        </div>
    );
}

/* ── Empty State ── */
function EmptyState() {
    return (
        <div style={{
            background: '#fff', borderRadius: '16px',
            border: '1.5px dashed #e2e8f0',
            padding: '60px 32px', textAlign: 'center'
        }}>
            <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: '#f1f5f9', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <LayoutGrid size={24} color="#94a3b8" />
            </div>
            <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>No workspaces yet</p>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#94a3b8', maxWidth: '280px', marginLeft: 'auto', marginRight: 'auto' }}>
                Create your first workspace to start collaborating with your team.
            </p>
            <Link
                to="/workspace/create"
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                    padding: '10px 20px', borderRadius: '9px',
                    background: '#2563eb', color: '#fff',
                    fontSize: '13.5px', fontWeight: 600,
                    textDecoration: 'none',
                    boxShadow: '0 1px 3px rgba(37,99,235,0.3)'
                }}
            >
                <Plus size={16} /> Create Workspace
            </Link>
        </div>
    );
}