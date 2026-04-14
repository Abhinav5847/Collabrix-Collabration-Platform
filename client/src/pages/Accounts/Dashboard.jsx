import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, LayoutGrid, Clock, Users, FolderOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchWorkspaces } from '../../store/slices/workspaceSlice';

const COLORS = ['#2563eb','#0891b2','#7c3aed','#059669','#dc2626','#d97706'];
const wsColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length];

export default function Dashboard() {
    const dispatch = useDispatch();
    const { list: workspaces, loading, error } = useSelector((s) => s.workspaces);

    useEffect(() => { dispatch(fetchWorkspaces()); }, [dispatch]);

    const stats = [
        { label: 'Workspaces', value: workspaces.length, icon: <LayoutGrid size={18} />, color: '#2563eb', bg: '#eff6ff' },
        { label: 'Members', value: workspaces.reduce((a, ws) => a + (ws.member_count || 0), 0), icon: <Users size={18} />, color: '#0891b2', bg: '#ecfeff' },
        { label: 'Active', value: workspaces.filter(ws => ws.updated_at).length, icon: <Clock size={18} />, color: '#7c3aed', bg: '#f5f3ff' },
    ];

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '60vh', gap: 12 }}>
            <div className="spinner-border text-primary" />
            <small className="text-muted">Loading workspaces…</small>
        </div>
    );

    return (
        <div className="container-fluid px-3 px-md-4 py-4">

            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Dashboard</h5>
                    <small className="text-muted">Manage your workspaces and team collaboration.</small>
                </div>
                <Link to="/workspace/create" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                    <Plus size={14} /> New Workspace
                </Link>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4">
                    <AlertCircle size={15} />
                    <span className="flex-grow-1 small">{typeof error === 'string' ? error : 'Failed to load.'}</span>
                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => dispatch(fetchWorkspaces())}>
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            <div className="row g-3 mb-4">
                {stats.map((s, i) => (
                    <div key={i} className="col-12 col-sm-4">
                        <div className="card border shadow-sm d-flex flex-row align-items-center gap-3 p-3">
                            <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: 40, height: 40, background: s.bg, color: s.color }}>
                                {s.icon}
                            </div>
                            <div>
                                <div className="fw-bold fs-5 lh-1">{s.value}</div>
                                <small className="text-muted">{s.label}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="d-flex align-items-center gap-2 mb-3">
                <FolderOpen size={14} className="text-muted" />
                <span className="text-uppercase fw-bold small text-secondary" style={{ letterSpacing: '.6px' }}>Your Workspaces</span>
                <span className="badge bg-light text-secondary border">{workspaces.length}</span>
            </div>

            {workspaces.length > 0 ? (
                <div className="row g-3">
                    {workspaces.map(ws => (
                        <div key={ws.id} className="col-12 col-sm-6 col-lg-4">
                            <div className="card border shadow-sm h-100 p-3">
                                <div className="d-flex align-items-start gap-3 mb-3">
                                    <div className="rounded-3 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                        style={{ width: 42, height: 42, background: wsColor(ws.name) + '18', color: wsColor(ws.name), fontSize: 13 }}>
                                        {ws.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="fw-bold text-truncate">{ws.name}</div>
                                        <small className="text-muted text-truncate d-block">{ws.description || 'No description.'}</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center justify-content-between mt-auto">
                                    <small className="text-muted d-flex align-items-center gap-1">
                                        <Users size={11} /> {ws.owner_name || 'Owner'}
                                    </small>
                                    <Link to={`/workspace/${ws.id}`} className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1">
                                        Open <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card border-dashed text-center py-5">
                    <div className="mb-3"><LayoutGrid size={28} className="text-muted" /></div>
                    <p className="fw-bold mb-1">No workspaces yet</p>
                    <small className="text-muted d-block mb-3">Create your first workspace to start collaborating.</small>
                    <div><Link to="/workspace/create" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2">
                        <Plus size={14} /> Create Workspace
                    </Link></div>
                </div>
            )}
        </div>
    );
}
