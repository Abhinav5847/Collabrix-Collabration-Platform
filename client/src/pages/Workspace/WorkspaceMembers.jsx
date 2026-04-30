import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
    UserPlus, Shield, Trash2, ArrowLeft, 
    Mail, Users, Send
} from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function WorkspaceMembers() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI state now only tracks Email and Role
    const [inviteData, setInviteData] = useState({
        email: '',
        role: 'VIEWER'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const Toast = MySwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    useEffect(() => { loadData(); }, [workspaceId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`workspaces/workspace/${workspaceId}/members/`);
            setMembers(res.data.results || res.data || []);
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Failed to load members' });
        } finally { setLoading(false); }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteData.email) {
            return Toast.fire({ icon: 'warning', title: 'Email is required' });
        }
        
        setIsSubmitting(true);
        try {
            // Send the request - the backend handles the missing username
            await api.post(`workspaces/workspace/${workspaceId}/members/`, {
                email: inviteData.email,
                role: inviteData.role
            });
            
            Toast.fire({ icon: 'success', title: `Invite sent to ${inviteData.email}` });
            setInviteData({ email: '', role: 'VIEWER' });
            loadData();
        } catch (err) {
            MySwal.fire({ 
                icon: 'error', 
                title: 'Invite Failed', 
                text: err.response?.data?.error || 'Could not send invitation' 
            });
        } finally { setIsSubmitting(false); }
    };

    // ... handleUpdateRole and handleRemoveMember functions remain the same ...

    return (
        <div className="container-fluid py-5 bg-light min-vh-100">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-xl-11">
                        <div className="d-flex justify-content-between align-items-center mb-5">
                            <div className="d-flex align-items-center gap-3">
                                <button onClick={() => navigate(-1)} className="btn btn-white border shadow-sm rounded-circle p-2">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="fw-bold m-0 h4 text-dark">Workspace Team</h2>
                                    <p className="text-muted small m-0">Invite new collaborators by email</p>
                                </div>
                            </div>
                        </div>

                        <div className="row g-4">
                            {/* Simplified Invitation Form */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm p-4 rounded-4">
                                    <h6 className="fw-bold mb-4 text-primary">Invite Member</h6>
                                    
                                    <form onSubmit={handleSendInvite}>
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-muted">Email Address</label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light border-0"><Mail size={18} className="text-muted"/></span>
                                                <input 
                                                    type="email" className="form-control bg-light border-0" 
                                                    placeholder="colleague@company.com"
                                                    value={inviteData.email} 
                                                    onChange={e => setInviteData({...inviteData, email: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label small fw-bold text-muted">Role</label>
                                            <select 
                                                className="form-select bg-light border-0" 
                                                value={inviteData.role} 
                                                onChange={e => setInviteData({...inviteData, role: e.target.value})}
                                            >
                                                <option value="VIEWER">Viewer</option>
                                                <option value="EDITOR">Editor</option>
                                            </select>
                                        </div>

                                        <button 
                                            className="btn btn-primary w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" 
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <><Send size={18}/> Send Invite</>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Member Table Section remains the same ... */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}