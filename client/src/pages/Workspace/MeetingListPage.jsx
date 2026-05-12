import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Clock, Play, User, Calendar, FileX } from 'lucide-react';

const MeetingList = () => {
  const { workspaceId } = useParams(); 
  
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      api.get(`workspaces/${workspaceId}/meetings/`)
        .then(res => {
          setMeetings(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch meetings:", err);
          setLoading(false);
        });
    }
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2 text-muted fw-medium">Fetching meeting history...</p>
      </div>
    );
  }

  return (
    <div className="p-4 p-md-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1 text-dark">Meeting History</h3>
          <p className="text-muted small mb-0">Access all past recordings and their current status.</p>
        </div>
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-2 rounded-pill">
          {meetings.length} Total Meetings
        </span>
      </div>

      <div className="table-responsive bg-white rounded-4 shadow-sm border overflow-hidden">
        <table className="table table-hover align-middle mb-0">
          <thead className="bg-light">
            <tr>
              <th className="px-4 py-3 text-muted small text-uppercase fw-bold">ID</th>
              <th className="py-3 text-muted small text-uppercase fw-bold">Host</th>
              <th className="py-3 text-muted small text-uppercase fw-bold">Date & Time</th>
              <th className="py-3 text-muted small text-uppercase fw-bold">Status</th>
              <th className="text-end px-4 py-3 text-muted small text-uppercase fw-bold">Recording</th>
            </tr>
          </thead>
          <tbody>
            {meetings.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-5">
                  <div className="d-flex flex-column align-items-center opacity-50">
                    <FileX size={48} className="mb-2 text-muted"/>
                    <p className="text-muted fw-medium mb-0">No meetings found in this workspace.</p>
                  </div>
                </td>
              </tr>
            ) : (
              meetings.map(m => (
                <tr key={m.id} className="border-bottom">
                  <td className="px-4 fw-bold text-primary">#{m.id}</td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary bg-opacity-10 p-1 rounded-circle">
                        <User size={14} className="text-primary"/>
                      </div>
                      <span className="fw-medium text-dark">{m.host_name || 'System'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-column">
                      <span className="small fw-semibold text-dark">
                        <Calendar size={12} className="me-1 text-muted mb-1"/> 
                        {new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                        <Clock size={12} className="me-1"/> 
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge rounded-pill px-3 py-1 fw-medium border ${
                      m.status === 'completed' 
                        ? 'bg-success-subtle text-success border-success-subtle' 
                        : m.status === 'processing' 
                        ? 'bg-info-subtle text-info border-info-subtle'
                        : 'bg-warning-subtle text-warning border-warning-subtle'
                    }`}>
                      {m.status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="text-end px-4">
                    {m.audio_file ? (
                      <a 
                        href={m.audio_file} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-sm btn-dark d-inline-flex align-items-center gap-2 px-3 rounded-pill shadow-sm transition-all hover-scale"
                      >
                        <Play size={12} fill="currentColor"/> Listen
                      </a>
                    ) : (
                      <span className="text-muted small fst-italic">No File</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MeetingList;