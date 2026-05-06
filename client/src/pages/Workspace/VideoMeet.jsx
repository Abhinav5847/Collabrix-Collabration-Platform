import React, { useEffect, useRef } from 'react';
import useAgora from '../../services/useAgora';
import { Mic, Video, PhoneOff, Users } from 'lucide-react';

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

const VideoMeet = ({ appId, channel, token, uid, userMap = {}, onLeave }) => {
  const { join, leave, localVideoTrack, remoteUsers } = useAgora();
  const localRef = useRef(null);

  // Debugging: Check if names are actually arriving
  useEffect(() => {
    console.log("Current userMap received in VideoMeet:", userMap);
    console.log("Connected Remote UIDs:", remoteUsers.map(u => u.uid));
  }, [userMap, remoteUsers]);

  useEffect(() => {
    const numericUid = Number(uid);
    if (appId && channel && token) {
      join(appId, channel, token, numericUid);
    }
    return () => leave();
  }, [appId, channel, token, uid]);

  useEffect(() => {
    if (localVideoTrack && localRef.current) {
      localVideoTrack.play(localRef.current);
    }
  }, [localVideoTrack]);

  return (
    <div className="d-flex flex-column h-100 bg-dark text-white rounded-4 shadow-lg overflow-hidden">
      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="row g-3 justify-content-center">
          {/* Local User */}
          <div className="col-12 col-md-6">
            <div className="ratio ratio-16x9 bg-black rounded-3 overflow-hidden border border-primary border-opacity-50 shadow-sm">
              <div ref={localRef} className="w-100 h-100" />
              <div className="position-absolute bottom-0 start-0 p-2 w-100 bg-gradient-to-t from-black to-transparent" style={{ zIndex: 10 }}>
                <span className="badge bg-primary text-white fw-medium px-3 py-2 rounded-2">You</span>
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

      <div className="p-4 bg-black bg-opacity-40 border-top border-secondary border-opacity-25">
        <div className="d-flex justify-content-center gap-3">
          <button onClick={onLeave} className="btn btn-danger rounded-pill px-5 py-2 fw-bold d-flex align-items-center gap-2 shadow-lg">
            <PhoneOff size={18} /> LEAVE MEETING
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoMeet;