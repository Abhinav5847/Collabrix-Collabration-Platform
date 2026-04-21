import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { ArrowLeft, Trash, MessageSquare, X, PanelRightClose, PanelRightOpen } from "lucide-react";
import CollabrixChat from "../ai/aiChatBot";

export default function DocumentDetail() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    api.get(`/documents/documents/${pk}/`).then(res => setDoc(res.data));
  }, [pk]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/documents/documents/${pk}/`, doc);
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

  return (
    <div className="vh-100 d-flex flex-column bg-white overflow-hidden">

      {/* TOP BAR */}
      <div className="border-bottom px-3 d-flex align-items-center justify-content-between bg-white" style={{ height: 56 }}>
        
        <div className="d-flex align-items-center gap-2 flex-grow-1 min-w-0">
          <button className="btn btn-sm btn-light rounded-circle border-0 flex-shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </button>

          <input
            className="form-control border-0 shadow-none bg-transparent fw-semibold p-1 text-truncate"
            style={{ fontSize: "1.05rem" }}
            value={doc.title}
            onChange={(e) => setDoc({ ...doc, title: e.target.value })}
            onBlur={handleUpdate}
            placeholder="Untitled Document"
          />
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {saving ? (
            <span className="badge text-secondary bg-light border fw-normal px-2 py-1" style={{ fontSize: "0.72rem" }}>
              <span className="spinner-border spinner-border-sm me-1" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
              Saving
            </span>
          ) : (
            <span className="badge bg-success-subtle text-success fw-normal px-2 py-1" style={{ fontSize: "0.72rem" }}>
              ✓ Saved
            </span>
          )}

          <div className="vr mx-1" />

          <button
            className={`btn btn-sm border-0 ${isChatOpen ? "btn-primary" : "btn-light"}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="Toggle AI Assistant"
          >
            {isChatOpen ? <PanelRightClose size={16} /> : <MessageSquare size={16} />}
          </button>

          <button className="btn btn-sm btn-light border-0" onClick={handleSoftDelete} title="Move to trash">
            <Trash size={16} className="text-danger" />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="d-flex flex-grow-1 overflow-hidden">

        {/* EDITOR */}
        <div className="flex-grow-1 overflow-auto bg-light p-4 d-flex justify-content-center">
          <div className="bg-white rounded-3 shadow-sm p-5 w-100" style={{ maxWidth: 780, minHeight: "100%" }}>
            <textarea
              className="form-control border-0 shadow-none p-0 w-100 h-100"
              style={{ resize: "none", fontSize: "1rem", lineHeight: "1.75", minHeight: "75vh", color: "#2c2c2c" }}
              value={doc.content}
              onChange={(e) => setDoc({ ...doc, content: e.target.value })}
              onBlur={handleUpdate}
              placeholder="Start writing…"
            />
          </div>
        </div>

        {/* CHAT SIDEBAR */}
        {isChatOpen && (
          <div className="border-start bg-white d-flex flex-column" style={{ width: 360 }}>
            <div className="px-3 border-bottom d-flex align-items-center justify-content-between" style={{ height: 48 }}>
              <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>AI Assistant</span>
              <button className="btn btn-sm btn-light border-0" onClick={() => setIsChatOpen(false)}>
                <X size={15} />
              </button>
            </div>
            <div className="flex-grow-1 overflow-hidden d-flex flex-column">
              <CollabrixChat documentContext={doc.content} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}