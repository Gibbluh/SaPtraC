import { io } from "socket.io-client";

// Singleton socket instance
let socket;
const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export function getSocket({ forceNew = false } = {}) {
  if (socket && !forceNew) return socket;

  // close existing before creating new
  if (socket) try { socket.disconnect(); } catch { /* ignore */ }

  socket = io(url, {
    withCredentials: true,
    transports: ["polling", "websocket"], // allow polling first for environments where websocket may fail
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    autoConnect: true,
  });

  // Basic logging for connection issues
  socket.on("connect_error", (err) => {
    console.warn("Socket connect_error:", err?.message || err);
  });

  socket.on("reconnect_failed", () => {
    console.warn("Socket reconnect failed");
  });

  return socket;
}

export function forceReconnect() {
  return getSocket({ forceNew: true });
}
