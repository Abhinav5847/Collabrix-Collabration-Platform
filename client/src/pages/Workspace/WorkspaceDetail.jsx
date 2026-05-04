import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft, LayoutDashboard, FileText, Users, Settings,
    Plus, Upload, Trash2, Pencil, Save, X, Crown,
    ShieldCheck, Eye, UserPlus, Loader2, AlertCircle,
    CheckCircle2, MoreHorizontal, FileIcon, RefreshCw,
    Building2, Mail, ChevronDown
} from 'lucide-react';
import { api } from '../../services/api';

const TABS = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> },
];

const ROLE_META = {
    OWNER:  { bg: '#fef3c7', color: '#92400e', border: '#fde68a', icon: <Crown size={11} /> },
    EDITOR: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', icon: <Pencil size={11} /> },
    VIEWER: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', icon: <Eye size={11} /> },
};

export default function WorkspaceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [workspace, setWorkspace] = useState(null);
    const [pageStatus, setPageStatus] = useState('loading');

    useEffect(() => {
        api.get(`workspaces/${id}/`)
            .then(res => { setWorkspace(res.data); setPageStatus('ready'); })
            .catch(() => setPageStatus('error'));
    }, [id]);

    const wsColors = ['#2563eb','#0891b2','#7c3aed','#059669','#dc2626','#d97706'];
    const wsColor = workspace ? wsColors[workspace.name.charCodeAt(0) % wsColors.length] : '#2563eb';

    if (pageStatus === 'loading') return <PageLoader />;
    if (pageStatus === 'error')   return <PageError />;

    return (
        <div style={{ fontFamily: "'Inter', system-ui, sans-serif", maxWidth: '900px', margin: '0 auto' }}>
            <style>{`
                @keyframes spin    { to { transform: rotate(360deg); } }
                @keyframes fadeIn  { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
                @keyframes slideIn { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:translateY(0); } }
            `}</style>

            {/* Back */}
            <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:500, color:'#64748b', textDecoration:'none', marginBottom:'20px' }}
                onMouseEnter={e => e.currentTarget.style.color='#1e293b'}
                onMouseLeave={e => e.currentTarget.style.color='#64748b'}>
                <ArrowLeft size={14}/> Back to Dashboard
            </Link>

            {/* ── Workspace Header ── */}
            <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', padding:'22px 24px', marginBottom:'6px', display:'flex', alignItems:'center', gap:'16px' }}>
                <div style={{ width:'52px', height:'52px', borderRadius:'13px', background: wsColor+'18', border:`1px solid ${wsColor}30`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'17px', color: wsColor, flexShrink:0 }}>
                    {workspace.name.substring(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1, overflow:'hidden' }}>
                    <h1 style={{ margin:0, fontSize:'19px', fontWeight:700, color:'#0f172a', letterSpacing:'-0.4px' }}>{workspace.name}</h1>
                    <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#94a3b8' }}>{workspace.description || 'No description provided.'}</p>
                </div>
                <RoleBadge role={workspace.your_role || 'VIEWER'} />
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ background:'#fff', borderRadius:'0 0 0 0', border:'1px solid #e2e8f0', borderTop:'none', display:'flex', gap:'2px', padding:'0 16px', marginBottom:'16px', borderRadius:'0 0 10px 10px' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'13px 14px', fontSize:'13.5px', fontWeight: activeTab===tab.id ? 600 : 500, color: activeTab===tab.id ? '#2563eb' : '#64748b', background:'none', border:'none', borderBottom: activeTab===tab.id ? '2px solid #2563eb' : '2px solid transparent', cursor:'pointer', transition:'all 0.15s', marginBottom:'-1px' }}>
                        <span style={{ color: activeTab===tab.id ? '#2563eb' : '#94a3b8' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div style={{ animation:'slideIn 0.2s ease' }} key={activeTab}>
                {activeTab === 'overview'   && <OverviewTab  workspace={workspace} wsColor={wsColor} />}
                {activeTab === 'documents'  && <DocumentsTab workspaceId={id} workspace={workspace} />}
                {activeTab === 'members'    && <MembersTab   workspaceId={id} workspace={workspace} />}
                {activeTab === 'settings'   && <SettingsTab  workspace={workspace} setWorkspace={setWorkspace} navigate={navigate} workspaceId={id} />}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   TAB: OVERVIEW
════════════════════════════════════════ */
function OverviewTab({ workspace, wsColor }) {
    const rows = [
        { label:'Workspace Name',  value: workspace.name },
        { label:'Description',     value: workspace.description || <em style={{color:'#94a3b8'}}>No description</em> },
        { label:'Owner',           value: workspace.owner_name || '—' },
        { label:'Members',         value: workspace.member_count ? `${workspace.member_count} member${workspace.member_count!==1?'s':''}` : '—' },
        { label:'Your Role',       value: <RoleBadge role={workspace.your_role||'VIEWER'} /> },
        { label:'Workspace ID',    value: <code style={{fontSize:'12px',background:'#f1f5f9',padding:'2px 8px',borderRadius:'5px',color:'#475569'}}>{workspace.id}</code> },
    ];
    return (
        <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
                <h3 style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#0f172a' }}>Workspace Details</h3>
            </div>
            <div style={{ padding:'8px 24px 20px' }}>
                {rows.map((r,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', padding:'13px 0', borderBottom: i<rows.length-1 ? '1px solid #f8fafc' : 'none', gap:'16px' }}>
                        <span style={{ fontSize:'13px', color:'#64748b', fontWeight:500, minWidth:'140px' }}>{r.label}</span>
                        <span style={{ fontSize:'13.5px', color:'#1e293b', fontWeight:500 }}>{r.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   TAB: DOCUMENTS
════════════════════════════════════════ */
function DocumentsTab({ workspaceId, workspace }) {
    const [docs, setDocs]             = useState([]);
    const [status, setStatus]         = useState('loading');
    const [showCreate, setShowCreate] = useState(false);
    const [newDocName, setNewDocName] = useState('');
    const [creating, setCreating]     = useState(false);
    const [error, setError]           = useState('');
    const [renameId, setRenameId]     = useState(null);
    const [renameName, setRenameName] = useState('');
    const [openMenu, setOpenMenu]     = useState(null);

    useEffect(() => {
        api.get(`workspaces/${workspaceId}/documents/`)
            .then(res => { setDocs(res.data); setStatus('ready'); })
            .catch(() => setStatus('ready')); // graceful — maybe no docs yet
    }, [workspaceId]);

    const handleCreate = async () => {
        if (!newDocName.trim()) return;
        setCreating(true);
        try {
            const res = await api.post(`workspaces/${workspaceId}/documents/`, { name: newDocName.trim() });
            setDocs(prev => [res.data, ...prev]);
            setNewDocName(''); setShowCreate(false);
        } catch (e) {
            setError(e.response?.data?.error || 'Failed to create document.');
        } finally { setCreating(false); }
    };

    const handleRename = async (docId) => {
        if (!renameName.trim()) return;
        try {
            const res = await api.put(`workspaces/${workspaceId}/documents/${docId}/`, { name: renameName.trim() });
            setDocs(prev => prev.map(d => d.id===docId ? res.data : d));
            setRenameId(null);
        } catch (e) { setError('Failed to rename.'); }
    };

    const handleDelete = async (docId) => {
        try {
            await api.delete(`workspaces/${workspaceId}/documents/${docId}/`);
            setDocs(prev => prev.filter(d => d.id !== docId));
        } catch (e) { setError('Failed to delete.'); }
        setOpenMenu(null);
    };

    return (
        <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                    <h3 style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#0f172a' }}>Documents</h3>
                    <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>{docs.length} file{docs.length!==1?'s':''}</p>
                </div>
                <div style={{ display:'flex', gap:'8px' }}>
                    <label style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background:'#f8fafc', border:'1.5px solid #e2e8f0', color:'#374151', cursor:'pointer' }}>
                        <Upload size={13}/> Upload
                        <input type="file" style={{ display:'none' }} onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const fd = new FormData(); fd.append('file', file); fd.append('name', file.name);
                            api.post(`workspaces/${workspaceId}/documents/`, fd)
                                .then(res => setDocs(prev => [res.data, ...prev]))
                                .catch(() => setError('Upload failed.'));
                        }} />
                    </label>
                    <button onClick={() => { setShowCreate(true); setNewDocName(''); }} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background:'#2563eb', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 1px 3px rgba(37,99,235,0.3)' }}>
                        <Plus size={13}/> New Document
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#fef2f2', borderBottom:'1px solid #fecaca', padding:'10px 24px' }}>
                    <AlertCircle size={14} color="#dc2626"/>
                    <span style={{ fontSize:'13px', color:'#b91c1c' }}>{error}</span>
                    <button onClick={() => setError('')} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={13}/></button>
                </div>
            )}

            {showCreate && (
                <div style={{ padding:'14px 24px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', gap:'10px', alignItems:'center', animation:'fadeIn 0.15s ease' }}>
                    <FileText size={15} color="#2563eb" style={{ flexShrink:0 }}/>
                    <input autoFocus value={newDocName} onChange={e => setNewDocName(e.target.value)}
                        onKeyDown={e => { if(e.key==='Enter') handleCreate(); if(e.key==='Escape') setShowCreate(false); }}
                        placeholder="Document name…"
                        style={{ flex:1, padding:'8px 12px', fontSize:'13.5px', border:'1.5px solid #bfdbfe', borderRadius:'8px', outline:'none', background:'#fff', fontFamily:'inherit' }}/>
                    <button onClick={handleCreate} disabled={creating || !newDocName.trim()} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background: newDocName.trim() ? '#2563eb' : '#93c5fd', color:'#fff', border:'none', cursor: newDocName.trim() ? 'pointer' : 'not-allowed' }}>
                        {creating ? <Loader2 size={13} style={{animation:'spin 0.75s linear infinite'}}/> : <CheckCircle2 size={13}/>} Create
                    </button>
                    <button onClick={() => setShowCreate(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}><X size={15}/></button>
                </div>
            )}

            <div>
                {status === 'loading' ? (
                    <div style={{ padding:'40px', textAlign:'center' }}><Loader2 size={20} color="#94a3b8" style={{animation:'spin 0.75s linear infinite'}}/></div>
                ) : docs.length === 0 ? (
                    <EmptyState icon={<FileText size={22} color="#94a3b8"/>} title="No documents yet" subtitle="Create a new document or upload a file to get started." />
                ) : (
                    docs.map((doc, i) => (
                        <div key={doc.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 24px', borderBottom: i<docs.length-1 ? '1px solid #f8fafc' : 'none', transition:'background 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                            <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                <FileText size={15} color="#2563eb"/>
                            </div>
                            {renameId === doc.id ? (
                                <input autoFocus value={renameName} onChange={e => setRenameName(e.target.value)}
                                    onKeyDown={e => { if(e.key==='Enter') handleRename(doc.id); if(e.key==='Escape') setRenameId(null); }}
                                    style={{ flex:1, padding:'6px 10px', fontSize:'13.5px', border:'1.5px solid #bfdbfe', borderRadius:'7px', outline:'none', fontFamily:'inherit' }}/>
                            ) : (
                                <div style={{ flex:1, overflow:'hidden' }}>
                                    <p style={{ margin:0, fontSize:'13.5px', fontWeight:600, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{doc.name}</p>
                                    <p style={{ margin:'2px 0 0', fontSize:'11.5px', color:'#94a3b8' }}>{doc.created_at ? new Date(doc.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—'}</p>
                                </div>
                            )}
                            {renameId === doc.id ? (
                                <div style={{ display:'flex', gap:'6px' }}>
                                    <button onClick={() => handleRename(doc.id)} style={{ padding:'5px 10px', borderRadius:'6px', background:'#2563eb', color:'#fff', border:'none', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>Save</button>
                                    <button onClick={() => setRenameId(null)} style={{ padding:'5px 10px', borderRadius:'6px', background:'#f1f5f9', color:'#64748b', border:'none', fontSize:'12px', cursor:'pointer' }}>Cancel</button>
                                </div>
                            ) : (
                                <div style={{ position:'relative' }}>
                                    <button onClick={() => setOpenMenu(openMenu===doc.id ? null : doc.id)} style={{ width:'30px', height:'30px', borderRadius:'7px', background:'none', border:'1px solid transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}
                                        onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#e2e8f0'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'; }}>
                                        <MoreHorizontal size={15}/>
                                    </button>
                                    {openMenu === doc.id && (
                                        <div style={{ position:'absolute', right:0, top:'34px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'5px', zIndex:50, minWidth:'140px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', animation:'fadeIn 0.12s ease' }}>
                                            <MenuBtn icon={<Pencil size={13}/>} label="Rename" onClick={() => { setRenameId(doc.id); setRenameName(doc.name); setOpenMenu(null); }} />
                                            <MenuBtn icon={<Trash2 size={13}/>} label="Delete" danger onClick={() => handleDelete(doc.id)} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


function MembersTab({ workspaceId, workspace }) {
    const [members, setMembers]       = useState([]);
    const [status, setStatus]         = useState('loading');
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole]   = useState('VIEWER');
    const [inviting, setInviting]       = useState(false);
    const [openMenu, setOpenMenu]       = useState(null);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState('');

    useEffect(() => {
        api.get(`workspaces/${workspaceId}/members/`)
            .then(res => { setMembers(res.data); setStatus('ready'); })
            .catch(() => setStatus('ready'));
    }, [workspaceId]);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return;
        setInviting(true); setError('');
        try {
            const res = await api.post(`workspaces/${workspaceId}/members/invite/`, { email: inviteEmail.trim(), role: inviteRole });
            setMembers(prev => [...prev, res.data]);
            setInviteEmail(''); setShowInvite(false);
            setSuccess(`Invitation sent to ${inviteEmail}`);
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) {
            setError(e.response?.data?.error || e.response?.data?.email?.[0] || 'Failed to invite member.');
        } finally { setInviting(false); }
    };

    const handleRoleChange = async (memberId, newRole) => {
        try {
            const res = await api.patch(`workspaces/${workspaceId}/members/${memberId}/`, { role: newRole });
            setMembers(prev => prev.map(m => m.id===memberId ? {...m, role: res.data.role} : m));
        } catch (e) { setError('Failed to update role.'); }
        setOpenMenu(null);
    };

    const handleRemove = async (memberId) => {
        try {
            await api.delete(`workspaces/${workspaceId}/members/${memberId}/`);
            setMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (e) { setError(e.response?.data?.error || 'Failed to remove member.'); }
        setOpenMenu(null);
    };

    return (
        <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
            {/* Header */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                    <h3 style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#0f172a' }}>Members</h3>
                    <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>{members.length} member{members.length!==1?'s':''}</p>
                </div>
                <button onClick={() => setShowInvite(v => !v)} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background:'#2563eb', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 1px 3px rgba(37,99,235,0.3)' }}>
                    <UserPlus size={13}/> Invite Member
                </button>
            </div>

            {/* Banners */}
            {error && <Banner type="error" msg={error} onClose={() => setError('')}/>}
            {success && <Banner type="success" msg={success} onClose={() => setSuccess('')}/>}

            {/* Invite Form */}
            {showInvite && (
                <div style={{ padding:'16px 24px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', animation:'fadeIn 0.15s ease' }}>
                    <p style={{ margin:'0 0 12px', fontSize:'13px', fontWeight:600, color:'#374151' }}>Invite by email</p>
                    <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
                            <Mail size={14} color="#94a3b8" style={{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                onKeyDown={e => { if(e.key==='Enter') handleInvite(); }}
                                placeholder="colleague@company.com"
                                style={{ width:'100%', boxSizing:'border-box', padding:'9px 12px 9px 34px', fontSize:'13.5px', border:'1.5px solid #e2e8f0', borderRadius:'8px', outline:'none', background:'#fff', fontFamily:'inherit' }}
                                onFocus={e => e.target.style.borderColor='#bfdbfe'}
                                onBlur={e => e.target.style.borderColor='#e2e8f0'}/>
                        </div>
                        <RoleSelect value={inviteRole} onChange={setInviteRole}/>
                        <button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:600, background: inviteEmail.trim() ? '#2563eb':'#93c5fd', color:'#fff', border:'none', cursor: inviteEmail.trim()?'pointer':'not-allowed' }}>
                            {inviting ? <Loader2 size={13} style={{animation:'spin 0.75s linear infinite'}}/> : <UserPlus size={13}/>} Send Invite
                        </button>
                        <button onClick={() => setShowInvite(false)} style={{ padding:'9px 12px', borderRadius:'8px', background:'#f1f5f9', border:'none', cursor:'pointer', color:'#64748b', display:'flex', alignItems:'center' }}><X size={14}/></button>
                    </div>
                </div>
            )}

            {/* Member List */}
            <div>
                {status === 'loading' ? (
                    <div style={{ padding:'40px', textAlign:'center' }}><Loader2 size={20} color="#94a3b8" style={{animation:'spin 0.75s linear infinite'}}/></div>
                ) : members.length === 0 ? (
                    <EmptyState icon={<Users size={22} color="#94a3b8"/>} title="No members yet" subtitle="Invite colleagues to start collaborating." />
                ) : (
                    members.map((m, i) => (
                        <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'13px 24px', borderBottom: i<members.length-1 ? '1px solid #f8fafc' : 'none' }}>
                            {/* Avatar */}
                            <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:'#dbeafe', color:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'13px', flexShrink:0 }}>
                                {(m.username||m.email||'?').substring(0,1).toUpperCase()}
                            </div>
                            <div style={{ flex:1, overflow:'hidden' }}>
                                <p style={{ margin:0, fontSize:'13.5px', fontWeight:600, color:'#1e293b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.username || m.email}</p>
                                <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#94a3b8' }}>{m.email}</p>
                            </div>
                            <RoleBadge role={m.role}/>
                            {/* Actions (only non-owners can be managed) */}
                            {m.role !== 'OWNER' && (
                                <div style={{ position:'relative' }}>
                                    <button onClick={() => setOpenMenu(openMenu===m.id ? null : m.id)}
                                        style={{ width:'30px', height:'30px', borderRadius:'7px', background:'none', border:'1px solid transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}
                                        onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.borderColor='#e2e8f0'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'; }}>
                                        <MoreHorizontal size={15}/>
                                    </button>
                                    {openMenu === m.id && (
                                        <div style={{ position:'absolute', right:0, top:'34px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:'10px', padding:'5px', zIndex:50, minWidth:'160px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', animation:'fadeIn 0.12s ease' }}>
                                            <p style={{ margin:'4px 8px 6px', fontSize:'10px', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.5px' }}>Change Role</p>
                                            {['EDITOR','VIEWER'].map(r => (
                                                <MenuBtn key={r} icon={ROLE_META[r]?.icon} label={r} active={m.role===r} onClick={() => handleRoleChange(m.id, r)}/>
                                            ))}
                                            <div style={{ height:'1px', background:'#f1f5f9', margin:'4px 0' }}/>
                                            <MenuBtn icon={<X size={13}/>} label="Remove" danger onClick={() => handleRemove(m.id)}/>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   TAB: SETTINGS
════════════════════════════════════════ */
function SettingsTab({ workspace, setWorkspace, navigate, workspaceId }) {
    const [formData, setFormData]   = useState({ name: workspace.name, description: workspace.description||'' });
    const [saveStatus, setSaveStatus] = useState('idle');
    const [saveError, setSaveError]   = useState('');
    const [deleteStep, setDeleteStep] = useState('idle'); // idle | confirm | deleting

    const nameOk = formData.name.trim().length >= 2;
    const hasChanges = formData.name !== workspace.name || formData.description !== (workspace.description||'');

    const handleUpdate = async () => {
        setSaveStatus('saving'); setSaveError('');
        try {
            const res = await api.put(`workspaces/${workspaceId}/`, formData);
            setWorkspace(res.data);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
            const msg = e.response?.data?.error || e.response?.data?.name?.[0] || 'Update failed.';
            setSaveError(typeof msg==='string' ? msg : JSON.stringify(msg));
            setSaveStatus('error');
        }
    };

    const handleDelete = async () => {
        if (deleteStep === 'idle')    { setDeleteStep('confirm'); return; }
        if (deleteStep === 'confirm') {
            setDeleteStep('deleting');
            try {
                await api.delete(`workspaces/${workspaceId}/`);
                navigate('/'); window.location.reload();
            } catch (e) {
                setSaveError(e.response?.data?.error || 'Delete failed.');
                setDeleteStep('idle');
            }
        }
    };

    return (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Edit Card */}
            <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #e2e8f0', overflow:'hidden' }}>
                <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9' }}>
                    <h3 style={{ margin:0, fontSize:'14px', fontWeight:700, color:'#0f172a' }}>General Settings</h3>
                    <p style={{ margin:'3px 0 0', fontSize:'12.5px', color:'#94a3b8' }}>Update your workspace name and description.</p>
                </div>
                <div style={{ padding:'24px' }}>
                    {saveStatus==='success' && <Banner type="success" msg="Workspace updated successfully." onClose={() => setSaveStatus('idle')}/>}
                    {saveError && <Banner type="error" msg={saveError} onClose={() => setSaveError('')}/>}

                    <div style={{ marginBottom:'18px' }}>
                        <label style={{ display:'block', fontSize:'13px', fontWeight:600, color:'#374151', marginBottom:'7px' }}>
                            Workspace Name <span style={{ color:'#ef4444' }}>*</span>
                        </label>
                        <div style={{ position:'relative' }}>
                            <input value={formData.name} onChange={e => setFormData({...formData, name:e.target.value})}
                                style={{ width:'100%', boxSizing:'border-box', padding:'10px 38px 10px 14px', fontSize:'14px', color:'#0f172a', background:'#f8fafc', border:`1.5px solid ${formData.name&&!nameOk?'#fca5a5':formData.name&&nameOk?'#86efac':'#e2e8f0'}`, borderRadius:'9px', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s, box-shadow 0.15s' }}
                                onFocus={e => e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'}
                                onBlur={e => e.target.style.boxShadow='none'}/>
                            {formData.name && <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)' }}>
                                <CheckCircle2 size={15} color={nameOk?'#16a34a':'#ef4444'}/>
                            </div>}
                        </div>
                    </div>

                    <div style={{ marginBottom:'24px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'7px' }}>
                            <label style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>Description <span style={{ fontWeight:400, color:'#94a3b8' }}>(optional)</span></label>
                            <span style={{ fontSize:'11px', color: formData.description.length>260?'#ef4444':'#94a3b8' }}>{formData.description.length}/300</span>
                        </div>
                        <textarea rows={4} value={formData.description} maxLength={300}
                            onChange={e => setFormData({...formData, description:e.target.value})}
                            placeholder="Describe this workspace…"
                            style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', fontSize:'14px', color:'#0f172a', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:'9px', outline:'none', resize:'vertical', lineHeight:1.6, fontFamily:'inherit', transition:'border-color 0.15s, box-shadow 0.15s' }}
                            onFocus={e => { e.target.style.borderColor='#bfdbfe'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}/>
                    </div>

                    <div style={{ height:'1px', background:'#f1f5f9', marginBottom:'20px' }}/>
                    <div style={{ display:'flex', gap:'10px' }}>
                        <button onClick={() => setFormData({ name:workspace.name, description:workspace.description||'' })} style={{ padding:'9px 18px', borderRadius:'9px', fontSize:'13.5px', fontWeight:600, color:'#64748b', background:'#f8fafc', border:'1.5px solid #e2e8f0', cursor:'pointer' }}>
                            Reset
                        </button>
                        <button onClick={handleUpdate} disabled={!nameOk||!hasChanges||saveStatus==='saving'}
                            style={{ flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'9px 20px', borderRadius:'9px', fontSize:'13.5px', fontWeight:600, color:'#fff', border:'none', cursor:(!nameOk||!hasChanges||saveStatus==='saving')?'not-allowed':'pointer', background:(!nameOk||!hasChanges||saveStatus==='saving')?'#93c5fd':'#2563eb', transition:'all 0.15s' }}
                            onMouseEnter={e => { if(nameOk&&hasChanges&&saveStatus!=='saving') e.currentTarget.style.background='#1d4ed8'; }}
                            onMouseLeave={e => { if(nameOk&&hasChanges&&saveStatus!=='saving') e.currentTarget.style.background='#2563eb'; }}>
                            {saveStatus==='saving' ? <><Loader2 size={14} style={{animation:'spin 0.75s linear infinite'}}/> Saving…</> : <><Save size={14}/> Save Changes</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div style={{ background:'#fff', borderRadius:'14px', border:'1px solid #fee2e2', overflow:'hidden' }}>
                <div style={{ padding:'14px 24px', background:'#fff5f5', borderBottom:'1px solid #fee2e2', display:'flex', alignItems:'center', gap:'8px' }}>
                    <AlertCircle size={14} color="#dc2626"/>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.5px' }}>Danger Zone</span>
                </div>
                <div style={{ padding:'18px 24px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px', flexWrap:'wrap' }}>
                        <div>
                            <p style={{ margin:0, fontSize:'13.5px', fontWeight:600, color:'#1e293b' }}>Delete this workspace</p>
                            <p style={{ margin:'3px 0 0', fontSize:'12.5px', color:'#94a3b8' }}>Permanently removes all data. Only the owner can do this.</p>
                        </div>
                        <button onClick={handleDelete} disabled={deleteStep==='deleting'}
                            style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'9px 16px', borderRadius:'8px', fontSize:'13px', fontWeight:600, border:`1.5px solid ${deleteStep==='confirm'?'#dc2626':'#fca5a5'}`, background:deleteStep==='confirm'?'#dc2626':'#fff', color:deleteStep==='confirm'?'#fff':'#dc2626', cursor:deleteStep==='deleting'?'not-allowed':'pointer', transition:'all 0.15s', flexShrink:0 }}>
                            {deleteStep==='deleting' ? <><Loader2 size={13} style={{animation:'spin 0.75s linear infinite'}}/> Deleting…</> : deleteStep==='confirm' ? <><AlertCircle size={13}/> Confirm Delete</> : <><Trash2 size={13}/> Delete Workspace</>}
                        </button>
                    </div>
                    {deleteStep==='confirm' && (
                        <div style={{ marginTop:'12px', display:'flex', alignItems:'center', gap:'10px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'8px', padding:'10px 14px', animation:'fadeIn 0.15s ease' }}>
                            <AlertCircle size={13} color="#d97706" style={{ flexShrink:0 }}/>
                            <span style={{ fontSize:'12.5px', color:'#92400e' }}>This cannot be undone. Click Confirm Delete to proceed.</span>
                            <button onClick={() => setDeleteStep('idle')} style={{ marginLeft:'auto', fontSize:'12px', color:'#64748b', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', padding:0, flexShrink:0 }}>Cancel</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function RoleBadge({ role }) {
    const s = ROLE_META[role] || ROLE_META['VIEWER'];
    return (
        <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'20px', fontSize:'11.5px', fontWeight:700, background:s.bg, color:s.color, border:`1px solid ${s.border}`, whiteSpace:'nowrap', flexShrink:0 }}>
            {s.icon} {role||'VIEWER'}
        </span>
    );
}

function RoleSelect({ value, onChange }) {
    return (
        <div style={{ position:'relative', display:'inline-flex', alignItems:'center' }}>
            <select value={value} onChange={e => onChange(e.target.value)}
                style={{ appearance:'none', padding:'9px 32px 9px 12px', fontSize:'13px', fontWeight:600, border:'1.5px solid #e2e8f0', borderRadius:'8px', background:'#fff', color:'#374151', cursor:'pointer', fontFamily:'inherit', outline:'none' }}>
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
            </select>
            <ChevronDown size={13} color="#94a3b8" style={{ position:'absolute', right:'10px', pointerEvents:'none' }}/>
        </div>
    );
}

function MenuBtn({ icon, label, danger, active, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button onClick={onClick}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'7px 10px', borderRadius:'7px', background: hov ? (danger?'#fef2f2': active?'#eff6ff':'#f8fafc') : 'transparent', border:'none', cursor:'pointer', fontSize:'13px', fontWeight: active?700:500, color: danger?'#dc2626': active?'#2563eb':'#374151', textAlign:'left' }}>
            <span style={{ color: danger?'#dc2626': active?'#2563eb':'#94a3b8', display:'flex' }}>{icon}</span>
            {label}
            {active && <CheckCircle2 size={12} color="#2563eb" style={{ marginLeft:'auto' }}/>}
        </button>
    );
}

function Banner({ type, msg, onClose }) {
    const isErr = type==='error';
    return (
        <div style={{ display:'flex', alignItems:'center', gap:'10px', background:isErr?'#fef2f2':'#f0fdf4', border:`1px solid ${isErr?'#fecaca':'#bbf7d0'}`, borderRadius:'10px', padding:'11px 14px', marginBottom:'18px', animation:'fadeIn 0.2s ease' }}>
            {isErr ? <AlertCircle size={15} color="#dc2626" style={{flexShrink:0}}/> : <CheckCircle2 size={15} color="#16a34a" style={{flexShrink:0}}/>}
            <span style={{ fontSize:'13px', color:isErr?'#b91c1c':'#15803d', fontWeight:500 }}>{msg}</span>
            <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', padding:0 }}><X size={13}/></button>
        </div>
    );
}

function EmptyState({ icon, title, subtitle }) {
    return (
        <div style={{ padding:'52px 32px', textAlign:'center' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>{icon}</div>
            <p style={{ margin:'0 0 6px', fontSize:'14.5px', fontWeight:700, color:'#1e293b' }}>{title}</p>
            <p style={{ margin:0, fontSize:'13px', color:'#94a3b8', maxWidth:'260px', marginLeft:'auto', marginRight:'auto' }}>{subtitle}</p>
        </div>
    );
}

function PageLoader() {
    return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', border:'3px solid #e2e8f0', borderTop:'3px solid #2563eb', borderRadius:'50%', animation:'spin 0.75s linear infinite' }}/>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <span style={{ fontSize:'13px', color:'#94a3b8', fontWeight:500 }}>Loading workspace…</span>
        </div>
    );
}

function PageError() {
    return (
        <div style={{ maxWidth:'480px', margin:'60px auto', textAlign:'center' }}>
            <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'#fef2f2', border:'1px solid #fecaca', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <AlertCircle size={22} color="#dc2626"/>
            </div>
            <p style={{ margin:'0 0 6px', fontSize:'16px', fontWeight:700, color:'#1e293b' }}>Workspace not found</p>
            <p style={{ margin:'0 0 20px', fontSize:'13.5px', color:'#94a3b8' }}>This workspace may have been deleted or you don't have access.</p>
            <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'9px', background:'#2563eb', color:'#fff', fontSize:'13.5px', fontWeight:600, textDecoration:'none' }}>
                <ArrowLeft size={14}/> Back to Dashboard
            </Link>
        </div>
    );
}