import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api'; 
import { FileText, Sparkles, MessageSquare, ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const MeetingSummaryList = () => {
  const { workspaceId, meetingId } = useParams();
  const navigate = useNavigate();
  
  const [meetings, setMeetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");

  // 1. Fetch all meetings for the workspace
  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      api.get(`workspaces/${workspaceId}/meetings/`)
        .then(res => {
          setMeetings(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching meetings:", err);
          toast.error("Could not load meetings.");
          setLoading(false);
        });
    }
  }, [workspaceId]);

  // 2. Handle selection logic based on URL meetingId
  useEffect(() => {
    if (meetingId && meetings.length > 0) {
      const found = meetings.find(m => m.id.toString() === meetingId.toString());
      if (found) {
        setSelected(found);
        setEditedSummary(found.summary || "");
      } else {
        toast.warn("Meeting summary not found.");
        navigate(`/workspace/${workspaceId}/summaries`);
      }
    } else {
      setSelected(null);
      setEditedSummary("");
    }
  }, [meetingId, meetings, workspaceId, navigate]);

  // 3. The PATCH Update Logic
  const handleUpdateSummary = async () => {
    if (!meetingId) return;
    
    setIsUpdating(true);
    try {
      const payload = { 
        summary: editedSummary,
        // We only send summary to be concise, assuming backend handles partial updates
      };

      const response = await api.patch(`workspaces/meetings/${meetingId}/update-summary/`, payload);
      
      if (response.status === 200 || response.data.status === 'updated') {
        // Update local meetings list so the change persists if user goes back to list
        setMeetings(prev => prev.map(m => 
          m.id.toString() === meetingId.toString() ? { ...m, summary: editedSummary } : m
        ));
        
        // Sync the current selection state
        setSelected(prev => ({ ...prev, summary: editedSummary }));
        
        toast.success("Summary updated successfully!");
      }
    } catch (err) {
      console.error("Update failed:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || "Failed to update summary.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW (When a meeting is selected) ---
  if (selected) return (
    <div className="p-4 p-md-5 animate__animated animate__fadeIn">
      <button 
        onClick={() => navigate(`/workspace/${workspaceId}/summaries`)} 
        className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 shadow-none text-muted"
      >
        <ArrowLeft size={18}/> Back to Summaries
      </button>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold m-0">Meeting Summary #{selected.id}</h3>
          <p className="text-muted small mb-0">
            Recorded on {new Date(selected.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <button 
          onClick={handleUpdateSummary}
          disabled={isUpdating || editedSummary === selected.summary}
          className="btn btn-primary d-flex align-items-center justify-content-center gap-2 px-4 rounded-pill shadow-sm"
        >
          {isUpdating ? (
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          ) : <Save size={18}/>}
          {isUpdating ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
            <h5 className="fw-bold d-flex align-items-center gap-2 mb-3 text-success">
              <Sparkles size={20}/> AI Generated Insights
            </h5>
            <textarea 
              className="form-control border-0 bg-light p-3 rounded-3"
              style={{ minHeight: '450px', resize: 'vertical', lineHeight: '1.6', fontSize: '0.95rem' }}
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              placeholder="Waiting for AI to generate insights..."
            />
          </div>
        </div>
        
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
            <h5 className="fw-bold d-flex align-items-center gap-2 mb-3 text-primary">
              <MessageSquare size={20}/> Original Transcript
            </h5>
            <div 
              className="p-3 border-0 rounded-3 bg-light text-muted" 
              style={{ maxHeight: '450px', overflowY: 'auto', whiteSpace: 'pre-line', fontSize: '0.875rem' }}
            >
              {selected.transcript || "No transcript available for this recording."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- LIST VIEW (Default view) ---
  const completedMeetings = meetings.filter(m => m.status === 'completed');

  return (
    <div className="p-4 p-md-5">
      <div className="mb-5">
        <h2 className="fw-bold m-0">AI Meeting Summaries</h2>
        <p className="text-muted">Review automated insights and transcripts from your workspace calls.</p>
      </div>

      <div className="row g-4">
        {completedMeetings.length === 0 ? (
          <div className="col-12 text-center py-5 border border-dashed rounded-4 bg-white shadow-sm">
            <AlertCircle size={48} className="text-warning mb-3 opacity-50" />
            <h5 className="text-dark fw-bold">No Summaries Yet</h5>
            <p className="text-muted small">Completed meetings will appear here once the AI processing is finished.</p>
            <button 
              onClick={() => navigate(`/workspace/${workspaceId}/meetings`)} 
              className="btn btn-primary rounded-pill mt-2 px-4"
            >
              Check Recording Status
            </button>
          </div>
        ) : (
          completedMeetings.map(m => (
            <div key={m.id} className="col-md-6 col-xl-4">
              <div 
                className="card h-100 border-0 shadow-sm p-4 border-start border-4 border-primary rounded-4" 
                onClick={() => navigate(`/workspace/${workspaceId}/summaries/${m.id}`)} 
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.classList.add('shadow');
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.classList.remove('shadow');
                }}
              >
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                    <FileText size={24}/>
                  </div>
                  <span className="badge bg-success-subtle text-success d-flex align-items-center gap-1 border border-success-subtle px-2 py-1">
                    <CheckCircle size={12}/> AI PROCESSED
                  </span>
                </div>
                <h5 className="fw-bold mb-1">Meeting #{m.id}</h5>
                <p className="text-muted small mb-4">
                  {new Date(m.created_at).toLocaleDateString(undefined, { 
                    month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </p>
                <div className="mt-auto d-flex align-items-center text-primary fw-bold small">
                  View Full Insights <ArrowLeft size={14} className="ms-2" style={{ transform: 'rotate(180deg)' }}/>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MeetingSummaryList;