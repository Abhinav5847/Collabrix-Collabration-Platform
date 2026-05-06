import { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

export default function useAgora() {
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);

  async function join(appid, channel, token, uid) {
    client.on('user-published', async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      
      if (mediaType === 'video') {
        setRemoteUsers((prevUsers) => {
          if (prevUsers.find(u => u.uid === user.uid)) return prevUsers;
          return [...prevUsers, user];
        });
      }
      if (mediaType === 'audio') {
        user.audioTrack.play();
      }
    });

    client.on('user-unpublished', (user) => {
      setRemoteUsers((prevUsers) => prevUsers.filter((u) => u.uid !== user.uid));
    });

    try {
      await client.join(appid, channel, token, uid);
      const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
      
      setLocalAudioTrack(audio);
      setLocalVideoTrack(video);
      
      await client.publish([audio, video]);
    } catch (error) {
      console.error("Agora Join Error:", error);
    }
  }

  async function leave() {
    if (localAudioTrack) {
      localAudioTrack.stop();
      localAudioTrack.close();
    }
    if (localVideoTrack) {
      localVideoTrack.stop();
      localVideoTrack.close();
    }
    await client.leave();
    setRemoteUsers([]);
  }

  return { join, leave, localVideoTrack, remoteUsers };
}