import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { FileText, Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';

const MeetingSummaryList = () => {
  // Use useParams to get IDs from the URL defined in App.js
  const { workspaceId, meetingId } = useParams();
  const navigate = useNavigate();
  
  const [meetings, setMeetings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch all meetings for this workspace
  useEffect(() => {
    if (workspaceId) {
      api.get(`workspaces/${workspaceId}/meetings/`)
        .then(res => {
          setMeetings(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching meetings:", err);
          setLoading(false);
        });
    }
  }, [workspaceId]);

  // Sync the 'selected' state with the 'meetingId' in the URL
  useEffect(() => {
    if (meetingId && meetings.length > 0) {
      const found = meetings.find(m => m.id.toString() === meetingId.toString());
      setSelected(found);
    } else {
      setSelected(null);
    }
  }, [meetingId, meetings]);

  if (loading) return <div className="p-5 text-center">Loading Meetings...</div>;

  // IF A MEETING IS SELECTED (URL has :meetingId)
  if (selected) return (
    <div className="p-5">
      <button 
        onClick={() => navigate(`/workspace/${workspaceId}/summaries`)} 
        className="btn btn-link text-decoration-none p-0 mb-4 d-flex align-items-center gap-2 shadow-none"
      >
        <ArrowLeft size={18}/> Back to List
      </button>
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold d-flex align-items-center gap-2 mb-4 text-success">
              <Sparkles size={20}/> AI Summary
            </h5>
            <div className="bg-light p-3 rounded-3" style={{whiteSpace: 'pre-line', minHeight: '200px'}}>
              {selected.summary || "Summary is being generated..."}
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm p-4 h-100">
            <h5 className="fw-bold d-flex align-items-center gap-2 mb-4 text-primary">
              <MessageSquare size={20}/> Transcript
            </h5>
            <div className="small text-muted p-2 border rounded bg-white" style={{maxHeight: '400px', overflowY: 'auto'}}>
              {selected.transcript || "Transcript not yet available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // LIST VIEW (URL is just /summaries)
  return (
    <div className="p-5">
      <h3 className="fw-bold mb-4">AI Summaries</h3>
      <div className="row g-3">
        {meetings.filter(m => m.status === 'completed').length === 0 ? (
           <div className="col-12 text-center py-5 border rounded bg-white text-muted">
             No completed meetings found to summarize.
           </div>
        ) : (
          meetings.filter(m => m.status === 'completed').map(m => (
            <div key={m.id} className="col-md-6 col-lg-4">
              <div 
                className="card h-100 border-0 shadow-sm p-4 hover-shadow transition-all" 
                onClick={() => navigate(`/workspace/${workspaceId}/summaries/${m.id}`)} 
                style={{cursor: 'pointer'}}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <FileText className="text-primary mb-3" size={32}/>
                  <span className="badge bg-success-subtle text-success border border-success-subtle">AI Ready</span>
                </div>
                <h5 className="fw-bold">Meeting Summary #{m.id}</h5>
                <p className="text-muted small mb-3">Processed on {new Date(m.created_at).toLocaleDateString()}</p>
                <button className="btn btn-sm btn-outline-primary w-100 mt-auto">View Insights</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MeetingSummaryList;