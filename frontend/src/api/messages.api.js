// frontend/src/api/messages.api.js
import { apiFetch, getApiBaseUrl } from "./apiFetch";

/* =========================================================
   JWT helper (no extra deps)
========================================================= */
export function getToken() {
  try {
    return (
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("checkin:token") ||
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

export async function sendMessageRaw({ threadId, text, clientId = null, senderMode = null }) {
  return apiFetch(`/api/messages/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ text, clientId, senderMode }),
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

/* =========================================================
   MAPPERS
   - User side: MessagesDrawer expects threads[] shape
   - Counselor side: optional mapper for simpler Inbox UIs
========================================================= */

export function toDrawerThreads(rawThreads = []) {
  const myId = getMyUserId();

  return (rawThreads || []).map((t) => {
    const threadId = String(t._id);

    // identity flags from backend
    const anonymous = !!t.anonymous;
    const identityLocked = !!t.identityLocked;

    const lastAt = t.lastMessageAt || t.updatedAt || null;

    const messages = (t.messages || []).map((m) => {
      const from = String(m.senderId) === String(myId) ? "me" : "them";
      return {
        id: String(m._id),
        from,
        text: m.text,
        time: formatClock(m.createdAt),
        createdAt: new Date(m.createdAt).getTime(),
        _raw: m,
      };
    });

    const counselorName = t?.counselorId?.fullName || t?.counselorName || "Counselor";
    const unread = Number(t?.unreadCounts?.[myId] || 0);

    return {
      id: threadId,
      counselorName,
      counselorUsername: counselorName,
      status: t.status,
      anonymous,
      identityLocked,
      identityLockedAt: t.identityLockedAt || null,
      messages,
      lastMessage: t.lastMessage || (messages[messages.length - 1]?.text || "—"),
      lastTime: lastAt ? formatRelative(lastAt) : "",
      unread,
      _raw: t,
    };
  });
}

// Counselor-side mapper (for simpler Inbox UIs)
// - Hides student identity until claimed by *this* counselor
// - Shows clear label for unclaimed threads
export function toInboxItems(rawThreads = []) {
  const myId = getMyUserId();

  return (rawThreads || []).map((t) => {
    const threadId = String(t._id || "");
    const suffix = `T-${threadId.slice(-5)}`;

    const claimedBy = t?.counselorId?._id || t?.counselorId || null;
    const claimed = Boolean(claimedBy);
    const mine = claimed && String(claimedBy) === String(myId);

    const hideIdentity = !claimed || !mine;
    const trulyAnonymous = Boolean(t?.anonymous);
    const anonymous = hideIdentity || trulyAnonymous;

    const student = t?.studentId || null;

    const title = !claimed
      ? `New Student • Unclaimed (${suffix})`
      : anonymous
      ? `Anonymous Student (${suffix})`
      : student?.fullName || `Student (${suffix})`;

    const meta = !anonymous && student?.studentNumber ? `#${student.studentNumber}` : null;

    const lastAt = t?.lastMessageAt || t?.updatedAt || t?.createdAt || null;
    const lastTime = lastAt ? formatRelative(lastAt) : "";

    const unread = Number(t?.unreadCounts?.[myId] || 0);

    const thread = (t?.messages || []).map((m) => {
      const by = String(m.senderId) === String(myId) ? "Counselor" : "Participant";
      return {
        id: String(m._id),
        by,
        at: formatClock(m.createdAt),
        text: m.text,
        _raw: m,
      };
    });

    return {
      id: threadId,
      title,
      meta,
      unread,
      lastMessage: t?.lastMessage || t?.lastMessageText || (thread[thread.length - 1]?.text || "—"),
      lastTime,
      anonymous,
      identityLocked: Boolean(t?.identityLocked),
      thread,
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

export async function sendDrawerMessage({ threadId, text, clientId = null, senderMode = null }) {
  const res = await sendMessageRaw({ threadId, text, clientId, senderMode });
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
