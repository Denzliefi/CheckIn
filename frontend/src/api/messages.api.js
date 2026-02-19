// frontend/src/api/messages.api.js
import { apiFetch } from "./apiFetch";

/**
 * Ensure a thread exists.
 * mode: "student" | "anonymous"
 * If anonymous: pass sessionKey (stored in sessionStorage by MessagesDrawer)
 */
export async function ensureThread({ mode = "student", email = "", sessionKey = "" } = {}) {
  const headers = {};
  if (sessionKey) headers["X-Chat-Session"] = sessionKey;

  const data = await apiFetch("/api/messages/threads/ensure", {
    method: "POST",
    headers,
    body: { mode, email },
  });

  return data; // { thread }
}

export async function fetchThreads({ mode = "student", email = "", sessionKey = "" } = {}) {
  // Student/anonymous UX expects a single active thread
  const { thread } = await ensureThread({ mode, email, sessionKey });
  return { items: [thread] };
}

export async function fetchThread(threadId, { sessionKey = "", limit = 200 } = {}) {
  const headers = {};
  if (sessionKey) headers["X-Chat-Session"] = sessionKey;

  return apiFetch(`/api/messages/threads/${threadId}/messages?limit=${encodeURIComponent(limit)}`, {
    method: "GET",
    headers,
  });
}

export async function sendMessage({ threadId, text, sessionKey = "" }) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Message is empty");

  const headers = {};
  if (sessionKey) headers["X-Chat-Session"] = sessionKey;

  return apiFetch(`/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    headers,
    body: { text: clean },
  });
}

export async function markThreadRead(threadId, { sessionKey = "" } = {}) {
  const headers = {};
  if (sessionKey) headers["X-Chat-Session"] = sessionKey;

  return apiFetch(`/api/messages/threads/${threadId}/read`, { method: "POST", headers });
}
