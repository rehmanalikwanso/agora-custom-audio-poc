import { setWebSocket } from "../stores/websocket/actions";

export const webSocketEventResolver = ({ serverUrl }: { serverUrl: string }) => {
  const socket = new WebSocket(serverUrl);

  // Save the WebSocket instance in your state or context

  setWebSocket({ socket });
  console.log("socket", socket)
  // Listen for connection open
  socket.onopen = () => {
    console.log("Connection established with server");
  };

  // Listen for messages from the server
  // socket.onmessage = (event) => {
  //   console.log("Message received from server")
  //   const data = JSON.parse(event.data); // Assuming server sends JSON
  //   console.log("Message received", data);
  // };

  // Handle connection errors
  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  // Listen for connection close
  socket.onclose = (event) => {
    console.log("Connection closed:", event.code, event.reason);
  };
  return socket;
};
