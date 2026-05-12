import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api"; 
import { aiApi } from "../../services/aiApi"; 
import Swal from "sweetalert2"; // Import SweetAlert2
import { 
  ArrowLeft, X, Sparkles, Send, 
  Loader2, MessageSquare, Trash2 
} from "lucide-react";

// Configure the Global Toast Mixin
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

export default function DocumentDetail() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const [doc, setDoc] = useState({ title: "", content: "", workspace: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // 1. LOAD DOCUMENT & RECENT HISTORY
  useEffect(() => {
    api.get(`/documents/documents/${pk}/`)
      .then(res => setDoc(res.data))
      .catch(err => {
        console.error("Document Load Error", err);
        Toast.fire({ icon: 'error', title: 'Failed to load document' });
      });

    const loadRecentHistory = async () => {
      try {
        setHistoryLoading(true);
        const res = await aiApi.get(`history/${pk}`);
        if (res.data.history) {
          const recentMessages = res.data.history.slice(-6); 
          const formatted = recentMessages.map(m => ({
            role: m.role,
            text: m.content 
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error("AI History Load Error", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (pk) loadRecentHistory();
  }, [pk]);

  // 2. AUTO-SCROLL
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  // 3. AUTO-SAVE
  useEffect(() => {
    if (!doc.title && !doc.content) return;
    const delayDebounceFn = setTimeout(() => { handleUpdate(); }, 1500);
    return () => clearTimeout(delayDebounceFn);
  }, [doc.title, doc.content]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/documents/documents/${pk}/`, {
        title: doc.title,
        content: doc.content,
        workspace: doc.workspace
      });
    } catch (err) {
      console.error("Auto-save failed", err);
      Toast.fire({ icon: 'error', title: 'Connection error: Auto-save failed' });
    } finally {
      setSaving(false);
    }
  };

  // DELETE WITH SWEETALERT CONFIRMATION & TOAST
  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Delete Document?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      background: '#fff',
      customClass: {
        popup: 'rounded-4 shadow-sm',
        confirmButton: 'btn btn-danger px-4 rounded-pill',
        cancelButton: 'btn btn-light px-4 rounded-pill'
      }
    });

    if (result.isConfirmed) {
      setDeleting(true);
      try {
        await api.delete(`/documents/documents/${pk}/`);
        // Show success toast then navigate
        await Toast.fire({ icon: 'success', title: 'Document deleted' });
        navigate(-1);
      } catch (err) {
        console.error("Delete failed", err);
        Toast.fire({ icon: 'error', title: 'Failed to delete document' });
      } finally {
        setDeleting(false);
      }
    }
  };

  // 4. SEND MESSAGE
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: "user", text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    
    const currentInput = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await aiApi.post("chat", {
        message: currentInput,
        doc_id: String(pk),
        workspace_id: String(doc.workspace)
      });
      setMessages(prev => [...prev, { role: "ai", text: res.data.response }]);
    } catch (err) {
      console.error("Chat Error:", err);
      Toast.fire({ icon: 'warning', title: 'AI service is unreachable' });
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: "⚠️ Connection lost. AI Service might be restarting." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex flex-column bg-white overflow-hidden">
      {/* NAVBAR */}
      <header className="border-bottom px-3 d-flex align-items-center justify-content-between bg-white shadow-sm" style={{ height: 60, zIndex: 10 }}>
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <button className="btn btn-sm btn-light rounded-circle shadow-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={18}/>
          </button>
          <input 
            className="form-control border-0 fw-bold fs-5 shadow-none p-0 bg-transparent" 
            value={doc.title} 
            onChange={(e) => setDoc({...doc, title: e.target.value})} 
            placeholder="Untitled Document"
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          {saving && (
            <div className="d-flex align-items-center text-muted small animate-pulse me-2">
               <Loader2 size={14} className="animate-spin me-1" /> Saving...
            </div>
          )}

          <button 
            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-2 px-3 rounded-pill"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="fw-medium">Delete</span>
          </button>

          <button 
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 rounded-pill transition-all ${isChatOpen ? 'btn-primary' : 'btn-outline-primary'}`} 
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <Sparkles size={16} /> 
            <span className="fw-medium">AI Assistant</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="d-flex flex-grow-1 overflow-hidden bg-light">
        <div className="flex-grow-1 p-4 overflow-auto">
          <div className="mx-auto shadow-sm bg-white rounded-4 border" style={{ maxWidth: '850px', minHeight: '100%' }}>
            <textarea 
              className="form-control border-0 shadow-none p-5 rounded-4" 
              style={{ minHeight: '80vh', fontSize: '1.1rem', lineHeight: '1.8', resize: 'none' }} 
              value={doc.content} 
              onChange={(e) => setDoc({...doc, content: e.target.value})} 
              placeholder="Start writing your thoughts..."
            />
          </div>
        </div>

        {isChatOpen && (
          <aside className="border-start bg-white d-flex flex-column shadow-lg" style={{ width: '400px' }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-white">
              <div className="d-flex align-items-center gap-2 text-primary fw-bold">
                <MessageSquare size={20} />
                <span>Chat History (Recent)</span>
              </div>
              <button className="btn btn-sm hover-bg-light rounded-circle" onClick={() => setIsChatOpen(false)}>
                <X size={20}/>
              </button>
            </div>

            <div ref={scrollRef} className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 bg-light/30">
              {historyLoading ? (
                <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                    <Loader2 className="animate-spin mb-2" size={24} />
                    <span className="small">Retrieving memory...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center mt-5 px-4 text-muted">
                  <Sparkles size={32} className="mb-3 opacity-20 mx-auto" />
                  <p className="small">No recent messages. Start a conversation about your document!</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`d-flex flex-column ${m.role === 'user' ? 'align-items-end' : 'align-items-start'}`}>
                    <div className={`p-3 rounded-4 shadow-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '85%', fontSize: '0.92rem' }}>
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="d-flex align-items-center gap-2 text-primary small p-2 bg-primary/5 rounded-3 w-fit">
                    <Loader2 size={14} className="animate-spin" /> 
                    <span className="fw-medium">AI is thinking...</span>
                </div>
              )}
            </div>

            <div className="p-3 border-top bg-white">
              <form onSubmit={sendChatMessage} className="d-flex gap-2 bg-light p-1 rounded-pill border focus-within-ring">
                <input 
                  className="form-control border-0 bg-transparent shadow-none px-3 py-2" 
                  placeholder="Type a message..." 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                />
                <button 
                  className="btn btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0" 
                  style={{width: '38px', height: '38px'}}
                  type="submit" 
                  disabled={chatLoading || !chatInput.trim()}
                >
                  <Send size={18}/>
                </button>
              </form>
            </div>
          </aside>
        )}
      </main>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        .focus-within-ring:focus-within { border-color: var(--bs-primary) !important; box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15); }
        .w-fit { width: fit-content; }
        .swal2-toast { padding: 0.5rem 1rem !important; }
      `}</style>
    </div>
  );
}