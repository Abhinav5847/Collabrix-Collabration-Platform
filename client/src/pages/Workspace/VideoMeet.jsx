import React, { useEffect, useRef, useState } from 'react';
import useAgora from '../../services/useAgora';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, Disc } from 'lucide-react';
import axios from 'axios';

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

  // --- Refs for non-reactive data storage ---
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const workspaceIdRef = useRef(workspaceId); 

  // --- UI States ---
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keep the Ref in sync with the prop if it updates
  useEffect(() => {
    if (workspaceId) {
      workspaceIdRef.current = workspaceId;
    }
  }, [workspaceId]);

  // Initial Join
  useEffect(() => {
    const numericUid = Number(uid);
    if (appId && channel && token) {
      join(appId, channel, token, numericUid);
    }
    return () => leave();
  }, [appId, channel, token, uid]);

  // Handle Local Video Playback
  useEffect(() => {
    if (localVideoTrack && localRef.current) {
      localVideoTrack.play(localRef.current);
    }
  }, [localVideoTrack]);

  // Auto-play remote audio tracks
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.audioTrack) user.audioTrack.play();
    });
  }, [remoteUsers]);

  // --- Audio Mixing & Recording Logic ---
  const startRecording = async () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();

      const dest = audioContext.createMediaStreamDestination();

      // Connect Local Mic
      if (localAudioTrack) {
        const localStream = new MediaStream([localAudioTrack.getMediaStreamTrack()]);
        audioContext.createMediaStreamSource(localStream).connect(dest);
      }

      // Connect All Remote Mics
      remoteUsers.forEach((user) => {
        if (user.audioTrack) {
          const remoteStream = new MediaStream([user.audioTrack.getMediaStreamTrack()]);
          audioContext.createMediaStreamSource(remoteStream).connect(dest);
        }
      });

      mediaRecorder.current = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      console.log("Mixed Audio Recording Started...");
    } catch (err) {
      console.error("Recording failed to start:", err);
    }
  };

  const handleFinalUpload = async () => {
    const currentId = workspaceIdRef.current || workspaceId;

    if (!currentId || currentId === "undefined") {
      console.error("CRITICAL: workspaceId is undefined at upload time!");
      return;
    }

    if (audioChunks.current.length === 0) {
      console.warn("No audio chunks captured. Skipping upload.");
      return;
    }
    
    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    const formData = new FormData();
    
    // ADD 'meeting.webm' AS THE THIRD ARGUMENT BELOW
    formData.append('audio', audioBlob, 'meeting.webm'); 
    formData.append('channel', channel);

    // const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
    // const formData = new FormData();
    // formData.append('audio', audioBlob);
    // formData.append('channel', channel);

    try {
      console.log(`Uploading meeting data to workspace ${currentId}...`);
      await axios.post(`/api/workspaces/${currentId}/process-meeting/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("Meeting successfully sent for processing.");
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
    }
  };

  const stopRecordingAndLeave = async () => {
    setIsSaving(true);

    if (mediaRecorder.current && isRecording) {
      // Create a promise to ensure the 'onstop' fires and finishes before we call onLeave()
      await new Promise((resolve) => {
        mediaRecorder.current.onstop = async () => {
          await handleFinalUpload();
          resolve();
        };
        mediaRecorder.current.stop();
      });
      setIsRecording(false);
    }
    
    setIsSaving(false);
    onLeave(); // Close the modal in Dashboard.jsx
  };

  // --- Toggle Controls ---
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
      {/* Video Grid */}
      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="row g-3 justify-content-center">
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