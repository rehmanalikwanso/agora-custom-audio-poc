import { IAgoraRTCClient, IAgoraRTCRemoteUser, ICameraVideoTrack, ILocalAudioTrack } from "agora-rtc-sdk-ng";
import { create } from "zustand";

export interface RtcLocalStream {
  localAudioTrack: ILocalAudioTrack;
  localVideoTrack: ICameraVideoTrack;
}

export interface AgoraRTCStoreInterface {
  rtcClient: IAgoraRTCClient | null;
  rtcLocalStream: RtcLocalStream | null;
  rtcRemoteStream: IAgoraRTCRemoteUser | null;
}

export const agoraRTCInitialState: AgoraRTCStoreInterface = {
  rtcClient: null,
  rtcLocalStream: null,
  rtcRemoteStream: null
};

const useAgoraRTCStore = create(() => ({
  ...agoraRTCInitialState
}));

export { useAgoraRTCStore };
