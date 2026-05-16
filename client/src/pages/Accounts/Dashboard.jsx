import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../services/api';
import {
  Plus, ArrowRight, FolderOpen, FileText, MessageSquare, Users, Cpu, Settings, Video, List, Sparkles, X
} from 'lucide-react';
import { fetchWorkspaces } from '../../store/slices/workspaceSlice';
import VideoMeet from '../Workspace/VideoMeet';

/* ─── Brand Tokens ───────────────────────────────────────────────────────── */
const t = {
  navy:      "#0B1120",
  indigo:    "#4F6EF7",
  indigoBg:  "#EEF1FF",
  indigoHov: "#3D5CE8",
  surface:   "#FFFFFF",
  bg:        "#F4F6FB",
  border:    "#E4E7F0",
  text:      "#1A2236",
  textSoft:  "#4B5568",
  muted:     "#8A94A6",
  danger:    "#E53E3E",
  success:   "#10B981",
  warning:   "#F59E0B",
  purple:    "#8B5CF6",
};

const WS_COLORS = [t.indigo, '#0891B2', t.purple, t.success, t.danger, t.warning];
const wsColor   = (name) => WS_COLORS[name.charCodeAt(0) % WS_COLORS.length];

/* ─── Meet Options Modal ─────────────────────────────────────────────────── */
function MeetOptionsModal({ workspace, onClose, onStartMeet, onJoinMeet, joiningId, activeMeetings }) {
  const navigate = useNavigate();
  const color = wsColor(workspace.name);
  const isMeetActive = activeMeetings?.includes(workspace.id);

  const options = [
    // ── If a meeting is live, show "Join Meet" first; otherwise "Create Meet" ──
    isMeetActive
      ? {
          icon: <Video size={20} />,
          label: 'Join Live Meet',
          desc: 'A meeting is in progress — join now',
          color: t.success,
          bg: '#F0FDF4',
          action: () => { onJoinMeet(workspace.id); onClose(); },
          loading: joiningId === workspace.id,
        }
      : {
          icon: <Video size={20} />,
          label: 'Start Video Meet',
          desc: 'Launch a live HD video call with your team',
          color: t.danger,
          bg: '#FFF5F5',
          action: () => { onStartMeet(workspace.id); onClose(); },
          loading: joiningId === workspace.id,
        },
    {
      icon: <List size={20} />,
      label: 'Meeting History',
      desc: 'Browse all past recorded meetings',
      color: t.indigo,
      bg: t.indigoBg,
      action: () => { navigate(`/workspace/${workspace.id}/meetings`); onClose(); },
    },
    {
      icon: <Sparkles size={20} />,
      label: 'AI Summaries',
      desc: 'Read AI-generated meeting summaries',
      color: t.warning,
      bg: '#FFFBEB',
      action: () => { navigate(`/workspace/${workspace.id}/summaries`); onClose(); },
    },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1060,
      background: 'rgba(11,17,32,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
    }} onClick={onClose}>
      <div style={{
        background: t.surface, borderRadius: 20,
        padding: '28px 28px 24px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: color + '18', color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>{workspace.name.substring(0, 2).toUpperCase()}</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: t.text }}>{workspace.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: t.muted }}>
                {activeMeetings?.includes(workspace.id)
                  ? '🟢 Meeting in progress'
                  : 'Choose a meeting option'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: `1px solid ${t.border}`, background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: t.muted,
          }}><X size={14} /></button>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt) => (
            <button key={opt.label} onClick={opt.action} disabled={opt.loading} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 15px', borderRadius: 12,
              border: `1.5px solid ${t.border}`,
              background: t.surface, cursor: 'pointer',
              textAlign: 'left', width: '100%',
              transition: 'border-color .15s, background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = opt.color; e.currentTarget.style.background = opt.bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: opt.bg, color: opt.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {opt.loading
                  ? <div style={{ width: 16, height: 16, border: `2px solid ${opt.color}40`, borderTopColor: opt.color, borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                  : opt.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: t.text }}>{opt.label}</p>
                <p style={{ margin: 0, fontSize: 12, color: t.muted }}>{opt.desc}</p>
              </div>
              <ArrowRight size={14} color={t.muted} style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Workspace Card ─────────────────────────────────────────────────────── */
function WorkspaceCard({ ws, onMeetClick, navigate, activeMeetings }) {
  const color = wsColor(ws.name);
  const [hov, setHov] = useState(false);
  const isMeetActive = activeMeetings?.includes(ws.id);

  const actions = [
    { icon: <FileText size={13} />, label: 'Docs',  color: t.indigo,  path: `/workspace/${ws.id}/documents` },
    { icon: <MessageSquare size={13} />, label: 'Chat', color: t.success, path: `/workspace/${ws.id}/chat` },
    { icon: <Users size={13} />, label: 'Team',     color: t.purple,  path: `/workspace/${ws.id}/members` },
  ];

  return (
    <div style={{
      background: t.surface, borderRadius: 16,
      border: `1.5px solid ${hov ? color + '55' : t.border}`,
      padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', height: '100%',
      transition: 'border-color .2s, box-shadow .2s',
      boxShadow: hov ? `0 8px 28px ${color}15` : '0 2px 8px rgba(0,0,0,0.04)',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 13 }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: color + '18', color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13,
          }}>{ws.name.substring(0, 2).toUpperCase()}</div>
          {/* Live indicator on avatar */}
          {isMeetActive && (
            <div style={{
              position: 'absolute', top: -3, right: -3,
              width: 12, height: 12, borderRadius: '50%',
              background: t.success,
              border: `2px solid ${t.surface}`,
              boxShadow: `0 0 6px ${t.success}88`,
            }} />
          )}
        </div>

        <button onClick={() => navigate(`/workspace/${ws.id}`)} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 11px', borderRadius: 8,
          border: `1px solid ${t.border}`, background: t.bg,
          fontSize: 12, fontWeight: 600, color: t.textSoft,
          cursor: 'pointer',
        }}>
          <Settings size={12} /> Manage
        </button>
      </div>

      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 14.5, color: t.text }}>{ws.name}</p>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: t.muted, lineHeight: 1.55, flex: 1 }}>
        {ws.description || 'No description provided.'}
      </p>

      {/* Members pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: t.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Users size={11} color={t.indigo} /></div>
        <span style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}>
          {ws.member_count || ws.members?.length || 0} members
        </span>

        {/* Live meeting badge */}
        {isMeetActive && (
          <span style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10.5, fontWeight: 700,
            color: t.success,
            background: '#F0FDF4',
            border: `1px solid ${t.success}44`,
            padding: '2px 8px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.success, display: 'inline-block' }} />
            Live
          </span>
        )}
      </div>

      {/* Action row */}
      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {actions.map(a => (
            <button key={a.label} onClick={() => navigate(a.path)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 9px', borderRadius: 7,
              border: `1px solid ${t.border}`, background: t.surface,
              fontSize: 12, fontWeight: 600, color: a.color,
              cursor: 'pointer', transition: 'background .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = t.bg}
              onMouseLeave={e => e.currentTarget.style.background = t.surface}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        {/* Meet button — changes label based on live status */}
        <button onClick={() => onMeetClick(ws)} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', borderRadius: 7,
          border: 'none',
          background: isMeetActive ? '#F0FDF4' : '#FFF1F1',
          fontSize: 12, fontWeight: 600,
          color: isMeetActive ? t.success : t.danger,
          cursor: 'pointer', transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = isMeetActive ? '#DCFCE7' : '#FFE0E0'}
          onMouseLeave={e => e.currentTarget.style.background = isMeetActive ? '#F0FDF4' : '#FFF1F1'}
        >
          <Video size={13} />
          {isMeetActive ? 'Join Meet' : 'Meet'}
        </button>
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: workspaces, loading } = useSelector((s) => s.workspaces);

  const [meetData,      setMeetData]      = useState(null);
  const [joiningId,     setJoiningId]     = useState(null);
  const [meetModalWs,   setMeetModalWs]   = useState(null);
  // Track which workspace IDs have an active meeting
  const [activeMeetings, setActiveMeetings] = useState([]);

  useEffect(() => {
    if (workspaces.length === 0) dispatch(fetchWorkspaces());
  }, [dispatch, workspaces.length]);

  useEffect(() => {
    document.body.style.overflow = (meetData || meetModalWs) ? 'hidden' : 'unset';
  }, [meetData, meetModalWs]);

  // Poll active meetings so the card reflects live status
  useEffect(() => {
    const checkActiveMeetings = async () => {
      if (workspaces.length === 0) return;
      try {
        const res = await api.get('workspaces/active-meetings/');
        setActiveMeetings(res.data?.active_workspace_ids || []);
      } catch (_) {
        // endpoint may not exist — silently ignore
      }
    };
    checkActiveMeetings();
    const interval = setInterval(checkActiveMeetings, 15000);
    return () => clearInterval(interval);
  }, [workspaces]);

  const handleStartMeet = async (workspaceId) => {
    setJoiningId(workspaceId);
    try {
      const response = await api.get(`workspaces/${workspaceId}/meet-token/`);
      setMeetData({ ...response.data, workspaceId });
      // Mark as active locally immediately
      setActiveMeetings(prev => [...new Set([...prev, workspaceId])]);
    } catch (err) {
      console.error("Meeting failed:", err);
      alert("Failed to initialize meeting.");
    } finally {
      setJoiningId(null);
    }
  };

  // Join an existing meeting — same token endpoint, backend handles join vs create
  const handleJoinMeet = async (workspaceId) => {
    setJoiningId(workspaceId);
    try {
      const response = await api.get(`workspaces/${workspaceId}/meet-token/`);
      setMeetData({ ...response.data, workspaceId });
    } catch (err) {
      console.error("Join meeting failed:", err);
      alert("Failed to join meeting.");
    } finally {
      setJoiningId(null);
    }
  };

  if (loading && workspaces.length === 0) return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 12,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 26, height: 26, border: `2.5px solid ${t.indigoBg}`, borderTopColor: t.indigo, borderRadius: '50%', animation: 'spin .75s linear infinite' }} />
      <span style={{ fontSize: 13, color: t.muted }}>Loading workspaces…</span>
    </div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${t.border}`,
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: t.text, letterSpacing: '-0.4px' }}>
            Dashboard
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.muted, fontSize: 13 }}>
            <FolderOpen size={14} />
            <span>{workspaces.length} active workspace{workspaces.length !== 1 ? 's' : ''}</span>
            {activeMeetings.length > 0 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                marginLeft: 8, fontSize: 11.5, fontWeight: 600,
                color: t.success, background: '#F0FDF4',
                border: `1px solid ${t.success}44`,
                padding: '2px 9px', borderRadius: 20,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.success, display: 'inline-block' }} />
                {activeMeetings.length} live meeting{activeMeetings.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <Link to="/workspace/create" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 10,
          background: t.indigo, color: '#fff',
          textDecoration: 'none', fontSize: 13.5, fontWeight: 600,
        }}>
          <Plus size={15} /> New Workspace
        </Link>
      </div>

      {/* ── Welcome banner ── */}
      <div style={{
        background: t.navy, borderRadius: 14,
        padding: '20px 24px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,110,247,0.2) 0%, transparent 70%)', top: -60, left: -40, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
            Welcome to Collabrix
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            Your all-in-one platform for documents, video calls, and team collaboration.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1, flexShrink: 0 }}>
          {[
            { label: 'Docs', color: t.indigo },
            { label: 'Video', color: t.danger },
            { label: 'AI', color: t.warning },
            { label: 'Chat', color: t.success },
          ].map(f => (
            <div key={f.label} style={{
              padding: '4px 10px', borderRadius: 20,
              background: f.color + '22',
              border: `1px solid ${f.color}44`,
              fontSize: 11.5, fontWeight: 600, color: f.color,
            }}>{f.label}</div>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {workspaces.length === 0 && (
        <div style={{
          background: t.surface, borderRadius: 16,
          border: `1.5px dashed ${t.border}`,
          padding: '56px 40px', textAlign: 'center', marginBottom: 32,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: t.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <FolderOpen size={22} color={t.indigo} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: '0 0 5px' }}>No workspaces yet</p>
          <p style={{ fontSize: 13, color: t.muted, margin: '0 0 20px' }}>Create your first workspace to start collaborating</p>
          <Link to="/workspace/create" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10,
            background: t.indigo, color: '#fff',
            textDecoration: 'none', fontSize: 13.5, fontWeight: 600,
          }}><Plus size={14} /> Create Workspace</Link>
        </div>
      )}

      {/* ── Workspace grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 18, marginBottom: 30,
      }}>
        {workspaces.map(ws => (
          <WorkspaceCard
            key={ws.id}
            ws={ws}
            navigate={navigate}
            joiningId={joiningId}
            activeMeetings={activeMeetings}
            onMeetClick={(ws) => setMeetModalWs(ws)}
          />
        ))}
      </div>

      {/* ── AI Agent Bar ── */}
      <div style={{
        background: t.navy, borderRadius: 14,
        padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: t.indigo,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={19} color="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#fff' }}>Collabrix Global Agent</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Engine: Llama-3.1-8b
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/agent')} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 18px', borderRadius: 9,
          background: t.indigo, color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          transition: 'background .15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = t.indigoHov}
          onMouseLeave={e => e.currentTarget.style.background = t.indigo}
        >
          Open Agent <ArrowRight size={13} />
        </button>
      </div>

      {/* ── Meet Options Modal ── */}
      {meetModalWs && (
        <MeetOptionsModal
          workspace={meetModalWs}
          onClose={() => setMeetModalWs(null)}
          onStartMeet={handleStartMeet}
          onJoinMeet={handleJoinMeet}
          joiningId={joiningId}
          activeMeetings={activeMeetings}
        />
      )}

      {/* ── Video Meet Modal ── */}
      {meetData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1050,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(11,17,32,0.8)',
        }}>
          <div style={{
            width: '75%', height: '75%',
            background: '#0B1120', borderRadius: 16,
            overflow: 'hidden', border: `1px solid rgba(255,255,255,0.1)`,
          }}>
            <VideoMeet
              appId={meetData.app_id}
              channel={meetData.channel_name}
              token={meetData.token}
              uid={meetData.uid}
              workspaceId={meetData.workspaceId}
              userMap={meetData.user_map}
              onLeave={() => setMeetData(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}