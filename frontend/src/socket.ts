import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5200";

export const connectSocket = (token: string) => {
  if (socket && socket.connected) return socket;

  console.log("🌐 Connecting socket with token:", token);

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (err) => {
    console.error("Socket error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
