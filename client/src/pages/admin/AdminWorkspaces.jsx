import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { 
    FiSearch, FiEdit2, FiArchive, FiRefreshCcw, 
    FiFilter, FiX, FiCheck, FiMoreVertical 
} from "react-icons/fi";
import { 
    fetchAdminPortalData, 
    adminUpdateWorkspace, 
    adminDeleteWorkspace, 
    clearAdminState 
} from "../../store/slices/adminSlice";

const WorkspaceAdmin = () => {
    const dispatch = useDispatch();
    const { management, loading } = useSelector((state) => state.admin);
    const adminWorkspaces = management?.workspaces || [];

    // Local State for UI
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    
    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkspace, setEditingWorkspace] = useState({ id: null, name: "", description: "" });

    useEffect(() => {
        dispatch(fetchAdminPortalData());
    }, [dispatch]);

    // --- Action Handlers ---

    const openEditModal = (ws) => {
        setEditingWorkspace({ 
            id: ws.id, 
            name: ws.name, 
            description: ws.description || "" 
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        dispatch(adminUpdateWorkspace({ 
            id: editingWorkspace.id, 
            name: editingWorkspace.name,
            description: editingWorkspace.description 
        }));
        setIsEditModalOpen(false);
    };

    const handleSoftDelete = (id, isActive) => {
        const actionLabel = isActive !== false ? "Archive" : "Restore";
        toast.info(
            <div>
                <p style={{ margin: "0 0 10px 0" }}>Are you sure you want to {actionLabel} this workspace?</p>
                <button 
                    onClick={() => { dispatch(adminDeleteWorkspace(id)); toast.dismiss(); }}
                    style={S.confirmBtn}
                >
                    Confirm
                </button>
            </div>,
            { autoClose: false, closeOnClick: false }
        );
    };

    const filteredWorkspaces = adminWorkspaces.filter(ws => {
        const matchesSearch = ws.name.toLowerCase().includes(search.toLowerCase()) || 
                              ws.owner__email.toLowerCase().includes(search.toLowerCase());
        const isActive = ws.is_active !== false;
        const matchesFilter = filter === "all" || 
                              (filter === "active" && isActive) || 
                              (filter === "archived" && !isActive);
        return matchesSearch && matchesFilter;
    });

    return (
        <div style={S.container}>
            {/* Header Section */}
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Workspace Management</h1>
                    <p style={S.subtitle}>Global oversight of all Collabrix workspaces and assets.</p>
                </div>
                <button onClick={() => dispatch(fetchAdminPortalData())} style={S.btnRefresh}>
                    <FiRefreshCcw /> Sync Data
                </button>
            </div>

            {/* Stats Overview */}
            <div style={S.statsGrid}>
                <div style={S.statCard}>
                    <span style={S.statLabel}>Total Workspaces</span>
                    <span style={S.statValue}>{adminWorkspaces.length}</span>
                </div>
                <div style={S.statCard}>
                    <span style={S.statLabel}>Active Now</span>
                    <span style={S.statValue}>{adminWorkspaces.filter(w => w.is_active !== false).length}</span>
                </div>
            </div>

            {/* Control Bar */}
            <div style={S.controlBar}>
                <div style={S.searchWrapper}>
                    <FiSearch style={S.searchIcon} />
                    <input 
                        style={S.searchInput}
                        placeholder="Search by name, ID, or owner email..."
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div style={S.filterWrapper}>
                    <FiFilter style={S.filterIcon} />
                    <select style={S.select} onChange={(e) => setFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="active">Active Only</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div style={S.tableCard}>
                {loading ? (
                    <div style={S.loadingArea}>
                        <div className="spinner"></div>
                        <p>Refreshing Management Console...</p>
                    </div>
                ) : (
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Workspace Details</th>
                                <th style={S.th}>Ownership</th>
                                <th style={S.th}>Status</th>
                                <th style={S.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWorkspaces.map((ws) => (
                                <tr key={ws.id} style={S.tr}>
                                    <td style={S.td}>
                                        <div style={S.wsName}>{ws.name}</div>
                                        <div style={S.wsDesc}>{ws.description || "No description provided."}</div>
                                    </td>
                                    <td style={S.td}>
                                        <div style={S.ownerEmail}>{ws.owner__email}</div>
                                        <div style={S.wsId}>UID: {ws.id}</div>
                                    </td>
                                    <td style={S.td}>
                                        <span style={ws.is_active !== false ? S.badgeActive : S.badgeInactive}>
                                            {ws.is_active !== false ? "Active" : "Archived"}
                                        </span>
                                    </td>
                                    <td style={S.td}>
                                        <div style={S.actionGroup}>
                                            <button style={S.iconBtn} onClick={() => openEditModal(ws)}>
                                                <FiEdit2 />
                                            </button>
                                            <button 
                                                style={{...S.iconBtn, color: ws.is_active !== false ? "#EF4444" : "#10B981"}} 
                                                onClick={() => handleSoftDelete(ws.id, ws.is_active !== false)}
                                            >
                                                {ws.is_active !== false ? <FiArchive /> : <FiRefreshCcw />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Professional Edit Modal */}
            {isEditModalOpen && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <div style={S.modalHeader}>
                            <h2 style={S.modalTitle}>Edit Workspace Settings</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={S.closeBtn}><FiX /></button>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div style={S.formGroup}>
                                <label style={S.label}>Workspace Name</label>
                                <input 
                                    style={S.input}
                                    value={editingWorkspace.name}
                                    onChange={(e) => setEditingWorkspace({...editingWorkspace, name: e.target.value})}
                                    required
                                />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Description</label>
                                <textarea 
                                    style={{...S.input, height: "100px", resize: "none"}}
                                    value={editingWorkspace.description}
                                    onChange={(e) => setEditingWorkspace({...editingWorkspace, description: e.target.value})}
                                />
                            </div>
                            <div style={S.modalFooter}>
                                <button type="button" onClick={() => setIsEditModalOpen(false)} style={S.cancelBtn}>Cancel</button>
                                <button type="submit" style={S.saveBtn}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Modern Professional Styles ---
const S = {
    container: { padding: "40px", backgroundColor: "#F1F5F9", minHeight: "100vh", fontFamily: "'Inter', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
    title: { fontSize: "28px", fontWeight: "700", color: "#0F172A", margin: 0 },
    subtitle: { color: "#64748B", fontSize: "15px", marginTop: "4px" },
    btnRefresh: { padding: "10px 20px", borderRadius: "8px", border: "1px solid #E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fff", fontWeight: "600", transition: "0.2s" },
    
    statsGrid: { display: "flex", gap: "20px", marginBottom: "32px" },
    statCard: { backgroundColor: "#fff", padding: "20px", borderRadius: "12px", flex: 1, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    statLabel: { display: "block", color: "#64748B", fontSize: "13px", fontWeight: "600", marginBottom: "8px", textTransform: "uppercase" },
    statValue: { fontSize: "24px", fontWeight: "700", color: "#0F172A" },

    controlBar: { display: "flex", gap: "16px", marginBottom: "24px" },
    searchWrapper: { position: "relative", flex: 1 },
    searchIcon: { position: "absolute", left: "14px", top: "14px", color: "#94A3B8" },
    searchInput: { width: "100%", padding: "12px 12px 12px 42px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "14px", backgroundColor: "#fff" },
    filterWrapper: { position: "relative" },
    filterIcon: { position: "absolute", left: "12px", top: "14px", color: "#94A3B8" },
    select: { padding: "12px 40px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: "#fff", appearance: "none", cursor: "pointer" },

    tableCard: { background: "#fff", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "16px 24px", background: "#F8FAFC", fontSize: "12px", color: "#475569", fontWeight: "700", borderBottom: "1px solid #E2E8F0" },
    tr: { borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" },
    td: { padding: "20px 24px", verticalAlign: "top" },
    wsName: { fontWeight: "700", color: "#1E293B", fontSize: "15px" },
    wsDesc: { fontSize: "13px", color: "#64748B", marginTop: "4px", maxWidth: "300px" },
    ownerEmail: { fontSize: "14px", color: "#334155", fontWeight: "500" },
    wsId: { fontSize: "11px", color: "#94A3B8", marginTop: "2px" },
    badgeActive: { padding: "4px 12px", background: "#DCFCE7", color: "#166534", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
    badgeInactive: { padding: "4px 12px", background: "#FEE2E2", color: "#991B1B", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
    actionGroup: { display: "flex", gap: "12px" },
    iconBtn: { border: "none", background: "#F1F5F9", padding: "10px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", color: "#475569" },

    // Modal Styles
    modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
    modalContent: { backgroundColor: "#fff", padding: "32px", borderRadius: "16px", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" },
    modalHeader: { display: "flex", justifyContent: "space-between", marginBottom: "24px" },
    modalTitle: { margin: 0, fontSize: "20px", fontWeight: "700" },
    closeBtn: { border: "none", background: "none", cursor: "pointer", fontSize: "20px", color: "#94A3B8" },
    formGroup: { marginBottom: "20px" },
    label: { display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" },
    input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "14px" },
    modalFooter: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" },
    cancelBtn: { padding: "10px 20px", borderRadius: "8px", border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer" },
    saveBtn: { padding: "10px 24px", borderRadius: "8px", border: "none", background: "#2563EB", color: "#fff", fontWeight: "600", cursor: "pointer" },
    confirmBtn: { padding: "5px 12px", background: "#EF4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }
};

export default WorkspaceAdmin;