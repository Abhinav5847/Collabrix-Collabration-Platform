import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Trash2, Save, Layout, AlertTriangle, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { 
    fetchWorkspaces, 
    updateWorkspace, 
    deleteWorkspace, 
    clearToast 
} from '../../store/slices/workspaceSlice';

export default function WorkspaceManagePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const workspace = useSelector((s) => s.workspaces.list.find(w => String(w.id) === String(id)));
    const { loading, toast } = useSelector((s) => s.workspaces);
    const [formData, setFormData] = useState({ name: '', description: '' });

    // SweetAlert Toast Configuration
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    // Handle incoming Redux Toasts
    useEffect(() => {
        if (toast) {
            Toast.fire({
                icon: toast.type, // 'success' or 'error'
                title: toast.text
            });
            dispatch(clearToast());
        }
    }, [toast, dispatch]);

    useEffect(() => {
        if (!workspace) {
            dispatch(fetchWorkspaces());
        } else {
            setFormData({ name: workspace.name, description: workspace.description || '' });
        }
    }, [workspace, dispatch]);

    const handleUpdate = async (e) => {
    e.preventDefault();
    try {
        // .unwrap() allows you to catch errors or proceed only on success
        await dispatch(updateWorkspace({ id, formData })).unwrap();
        
        // Navigation occurs only after the update is successful
        navigate('/');
    } catch (error) {
        // The Toast useEffect already handles error notifications based on the slice
        console.error("Update failed:", error);
    }
};

    const handleDelete = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "All documents and agent history will be permanently deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            customClass: {
                confirmButton: 'rounded-pill px-4',
                cancelButton: 'rounded-pill px-4'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(deleteWorkspace(id));
                navigate('/');
            }
        });
    };

    if (!workspace && loading) return (
        <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light">
            <Loader2 className="animate-spin text-primary mb-2" size={32} />
            <span className="fw-bold text-muted font-monospace">SYNCING_NODE_DATA...</span>
        </div>
    );
    
    if (!workspace) return (
        <div className="text-center p-5 mt-5">
            <h4 className="text-muted">Workspace Not Found</h4>
            <button onClick={() => navigate('/')} className="btn btn-primary rounded-pill mt-3">Back to Dashboard</button>
        </div>
    );

    return (
        <div className="container-fluid bg-light min-vh-100 py-5 px-3 px-md-5">
            <div className="max-width-container mx-auto" style={{ maxWidth: '900px' }}>
                {/* Header Navigation */}
                <button 
                    onClick={() => navigate('/')} 
                    className="btn btn-link text-decoration-none text-secondary p-0 mb-4 d-flex align-items-center gap-2 fw-semibold transition-all hover-translate-x"
                >
                    <ArrowLeft size={18} /> BACK TO DASHBOARD
                </button>

                <div className="row g-4">
                    <div className="col-12">
                        {/* Main Settings Card */}
                        <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: '20px' }}>
                            <div className="card-header bg-white border-0 pt-4 px-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                                        <Layout size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h5 className="fw-bold mb-0">Workspace Settings</h5>
                                        <small className="text-muted">Manage node identity and cloud metadata</small>
                                    </div>
                                </div>
                            </div>

                            <div className="card-body p-4">
                                <form onSubmit={handleUpdate}>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-uppercase text-muted tracking-wider">Workspace Name</label>
                                        <input 
                                            className="form-control form-control-lg bg-light border-0 px-3 py-2 fw-medium shadow-none focus-ring" 
                                            placeholder="Enter workspace name"
                                            value={formData.name} 
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required 
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-uppercase text-muted tracking-wider">Description</label>
                                        <textarea 
                                            className="form-control bg-light border-0 px-3 py-2 fw-medium shadow-none focus-ring" 
                                            rows="4" 
                                            placeholder="Describe the purpose of this workspace..."
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-end border-top pt-4">
                                        <button type="submit" className="btn btn-primary px-5 py-2 fw-bold rounded-pill shadow-sm d-flex align-items-center gap-2">
                                            <Save size={18} /> Update Workspace
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Danger Zone Card */}
                        <div className="card border-0 shadow-sm mt-4 overflow-hidden" style={{ borderRadius: '20px' }}>
                            <div className="card-body p-4 border-start border-4 border-danger">
                                <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                                    <div className="d-flex gap-3">
                                        <div className="bg-danger bg-opacity-10 p-2 rounded-3 h-100">
                                            <AlertTriangle size={24} className="text-danger" />
                                        </div>
                                        <div>
                                            <h6 className="fw-bold text-danger mb-1">Termination Zone</h6>
                                            <p className="small text-muted mb-0" style={{ maxWidth: '400px' }}>
                                                Deleting this workspace is irreversible. All associated data will be purged from the cloud environment.
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleDelete} className="btn btn-outline-danger px-4 py-2 fw-bold rounded-pill hover-bg-danger transition-all">
                                        <Trash2 size={18} className="me-2" /> Delete Workspace
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-translate-x:hover { transform: translateX(-4px); color: #000 !important; }
                .focus-ring:focus { background-color: #fff !important; border: 1px solid #0d6efd !important; box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, .1) !important; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .tracking-wider { letter-spacing: 0.05em; }
            `}</style>
        </div>
    );
}