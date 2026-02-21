// frontend/src/api/messagesRealtime.js
import { io } from "socket.io-client";
import { getSocketBaseUrl, getToken } from "./messages.api";

let socket = null;

export function connectMessagesSocket() {
  if (socket) {
    try {
      if (!socket.connected) socket.connect();
    } catch {}
    return socket;
  }

  const url = getSocketBaseUrl();
  const token = getToken();

  socket = io(url, {
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 500,
    timeout: 20000,
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connect_error:", err?.message || err);
  });

  return socket;
}

export function disconnectMessagesSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch {}
  socket = null;
}

export function onMessageNew(handler) {
  const s = connectMessagesSocket();
  s.on("message:new", handler);
  return () => s.off("message:new", handler);
}

export function onThreadUpdate(handler) {
  const s = connectMessagesSocket();
  s.on("thread:update", handler);
  return () => s.off("thread:update", handler);
}

export function onThreadCreated(handler) {
  const s = connectMessagesSocket();
  s.on("thread:created", handler);
  return () => s.off("thread:created", handler);
}


export function joinThread(threadId) {
  if (!threadId) return;
  const s = connectMessagesSocket();
  try {
    s.emit("thread:join", { threadId: String(threadId) });
  } catch {}
}
