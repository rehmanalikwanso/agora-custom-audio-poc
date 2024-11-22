import { create } from "zustand";

export interface SSEStoreInterface {
  socket: WebSocket | null;
}

export const SSEInitialState: SSEStoreInterface = {
  socket: null,
};

const useSocketStore = create(() => ({
  ...SSEInitialState
}));

export { useSocketStore };
