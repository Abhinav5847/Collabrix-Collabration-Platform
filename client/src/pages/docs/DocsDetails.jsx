import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { api } from "../../services/api";
import Swal from "sweetalert2";
import {
  ArrowLeft, X, Sparkles, Loader2, Trash2, FileText, Download
} from "lucide-react";
import CollabrixChat from "../ai/aiChatBot"; 

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});

export default function DocumentDetail() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const user = useSelector((state) => state.auth.user);
  const currentUserId = user?.id || user?.user_id || user?.pk;

  // Local document state
  const [doc, setDoc] = useState({ title: "", content: "", workspace: "", pdf_file: null, is_exporting: false, updated_at: "" });
  
  // Independent UI Operation States
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Fetch document meta
  useEffect(() => {
    const fetchDoc = () => {
      api.get(`/documents/documents/${pk}/`)
        .then(res => setDoc(res.data))
        .catch(() => Toast.fire({ icon: 'error', title: 'Failed to load document' }));
    };
    fetchDoc();
  }, [pk]);

  // Collaborative WebSocket session handler
  useEffect(() => {
    if (!pk || !currentUserId) return;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://127.0.0.1:4000/ws/document/${pk}/`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    socket.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (String(data.sender_id) !== String(currentUserId)) {
        isRemoteUpdate.current = true;
        setDoc(prev => ({
          ...prev,
          title: data.title ?? prev.title,
          content: data.content ?? prev.content
        }));
      }
    };
    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [pk, currentUserId]);

  // Debounced auto-save sequence
  useEffect(() => {
    if (!doc.title && !doc.content) return;
    if (!isRemoteUpdate.current && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        title: doc.title,
        content: doc.content,
        sender_id: currentUserId
      }));
    }
    isRemoteUpdate.current = false;
    const MathAutoSaveDelay = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(MathAutoSaveDelay);
  }, [doc.title, doc.content, currentUserId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/documents/documents/${pk}/`, {
        title: doc.title,
        content: doc.content,
        workspace: doc.workspace
      });
    } catch (err) { 
      console.error("Save error:", err); 
    } finally { 
      setSaving(false); 
    }
  };

  // Fixed decoupled PDF Export Handler with Flat Polling Lookups
  const handleExportPDF = async () => {
    if (exporting) return;

    setExporting(true);
    let attemptCounter = 0;
    const maximumAttempts = 30; 
    const pollIntervalTime = 3000;
    
    // Create a benchmark timestamp to identify the *new* file drop cleanly
    const exportSessionToken = new Date().getTime();

    try {
      // 1. Fire generation sequence
      // Note: If you encounter a 404 error here, change this URL string directly to: `/documents/documents/${pk}/export-pdf/`
      await api.post(`/documents/${pk}/export-pdf/`);
      
      Toast.fire({ 
        icon: 'info', 
        title: 'PDF Generation Started', 
        text: 'Compiling document layout...',
        timer: 2000
      });

      // 2. Open tracking interval routine
      const pollingTracker = setInterval(async () => {
        attemptCounter++;

        if (attemptCounter > maximumAttempts) {
          clearInterval(pollingTracker);
          setExporting(false);
          Toast.fire({ icon: 'error', title: 'Export timed out', text: 'Please try again.' });
          return;
        }

        try {
          const checkResponse = await api.get(`/documents/documents/${pk}/`);
          const technicalData = checkResponse.data;

          // Compute if the database instance record update occurred AFTER we hit the export button
          const backendLastUpdate = new Date(technicalData.updated_at || new Date()).getTime();
          const isFreshFile = backendLastUpdate > exportSessionToken || !doc.pdf_file;

          // Resolve on structural completion flag from Django backend pipeline
          if (technicalData.is_exporting === false && technicalData.pdf_file && isFreshFile) {
            clearInterval(pollingTracker);
            setDoc(technicalData);
            setExporting(false);

            Toast.fire({ icon: 'success', title: 'Download ready!' });

            const fileUrl = typeof technicalData.pdf_file === 'string' 
              ? technicalData.pdf_file 
              : technicalData.pdf_file?.url;

            if (fileUrl) {
              const downloadLink = document.createElement("a");
              downloadLink.href = fileUrl;
              downloadLink.target = "_blank";
              downloadLink.rel = "noreferrer";
              const baseName = fileUrl.split('/').pop() || `Exported_Document_${pk}.pdf`;
              downloadLink.setAttribute("download", baseName);
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
            }
          }
        } catch (pollError) {
          console.error("Error monitoring export tracking routine:", pollError);
        }
      }, pollIntervalTime);

    } catch (err) {
      console.error("Export trigger failed:", err);
      Toast.fire({ icon: 'error', title: 'Export failed', text: 'Could not initiate PDF generation.' });
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Move to Trash?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, move it'
    });
    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await api.delete(`/documents/documents/${pk}/`);
        navigate(-1);
      } catch (err) {
        Toast.fire({ icon: 'error', title: 'Delete failed' });
      } finally { setDeleting(false); }
    }
  };

  return (
    <div className="cbx-root">
      {/* ── TOPBAR ── */}
      <header className="cbx-topbar">
        <div className="cbx-topbar-left">
          <button className="cbx-icon-btn" onClick={() => navigate(-1)} title="Go back">
            <ArrowLeft size={16} />
          </button>
          <div className="cbx-breadcrumb">
            <span className="cbx-brand">Collabrix</span>
            <span className="cbx-chevron">/</span>
            <input
              className="cbx-title-input"
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              placeholder="Untitled document"
            />
          </div>
        </div>

        <div className="cbx-topbar-right">
          {saving && (
            <span className="cbx-sync-pill">
              <Loader2 size={11} className="cbx-spin" /> Syncing
            </span>
          )}

          {doc.pdf_file && (
            <a 
              href={typeof doc.pdf_file === 'string' ? doc.pdf_file : doc.pdf_file?.url} 
              target="_blank" 
              rel="noreferrer" 
              className="cbx-action-btn cbx-action-btn--success" 
              title="Download PDF"
            >
              <Download size={14} />
            </a>
          )}

          <button 
            className="cbx-action-btn" 
            onClick={handleExportPDF} 
            disabled={exporting} 
            title="Export PDF"
          >
            {exporting ? (
              <>
                <Loader2 size={14} className="cbx-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileText size={14} />
                <span>Export</span>
              </>
            )}
          </button>

          <button className="cbx-action-btn cbx-action-btn--danger" onClick={handleDelete} disabled={deleting} title="Delete">
            <Trash2 size={14} />
          </button>

          <button
            className={`cbx-ai-toggle ${isChatOpen ? 'cbx-ai-toggle--active' : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <Sparkles size={14} />
            <span>AI</span>
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="cbx-main">
        {/* EDITOR */}
        <div className="cbx-editor-wrap">
          <div className="cbx-page">
            <div className="cbx-page-header">
              <div className="cbx-page-icon">📄</div>
              <input
                className="cbx-page-title"
                value={doc.title}
                onChange={(e) => setDoc({ ...doc, title: e.target.value })}
                placeholder="Untitled"
              />
            </div>
            <textarea
              className="cbx-editor"
              value={doc.content}
              onChange={(e) => setDoc({ ...doc, content: e.target.value })}
              placeholder="Start writing… press / for commands"
            />
          </div>
        </div>

        {/* AI CHAT PANEL */}
        {isChatOpen && (
          <aside className="cbx-chat" style={{ position: 'relative' }}>
            <button 
              className="cbx-icon-btn cbx-icon-btn--sm" 
              onClick={() => setIsChatOpen(false)}
              style={{ position: 'absolute', top: '12px', right: '14px', zIndex: 10 }}
            >
              <X size={14} />
            </button>
            
            <CollabrixChat 
              docId={pk} 
              workspaceId={doc.workspace} 
              userId={currentUserId} 
            />
          </aside>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cbx-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #f7f6f3;
          font-family: 'DM Sans', sans-serif;
          color: #1a1a1a;
          overflow: hidden;
        }

        .cbx-topbar {
          height: 52px;
          background: #ffffff;
          border-bottom: 1px solid #e8e6e0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          gap: 12px;
          flex-shrink: 0;
          z-index: 50;
        }
        .cbx-topbar-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
        .cbx-breadcrumb { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1; }
        .cbx-brand { font-size: 13px; font-weight: 600; color: #6e6a63; white-space: nowrap; letter-spacing: 0.01em; }
        .cbx-chevron { color: #c5c1b9; font-size: 13px; flex-shrink: 0; }
        .cbx-title-input {
          border: none; background: transparent; outline: none; font-size: 14px; font-weight: 500;
          color: #1a1a1a; font-family: 'DM Sans', sans-serif; min-width: 0; flex: 1; padding: 4px 6px;
          border-radius: 4px; transition: background 0.15s;
        }
        .cbx-title-input:hover { background: #f0ede8; }
        .cbx-title-input:focus { background: #ebe8e2; }
        .cbx-title-input::placeholder { color: #c5c1b9; }

        .cbx-topbar-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .cbx-icon-btn {
          width: 30px; height: 30px; border-radius: 6px; border: none; background: transparent;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #6e6a63; transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .cbx-icon-btn:hover { background: #f0ede8; color: #1a1a1a; }
        .cbx-icon-btn--sm { width: 24px; height: 24px; }

        .cbx-sync-pill {
          display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9e9a93;
          background: #f7f6f3; border: 1px solid #e8e6e0; border-radius: 20px; padding: 3px 10px; white-space: nowrap;
        }

        .cbx-action-btn {
          display: flex; align-items: center; gap: 5px; height: 30px; padding: 0 10px;
          border-radius: 6px; border: 1px solid #e8e6e0; background: #ffffff; font-size: 12px;
          font-weight: 500; color: #3d3d3d; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: background 0.15s, border-color 0.15s; text-decoration: none;
        }
        .cbx-action-btn:hover:not(:disabled) { background: #f7f6f3; border-color: #ccc9c2; }
        .cbx-action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .cbx-action-btn--success { color: #1d7a5a; border-color: #9fe1cb; background: #f0faf6; }
        .cbx-action-btn--success:hover { background: #e1f5ee; }
        .cbx-action-btn--danger { color: #c0392b; border-color: #f5c4b3; }
        .cbx-action-btn--danger:hover:not(:disabled) { background: #fff5f3; border-color: #f0997b; }

        .cbx-ai-toggle {
          display: flex; align-items: center; gap: 5px; height: 30px; padding: 0 12px;
          border-radius: 20px; border: 1px solid #e8e6e0; background: #ffffff; font-size: 12px;
          font-weight: 600; color: #3d3d3d; cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s; letter-spacing: 0.02em;
        }
        .cbx-ai-toggle:hover { background: #f0ede8; }
        .cbx-ai-toggle--active { background: #1a1a1a; border-color: #1a1a1a; color: #ffffff; }
        .cbx-ai-toggle--active:hover { background: #2d2d2d; }

        .cbx-main { display: flex; flex: 1; overflow: hidden; }

        .cbx-editor-wrap { flex: 1; overflow-y: auto; padding: 48px 24px; display: flex; justify-content: center; }
        .cbx-editor-wrap::-webkit-scrollbar { width: 6px; }
        .cbx-editor-wrap::-webkit-scrollbar-thumb { background: #dbd8d1; border-radius: 3px; }

        .cbx-page {
          width: 100%; max-width: 720px; background: #ffffff; border: 1px solid #e8e6e0;
          border-radius: 12px; padding: 56px 72px; min-height: 85vh; display: flex;
          flex-direction: column; gap: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .cbx-page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding-bottom: 16px; border-bottom: 1px solid #f0ede8; }
        .cbx-page-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
        .cbx-page-title {
          border: none; outline: none; background: transparent; font-family: 'DM Serif Display', serif;
          font-size: 32px; color: #1a1a1a; width: 100%; line-height: 1.2; padding: 0;
        }
        .cbx-page-title::placeholder { color: #d4d0c8; }

        .cbx-editor {
          flex: 1; border: none; outline: none; resize: none; font-family: 'DM Sans', sans-serif;
          font-size: 15.5px; line-height: 1.85; color: #2d2d2d; background: transparent;
          padding: 20px 0 0 0; min-height: 60vh; width: 100%;
        }
        .cbx-editor::placeholder { color: #ccc9c2; }

        .cbx-chat { width: 360px; flex-shrink: 0; background: #ffffff; border-left: 1px solid #e8e6e0; display: flex; flex-direction: column; overflow: hidden; }
        .cbx-spin { animation: cbxSpin 1s linear infinite; display: inline-block; }
        @keyframes cbxSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}