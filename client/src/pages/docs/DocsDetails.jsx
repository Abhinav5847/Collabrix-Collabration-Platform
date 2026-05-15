import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api"; 
import { aiApi } from "../../services/aiApi"; 
import Swal from "sweetalert2"; 
import { 
  ArrowLeft, X, Sparkles, Send, 
  Loader2, MessageSquare, Trash2, FileText, Download 
} from "lucide-react";

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
  const scrollRef = useRef(null);
  const socketRef = useRef(null);
  const isRemoteUpdate = useRef(false);
  
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  const [doc, setDoc] = useState({ title: "", content: "", workspace: "", is_exporting: false, pdf_file: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // 1. INITIAL LOAD
  useEffect(() => {
    const fetchDoc = () => {
      api.get(`/documents/documents/${pk}/`)
        .then(res => setDoc(res.data))
        .catch(() => Toast.fire({ icon: 'error', title: 'Failed to load' }));
    };
    fetchDoc();
  }, [pk]);

  // 2. WEBSOCKET SYNC
  useEffect(() => {
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

  // 3. AUTO-SAVE & BROADCAST
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

    const delayDebounceFn = setTimeout(() => handleSave(), 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [doc.title, doc.content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/documents/documents/${pk}/`, {
        title: doc.title,
        content: doc.content,
        workspace: doc.workspace
      });
    } catch (err) { console.error("Save error"); }
    finally { setSaving(false); }
  };

  // 4. PDF EXPORT LOGIC
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await api.post(`/documents/documents/${pk}/export_pdf/`);
      Toast.fire({ icon: 'success', title: 'PDF Generation Started' });
      // Polling or waiting for update could go here
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  // 5. DELETE LOGIC
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
      } finally {
        setDeleting(false);
      }
    }
  };

  // 6. CHAT LOGIC
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: "user", text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await aiApi.post("chat", {
        message: chatInput,
        doc_id: String(pk),
        workspace_id: String(doc.workspace)
      });
      setMessages(prev => [...prev, { role: "ai", text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "AI unavailable." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex flex-column bg-white overflow-hidden">
      <header className="border-bottom px-3 d-flex align-items-center justify-content-between bg-white shadow-sm" style={{ height: 60 }}>
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <button className="btn btn-sm btn-light rounded-circle shadow-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18}/>
          </button>
          <input 
            className="form-control border-0 fw-bold fs-5 shadow-none p-0 bg-transparent" 
            value={doc.title} 
            onChange={(e) => setDoc({...doc, title: e.target.value})} 
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          {saving && <div className="text-muted small animate-pulse">Syncing...</div>}
          
          {/* PDF DOWNLOAD LINK IF EXISTS */}
          {doc.pdf_file && (
            <a href={doc.pdf_file} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill">
              <Download size={16} />
            </a>
          )}

          <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={handleExportPDF} disabled={exporting || doc.is_exporting}>
            {exporting || doc.is_exporting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          </button>

          <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={handleDelete} disabled={deleting}>
            <Trash2 size={16} />
          </button>

          <button className={`btn btn-sm rounded-pill ${isChatOpen ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setIsChatOpen(!isChatOpen)}>
            <Sparkles size={16} /> AI
          </button>
        </div>
      </header>

      <main className="d-flex flex-grow-1 overflow-hidden bg-light">
        <div className="flex-grow-1 p-4 overflow-auto">
          <div className="mx-auto shadow-sm bg-white rounded-4 border" style={{ maxWidth: '850px', minHeight: '100%' }}>
            <textarea 
              className="form-control border-0 shadow-none p-5 rounded-4" 
              style={{ minHeight: '80vh', fontSize: '1.1rem', lineHeight: '1.8', resize: 'none' }} 
              value={doc.content} 
              onChange={(e) => setDoc({...doc, content: e.target.value})} 
              placeholder="Start collaborating..."
            />
          </div>
        </div>

        {isChatOpen && (
          <aside className="border-start bg-white d-flex flex-column shadow-lg" style={{ width: '380px' }}>
             <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-bold text-primary"><MessageSquare size={18} className="me-2"/>AI Assistant</span>
              <button className="btn btn-sm" onClick={() => setIsChatOpen(false)}><X size={20}/></button>
            </div>
            <div ref={scrollRef} className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 bg-light">
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-4 shadow-sm ${m.role === 'user' ? 'bg-primary text-white ms-auto' : 'bg-white border'}`} style={{ maxWidth: '85%' }}>
                  {m.text}
                </div>
              ))}
              {chatLoading && <Loader2 className="animate-spin text-primary mx-auto" />}
            </div>
            <form onSubmit={sendChatMessage} className="p-3 border-top bg-white d-flex gap-2">
              <input className="form-control rounded-pill px-3" placeholder="Ask AI..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
              <button className="btn btn-primary rounded-circle" type="submit" disabled={chatLoading}><Send size={18}/></button>
            </form>
          </aside>
        )}
      </main>
      <style>{`.animate-spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}