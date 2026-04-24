import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, LayoutGrid, Clock, Users, FolderOpen, RefreshCw, AlertCircle, FileText, MessageSquare, Settings } from 'lucide-react';
import { fetchWorkspaces } from '../../store/slices/workspaceSlice';

const COLORS = ['#2563eb','#0891b2','#7c3aed','#059669','#dc2626','#d97706'];
const wsColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length];

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: workspaces, loading, error } = useSelector((s) => s.workspaces);

    useEffect(() => { dispatch(fetchWorkspaces()); }, [dispatch]);

    if (loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '60vh', gap: 12 }}>
            <div className="spinner-border text-primary" />
            <small className="text-muted">Loading your Collabrix environment…</small>
        </div>
    );

    return (
        <div className="container-fluid px-3 px-md-4 py-4">
            {/* Header */}
            <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
                <div>
                    <h5 className="fw-bold mb-1">Your Hub</h5>
                    <small className="text-muted">Select a workspace to start collaborating.</small>
                </div>
                <Link to="/workspace/create" className="btn btn-primary btn-sm d-flex align-items-center gap-2">
                    <Plus size={14} /> New Workspace
                </Link>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-4">
                    <AlertCircle size={15} />
                    <span className="flex-grow-1 small">{typeof error === 'string' ? error : 'Failed to load.'}</span>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => dispatch(fetchWorkspaces())}>
                        <RefreshCw size={12} /> Retry
                    </button>
                </div>
            )}

            <div className="d-flex align-items-center gap-2 mb-3">
                <FolderOpen size={14} className="text-muted" />
                <span className="text-uppercase fw-bold small text-secondary" style={{ letterSpacing: '.6px' }}>Workspaces</span>
                <span className="badge bg-light text-secondary border">{workspaces.length}</span>
            </div>

            <div className="row g-3">
                {workspaces.map(ws => (
                    <div key={ws.id} className="col-12 col-sm-6 col-lg-4">
                        <div className="card border shadow-sm h-100 p-3">
                            <div className="d-flex align-items-start gap-3 mb-3">
                                <div className="rounded-3 d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                    style={{ width: 42, height: 42, background: wsColor(ws.name) + '18', color: wsColor(ws.name) }}>
                                    {ws.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="fw-bold text-truncate">{ws.name}</div>
                                    <small className="text-muted text-truncate d-block">{ws.description || 'No description provided.'}</small>
                                </div>
                            </div>

                            {/* NAVIGATION ACTIONS */}
                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <button onClick={() => navigate(`/workspace/${ws.id}/documents`)} className="btn btn-sm btn-light border w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                                        <FileText size={14} className="text-primary" /> <span className="small fw-semibold">Docs</span>
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button onClick={() => navigate(`/workspace/${ws.id}/chat`)} className="btn btn-sm btn-light border w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                                        <MessageSquare size={14} className="text-success" /> <span className="small fw-semibold">Chat</span>
                                    </button>
                                </div>
                                <div className="col-6">
                                    <button onClick={() => navigate(`/workspace/${ws.id}/members`)} className="btn btn-sm btn-light border w-100 d-flex align-items-center justify-content-center gap-2 py-2">
                                        <Users size={14} className="text-info" /> <span className="small fw-semibold">Team</span>
                                    </button>
                                </div>

                            </div>

                            <div className="mt-auto pt-2 border-top d-flex justify-content-between align-items-center">
                                <small className="text-muted small">Created by: {ws.owner_name || 'You'}</small>
                                <Link to={`/workspace/${ws.id}`} className="text-primary small text-decoration-none fw-bold">Overview <ArrowRight size={12} /></Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}