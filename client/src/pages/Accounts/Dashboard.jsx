import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, ArrowRight, FolderOpen, FileText, MessageSquare, Users, Cpu, Settings, Video, List, Sparkles 
} from 'lucide-react';
import { fetchWorkspaces } from '../../store/slices/workspaceSlice';
import VideoMeet from '../Workspace/VideoMeet';

const COLORS = ['#2563eb','#0891b2','#7c3aed','#059669','#dc2626','#d97706'];
const wsColor = (name) => COLORS[name.charCodeAt(0) % COLORS.length];

export default function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { list: workspaces, loading } = useSelector((s) => s.workspaces);

    const [meetData, setMeetData] = useState(null);
    const [joiningId, setJoiningId] = useState(null);

    useEffect(() => { 
        if (workspaces.length === 0) dispatch(fetchWorkspaces()); 
    }, [dispatch, workspaces.length]);

    useEffect(() => {
        document.body.style.overflow = meetData ? 'hidden' : 'unset';
    }, [meetData]);

    const handleStartMeet = async (workspaceId) => {
        setJoiningId(workspaceId);
        try {
            const response = await axios.get(`/api/workspaces/${workspaceId}/meet-token/`);
            setMeetData({
                ...response.data,
                workspaceId: workspaceId 
            });
        } catch (err) {
            console.error("Meeting failed:", err);
            alert("Failed to initialize meeting.");
        } finally {
            setJoiningId(null);
        }
    };

    if (loading && workspaces.length === 0) return (
        <div className="d-flex flex-column align-items-center justify-content-center bg-white vh-100">
            <div className="spinner-border text-primary mb-3" />
            <small className="text-muted fw-bold font-monospace">SYNCING_RESOURCES...</small>
        </div>
    );

    return (
        <div className="container-fluid px-3 px-md-5 py-4 bg-light min-vh-100">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-end mb-4 pb-3 border-bottom">
                <div>
                    <h4 className="fw-bold text-dark mb-1">Collabrix Workspace</h4>
                    <div className="d-flex align-items-center gap-2 text-muted small">
                        <FolderOpen size={14} />
                        <span>{workspaces.length} Active Nodes</span>
                    </div>
                </div>
                <Link to="/workspace/create" className="btn btn-primary d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm fw-semibold">
                    <Plus size={18} /> New Workspace
                </Link>
            </div>

            {/* Workspace Cards */}
            <div className="row g-4 mb-5">
                {workspaces.map(ws => (
                    <div key={ws.id} className="col-12 col-md-6 col-xl-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-start justify-content-between mb-3">
                                    <div className="rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm"
                                        style={{ width: 44, height: 44, background: wsColor(ws.name) + '15', color: wsColor(ws.name) }}>
                                        {ws.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold" onClick={() => navigate(`/workspace/${ws.id}/manage`)}>
                                        <Settings size={14} className="me-1" /> Manage
                                    </button>
                                </div>

                                <h6 className="fw-bold text-dark mb-1">{ws.name}</h6>
                                <p className="text-muted small mb-3">{ws.description || 'No description provided.'}</p>

                                <div className="mb-4 d-flex align-items-center gap-2">
                                    <div className="bg-light border rounded-circle d-flex align-items-center justify-content-center" style={{ width: 28, height: 28 }}>
                                        <Users size={12} className="text-primary" />
                                    </div>
                                    <span className="text-muted extra-small fw-bold">
                                        {ws.member_count || ws.members?.length || 0} Members Tracked
                                    </span>
                                </div>

                                {/* Action Buttons - Updated with Meetings and Summary */}
                                <div className="border-top pt-3">
                                    <div className="d-flex flex-wrap gap-3 mb-2">
                                        <button onClick={() => navigate(`/workspace/${ws.id}/documents`)} className="btn btn-link p-0 text-decoration-none small fw-bold text-primary">
                                            <FileText size={14} /> Docs
                                        </button>
                                        <button onClick={() => navigate(`/workspace/${ws.id}/chat`)} className="btn btn-link p-0 text-decoration-none small fw-bold text-success">
                                            <MessageSquare size={14} /> Chat
                                        </button>
                                        <button onClick={() => handleStartMeet(ws.id)} disabled={joiningId === ws.id} className="btn btn-link p-0 text-decoration-none small fw-bold text-danger">
                                            {joiningId === ws.id ? <span className="spinner-border spinner-border-sm" /> : <Video size={14} />} Meet
                                        </button>
                                    </div>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex gap-3">
                                            <button onClick={() => navigate(`/workspace/${ws.id}/meetings`)} className="btn btn-link p-0 text-decoration-none small fw-bold text-dark">
                                                <List size={14} /> Meetings
                                            </button>
                                            <button onClick={() => navigate(`/workspace/${ws.id}/summaries`)} className="btn btn-link p-0 text-decoration-none small fw-bold text-warning shadow-none">
                                                <Sparkles size={14} /> AI Summary
                                            </button>
                                        </div>
                                        <button onClick={() => navigate(`/workspace/${ws.id}/members`)} className="btn btn-link p-0 text-decoration-none small fw-bold text-secondary">
                                            <Users size={14} /> Team
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Global AI Agent Bar */}
            <div className="card border-0 shadow-sm bg-dark text-white p-3 rounded-3 mt-auto">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary p-2 rounded-circle"><Cpu size={20} /></div>
                        <div>
                            <span className="fw-bold d-block">Collabrix Global Agent</span>
                            <small className="text-secondary font-monospace text-uppercase">Engine: Llama-3.1-8b</small>
                        </div>
                    </div>
                    <button onClick={() => navigate('/agent')} className="btn btn-primary btn-sm px-4 fw-bold rounded-pill">
                        MEET_AGENT <ArrowRight size={14} />
                    </button>
                </div>
            </div>

            {/* Meeting Modal */}
            {meetData && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75" style={{ zIndex: 1050 }}>
                    <div className="w-75 h-75 bg-dark rounded-3 shadow-lg overflow-hidden border border-secondary">
                        <VideoMeet 
                            appId={meetData.app_id}
                            channel={meetData.channel_name}
                            token={meetData.token}
                            uid={meetData.uid}
                            workspaceId={meetData.workspaceId} 
                            userMap={meetData.user_map} 
                            onLeave={() => setMeetData(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}