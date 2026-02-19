// src/pages/CounselorDashboard/Sections/Inbox.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { listThreads, listMessages, sendMessage, markRead } from "../../../api/messages.api";
import { joinThread, leaveThread, onNewMessage, onThreadActivity } from "../../../api/messagesRealtime";

const ACCENT = "#B9FF66";

function safeLower(v) {
  return String(v ?? "").toLowerCase().trim();
}

function fmtTimeAgo(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function fmtClock(iso) {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function badgeForThread(t) {
  if (t.assignedToMe) return { label: "Mine", tone: "bg-black text-white" };
  if (t.isAssigned) return { label: "Assigned", tone: "bg-black/5 text-black/70 border border-black/10" };
  return { label: "Unassigned", tone: "bg-white text-black/70 border border-black/10" };
}

export default function Inbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [activeId, setActiveId] = useState("");
  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) || null, [threads, activeId]);

  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sendErr, setSendErr] = useState("");

  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const chatEndRef = useRef(null);
  const scrollerRef = useRef(null);

  const refreshThreads = useCallback(async () => {
    setListError("");
    try {
      const res = await listThreads();
      const list = Array.isArray(res?.threads) ? res.threads : [];
      setThreads(list);
    } catch (e) {
      setListError(e?.message || "Failed to load inbox.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await refreshThreads();
      if (!alive) return;
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [refreshThreads]);

  // Realtime: refresh list when any thread activity happens
  useEffect(() => {
    const off = onThreadActivity(() => {
      refreshThreads();
    });
    return () => off?.();
  }, [refreshThreads]);

  // Select a thread -> load messages + join room
  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;

    (async () => {
      setSendErr("");
      setLoadingMsgs(true);
      try {
        joinThread(activeId);

        const res = await listMessages(activeId);
        if (cancelled) return;

        const list = Array.isArray(res?.messages) ? res.messages : [];
        setMessages(list);

        // only assigned counselor can clear counselor unread; safe to call regardless
        await markRead(activeId).catch(() => {});
        await refreshThreads();
      } catch (e) {
        if (!cancelled) setSendErr(e?.message || "Failed to load messages.");
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();

    return () => {
      cancelled = true;
      leaveThread(activeId);
    };
  }, [activeId, refreshThreads]);

  // Realtime: new messages in open thread
  useEffect(() => {
    if (!activeId) return;

    const off = onNewMessage(({ message, threadId }) => {
      if (!message) return;
      if (String(threadId) !== String(activeId)) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });

      // keep list fresh
      refreshThreads();

      requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    });

    return () => off?.();
  }, [activeId, refreshThreads]);

  const filteredThreads = useMemo(() => {
    const q = safeLower(search);
    return (threads || [])
      .filter((t) => {
        const name = safeLower(t?.other?.fullName || "");
        const code = safeLower(t?.shortCode || "");
        const last = safeLower(t?.lastMessageText || "");
        const hit = !q || name.includes(q) || code.includes(q) || last.includes(q);
        const passUnread = !unreadOnly || Number(t?.unread || 0) > 0;
        return hit && passUnread;
      })
      .sort((a, b) => {
        const ta = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });
  }, [threads, search, unreadOnly]);

  const canSend = useMemo(() => {
    if (!activeThread) return false;
    if (!activeThread.isAssigned) return true; // unassigned -> claim-on-reply
    if (activeThread.assignedToMe) return true;
    return false; // assigned to another counselor -> read-only
  }, [activeThread]);

  const handleSend = useCallback(
    async (text) => {
      const clean = String(text || "").trim();
      if (!clean || !activeId) return;

      setSendErr("");

      if (!canSend) {
        setSendErr("This thread is assigned to another counselor (read-only).");
        return;
      }

      // optimistic
      const tempId = `tmp_${Date.now()}`;
      const optimistic = {
        id: tempId,
        threadId: activeId,
        senderRole: "Counselor",
        senderId: "me",
        text: clean,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      requestAnimationFrame(() => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
      });

      try {
        await sendMessage(activeId, clean);
        // REST also triggers socket event; we keep de-dupe by id on socket.
        await refreshThreads();
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSendErr(e?.message || "Failed to send.");
      }
    },
    [activeId, canSend, refreshThreads]
  );

  return (
    <div className="w-full">
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        {/* LEFT: THREAD LIST */}
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold text-black">Inbox</div>
              <div className="text-[12px] text-black/60">System-wide view • Claim on reply</div>
            </div>
            <button
              onClick={refreshThreads}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-black/80 hover:bg-black/[0.03]"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <div className="flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search (name, code, message)…"
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-[13px] outline-none focus:border-black/20"
              />
            </div>
            <button
              onClick={() => setUnreadOnly((v) => !v)}
              className={`rounded-xl px-3 py-2 text-[12px] font-medium ${
                unreadOnly ? "bg-black text-white" : "border border-black/10 bg-white text-black/80 hover:bg-black/[0.03]"
              }`}
            >
              Unread
            </button>
          </div>

          {listError ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {listError}
            </div>
          ) : null}

          <div className="mt-3 max-h-[70vh] overflow-auto pr-1">
            {loading ? (
              <div className="py-10 text-center text-[13px] text-black/60">Loading threads…</div>
            ) : filteredThreads.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-black/60">No conversations found.</div>
            ) : (
              <div className="space-y-2">
                {filteredThreads.map((t) => {
                  const active = t.id === activeId;
                  const b = badgeForThread(t);
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveId(t.id)}
                      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                        active ? "border-black/20 bg-black/[0.03]" : "border-black/10 bg-white hover:bg-black/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="truncate text-[13px] font-semibold text-black">
                              {t?.other?.fullName || `Thread ${t.shortCode}`}
                            </div>
                            <span className={`rounded-full px-2 py-[3px] text-[10px] ${b.tone}`}>{b.label}</span>
                          </div>
                          <div className="mt-[2px] truncate text-[12px] text-black/65">
                            {t.lastMessageText || "No messages yet"}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="text-[11px] text-black/55">{fmtTimeAgo(t.lastMessageAt || t.updatedAt)}</div>
                          {Number(t.unread || 0) > 0 ? (
                            <div
                              className="min-w-[22px] rounded-full px-2 py-[2px] text-center text-[11px] font-semibold text-black"
                              style={{ background: ACCENT }}
                            >
                              {t.unread}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {!t.identityVisible && !t.isAssigned ? (
                        <div className="mt-2 text-[11px] text-black/55">
                          Identity hidden • Reply to claim & reveal
                        </div>
                      ) : null}

                      {t.isAssigned && !t.assignedToMe && t.assignedCounselor?.fullName ? (
                        <div className="mt-2 text-[11px] text-black/55">
                          Assigned to: <span className="font-medium text-black/75">{t.assignedCounselor.fullName}</span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: CHAT */}
        <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
          {!activeThread ? (
            <div className="flex h-[72vh] flex-col items-center justify-center px-6 text-center">
              <div className="text-[16px] font-semibold text-black">Select a conversation</div>
              <div className="mt-2 text-[13px] text-black/60">
                You can read all threads. Replying to an unassigned thread will automatically claim it.
              </div>
            </div>
          ) : (
            <div className="flex h-[72vh] flex-col">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold text-black">
                    {activeThread?.other?.fullName || `Thread ${activeThread.shortCode}`}
                  </div>
                  <div className="mt-[2px] text-[12px] text-black/60">
                    {activeThread.identityVisible
                      ? activeThread?.other?.studentNumber
                        ? `Student #${activeThread.other.studentNumber}`
                        : "Student"
                      : activeThread.isAssigned
                      ? "Read-only (assigned to another counselor)"
                      : "Identity hidden until you claim by replying"}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveId("");
                    setMessages([]);
                  }}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[12px] font-medium text-black/80 hover:bg-black/[0.03]"
                >
                  Close
                </button>
              </div>

              {/* Body */}
              <div ref={scrollerRef} className="flex-1 overflow-auto px-5 py-4">
                {loadingMsgs ? (
                  <div className="py-10 text-center text-[13px] text-black/60">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-black/60">No messages yet.</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => {
                      const mine = safeLower(m.senderRole) === "counselor";
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, x: mine ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                              mine ? "bg-black text-white" : "border border-black/10 bg-white text-black"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{m.text}</div>
                            <div className={`mt-2 text-[11px] ${mine ? "text-white/70" : "text-black/50"}`}>
                              {fmtClock(m.createdAt)}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-black/10 px-5 py-4">
                {sendErr ? (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                    {sendErr}
                  </div>
                ) : null}

                {!canSend ? (
                  <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-3 text-[12px] text-black/60">
                    This thread is assigned to another counselor. You can read messages but you cannot reply.
                  </div>
                ) : (
                  <Composer onSend={handleSend} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Composer({ onSend }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex items-end gap-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type a reply…"
        rows={1}
        className="min-h-[44px] flex-1 resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-[13px] outline-none focus:border-black/20"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const text = draft.trim();
            if (!text) return;
            onSend?.(text);
            setDraft("");
          }
        }}
      />
      <button
        onClick={() => {
          const text = draft.trim();
          if (!text) return;
          onSend?.(text);
          setDraft("");
        }}
        className="rounded-2xl px-4 py-3 text-[13px] font-semibold text-black shadow-sm"
        style={{ background: ACCENT }}
      >
        Send
      </button>
    </div>
  );
}
