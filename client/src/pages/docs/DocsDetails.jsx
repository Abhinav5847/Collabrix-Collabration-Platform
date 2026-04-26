import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import axios from "axios"; 
import { 
  ArrowLeft, Trash, X, Sparkles, Send, 
  Loader2, PanelRightClose, MessageSquare 
} from "lucide-react";

export default function DocumentDetail() {
  const { pk } = useParams();
  const navigate = useNavigate();
  
  // Clean State
  const [doc, setDoc] = useState({ title: "", content: "", workspace: "" });
  const [saving, setSaving] = useState(false);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // --- THE CRITICAL FIX ---
  // We point to the Gateway (Port 80) instead of the internal port 8001.
  const AI_SERVICE_URL = "http://localhost/ai/chat";

  // Ref for Auto-save (Prevents stale state issues)
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);

  // Load Document
  useEffect(() => {
    api.get(`/documents/documents/${pk}/`).then(res => setDoc(res.data));
  }, [pk]);

  // Auto-save Logic (Saves 1.5 seconds after you stop typing)
  useEffect(() => {
    if (!doc.title && !doc.content) return;
    const delayDebounceFn = setTimeout(() => {
      handleUpdate();
    }, 1500);
    return () => clearTimeout(delayDebounceFn);
  }, [doc.title, doc.content]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/documents/documents/${pk}/`, docRef.current);
    } catch (err) {
      console.error("Auto-save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!window.confirm("Move to trash?")) return;
    await api.delete(`/documents/documents/${pk}/`);
    navigate(-1);
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", text: chatInput };
    setMessages([...messages, userMsg]);
    const currentInput = chatInput; // Capture current input
    setChatInput("");
    setChatLoading(true);

    try {
      // FIXED: URL changed from http://localhost:8001/ai/chat to AI_SERVICE_URL (Port 80)
      const res = await axios.post(AI_SERVICE_URL, {
        message: currentInput,
        doc_id: pk,
        workspace_id: String(doc.workspace) // Ensure workspace_id is sent as a string
      });
      
      setMessages(prev => [...prev, { role: "ai", text: res.data.response }]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      setMessages(prev => [...prev, { role: "ai", text: `⚠️ Error: ${err.response?.data?.detail || "AI Service unreachable."}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex flex-column bg-white overflow-hidden">
      {/* HEADER / TOP BAR */}
      <div className="border-bottom px-3 d-flex align-items-center justify-content-between bg-white" style={{ height: 60 }}>
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <button className="btn btn-sm btn-light rounded-circle" onClick={() => navigate(-1)}>
            <ArrowLeft size={18}/>
          </button>
          <input 
            className="form-control border-0 fw-bold fs-5 shadow-none p-0" 
            value={doc.title} 
            onChange={(e) => setDoc({...doc, title: e.target.value})} 
            placeholder="Untitled Document"
          />
        </div>

        <div className="d-flex align-items-center gap-2">
          <small className="text-muted">
            {saving ? (
              <span className="d-flex align-items-center gap-1">
                <Loader2 size={14} className="animate-spin" /> Syncing...
              </span>
            ) : "Ready"}
          </small>
          
          <div className="vr mx-2" style={{ height: 20 }}></div>

          <button 
            className={`btn btn-sm ${isChatOpen ? 'btn-primary' : 'btn-light'}`} 
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <Sparkles size={16} className="me-1" /> AI
          </button>

          <button className="btn btn-sm btn-light text-danger" onClick={handleSoftDelete}>
            <Trash size={16} />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        
        {/* TEXT EDITOR */}
        <div className="flex-grow-1 p-4 p-md-5 overflow-auto bg-light d-flex justify-content-center">
          <textarea 
            className="form-control border-0 shadow-sm bg-white p-5 rounded-3" 
            style={{ maxWidth: '800px', minHeight: '80vh', fontSize: '1.1rem', lineHeight: '1.6', outline: 'none', resize: 'none' }} 
            value={doc.content} 
            onChange={(e) => setDoc({...doc, content: e.target.value})} 
            placeholder="Start writing..."
          />
        </div>

        {/* AI SIDEBAR */}
        {isChatOpen && (
          <div className="border-start bg-white d-flex flex-column shadow-sm" style={{ width: '380px' }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
              <span className="fw-bold d-flex align-items-center gap-2">
                <Sparkles size={16} className="text-primary"/> AI Assistant
              </span>
              <button className="btn btn-sm text-muted" onClick={() => setIsChatOpen(false)}>
                <X size={18}/>
              </button>
            </div>

            <div className="flex-grow-1 p-3 overflow-auto">
              {messages.map((m, i) => (
                <div key={i} className={`mb-3 p-3 rounded-3 ${m.role === 'user' ? 'bg-light text-dark ms-4 border' : 'bg-primary bg-opacity-10 me-4'}`}>
                  <small className="fw-bold d-block mb-1 text-uppercase" style={{ fontSize: '0.7rem' }}>{m.role}</small>
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className="d-flex align-items-center gap-2 m-2 text-muted italic" style={{ fontSize: '13px' }}>
                  <Loader2 className="animate-spin text-primary" size={18} /> 
                  Thinking...
                </div>
              )}
            </div>

            <form onSubmit={sendChatMessage} className="p-3 border-top">
              <div className="input-group bg-light rounded-3 overflow-hidden">
                <input 
                  className="form-control border-0 bg-transparent py-2 shadow-none" 
                  placeholder="Ask about this doc..." 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                />
                <button className="btn text-primary border-0" type="submit" disabled={chatLoading || !chatInput.trim()}>
                  <Send size={18}/>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}