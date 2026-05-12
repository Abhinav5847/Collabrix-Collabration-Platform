import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useParams, Link } from "react-router-dom";
import { FilePlus, Trash2, FileText, X } from "lucide-react";

/* ─── Brand Tokens ───────────────────────────────────────────────────────── */
const t = {
  navy:      "#0B1120",
  indigo:    "#4F6EF7",
  indigoBg:  "#EEF1FF",
  indigoHov: "#3D5CE8",
  surface:   "#FFFFFF",
  bg:        "#F4F6FB",
  border:    "#E4E7F0",
  text:      "#1A2236",
  textSoft:  "#4B5568",
  muted:     "#8A94A6",
  danger:    "#E53E3E",
  dangerBg:  "#FFF5F5",
};

export default function DocumentList() {
  const { workspaceId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTitle, setNewTitle]   = useState("");
  const [showModal, setShowModal] = useState(false);
  const [focused, setFocused]     = useState(false);
  const [hovCard, setHovCard]     = useState(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res  = await api.get(`/documents/workspaces/${workspaceId}/document/`);
      const data = Array.isArray(res.data) ? res.data : res.data.results;
      setDocuments(data || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (workspaceId) fetchDocs(); }, [workspaceId]);

  /* ── Modal helpers (React-based Fix) ── */
  const openModal = () => {
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setNewTitle("");
    document.body.style.overflow = 'unset';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/documents/workspaces/${workspaceId}/document/`, {
        title: newTitle, content: "", workspace: workspaceId,
      });
      setNewTitle("");
      await fetchDocs();
      closeModal();
    } catch (err) {
      alert("Backend Error: " + JSON.stringify(err.response?.data || "Server Error"));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 26, height: 26, border: `2.5px solid ${t.indigoBg}`, borderTopColor: t.indigo, borderRadius: '50%', animation: 'spin .75s linear infinite' }} />
      <span style={{ fontSize: 13, color: t.muted }}>Loading documents…</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .doc-input:focus { outline: none; }
        .open-btn:hover { background: #1A2236 !important; }
        .trash-btn:hover { background: ${t.dangerBg} !important; color: ${t.danger} !important; border-color: ${t.danger} !important; }
        .new-btn:hover { background: ${t.indigoHov} !important; }
        .modal-submit:hover { background: ${t.indigoHov} !important; }
        .cancel-btn:hover { background: ${t.bg} !important; }
        
        /* Modal Animation Styles */
        .custom-backdrop {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(11, 17, 32, 0.4);
          backdrop-filter: blur(4px);
          z-index: 1040;
          animation: fadeIn 0.2s ease-out;
        }
        .custom-modal-container {
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          z-index: 1050;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${t.border}` }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: t.text, letterSpacing: '-0.4px' }}>Documents</h2>
          <p style={{ margin: 0, fontSize: 13, color: t.muted }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} in this workspace
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/workspace/${workspaceId}/trash`} className="trash-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 9,
            border: `1px solid ${t.border}`, background: t.surface,
            fontSize: 13, fontWeight: 600, color: t.textSoft,
            textDecoration: 'none', transition: 'all .15s',
          }}>
            <Trash2 size={14} /> Trash
          </Link>
          <button onClick={openModal} className="new-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 9,
            border: 'none', background: t.indigo,
            fontSize: 13, fontWeight: 600, color: '#fff',
            cursor: 'pointer', transition: 'background .15s',
          }}>
            <FilePlus size={14} /> New Document
          </button>
        </div>
      </div>

      {/* ── Empty State ── */}
      {documents.length === 0 && (
        <div style={{
          background: t.surface, borderRadius: 16,
          border: `1.5px dashed ${t.border}`,
          padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: t.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <FileText size={22} color={t.indigo} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: '0 0 5px' }}>No documents yet</p>
          <p style={{ fontSize: 13, color: t.muted, margin: '0 0 20px' }}>Create your first document to start collaborating</p>
          <button onClick={openModal} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10,
            border: 'none', background: t.indigo, color: '#fff',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          }}>
            <FilePlus size={14} /> New Document
          </button>
        </div>
      )}

      {/* ── Document Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {documents.map(doc => (
          <div
            key={doc.id}
            onMouseEnter={() => setHovCard(doc.id)}
            onMouseLeave={() => setHovCard(null)}
            style={{
              background: t.surface, borderRadius: 14,
              border: `1.5px solid ${hovCard === doc.id ? t.indigo + '55' : t.border}`,
              padding: '20px 20px 16px',
              display: 'flex', flexDirection: 'column',
              boxShadow: hovCard === doc.id ? `0 6px 24px rgba(79,110,247,0.1)` : '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'border-color .2s, box-shadow .2s',
            }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: t.indigoBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <FileText size={20} color={t.indigo} />
            </div>

            <p style={{
              margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: t.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
            }}>
              {doc.title}
            </p>

            {doc.updated_at && (
              <p style={{ margin: '0 0 14px', fontSize: 11.5, color: t.muted }}>
                {new Date(doc.updated_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}

            <Link to={`/documents/${doc.id}`} className="open-btn" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', borderRadius: 8,
              background: t.text, color: '#fff',
              textDecoration: 'none', fontSize: 13, fontWeight: 600,
              transition: 'background .15s', marginTop: 'auto',
            }}>
              Open →
            </Link>
          </div>
        ))}
      </div>

      {/* ── Create Document Modal (React Integrated) ── */}
      {showModal && (
        <>
          <div className="custom-backdrop" onClick={closeModal} />
          <div className="custom-modal-container">
            <div style={{
              background: t.surface, borderRadius: 20,
              boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
              overflow: 'hidden', border: 'none', width: '100%', maxWidth: '480px', margin: '20px',
              position: 'relative'
            }}>
              {/* Modal header */}
              <div style={{ padding: '22px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: t.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FilePlus size={17} color={t.indigo} />
                  </div>
                  <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: t.text }}>New Document</h5>
                </div>
                <button onClick={closeModal} style={{
                  width: 30, height: 30, borderRadius: 8,
                  border: `1px solid ${t.border}`, background: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: t.muted,
                }}><X size={14} /></button>
              </div>

              <form onSubmit={handleCreate}>
                <div style={{ padding: '20px 24px' }}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: t.textSoft, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Document Title
                  </label>
                  <input
                    className="doc-input"
                    style={{
                      display: 'block', width: '100%', boxSizing: 'border-box',
                      padding: '11px 14px', borderRadius: 9,
                      border: `1.5px solid ${focused ? t.indigo : t.border}`,
                      boxShadow: focused ? `0 0 0 3px ${t.indigoBg}` : 'none',
                      fontSize: 14, color: t.text, background: t.bg,
                      transition: 'border-color .15s, box-shadow .15s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    placeholder="Enter document title…"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoFocus
                  />
                </div>

                <div style={{ padding: '0 24px 22px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={closeModal} className="cancel-btn" style={{
                    padding: '9px 16px', borderRadius: 9,
                    border: `1px solid ${t.border}`, background: t.surface,
                    fontSize: 13.5, fontWeight: 600, color: t.textSoft,
                    cursor: 'pointer', transition: 'background .15s',
                  }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="modal-submit" style={{
                    padding: '9px 20px', borderRadius: 9,
                    border: 'none', background: t.indigo, color: '#fff',
                    fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                    opacity: submitting ? 0.75 : 1,
                    transition: 'background .15s',
                  }}>
                    {submitting ? "Creating…" : "Create Document"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}