import React, { useState, useEffect } from "react";
import { api } from "../../services/api"; 
import { useParams, Link } from "react-router-dom";
import { FilePlus, Trash2, FileText, Loader2, MoreVertical } from "lucide-react";

export default function DocumentList() {
  const { workspaceId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  // Manual Modal State
  const [showModal, setShowModal] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/documents/workspaces/${workspaceId}/document/`);
      const data = Array.isArray(res.data) ? res.data : res.data.results;
      setDocuments(data || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchDocs();
  }, [workspaceId]);

  // 1. Manual Open Handler
  const openModal = () => {
    setShowModal(true);
    // Directly interact with the DOM to add Bootstrap classes
    const modal = document.getElementById('createDocModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      // Add backdrop manually
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      backdrop.id = 'modal-backdrop';
      document.body.appendChild(backdrop);
    }
  };

  // 2. Manual Close Handler
  const closeModal = () => {
    setShowModal(false);
    const modal = document.getElementById('createDocModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop) backdrop.remove();
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      // Send to Django
      await api.post(`/documents/workspaces/${workspaceId}/document/`, {
        title: newTitle,
        content: "",
        workspace: workspaceId 
      });

      setNewTitle("");
      await fetchDocs();
      closeModal(); // Close after success

    } catch (err) {
      alert("Backend Error: " + JSON.stringify(err.response?.data || "Server Error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <Loader2 className="spinner-border text-primary" />
    </div>
  );

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold m-0 text-dark">Documents</h4>
        <div className="d-flex gap-2">
          <Link to={`/workspace/${workspaceId}/trash`} className="btn btn-outline-danger btn-sm px-3">
            <Trash2 size={14} className="me-1" /> Trash
          </Link>   
          {/* NEW: OnClick Handler instead of data-attributes */}
          <button className="btn btn-primary btn-sm px-3" onClick={openModal}>
            <FilePlus size={14} className="me-1" /> New Document
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="row g-3">
        {documents.map(doc => (
          <div className="col-md-4 col-lg-3" key={doc.id}>
            <div className="card h-100 border shadow-sm border-0 bg-white">
              <div className="card-body p-4">
                <FileText className="text-primary mb-3" size={24} />
                <h6 className="card-title fw-bold text-truncate">{doc.title}</h6>
                <Link to={`/documents/${doc.id}`} className="btn btn-sm btn-dark w-100 mt-3">Open</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MANUAL MODAL */}
      <div 
        className={`modal fade ${showModal ? 'show' : ''}`} 
        id="createDocModal" 
        style={{ display: showModal ? 'block' : 'none' }} 
        tabIndex="-1"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header">
              <h5 className="modal-title fw-bold">New Document</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body py-4">
                <label className="form-label small fw-bold text-muted">TITLE</label>
                <input 
                  className="form-control bg-light border-0 shadow-none" 
                  placeholder="Enter title..." 
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}