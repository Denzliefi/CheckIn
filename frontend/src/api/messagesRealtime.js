// src/api/messagesRealtime.js
import { io } from "socket.io-client";
import { getApiBaseUrl } from "./apiFetch";

let socket = null;

function getToken() {
  try {
    return localStorage.getItem("token") || localStorage.getItem("checkin:token") || "";
  } catch {
    return "";
  }
}

function guessLocalBackend() {
  if (typeof window === "undefined") return "http://localhost:5000";
  const { protocol, hostname } = window.location;
  // common dev setups: CRA on :3000, backend on :5000
  return `${protocol}//${hostname}:5000`;
}

export function getSocket() {
  if (socket) return socket;

  const base = getApiBaseUrl(); // "" in localhost dev with proxy
  const url = base && String(base).trim() ? base : guessLocalBackend();

  socket = io(url, {
    transports: ["websocket"],
    auth: { token: getToken() },
  });

  // If token changes (login/logout), you can call resetSocket()
  return socket;
}

export function resetSocket() {
  try {
    socket?.disconnect();
  } catch {}
  socket = null;
}

export function joinThread(threadId) {
  if (!threadId) return;
  getSocket().emit("thread:join", { threadId });
}

export function leaveThread(threadId) {
  if (!threadId) return;
  getSocket().emit("thread:leave", { threadId });
}

export function onNewMessage(handler) {
  const s = getSocket();
  s.on("message:new", handler);
  return () => s.off("message:new", handler);
}

export function onThreadActivity(handler) {
  const s = getSocket();
  s.on("thread:activity", handler);
  return () => s.off("thread:activity", handler);
}
