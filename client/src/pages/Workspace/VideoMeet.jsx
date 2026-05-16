import React, { useEffect, useRef, useState } from 'react';
import useAgora from '../../services/useAgora';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Disc } from 'lucide-react';
import { api } from '../../services/api';

const RemoteVideoPlayer = ({ user, displayName }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (user.videoTrack && videoRef.current) {
      user.videoTrack.play(videoRef.current);
    }
    return () => user.videoTrack?.stop();
  }, [user]);

  const initials = (displayName || `M${user.uid}`)
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="vm-tile">
      <div ref={videoRef} className="vm-tile__video" />
      {!user.videoTrack && (
        <div className="vm-tile__avatar">
          <span>{initials}</span>
        </div>
      )}
      <div className="vm-tile__nameplate">
        <span>{displayName || `Member ${user.uid}`}</span>
      </div>
    </div>
  );
};

const VideoMeet = ({ appId, channel, token, uid, workspaceId, userMap = {}, onLeave }) => {
  const { join, leave, localVideoTrack, localAudioTrack, remoteUsers } = useAgora();
  const localRef = useRef(null);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const audioContextRef = useRef(null);
  const audioDestRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ── FIX: stop hardware tracks so camera light turns off ──
  const stopHardwareTracks = () => {
    try {
      localVideoTrack?.stop();
      localVideoTrack?.close();
    } catch (_) {}
    try {
      localAudioTrack?.stop();
      localAudioTrack?.close();
    } catch (_) {}
    // Belt-and-suspenders: kill any live getUserMedia stream
    navigator.mediaDevices?.enumerateDevices?.().catch(() => {});
    try {
      const tracks = (window.__agoraLocalStream || []);
      tracks.forEach(t => { try { t.stop(); } catch (_) {} });
    } catch (_) {}
  };

  useEffect(() => {
    const numericUid = Number(uid);
    if (appId && channel && token) {
      join(appId, channel, token, numericUid);
    }
    return () => {
      leave();
      stopHardwareTracks();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [appId, channel, token, uid]);

  useEffect(() => {
    if (localVideoTrack && localRef.current) {
      localVideoTrack.play(localRef.current);
    }
  }, [localVideoTrack]);

  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.audioTrack) {
        user.audioTrack.play();
        if (isRecording && audioContextRef.current && audioDestRef.current) {
          try {
            const remoteStream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
            const source = audioContextRef.current.createMediaStreamSource(remoteStream);
            source.connect(audioDestRef.current);
          } catch (e) {
            console.error("Error adding late-joiner to recording mixer:", e);
          }
        }
      }
    });
  }, [remoteUsers, isRecording]);

  const startRecording = async () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      const dest = ctx.createMediaStreamDestination();
      audioContextRef.current = ctx;
      audioDestRef.current = dest;

      if (localAudioTrack) {
        const localStream = new MediaStream([localAudioTrack.getMediaStreamTrack()]);
        ctx.createMediaStreamSource(localStream).connect(dest);
      }

      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          const remoteStream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
          ctx.createMediaStreamSource(remoteStream).connect(dest);
        }
      });

      mediaRecorder.current = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      mediaRecorder.current.start(1000);
      setIsRecording(true);
      console.log("Recording started...");
    } catch (err) {
      console.error("Recording failed to start:", err);
    }
  };

  const handleFinalUpload = async () => {
    if (!workspaceId || audioChunks.current.length === 0) {
      console.warn("Upload skipped: No data or workspace ID.");
      return;
    }
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    if (audioBlob.size < 500) return;
    const formData = new FormData();
    formData.append('audio', audioBlob, `meeting_${workspaceId}_${Date.now()}.webm`);
    try {
      await api.post(`workspaces/${workspaceId}/process-meeting/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log("Meeting uploaded successfully.");
    } catch (err) {
      console.error("Upload failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const stopRecordingAndLeave = async () => {
    setIsSaving(true);
    try {
      if (mediaRecorder.current && isRecording) {
        await new Promise((resolve) => {
          mediaRecorder.current.onstop = () => {
            setTimeout(async () => {
              try {
                await handleFinalUpload();
                resolve();
              } catch (e) {
                resolve();
              }
            }, 600);
          };
          mediaRecorder.current.stop();
        });
        setIsRecording(false);
      }
      // ── FIX: stop hardware before calling onLeave ──
      leave();
      stopHardwareTracks();
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (_) {}
      }
      onLeave();
    } catch (err) {
      console.error("Error during session end:", err);
      stopHardwareTracks();
      onLeave();
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const totalParticipants = remoteUsers.length + 1;
  const gridClass = totalParticipants === 1 ? 'vm-grid--solo'
    : totalParticipants === 2 ? 'vm-grid--duo'
    : totalParticipants <= 4 ? 'vm-grid--quad'
    : 'vm-grid--many';

  return (
    <div className="vm-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');

        .vm-root {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          background: #0a0c10;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        /* ── HEADER ── */
        .vm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 22px;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .vm-header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .vm-header-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e88;
          animation: vmPulse 2s ease-in-out infinite;
        }
        @keyframes vmPulse {
          0%,100% { box-shadow: 0 0 6px #22c55e88; }
          50% { box-shadow: 0 0 14px #22c55ecc; }
        }
        .vm-header-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #fff;
        }
        .vm-header-channel {
          font-size: 11px;
          color: rgba(255,255,255,0.35);
          font-family: monospace;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .vm-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .vm-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
          color: rgba(255,255,255,0.55);
          font-weight: 500;
        }
        .vm-pill--rec {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
          animation: vmRecBlink 1.5s ease-in-out infinite;
        }
        @keyframes vmRecBlink {
          0%,100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* ── GRID ── */
        .vm-stage {
          flex: 1;
          padding: 20px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vm-grid {
          display: grid;
          gap: 12px;
          width: 100%;
          height: 100%;
        }
        .vm-grid--solo { grid-template-columns: 1fr; grid-template-rows: 1fr; max-width: 800px; }
        .vm-grid--duo { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
        .vm-grid--quad { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .vm-grid--many { grid-template-columns: repeat(3, 1fr); }

        /* ── TILE ── */
        .vm-tile {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #111318;
          border: 1px solid rgba(255,255,255,0.07);
          aspect-ratio: 16/9;
        }
        .vm-tile--local {
          border-color: rgba(79,110,247,0.45);
          box-shadow: 0 0 0 1px rgba(79,110,247,0.2);
        }
        .vm-tile__video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .vm-tile__avatar {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #13151c;
        }
        .vm-tile__avatar span {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(79,110,247,0.2);
          border: 2px solid rgba(79,110,247,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #818cf8;
        }
        .vm-tile__nameplate {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 22px 12px 10px;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
          display: flex;
          align-items: flex-end;
        }
        .vm-tile__nameplate span {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          background: rgba(0,0,0,0.5);
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(4px);
        }
        .vm-tile__you-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #818cf8;
          background: rgba(79,110,247,0.15);
          border: 1px solid rgba(79,110,247,0.35);
          padding: 3px 8px;
          border-radius: 5px;
        }
        .vm-tile__muted-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(239,68,68,0.2);
          border: 1px solid rgba(239,68,68,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f87171;
        }

        /* ── CONTROLS ── */
        .vm-controls {
          flex-shrink: 0;
          padding: 16px 24px 20px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .vm-ctrl {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
          outline: none;
          flex-shrink: 0;
        }
        .vm-ctrl:hover:not(:disabled) {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.25);
          transform: scale(1.06);
        }
        .vm-ctrl--active {
          background: rgba(239,68,68,0.2);
          border-color: rgba(239,68,68,0.5);
          color: #f87171;
        }
        .vm-ctrl--active:hover:not(:disabled) {
          background: rgba(239,68,68,0.3);
        }
        .vm-ctrl--rec {
          width: auto;
          border-radius: 24px;
          padding: 0 18px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          gap: 7px;
          border-color: rgba(245,158,11,0.4);
          color: #fbbf24;
          background: rgba(245,158,11,0.1);
        }
        .vm-ctrl--rec:hover:not(:disabled) {
          background: rgba(245,158,11,0.2);
          border-color: rgba(245,158,11,0.6);
        }
        .vm-ctrl--rec-active {
          border-color: rgba(34,197,94,0.4);
          color: #4ade80;
          background: rgba(34,197,94,0.1);
          animation: vmRecBlink 1.5s ease-in-out infinite;
        }
        .vm-ctrl--leave {
          width: auto;
          border-radius: 24px;
          padding: 0 22px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 600;
          gap: 7px;
          background: rgba(239,68,68,0.2);
          border-color: rgba(239,68,68,0.5);
          color: #f87171;
        }
        .vm-ctrl--leave:hover:not(:disabled) {
          background: rgba(239,68,68,0.35);
          border-color: rgba(239,68,68,0.7);
          transform: scale(1.03);
        }
        .vm-ctrl--leave:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .vm-ctrl-sep {
          width: 1px;
          height: 28px;
          background: rgba(255,255,255,0.08);
          margin: 0 4px;
        }
        .vm-spin {
          animation: vmSpin 0.8s linear infinite;
        }
        @keyframes vmSpin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── HEADER ── */}
      <div className="vm-header">
        <div className="vm-header-brand">
          <div className="vm-header-dot" />
          <div>
            <div className="vm-header-name">Collabrix Meet</div>
            <div className="vm-header-channel">{channel}</div>
          </div>
        </div>
        <div className="vm-header-meta">
          <div className="vm-pill">
            <Users size={11} />
            {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
          </div>
          {isRecording && (
            <div className={`vm-pill vm-pill--rec`}>
              <Disc size={10} />
              REC
            </div>
          )}
        </div>
      </div>

      {/* ── VIDEO STAGE ── */}
      <div className="vm-stage">
        <div className={`vm-grid ${gridClass}`}>

          {/* Local tile */}
          <div className={`vm-tile vm-tile--local`}>
            {isVideoOff && (
              <div className="vm-tile__avatar">
                <span>YOU</span>
              </div>
            )}
            <div ref={localRef} className="vm-tile__video" />
            <div className="vm-tile__you-badge">You</div>
            {isMuted && (
              <div className="vm-tile__muted-badge">
                <MicOff size={12} />
              </div>
            )}
            <div className="vm-tile__nameplate">
              <span>You {isMuted ? '· Muted' : ''}</span>
            </div>
          </div>

          {/* Remote tiles */}
          {remoteUsers.map((user) => (
            <RemoteVideoPlayer
              key={user.uid}
              user={user}
              displayName={userMap[user.uid] || userMap[String(user.uid)]}
            />
          ))}
        </div>
      </div>

      {/* ── CONTROL BAR ── */}
      <div className="vm-controls">
        <button onClick={toggleAudio} className={`vm-ctrl ${isMuted ? 'vm-ctrl--active' : ''}`} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button onClick={toggleVideo} className={`vm-ctrl ${isVideoOff ? 'vm-ctrl--active' : ''}`} title={isVideoOff ? 'Show Video' : 'Hide Video'}>
          {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
        </button>

        <div className="vm-ctrl-sep" />

        <button
          onClick={isRecording ? null : startRecording}
          disabled={isRecording || isSaving}
          className={`vm-ctrl vm-ctrl--rec ${isRecording ? 'vm-ctrl--rec-active' : ''}`}
          style={{ height: 46 }}
        >
          <Disc size={14} />
          {isRecording ? 'Recording…' : 'Record'}
        </button>

        <div className="vm-ctrl-sep" />

        <button
          onClick={stopRecordingAndLeave}
          disabled={isSaving}
          className="vm-ctrl vm-ctrl--leave"
          style={{ height: 46 }}
        >
          {isSaving
            ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(248,113,113,0.3)', borderTopColor: '#f87171', borderRadius: '50%' }} className="vm-spin" /> Saving…</>
            : <><PhoneOff size={15} /> Leave & Save</>}
        </button>
      </div>
    </div>
  );
};

export default VideoMeet;