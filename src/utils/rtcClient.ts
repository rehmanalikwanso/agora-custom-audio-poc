// src/services/agora/rtcClient.ts
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  ILocalAudioTrack
} from 'agora-rtc-sdk-ng';

let rtcClient: IAgoraRTCClient | null = null;

export const initRTCClient = (): IAgoraRTCClient => {
  if (!rtcClient) {
    rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  return rtcClient;
};

export const createLocalTracks = async (): Promise<{
  videoTrack: ICameraVideoTrack;
  audioTrack: ILocalAudioTrack;
}> => {
  try {
    const cameraDevices = await AgoraRTC.getCameras(false);
    const deviceId = cameraDevices.length > 1 && cameraDevices[0]['label'] === 'FaceTime HD Camera'
      ? cameraDevices[1]['deviceId']
      : cameraDevices[0]['deviceId'];

    const videoTrack: ICameraVideoTrack = await AgoraRTC.createCameraVideoTrack({
      cameraId: deviceId,
      encoderConfig: '720p_6',
      optimizationMode: 'motion',
    });

    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Extract the audio track from the media stream
    const mediaStreamTrack = mediaStream.getAudioTracks()[0];

    console.log("Audio stream track", mediaStreamTrack)
    
    // Create a custom audio track for Agora
    const audioTrack: ILocalAudioTrack = AgoraRTC.createCustomAudioTrack({
      mediaStreamTrack,
    });
      
    return { videoTrack, audioTrack };
  } catch (error) {
    console.error('Error creating local tracks:', error);
    throw error;
  }
};

export const joinChannel = async (
  client: IAgoraRTCClient,
  appId: string,
  channel: string,
  token: string | null,
  userId: string
): Promise<void> => {
  try {
    await client.join(appId, channel, token, userId);
    console.log(`Joined channel: ${channel}`);
  } catch (error) {
    console.error('Error joining channel:', error);
    throw error;
  }
};

export const leaveChannel = async (client: IAgoraRTCClient): Promise<void> => {
  try {
    await client.leave();
    console.log('Left the channel');
  } catch (error) {
    console.error('Error leaving channel:', error);
  }
};
