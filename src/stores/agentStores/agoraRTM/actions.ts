import { IAgoraRTMInterface, MessageObject, useAgoraRTMStore } from ".";

export const setAgoraRtm = (agoraRtc: Partial<IAgoraRTMInterface>) => {
  useAgoraRTMStore.setState((prevState) => ({
    ...prevState,
    ...agoraRtc
  }));
};

export const addNewMessageToChat = (messageObject: MessageObject) => {
  const prevChat = useAgoraRTMStore.getState().chat;
  setAgoraRtm({
    chat: [...prevChat, messageObject]
  });
};

export const resetAgoraRTM = () => {
  const rtmChannel = useAgoraRTMStore.getState().rtmChannel;
  const rtmClient = useAgoraRTMStore.getState().rtmClient;
  const chat = useAgoraRTMStore.getState().chat;

  if (rtmChannel) {
    rtmChannel.leave();
    setAgoraRtm({ rtmChannel: null });
  }

  if (rtmClient) {
    rtmClient.logout();
    setAgoraRtm({ rtmClient: null });
  }

  if (chat.length > 0) {
    setAgoraRtm({ chat: [] });
  }
};