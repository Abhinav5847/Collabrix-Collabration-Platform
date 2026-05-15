import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Import useSelector
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
  
  // FIX: Get User ID from Redux Auth Slice instead of localStorage
  const user = useSelector((state) => state.auth.user);
  const currentUserId = user?.id || user?.user_id || user?.pk;

  const [doc, setDoc] = useState({ title: "", content: "", workspace: "", is_exporting: false, pdf_file: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // 1. INITIAL LOAD (Document Metadata)
  useEffect(() => {
    const fetchDoc = () => {
      api.get(`/documents/documents/${pk}/`)
        .then(res => setDoc(res.data))
        .catch(() => Toast.fire({ icon: 'error', title: 'Failed to load document' }));
    };
    fetchDoc();
  }, [pk]);

  // 2. ISOLATED HISTORY LOAD
  useEffect(() => {
    const loadSavedHistory = async () => {
      // If Redux hasn't loaded the user yet, we wait
      if (!pk || !currentUserId) return;
      
      try {
        setChatLoading(true);
        const res = await aiApi.get(`history/${pk}`, {
          params: { user_id: currentUserId } 
        });

        if (res.data?.history) {
          const recent = res.data.history.map(item => ({
            role: item.role,
            text: item.content
          }));
          setMessages(recent);
        } else {
          setMessages([]); 
        }
      } catch (err) {
        console.error("Failed to load isolated history:", err);
        setMessages([]); 
      } finally {
        setChatLoading(false);
      }
    };
    loadSavedHistory();
  }, [pk, currentUserId]); 

  // 3. WEBSOCKET SYNC
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

  // 4. AUTO-SAVE & BROADCAST
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
  }, [doc.title, doc.content, currentUserId]);

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

  // 5. CHAT SEND LOGIC
  const sendChatMessage = async (e) => {
    e.preventDefault();
    const cleanMsg = chatInput.trim();
    if (!cleanMsg || chatLoading) return;

    if (!currentUserId) {
        Toast.fire({ icon: 'error', title: 'User session not found. Please log in.' });
        return;
    }

    setMessages(prev => [...prev, { role: "user", text: cleanMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await aiApi.post("chat", {
        message: cleanMsg,
        doc_id: String(pk),
        workspace_id: String(doc.workspace),
        user_id: String(currentUserId) 
      });
      
      setMessages(prev => [...prev, { role: "ai", text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ AI service unavailable." }]);
    } finally {
      setChatLoading(false);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  };

  // 6. UI ACTIONS
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await api.post(`/documents/${pk}/export-pdf/`);
      Toast.fire({ icon: 'success', title: 'PDF Generation Started' });
    } catch (err) {
      Toast.fire({ icon: 'error', title: 'Export failed' });
    } finally { setExporting(false); }
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
             <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
              <span className="fw-bold text-primary d-flex align-items-center gap-2">
                <MessageSquare size={18}/>AI Assistant
              </span>
              <button className="btn btn-sm p-0" onClick={() => setIsChatOpen(false)}><X size={20}/></button>
            </div>
            
            <div ref={scrollRef} className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 bg-light">
              {messages.length === 0 && !chatLoading && (
                <div className="text-center text-muted my-auto small">Ask a question about this document</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`p-3 rounded-4 shadow-sm ${m.role === 'user' ? 'bg-primary text-white ms-auto' : 'bg-white border text-dark'}`} style={{ maxWidth: '85%', fontSize: '0.9rem' }}>
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className="d-flex align-items-center gap-2 text-primary small p-2">
                   <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              )}
            </div>

            <form onSubmit={sendChatMessage} className="p-3 border-top bg-white d-flex gap-2">
              <input 
                className="form-control rounded-pill px-3 shadow-none border-light-subtle" 
                placeholder="Message AI..." 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
              />
              <button className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center p-2" type="submit" disabled={chatLoading || !chatInput.trim()}>
                <Send size={18}/>
              </button>
            </form>
          </aside>
        )}
      </main>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; } 
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
      `}</style>
    </div>
  );
}