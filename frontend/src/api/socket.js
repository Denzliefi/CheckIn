// frontend/src/api/socket.js
import { io } from "socket.io-client";
import { getApiBaseUrl } from "./apiFetch";

let _socket = null;

function getToken() {
  try {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("checkin:token") ||
      ""
    );
  } catch {
    return "";
  }
}

/**
 * Connect a singleton socket.
 * - Uses JWT token if present
 * - Also accepts optional sessionKey (for anonymous chat)
 */
export function connectSocket({ sessionKey = "" } = {}) {
  if (_socket) return _socket;

  let base = getApiBaseUrl();

  // apiFetch returns "" on localhost to allow proxy;
  // but websockets usually need a real backend URL.
  if (!base && typeof window !== "undefined") {
    base = "http://localhost:5000";
  }

  _socket = io(base, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelayMax: 4000,
    auth: {
      token: getToken(),
      sessionKey: String(sessionKey || "").trim(),
    },
  });

  return _socket;
}

export function getSocket() {
  return _socket;
}

export function disconnectSocket() {
  try {
    _socket?.disconnect();
  } catch {}
  _socket = null;
}
