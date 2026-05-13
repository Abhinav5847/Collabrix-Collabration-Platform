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

  return (
    <div className="ratio ratio-16x9 bg-black rounded-3 overflow-hidden border border-secondary border-opacity-25 shadow-sm">
      <div ref={videoRef} className="w-100 h-100" />
      <div className="position-absolute bottom-0 start-0 p-2 w-100 bg-gradient-to-t from-black to-transparent" style={{ zIndex: 10 }}>
        <span className="badge bg-dark bg-opacity-75 text-white fw-medium px-3 py-2 rounded-2 border border-secondary">
          {displayName || `Member ${user.uid}`}
        </span>
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

  useEffect(() => {
    const numericUid = Number(uid);
    if (appId && channel && token) {
      join(appId, channel, token, numericUid);
    }
    return () => {
      leave();
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

      mediaRecorder.current.start(1000); // Collect data in 1s chunks for stability
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
    
    // Minimal size check to prevent empty uploads
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
            // Short delay to ensure final buffer chunk is pushed to audioChunks
            setTimeout(async () => {
              try {
                await handleFinalUpload();
                resolve();
              } catch (e) {
                resolve(); // Still leave even if upload fails
              }
            }, 600);
          };
          mediaRecorder.current.stop();
        });
        setIsRecording(false);
      }
      onLeave();
    } catch (err) {
      console.error("Error during session end:", err);
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

  return (
    <div className="d-flex flex-column h-100 bg-dark text-white rounded-4 shadow-lg overflow-hidden">
      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="row g-3 justify-content-center">
          {/* Local User */}
          <div className="col-12 col-md-6">
            <div className="ratio ratio-16x9 bg-black rounded-3 overflow-hidden border border-primary border-opacity-50 shadow-sm position-relative">
              {isVideoOff && (
                <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-dark" style={{ zIndex: 5 }}>
                  <div className="rounded-circle bg-secondary p-4">
                    <Users size={48} className="text-white-50" />
                  </div>
                </div>
              )}
              <div ref={localRef} className="w-100 h-100" />
              <div className="position-absolute bottom-0 start-0 p-2 w-100 bg-gradient-to-t from-black to-transparent" style={{ zIndex: 10 }}>
                <span className="badge bg-primary text-white fw-medium px-3 py-2 rounded-2">
                  You {isMuted && "(Muted)"}
                </span>
              </div>
            </div>
          </div>

          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <div key={user.uid} className="col-12 col-md-6">
              <RemoteVideoPlayer 
                user={user} 
                displayName={userMap[user.uid] || userMap[String(user.uid)]} 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-black bg-opacity-40 border-top border-secondary border-opacity-25">
        <div className="d-flex justify-content-center align-items-center gap-3">
          <button onClick={toggleAudio} className={`btn rounded-circle p-3 ${isMuted ? 'btn-danger' : 'btn-outline-light'}`}>
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button 
            onClick={isRecording ? null : startRecording} 
            disabled={isRecording || isSaving}
            className={`btn rounded-pill px-4 py-2 d-flex align-items-center gap-2 ${isRecording ? 'btn-success' : 'btn-outline-warning'}`}
          >
            <Disc size={20} className={isRecording ? 'animate-pulse' : ''} />
            {isRecording ? "RECORDING..." : "START RECORDING"}
          </button>

          <button onClick={toggleVideo} className={`btn rounded-circle p-3 ${isVideoOff ? 'btn-danger' : 'btn-outline-light'}`}>
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          <button 
            onClick={stopRecordingAndLeave} 
            disabled={isSaving}
            className="btn btn-danger rounded-pill px-5 py-2 fw-bold d-flex align-items-center gap-2 shadow-lg"
          >
            <PhoneOff size={18} /> {isSaving ? "SAVING..." : "LEAVE & SAVE"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoMeet;