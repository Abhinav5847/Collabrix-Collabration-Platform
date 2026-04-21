import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { Save, ArrowLeft, Trash } from "lucide-react";

export default function DocumentDetail() {
  const { pk } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState({ title: "", content: "" });
  const [saving, setSaving] = useState(false);

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
    <div className="vh-100 d-flex flex-column bg-white">
      <div className="border-bottom p-3 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-3 flex-grow-1">
          <button className="btn btn-sm btn-light" onClick={() => navigate(-1)}><ArrowLeft size={16}/></button>
          <input 
            className="form-control form-control-lg border-0 fw-bold p-0 shadow-none"
            value={doc.title}
            onChange={(e) => setDoc({...doc, title: e.target.value})}
            onBlur={handleUpdate}
          />
        </div>
        <div className="d-flex align-items-center gap-3">
          <small className="text-muted">{saving ? "Saving..." : "Saved"}</small>
          <button className="btn btn-sm btn-outline-danger border-0" onClick={handleSoftDelete}><Trash size={16}/></button>
        </div>
      </div>
      <textarea 
        className="form-control border-0 flex-grow-1 p-4 shadow-none"
        style={{ resize: 'none', fontSize: '1.1rem' }}
        value={doc.content}
        onChange={(e) => setDoc({...doc, content: e.target.value})}
        onBlur={handleUpdate}
        placeholder="Write content here..."
      />
    </div>
  );
}