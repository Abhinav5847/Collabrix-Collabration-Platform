import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api"; // Your Django API
import axios from "axios"; // For AI Service
import { ArrowLeft, Trash, MessageSquare, X, Sparkles, Send, Loader2 } from "lucide-react";

export default function DocumentDetail() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "", workspace: "" });
  const [saving, setSaving] = useState(false);
  
  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    api.get(`/documents/documents/${pk}/`).then(res => setDoc(res.data));
  }, [pk]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/documents/documents/${pk}/`, doc);
      // Note: Django Signal triggers Celery task sync_document_to_qdrant automatically here
    } finally {
      setSaving(false);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", text: chatInput };
    setMessages([...messages, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await axios.post("http://localhost:8001/ai/chat", {
        message: chatInput,
        doc_id: pk,
        workspace_id: doc.workspace
      });
      setMessages(prev => [...prev, { role: "ai", text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "AI Service Error." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="vh-100 d-flex flex-column bg-white overflow-hidden">
      {/* Header */}
      <div className="border-bottom p-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-sm btn-light rounded-circle" onClick={() => navigate(-1)}><ArrowLeft size={18}/></button>
          <input className="form-control border-0 fw-bold fs-5 shadow-none" value={doc.title} onChange={(e) => setDoc({...doc, title: e.target.value})} onBlur={handleUpdate}/>
        </div>
        <div className="d-flex gap-2">
          <small className="text-muted mt-2">{saving ? "Syncing AI..." : "Ready"}</small>
          <button className={`btn btn-sm ${isChatOpen ? 'btn-primary' : 'btn-outline-dark'}`} onClick={() => setIsChatOpen(!isChatOpen)}><Sparkles size={16} /> AI</button>
        </div>
      </div>

      {/* Main Body */}
      <div className="d-flex flex-grow-1 overflow-hidden">
        <div className="flex-grow-1 p-5 overflow-auto bg-light">
          <textarea className="form-control border-0 shadow-none bg-white p-5 mx-auto rounded-3" style={{ maxWidth: '800px', minHeight: '80vh', fontSize: '1.1rem' }} value={doc.content} onChange={(e) => setDoc({...doc, content: e.target.value})} onBlur={handleUpdate} placeholder="Start writing..."/>
        </div>

        {/* AI Sidebar */}
        {isChatOpen && (
          <div className="border-start bg-white d-flex flex-column shadow-sm" style={{ width: '400px' }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <span className="fw-bold"><Sparkles size={16} className="text-primary me-2"/>AI Assistant</span>
              <button className="btn btn-sm text-muted" onClick={() => setIsChatOpen(false)}><X size={18}/></button>
            </div>
            <div className="flex-grow-1 p-3 overflow-auto">
              {messages.map((m, i) => (
                <div key={i} className={`mb-3 p-2 rounded-3 ${m.role === 'user' ? 'bg-light text-end' : 'bg-primary bg-opacity-10'}`}>
                  <small className="fw-bold d-block mb-1">{m.role.toUpperCase()}</small>
                  {m.text}
                </div>
              ))}
              {chatLoading && <Loader2 className="spinner-border spinner-border-sm text-primary animate-spin" />}
            </div>
            <form onSubmit={sendChatMessage} className="p-3 border-top">
              <div className="input-group">
                <input className="form-control border-0 bg-light" placeholder="Ask about this doc..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                <button className="btn btn-primary" type="submit"><Send size={16}/></button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}