// frontend/src/api/messages.api.js
import { apiFetch } from "./apiFetch";

/* ===========================
   Helpers
=========================== */
const PH_TZ = "Asia/Manila";

function timeLabel(isoOrDate) {
  if (!isoOrDate) return "";
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PH_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}

function mapStudentMessage(msg) {
  return {
    id: msg.id,
    from: msg.senderRole === "student" ? "me" : "them",
    text: msg.text,
    time: timeLabel(msg.createdAt),
    createdAt: new Date(msg.createdAt).getTime(),
  };
}

function mapCounselorMessage(msg) {
  return {
    id: msg.id,
    by: msg.senderRole === "counselor" ? "Counselor" : "Participant",
    at: timeLabel(msg.createdAt),
    text: msg.text,
    createdAt: new Date(msg.createdAt).getTime(),
  };
}

function studentThreadBase(thread) {
  return {
    id: thread.id,
    name: "Guidance Counselor",
    subtitle: thread.visibility === "identified" ? "Counselor (identified)" : "Counselor (anonymous)",
    avatarUrl: "",
    lastMessage: thread.lastMessage || "",
    lastTime: thread.lastMessageAt ? timeLabel(thread.lastMessageAt) : "",
    unread: Number(thread.unread || 0),
    status: thread.status || "open",
    visibility: thread.visibility || "masked",
    messages: Array.isArray(thread.messages) ? thread.messages.map(mapStudentMessage) : [],
  };
}

/* ===========================
   Student API
=========================== */
export async function ensureThread({ visibility = "masked" } = {}) {
  const data = await apiFetch("/api/messages/threads", {
    method: "POST",
    body: JSON.stringify({ visibility }),
  });
  return data?.item ? studentThreadBase(data.item) : null;
}

export async function listThreads() {
  const data = await apiFetch("/api/messages/threads/my");
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(studentThreadBase);
}

export async function getThread(threadId, { limit = 50 } = {}) {
  const data = await apiFetch(`/api/messages/threads/${threadId}?limit=${encodeURIComponent(limit)}`);
  return data?.item ? studentThreadBase(data.item) : null;
}

export async function sendMessage({ threadId, text }) {
  const data = await apiFetch(`/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return {
    message: data?.item ? mapStudentMessage(data.item) : null,
    thread: data?.thread ? studentThreadBase(data.thread) : null,
  };
}

export async function markThreadRead(threadId) {
  return apiFetch(`/api/messages/threads/${threadId}/seen`, { method: "POST" });
}

/* ===========================
   Counselor API
=========================== */
export async function counselorListInbox() {
  const data = await apiFetch("/api/messages/inbox");
  return Array.isArray(data?.items) ? data.items : [];
}

export async function counselorGetThread(threadId, { limit = 100 } = {}) {
  const data = await apiFetch(`/api/messages/threads/${threadId}?limit=${encodeURIComponent(limit)}`);
  // Backend returns item with counselor-friendly fields in this endpoint for counselors
  const item = data?.item || null;
  if (!item) return null;

  return {
    ...item,
    messages: Array.isArray(item.messages) ? item.messages.map(mapCounselorMessage) : [],
  };
}

export async function counselorSendMessage({ threadId, text }) {
  const data = await apiFetch(`/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

  return {
    message: data?.item ? mapCounselorMessage(data.item) : null,
    thread: data?.thread || null,
  };
}

export async function counselorMarkRead(threadId) {
  return apiFetch(`/api/messages/threads/${threadId}/seen`, { method: "POST" });
}

export async function counselorCloseThread(threadId) {
  return apiFetch(`/api/messages/threads/${threadId}/close`, { method: "POST" });
}

/* ===========================
   Realtime payload mappers
=========================== */
export function mapRealtimeStudentMessage(evt) {
  const msg = evt?.message;
  if (!msg) return null;
  return mapStudentMessage(msg);
}

export function mapRealtimeCounselorMessage(evt) {
  const msg = evt?.message;
  if (!msg) return null;
  return mapCounselorMessage(msg);
}
