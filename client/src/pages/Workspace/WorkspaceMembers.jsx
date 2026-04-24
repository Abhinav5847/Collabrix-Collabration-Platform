import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; 
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { 
    UserPlus, Shield, Trash2, ArrowLeft, 
    Search, Users, UserCircle, CheckCircle2 
} from 'lucide-react';

const MySwal = withReactContent(Swal);

export default function WorkspaceMembers() {
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    const [members, setMembers] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('VIEWER');
    const [searchTerm, setSearchTerm] = useState('');
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
            const [membersRes, usersRes] = await Promise.all([
                api.get(`workspaces/workspace/${workspaceId}/members/`), 
                api.get(`workspaces/users/all/`)
            ]);
            setMembers(membersRes.data.results || membersRes.data || []);
            setAvailableUsers(usersRes.data.results || usersRes.data || []);
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Failed to load data' });
        } finally { setLoading(false); }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserId) return;
        setIsSubmitting(true);
        try {
            await api.post(`workspaces/workspace/${workspaceId}/members/`, {
                user: selectedUserId,
                role: selectedRole
            });
            Toast.fire({ icon: 'success', title: 'Member added!' });
            setSelectedUserId('');
            loadData();
        } catch (err) {
            MySwal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to add member' });
        } finally { setIsSubmitting(false); }
    };

    // NEW: Function to update the role via PATCH
    const handleUpdateRole = async (memberId, newRole) => {
        try {
            await api.patch(`workspaces/workspace/${workspaceId}/members/${memberId}/`, {
                role: newRole
            });
            setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
            Toast.fire({ icon: 'success', title: `Role updated to ${newRole}` });
        } catch (err) {
            Toast.fire({ icon: 'error', title: 'Update failed' });
        }
    };

    const handleRemoveMember = async (memberId) => {
        const result = await MySwal.fire({
            title: 'Remove Member?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`workspaces/workspace/${workspaceId}/members/${memberId}/`);
                setMembers(members.filter(m => m.id !== memberId));
                Toast.fire({ icon: 'success', title: 'Member removed' });
            } catch (err) {
                Toast.fire({ icon: 'error', title: 'Action failed' });
            }
        }
    };

    const filteredAvailableUsers = availableUsers.filter(user => 
        !members.some(member => String(member.user) === String(user.id)) &&
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container py-5 bg-light min-vh-100">
            <div className="row justify-content-center">
                <div className="col-xl-11">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <button onClick={() => navigate('/')} className="btn btn-white border shadow-sm"><ArrowLeft size={18} /></button>
                        <h2 className="fw-bold m-0">Manage Workspace Team</h2>
                        <div className="badge bg-primary px-3 py-2"><Users size={16} className="me-2"/>{members.length}</div>
                    </div>

                    <div className="row g-4">
                        {/* Invite Form */}
                        <div className="col-lg-4">
                            <div className="card border-0 shadow-sm p-4 rounded-4">
                                <h6 className="fw-bold mb-4"><UserPlus size={18} className="me-2 text-primary"/>Invite Collaborator</h6>
                                <input 
                                    type="text" className="form-control mb-3" placeholder="Search users..." 
                                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="overflow-auto border rounded mb-3" style={{ height: '200px' }}>
                                    {filteredAvailableUsers.map(user => (
                                        <div 
                                            key={user.id} onClick={() => setSelectedUserId(user.id)}
                                            className={`p-2 border-bottom cursor-pointer ${selectedUserId === user.id ? 'bg-primary text-white' : ''}`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {user.username}
                                        </div>
                                    ))}
                                </div>
                                <select className="form-select mb-3" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                    <option value="VIEWER">Viewer</option>
                                    <option value="EDITOR">Editor</option>
                                </select>
                                <button className="btn btn-primary w-100 py-2 fw-bold" onClick={handleAddMember} disabled={!selectedUserId || isSubmitting}>
                                    {isSubmitting ? 'Adding...' : 'Add Member'}
                                </button>
                            </div>
                        </div>

                        {/* Member Table */}
                        <div className="col-lg-8">
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                                <table className="table align-middle mb-0">
                                    <thead className="bg-light border-bottom">
                                        <tr className="small text-muted fw-bold">
                                            <th className="ps-4 py-3">NAME</th>
                                            <th className="py-3">ROLE</th>
                                            <th className="text-end pe-4 py-3">ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map(member => (
                                            <tr key={member.id} className="border-bottom">
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{width: 38, height: 38}}>
                                                            {(member.user_name || member.username || '?')[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold">{member.user_name || member.username}</div>
                                                            <div className="small text-muted">{member.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {member.role === 'OWNER' ? (
                                                        <span className="badge bg-warning-subtle text-warning border border-warning px-3 py-2 rounded-pill">
                                                            <Shield size={12} className="me-1"/> OWNER
                                                        </span>
                                                    ) : (
                                                        <select 
                                                            className="form-select form-select-sm w-auto border-0 bg-light fw-bold"
                                                            value={member.role}
                                                            onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                                        >
                                                            <option value="VIEWER">VIEWER</option>
                                                            <option value="EDITOR">EDITOR</option>
                                                        </select>
                                                    )}
                                                </td>
                                                <td className="text-end pe-4">
                                                    {member.role !== 'OWNER' && (
                                                        <button onClick={() => handleRemoveMember(member.id)} className="btn btn-outline-danger border-0 p-2 rounded-circle">
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    )}
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
        </div>
    );
}