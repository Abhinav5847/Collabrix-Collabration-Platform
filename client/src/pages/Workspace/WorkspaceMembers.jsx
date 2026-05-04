import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import { 
    UserPlus, Shield, Trash2, ArrowLeft, Mail, 
    Users, Send, CheckCircle2, Search, Loader2 
} from 'lucide-react';
import { 
    fetchAllUsers, 
    fetchWorkspaceMembers, 
    clearToast 
} from '../../store/slices/workspaceSlice';

export default function WorkspaceMembers() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { members, allUsers, loading } = useSelector((state) => state.workspaces);
    const [searchTerm, setSearchTerm] = useState('');
    const [invitingEmails, setInvitingEmails] = useState({}); // Track loading per user

    useEffect(() => {
        dispatch(fetchAllUsers());
        dispatch(fetchWorkspaceMembers(workspaceId));
    }, [dispatch, workspaceId]);

    // Helper for Toast Notifications
    const showToast = (icon, title) => {
        Swal.fire({
            icon,
            title,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
    };

    const isMember = (email) => members.some(m => m.email === email);

    const handleInvite = async (email, role = 'VIEWER') => {
        setInvitingEmails(prev => ({ ...prev, [email]: true }));
        try {
            // Triggers your Django logic which pushes to AWS SQS/Lambda
            await api.post(`workspaces/workspace/${workspaceId}/members/`, { email, role });
            showToast('success', `Invitation sent to ${email}`);
            dispatch(fetchWorkspaceMembers(workspaceId));
        } catch (err) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Invite Failed', 
                text: err.response?.data?.error || 'Could not send invitation' 
            });
        } finally {
            setInvitingEmails(prev => ({ ...prev, [email]: false }));
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await api.patch(`workspaces/workspace/${workspaceId}/members/${memberId}/`, { role: newRole });
            showToast('success', 'Member role updated');
            dispatch(fetchWorkspaceMembers(workspaceId));
        } catch (err) {
            showToast('error', 'Failed to update role');
        }
    };

    const handleRemove = async (memberId) => {
        const res = await Swal.fire({
            title: 'Remove Member?',
            text: "They will lose access to this workspace.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, remove'
        });

        if (res.isConfirmed) {
            try {
                await api.delete(`workspaces/workspace/${workspaceId}/members/${memberId}/`);
                showToast('success', 'Member removed');
                dispatch(fetchWorkspaceMembers(workspaceId));
            } catch (err) {
                showToast('error', 'Could not remove member');
            }
        }
    };

    const filteredUsers = allUsers.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.full_name || u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container-fluid py-4 bg-light min-vh-100">
            <div className="mx-auto" style={{ maxWidth: '1200px' }}>
                <button onClick={() => navigate(-1)} className="btn btn-link text-dark p-0 mb-4 d-flex align-items-center gap-2 text-decoration-none">
                    <ArrowLeft size={18} /> <span className="fw-medium">Back to Workspace</span>
                </button>

                <div className="row g-4">
                    {/* LEFT: User Discovery and Mail Invite */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-2 mb-3">
                                    <UserPlus className="text-primary" size={20} />
                                    <h5 className="fw-bold mb-0">Find Collaborators</h5>
                                </div>
                                
                                <div className="input-group mb-4 bg-light rounded-pill px-3 py-1">
                                    <Search size={18} className="text-muted mt-2" />
                                    <input 
                                        type="text" 
                                        className="form-control border-0 bg-transparent shadow-none" 
                                        placeholder="Search by name or email..."
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                
                                <div className="user-list-scroll px-1" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                        <div key={user.id} className="d-flex align-items-center justify-content-between p-3 mb-2 bg-white border rounded-3 shadow-xs">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="avatar-sm bg-primary text-white rounded-circle fw-bold">
                                                    {user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    {/* FIXED: Uses full_name or username fallback */}
                                                    <div className="fw-bold small text-dark">
                                                        {user.full_name || user.username || user.email.split('@')[0]}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '11px' }}>{user.email}</div>
                                                </div>
                                            </div>

                                            {isMember(user.email) ? (
                                                <span className="badge bg-success-subtle text-success rounded-pill px-3 py-2 border border-success-subtle">
                                                    <CheckCircle2 size={12} className="me-1" /> Member
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => handleInvite(user.email)}
                                                    className="btn btn-sm btn-primary rounded-pill px-3 d-flex align-items-center gap-2"
                                                    disabled={invitingEmails[user.email]}
                                                >
                                                    {invitingEmails[user.email] ? (
                                                        <Loader2 size={14} className="spinner-border spinner-border-sm border-0" />
                                                    ) : (
                                                        <><Send size={14} /> Invite</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )) : (
                                        <div className="text-center py-5 text-muted">
                                            <Users size={40} className="mb-2 opacity-25" />
                                            <p>No users found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Active Workspace Members */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
                            <div className="card-header bg-white border-0 p-4">
                                <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                                    <Shield size={20} className="text-success" />
                                    Active Members 
                                    <span className="badge bg-light text-dark rounded-pill ms-2">{members.length}</span>
                                </h5>
                            </div>
                            <div className="table-responsive px-4 pb-4">
                                <table className="table align-middle">
                                    <thead>
                                        <tr className="text-muted small uppercase" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                                            <th>Member</th>
                                            <th>Role</th>
                                            <th className="text-end">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        {members.map(member => (
                                            <tr key={member.id}>
                                                <td className="py-3">
                                                    <div className="fw-bold text-dark">{member.user_name || member.email.split('@')[0]}</div>
                                                    <div className="text-muted x-small">{member.email}</div>
                                                </td>
                                                <td>
                                                    <select 
                                                        className="form-select form-select-sm border-0 bg-light fw-semibold rounded-3"
                                                        style={{ width: '110px' }}
                                                        value={member.role}
                                                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                                    >
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="EDITOR">Editor</option>
                                                        <option value="VIEWER">Viewer</option>
                                                    </select>
                                                </td>
                                                <td className="text-end">
                                                    <button 
                                                        onClick={() => handleRemove(member.id)} 
                                                        className="btn btn-light btn-sm text-danger rounded-circle p-2 border-0"
                                                        title="Remove Member"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .x-small { font-size: 11px; }
                .avatar-sm { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
                .user-list-scroll::-webkit-scrollbar { width: 6px; }
                .user-list-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .user-list-scroll::-webkit-scrollbar-track { background: transparent; }
                .shadow-xs { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .btn-primary { background-color: #4f46e5; border-color: #4f46e5; }
                .btn-primary:hover { background-color: #4338ca; border-color: #4338ca; }
            `}</style>
        </div>
    );
}