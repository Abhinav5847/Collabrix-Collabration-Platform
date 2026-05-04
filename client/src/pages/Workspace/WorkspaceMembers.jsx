import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import { UserPlus, Shield, Trash2, ArrowLeft, Send, CheckCircle2, Search, Loader2 } from 'lucide-react';
import { 
    fetchAllUsers, 
    fetchWorkspaceMembers, 
    clearToast 
} from '../../store/slices/workspaceSlice';

export default function WorkspaceMembers() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { members, allUsers } = useSelector((state) => state.workspaces);
    const [searchTerm, setSearchTerm] = useState('');
    const [invitingEmails, setInvitingEmails] = useState({});

    useEffect(() => {
        dispatch(fetchAllUsers());
        dispatch(fetchWorkspaceMembers(workspaceId));
    }, [dispatch, workspaceId]);

    const showToast = (icon, title) => {
        Swal.fire({
            icon, title, toast: true, position: 'top-end',
            showConfirmButton: false, timer: 3000, timerProgressBar: true,
        });
    };

    const isMember = (email) => members.some(m => m.email === email);

    const handleInvite = async (email, role = 'VIEWER') => {
        setInvitingEmails(prev => ({ ...prev, [email]: true }));
        try {
            await api.post(`workspaces/workspace/${workspaceId}/members/`, { email, role });
            showToast('success', `Invitation sent to ${email}`);
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
            showToast('success', `Role updated to ${newRole}`);
            dispatch(fetchWorkspaceMembers(workspaceId)); 
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemove = async (memberId) => {
        const res = await Swal.fire({
            title: 'Remove Member?',
            icon: 'warning',
            showCancelButton: true,
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

    const filteredUsers = allUsers.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="container py-4">
            <button onClick={() => navigate(-1)} className="btn btn-link text-dark p-0 mb-4 d-flex align-items-center gap-2 text-decoration-none">
                <ArrowLeft size={18} /> <span className="fw-medium">Back</span>
            </button>

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-4">
                            <h5 className="fw-bold mb-3"><UserPlus size={20} className="text-primary me-2" />Add Collaborators</h5>
                            <div className="input-group mb-3 bg-light rounded-pill px-3 py-1">
                                <Search size={18} className="text-muted mt-2" />
                                <input type="text" className="form-control border-0 bg-transparent shadow-none" placeholder="Search users..." onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="overflow-auto" style={{ maxHeight: '400px' }}>
                                {filteredUsers.map(user => (
                                    <div key={user.id} className="d-flex align-items-center justify-content-between p-2 mb-2 border-bottom">
                                        <div className="small fw-medium text-truncate">{user.email}</div>
                                        {isMember(user.email) ? (
                                            <CheckCircle2 size={16} className="text-success" />
                                        ) : (
                                            <button onClick={() => handleInvite(user.email)} className="btn btn-sm btn-primary rounded-pill px-3" disabled={invitingEmails[user.email]}>
                                                {invitingEmails[user.email] ? <Loader2 size={12} className="spinner-border border-0" /> : 'Invite'}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-white p-4 border-0">
                            <h5 className="fw-bold mb-0">Current Members</h5>
                        </div>
                        <div className="table-responsive px-4 pb-4">
                            <table className="table align-middle">
                                <thead>
                                    <tr className="text-muted small">
                                        <th>User</th>
                                        <th>Role</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map(member => (
                                        <tr key={member.id}>
                                            <td className="py-3 fw-bold small">{member.email}</td>
                                            <td>
                                                <select 
                                                    className="form-select form-select-sm border-0 bg-light rounded-3 fw-medium"
                                                    value={member.role}
                                                    onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                                >
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="EDITOR">Editor</option>
                                                    <option value="VIEWER">Viewer</option>
                                                </select>
                                            </td>
                                            <td className="text-end">
                                                <button onClick={() => handleRemove(member.id)} className="btn btn-link text-danger p-0 border-0">
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
    );
}