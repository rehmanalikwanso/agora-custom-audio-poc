import { RtmChannel, RtmClient } from 'agora-rtm-sdk';
import { create } from "zustand";

export interface MessageObject {
  user: string;
  content: string;
  type: "promo" | "message" | "product";
}

export interface IAgoraRTMInterface {
  rtmClient: RtmClient | null;
  rtmChannel: RtmChannel | null;
  chat: MessageObject[];
}

export const agoraRTMInitialState: IAgoraRTMInterface = {
  rtmClient: null,
  rtmChannel: null,
  chat: [],
};

const useAgoraRTMStore = create(() => ({
  ...agoraRTMInitialState
}));

export { useAgoraRTMStore };