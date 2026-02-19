// src/api/messages.api.js
// Real backend adapter for messaging (threads + messages)

import { apiFetch } from "./apiFetch";

/** Student: ensure you have one open thread */
export function ensureMyThread() {
  return apiFetch("/api/messages/threads/ensure", { method: "POST", body: JSON.stringify({}) });
}

/** Student: list own threads | Counselor: list all threads (system-wide read) */
export function listThreads() {
  return apiFetch("/api/messages/threads");
}

/** Get messages in a thread */
export function listMessages(threadId) {
  return apiFetch(`/api/messages/threads/${threadId}/messages`);
}

/** Send a message (Counselor will auto-claim on first reply) */
export function sendMessage(threadId, text) {
  return apiFetch(`/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

/** Mark read (Student clears unreadForStudent, Counselor clears only if assigned-to-me) */
export function markRead(threadId) {
  return apiFetch(`/api/messages/threads/${threadId}/read`, { method: "POST", body: JSON.stringify({}) });
}
