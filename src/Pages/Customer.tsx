// src/components/VideoCallClient.tsx
import { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import React, { useState } from 'react';
import { AGORA_APP_ID, AGORA_CHANNEL_KEY, UUID } from '../constant';
import '../styles/videoCallClient.css';
import { requestPermissions } from '../utils/permissions';
import { createLocalTracks, initRTCClient, joinChannel } from '../utils/rtcClient';

export const VideoCallClient: React.FC = () => {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);


  const handleJoinClientChannel = async () => {
    try {
      if (!rtcClient) {

        await requestPermissions();

        const client = initRTCClient();
        setRtcClient(client);
        const { videoTrack, audioTrack } = await createLocalTracks();
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
