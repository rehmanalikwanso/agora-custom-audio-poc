import { AgoraRTCStoreInterface, useAgoraRTCStore } from ".";

export const setAgoraRtc = (agoraRtc: Partial<AgoraRTCStoreInterface>) => {
  useAgoraRTCStore.setState((prevState) => ({
    ...prevState,
    ...agoraRtc
  }));
};

export const resetAgoraRTC = () => {
  const rtcRemoteStream = useAgoraRTCStore.getState().rtcRemoteStream;
  const rtcLocalStream = useAgoraRTCStore.getState().rtcLocalStream;
  const rtcClient = useAgoraRTCStore.getState().rtcClient;

  if (rtcRemoteStream) {
    if (rtcRemoteStream?.hasVideo) {
      rtcRemoteStream?.videoTrack?.stop();
    }
    if (rtcRemoteStream?.hasAudio) {
      rtcRemoteStream?.audioTrack?.stop();
    }
    setAgoraRtc({ rtcRemoteStream: null });
  }

  if (rtcLocalStream) {
    rtcLocalStream?.localAudioTrack?.close();
    rtcLocalStream?.localVideoTrack?.close();
    setAgoraRtc({ rtcLocalStream: null });
  }

  if (rtcClient) {
    rtcClient?.leave();
    setAgoraRtc({ rtcClient: null });
  }
};
