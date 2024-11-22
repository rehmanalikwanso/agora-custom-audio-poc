import { SSEStoreInterface, useSocketStore } from ".";

export const setWebSocket = (sseData: Partial<SSEStoreInterface>) => {
  useSocketStore.setState((prevState) => ({
    ...prevState,
    ...sseData
  }));
};