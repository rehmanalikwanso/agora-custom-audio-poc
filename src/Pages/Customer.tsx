// src/components/VideoCallClient.tsx
import { Call, Device } from '@twilio/voice-sdk';
import { IAgoraRTCClient, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import React, { useEffect, useRef, useState } from 'react';
import { AGORA_APP_ID, AGORA_CHANNEL_KEY, UUID } from '../constant';
import '../styles/videoCallClient.css';
import { requestPermissions } from '../utils/permissions';
import { createCustomerLocalTracks, initRTCClient, joinChannel } from '../utils/rtcClient';
import { getTwilioToken } from '../utils/twilio';

export const VideoCallClient: React.FC = () => {
  const [rtcClient, setRtcClient] = useState<IAgoraRTCClient | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<ILocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<ILocalAudioTrack | null>(null);

  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [isCallInProgress, setIsCallInProgress] = useState<boolean>(false);
  const [currentCall, setCall] = useState<Call | null>(null);

  const phoneNumberInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    console.log("localAudioTrack>>>>>>.")
    const init = async () => {
      if (phoneNumberInputRef.current) {
        phoneNumberInputRef.current.value = '+923160485008'; // Set the default value
      }
      const token = await getTwilioToken();
      console.log("data", token);
      // setToken(token);
      initializeDevice(token);
    }

    init();
  }, [])


  useEffect(() => {
    !isCallInProgress && handleLeaveCall()
  }, [isCallInProgress]);


  const initializeDevice = (token: string) => {
    log("Initializing device");

    const newDevice = new Device(token, {
      logLevel: 1,
      codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
    });

    addDeviceListeners(newDevice);
    newDevice.register();
    setDevice(newDevice);
  };


  const addDeviceListeners = (device: Device) => {
    device.on("registered", () => {
      log("Twilio.Device Ready to make and receive calls!");
    });

    device.on("error", (error: Error) => {
      log("Twilio.Device Error: " + error.message);
    });

  };

  const handleJoinClientChannel = async () => {
    try {
      console.log(">>>>>>>>>>>>>")
      if (!rtcClient) {

        await requestPermissions();

        const client = initRTCClient();
        setRtcClient(client);
        const { videoTrack } = await createCustomerLocalTracks();

        setLocalVideoTrack(videoTrack);

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
        });

        client.on('user-unpublished', (user) => {
          document.getElementById(user.uid.toString())?.remove();
        });

        videoTrack.play('client-customer-video');
        client.publish([videoTrack]);

      }
    } catch (error) {
      console.error('Error during client join:', error);
    }
  };


  const handleLeaveCall = async () => {
    if (rtcClient) {
      try {
        currentCall?.disconnect();
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

  const log = (message: string) => {
    setLogMessages((prevLogs) => [...prevLogs, message]);
  };

  const makeOutgoingCall = async () => {
    if (device && phoneNumberInputRef.current) {
      const params = {
        To: phoneNumberInputRef.current.value,
      };
      log(`Attempting to call ${params.To} ...`);
      console.log("device>>>>>>", device)
      try {

        const call = await device.connect({ params });
        setCall(call)
        call.on("accept", () => {
          log("Call accepted.");
          setIsCallInProgress(true);
          handleJoinClientChannel()
        });
        call.on("disconnect", () => {
          log("Call disconnected.");
          setIsCallInProgress(false);
        });
        call.on("cancel", () => {
          console.log("Incoming call canceled by the caller.");
        });

        call.on("ringing", () => {
          log("Outgoing call is ringing.");
        });


        call.on("error", (error) => {
          console.error("Call error: ", error.message);
        });
      } catch (error) {
        console.log("device>>>>>> error", error)
      }
    } else {
      log("Unable to make call.");
    }
  };

  return (
    <>
      <div className='button-container'>
        <button onClick={makeOutgoingCall} className="join-client-button">
          Join Channel
        </button>
        <div>
          <input ref={phoneNumberInputRef} type="text" placeholder="Phone Number" />
        </div>
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
      <div>


        <div>
          <h3>Logs</h3>
          <div id="log">
            {logMessages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};
