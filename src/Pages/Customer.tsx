// src/components/VideoCallClient.tsx
import { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import React, { useEffect, useState } from 'react';
import { AGORA_APP_ID, AGORA_CHANNEL_KEY, UUID } from '../constant';
import '../styles/videoCallClient.css';
import { requestPermissions } from '../utils/permissions';
import { createCustomerLocalTracks, initRTCClient, joinChannel } from '../utils/rtcClient';
import { webSocketEventResolver } from '../utils/websocketCunsumer';

export const VideoCallClient: React.FC = () => {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    console.log("localAudioTrack>>>>>>.")
    const socket = webSocketEventResolver({ serverUrl: "https://126a-182-176-115-44.ngrok-free.app" });
    setSocket(socket)
  }, [])
  
  const handleJoinClientChannel = async () => {
    try {
      console.log(">>>>>>>>>>>>>", socket)
      if (!rtcClient && socket) {

        await requestPermissions();

        const client = initRTCClient();
        setRtcClient(client);
          const { videoTrack, audioTrack } = await createCustomerLocalTracks(socket);
        
        setLocalVideoTrack(videoTrack);
        setLocalAudioTrack(audioTrack);

        await joinChannel(client, AGORA_APP_ID, AGORA_CHANNEL_KEY, null, UUID);


        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === 'video') {
            const remoteContainer = document.createElement('div');
            remoteContainer.id = user.uid.toString();
            remoteContainer.style.width = '100%';
            remoteContainer.style.height = '100%';
            document.getElementById('client-agent-video')?.appendChild(remoteContainer);
            user.videoTrack?.play(remoteContainer.id);
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user) => {
          document.getElementById(user.uid.toString())?.remove();
        });

        videoTrack.play('client-customer-video');
        client.publish([videoTrack, audioTrack]);

      }
    } catch (error) {
      console.error('Error during client join:', error);
    }
  };

  const handleLeaveCall = async () => {
    if (rtcClient) {
      try {
        // Stop and close local tracks
        if (localVideoTrack) {
          localVideoTrack.stop();
          localVideoTrack.close();
        }
        if (localAudioTrack) {
          localAudioTrack.stop();
          localAudioTrack.close();
        }

        // Leave the channel
        await rtcClient.leave();
        rtcClient.removeAllListeners();
        setRtcClient(null);
        setLocalAudioTrack(null);
        setLocalVideoTrack(null);

      } catch (error) {
        console.error('Error during client leave:', error);
      }
    }
  };

  return (
    <>
      <div className='button-container'>
        <button onClick={handleJoinClientChannel} className="join-client-button">
          Join Channel
        </button>
        <button onClick={handleLeaveCall} className="leave-channel-button">
          Leave Channel
        </button>
      </div>
      <div className="video-container">
        <div id="client-agent-video" className="client-agent-video">
          <span className="client-agent-label">Agent Video</span>
          <div id="client-customer-video" className="client-customer-video"></div>
          <span className="client-customer-label">Your Video</span>
        </div>
      </div>
    </>
  );
};
