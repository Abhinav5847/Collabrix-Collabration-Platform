import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { RefreshCcw, Trash2, ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

export default function TrashManager() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [trash, setTrash] = useState([]);

  const fetchTrash = async () => {
    const res = await api.get(`/documents/workspaces/${workspaceId}/trash/`);
    setTrash(Array.isArray(res.data) ? res.data : res.data.results || []);
  };

  useEffect(() => { fetchTrash(); }, []);

  const restore = async (id) => {
    await api.post(`/documents/documents/${id}/restore/`);
    fetchTrash();
  };

  const purge = async (id) => {
    if (!window.confirm("Permanent delete?")) return;
    await api.delete(`/documents/documents/${id}/permanent-delete/`);
    fetchTrash();
  };

  return (
    <div className="container py-4">
      <div className="d-flex align-items-center gap-3 mb-4">
        <button className="btn btn-sm btn-light" onClick={() => navigate(-1)}><ArrowLeft size={16}/></button>
        <h4 className="fw-bold m-0">Trash Bin</h4>
      </div>
      <div className="list-group shadow-sm">
        {trash.map(doc => (
          <div key={doc.id} className="list-group-item d-flex justify-content-between align-items-center p-3">
            <span>{doc.title}</span>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-success" onClick={() => restore(doc.id)}><RefreshCcw size={14}/> Restore</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => purge(doc.id)}><Trash2 size={14}/> Delete</button>
            </div>
          </div>
        ))}
        {trash.length === 0 && <div className="p-5 text-center text-muted">Trash is empty</div>}
      </div>
    </div>
  );
}