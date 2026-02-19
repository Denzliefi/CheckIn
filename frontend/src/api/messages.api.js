// frontend/src/api/messages.api.js
import { apiFetch, getApiBaseUrl } from "./apiFetch";

/* =========================================================
   JWT helper (no extra deps)
========================================================= */
export function getToken() {
  try {
    return (
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("authToken") ||
      window.sessionStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

export function getMyUserId() {
  const token = getToken();
  if (!token) return "";
  try {
    const [, payload] = token.split(".");
    if (!payload) return "";
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    const obj = JSON.parse(json);
    return String(obj?.id || obj?._id || "");
  } catch {
    return "";
  }
}

/* =========================================================
   Time helpers (UI format)
========================================================= */
function pad2(n) {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

function formatClock(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function formatRelative(isoOrDate) {
  try {
    const d = new Date(isoOrDate);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (!Number.isFinite(diff)) return "";

    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;

    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;

    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/* =========================================================
   Raw API
========================================================= */
export async function listThreadsRaw({ includeMessages = true, limit = 40 } = {}) {
  const qs = new URLSearchParams();
  qs.set("includeMessages", includeMessages ? "1" : "0");
  qs.set("limit", String(limit));
  return apiFetch(`/api/messages/threads?${qs.toString()}`);
}

export async function ensureThread({ anonymous = false, counselorId = null } = {}) {
  return apiFetch("/api/messages/threads/ensure", {
    method: "POST",
    body: JSON.stringify({ anonymous, counselorId }),
  });
}

export async function getThreadRaw(threadId, { limit = 60 } = {}) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  return apiFetch(`/api/messages/threads/${threadId}?${qs.toString()}`);
}

export async function sendMessageRaw({ threadId, text, clientId = null }) {
  return apiFetch(`/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text, clientId }),
  });
}

export async function markThreadRead(threadId) {
  return apiFetch(`/api/messages/threads/${threadId}/read`, { method: "POST" });
}

/* =========================================================
   MAPPERS
   - User side: MessagesDrawer expects threads[] shape
   - Counselor side: Inbox expects items[] shape
========================================================= */

export function toDrawerThreads(rawThreads = []) {
  const myId = getMyUserId();

  return (rawThreads || []).map((t) => {
    const threadId = String(t._id);
    const student = t.studentId;

// If thread is unclaimed, always mask identity (privacy-first)
const isUnclaimed = !t.counselorId;
const suffix = `T-${threadId.slice(-5)}`;

const displayName = isUnclaimed
  ? `New Student • Unclaimed (${suffix})`
  : t.anonymous
  ? `Anonymous Student (${suffix})`
  : student?.fullName || `Student (${suffix})`;

const studentId = isUnclaimed ? null : (t.anonymous ? null : (student?.studentNumber || null));

    const unread = Number(t?.unreadCounts?.[myId] || 0);
    const read = unread === 0;

    const thread = (t.messages || []).map((m) => {
      const by = String(m.senderId) === myId ? "Counselor" : "Participant";
      return {
        id: String(m._id),
        by,
        at: formatClock(m.createdAt),
        text: m.text,
        _raw: m,
      };
    });

    const lastAt = t.lastMessageAt || t.updatedAt || null;
    const lastActivity = lastAt ? new Date(lastAt).getTime() : 0;

    // keep mood tracker ready (empty for now)
    const moodTracking = { entries: [] };

    return {
      id: threadId,
      studentId: studentId ? `#${studentId}` : null,
      anonymous: !!t.anonymous,
      displayName,
      read,
      lastSeen: lastAt ? new Date(lastAt).toISOString().slice(0, 10) : "",
      lastMessage: t.lastMessage || (thread[thread.length - 1]?.text || "—"),
      lastActivity,
      thread,
      moodTracking,
      _raw: t,
    };
  });
}

/* =========================================================
   Convenience
========================================================= */
export async function listThreadsForDrawer() {
  const data = await listThreadsRaw({ includeMessages: true, limit: 60 });
  return { items: toDrawerThreads(data.items || []) };
}

export async function listThreadsForInbox() {
  const data = await listThreadsRaw({ includeMessages: true, limit: 120 });
  return { items: toInboxItems(data.items || []) };
}

export async function sendDrawerMessage({ threadId, text, clientId = null }) {
  const res = await sendMessageRaw({ threadId, text, clientId });
  return res;
}

export function getSocketBaseUrl() {
  // Socket.io should connect to the same base as API.
  // apiFetch uses REACT_APP_API_URL or relative; relative won't work for sockets on local dev.
  const base = getApiBaseUrl();
  if (base) return base;
  // local fallback
  return "http://localhost:5000";
}
