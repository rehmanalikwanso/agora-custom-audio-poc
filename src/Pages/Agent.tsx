// src/components/VideoCallAgent.tsx
import { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { useState } from 'react';
import { AGORA_APP_ID, AGORA_CHANNEL_KEY } from '../constant';
import '../styles/videoCallAgent.css';
import UPTOK_LOGO from "../svgs/logo.svg";
import { createLocalTracks, initRTCClient, joinChannel } from '../utils/rtcClient';

export const VideoCallAgent = () => {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);
  const [callStatus, setCallStatus] = useState<'NotInCall' | 'Connecting' | 'InCall'>('NotInCall');

  const handleJoinCall = async () => {
    try {
      if (!rtcClient) {
        setCallStatus('Connecting');
        const client = initRTCClient();
        setRtcClient(client);

        const { videoTrack } = await createLocalTracks();
        setLocalVideoTrack(videoTrack);
        // setLocalAudioTrack(audioTrack);

        await joinChannel(client, AGORA_APP_ID, AGORA_CHANNEL_KEY, null, 'agent_user_id');

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);

          if (mediaType === 'video') {
            const remoteContainer = document.createElement('div');
            remoteContainer.id = user.uid.toString();
            remoteContainer.style.width = '100%';
            remoteContainer.style.height = '100%';
            document.getElementById('customer-video')?.appendChild(remoteContainer);
            user.videoTrack?.play(remoteContainer.id);
          }

          console.log("mediaType>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", mediaType)
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user) => {
          document.getElementById(user.uid.toString())?.remove();
        });

        if (videoTrack) {
          videoTrack.play('agent-video');
        }
        client.publish([videoTrack]);
        setCallStatus('InCall');
      }
    } catch (error) {
      console.error('Error during joining call:', error);
      setCallStatus('NotInCall');
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

        await rtcClient.leave();
        rtcClient.removeAllListeners();
        setRtcClient(null);
        setLocalAudioTrack(null);
        setLocalAudioTrack(null)
        setCallStatus('NotInCall');
      } catch (error) {
        console.error('Error during leaving call:', error);
      }
    }
  };

  return (
    <>
      <div className='uptok-logo'>
        <img src={UPTOK_LOGO} alt="uptok-logo" width={174} />
      </div>
      <div className="video-container">
        <div className="status-container">
          {
            callStatus === 'NotInCall' ?
              <p className="status-message">Not in a Call</p> :

              <div id="customer-video" className="customer-video">
                {callStatus === "Connecting" && (
                  <div className="connecting-spinner-container">
                    <div className="spinner"></div>
                    <p className="connecting-text">Connecting...</p>
                  </div>
                )}
                <span className="customer-label">Customer Video</span>
                <div id="agent-video" className="agent-video"></div>
                <span className="agent-label">Your Video</span>
              </div>
          }
          <div className='button-bottom'>
            {callStatus === 'NotInCall' ?
              <button onClick={handleJoinCall} className="join-channel-button">
                Accept Call
              </button> :
              <button onClick={handleLeaveCall} className="leave-channel-button" disabled={!rtcClient}>
                Hang Up
              </button>
            }
          </div>
        </div>
      </div>
    </>
  );
};
