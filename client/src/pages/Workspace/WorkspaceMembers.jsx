import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
    UserPlus, Shield, Trash2, ArrowLeft, 
    Mail, Users, Send, UserCheck
} from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function WorkspaceMembers() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI state for the invitation form
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

    useEffect(() => { 
        loadData(); 
    }, [workspaceId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`workspaces/workspace/${workspaceId}/members/`);
            // Standardize response handling for DRF pagination or flat lists
            setMembers(res.data.results || res.data || []);
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Failed to load members' });
        } finally { 
            setLoading(false); 
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteData.email) {
            return Toast.fire({ icon: 'warning', title: 'Email is required' });
        }
        
        setIsSubmitting(true);
        try {
            // Using your endpoint structure for Collabrix invitations
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
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await api.patch(`workspaces/workspace/${workspaceId}/members/${memberId}/`, { 
                role: newRole 
            });
            Toast.fire({ icon: 'success', title: 'Role updated successfully' });
            loadData();
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Failed to update role' });
        }
    };

    const handleRemoveMember = async (memberId, name) => {
        const result = await MySwal.fire({
            title: 'Remove Member?',
            text: `Are you sure you want to remove ${name || 'this member'}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, remove them'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`workspaces/workspace/${workspaceId}/members/${memberId}/`);
                Toast.fire({ icon: 'success', title: 'Member removed' });
                loadData();
            } catch (err) {
                Toast.fire({ icon: 'error', title: 'Action failed' });
            }
        }
    };

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
                                    <p className="text-muted small m-0">Invite and manage collaborators for Collabrix</p>
                                </div>
                            </div>
                        </div>

                        <div className="row g-4">
                            {/* Invitation Form Section */}
                            <div className="col-lg-4">
                                <div className="card border-0 shadow-sm p-4 rounded-4">
                                    <h6 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                                        <UserPlus size={18}/> Invite Member
                                    </h6>
                                    
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
                                                <option value="ADMIN">Admin</option>
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

                            {/* Member List Table Section */}
                            <div className="col-lg-8">
                                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-white">
                                                <tr>
                                                    <th className="px-4 py-3 border-0 text-muted small fw-bold text-uppercase">Member</th>
                                                    <th className="py-3 border-0 text-muted small fw-bold text-uppercase">Role</th>
                                                    <th className="py-3 border-0 text-end px-4">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white">
                                                {loading ? (
                                                    <tr>
                                                        <td colSpan="3" className="text-center py-5">
                                                            <div className="spinner-border text-primary spinner-border-sm"></div>
                                                        </td>
                                                    </tr>
                                                ) : members.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" className="text-center py-5 text-muted">
                                                            No members found in this workspace.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    members.map((member) => (
                                                        <tr key={member.id}>
                                                            <td className="px-4 py-3">
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                                         style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>
                                                                        {/* Fixed: Use user_name from your serializer */}
                                                                        {member.user_name?.charAt(0).toUpperCase() || <Users size={18}/>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="fw-bold text-dark">{member.user_name || 'Pending User'}</div>
                                                                        <div className="text-muted small">{member.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <select 
                                                                    className="form-select form-select-sm border-0 bg-light w-auto fw-medium"
                                                                    value={member.role}
                                                                    onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                                                >
                                                                    <option value="ADMIN">Admin</option>
                                                                    <option value="EDITOR">Editor</option>
                                                                    <option value="VIEWER">Viewer</option>
                                                                </select>
                                                            </td>
                                                            <td className="text-end px-4">
                                                                <button 
                                                                    className="btn btn-link text-danger p-0"
                                                                    onClick={() => handleRemoveMember(member.id, member.user_name)}
                                                                    title="Remove Member"
                                                                >
                                                                    <Trash2 size={18}/>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}