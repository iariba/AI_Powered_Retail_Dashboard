import { io, Socket } from "socket.io-client";

let SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5200";
console.log("🌐 Connecting to:", SOCKET_URL);

const isLocalDev = window.location.hostname === "localhost";

const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket"], 
  reconnection: true,
  timeout: 20000,
  rejectUnauthorized: false,
  secure: !isLocalDev, 
  withCredentials: true,
});

socket.on("connect", () => console.log("✅ [Socket] Connected:", socket.id));
socket.on("disconnect", () => console.warn("⚠️ [Socket] Disconnected."));
socket.on("connect_error", (err) => console.error("❌ [Socket] Connect error:", err.message));

export default socket;
