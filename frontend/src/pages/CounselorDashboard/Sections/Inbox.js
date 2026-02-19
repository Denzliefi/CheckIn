// frontend/src/pages/CounselorDashboard/Sections/Inbox.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { connectSocket } from "../../../api/socket";
import {
  counselorCloseThread,
  counselorGetThread,
  counselorListInbox,
  counselorMarkRead,
  counselorSendMessage,
  mapRealtimeCounselorMessage,
} from "../../../api/messages.api";

const PH_TZ = "Asia/Manila";

function timeLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PH_TZ,
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function cls(...x) {
  return x.filter(Boolean).join(" ");
}

export default function Inbox() {
  const [items, setItems] = useState([]); // inbox threads
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const selected = useMemo(() => items.find((x) => x.id === selectedId) || null, [items, selectedId]);

  const scrollRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => String(x.displayName || "").toLowerCase().includes(q));
  }, [items, search]);

  const loadInbox = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const raw = await counselorListInbox();
      const mapped = raw.map((t) => ({
        id: t.id,
        status: t.status,
        visibility: t.visibility,
        displayName: t.displayName,
        studentNumber: t.studentNumber,
        lastMessage: t.lastMessage || "",
        lastMessageAt: t.lastMessageAt,
        unread: Number(t.unread || 0),
        messages: null, // load on open
      }));
      setItems(mapped);

      if (!selectedId && mapped.length) setSelectedId(mapped[0].id);
    } catch (e) {
      setError(String(e?.message || "Failed to load inbox."));
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const openThread = useCallback(async (threadId) => {
    if (!threadId) return;
    setSelectedId(threadId);
    setError("");

    try {
      const s = connectSocket();
      s.emit("thread:join", { threadId });

      await counselorMarkRead(threadId);

      // load messages
      const full = await counselorGetThread(threadId, { limit: 100 });

      setItems((prev) =>
        (prev || []).map((t) =>
          t.id === threadId
            ? {
                ...t,
                ...full,
                messages: full.messages || [],
                unread: 0,
              }
            : t
        )
      );

      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    } catch (e) {
      setError(String(e?.message || "Failed to open conversation."));
    }
  }, []);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || !selectedId) return;

    setDraft("");
    setError("");

    // optimistic message
    const optimistic = {
      id: `optimistic-${Date.now()}`,
      by: "Counselor",
      at: timeLabel(new Date().toISOString()),
      text,
      createdAt: Date.now(),
    };

    setItems((prev) =>
      (prev || []).map((t) => {
        if (t.id !== selectedId) return t;
        const msgs = Array.isArray(t.messages) ? t.messages : [];
        return {
          ...t,
          messages: [...msgs, optimistic],
          lastMessage: text,
          lastMessageAt: new Date().toISOString(),
        };
      })
    );

    try {
      const { message, thread } = await counselorSendMessage({ threadId: selectedId, text });

      setItems((prev) =>
        (prev || []).map((t) => {
          if (t.id !== selectedId) return t;
          const msgs = Array.isArray(t.messages) ? t.messages.filter((m) => !String(m.id).startsWith("optimistic-")) : [];
          return {
            ...t,
            ...(thread || {}),
            messages: message ? [...msgs, message] : msgs,
            unread: 0,
          };
        })
      );

      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    } catch (e) {
      // rollback optimistic
      setItems((prev) =>
        (prev || []).map((t) => {
          if (t.id !== selectedId) return t;
          const msgs = Array.isArray(t.messages) ? t.messages.filter((m) => !String(m.id).startsWith("optimistic-")) : t.messages;
          return { ...t, messages: msgs };
        })
      );
      setError(String(e?.message || "Failed to send message."));
      setDraft(text);
    }
  }, [draft, selectedId]);

  const closeThread = useCallback(async () => {
    if (!selectedId) return;
    setError("");
    try {
      await counselorCloseThread(selectedId);
      // refresh list
      await loadInbox();
      setSelectedId("");
      setDraft("");
    } catch (e) {
      setError(String(e?.message || "Failed to close thread."));
    }
  }, [selectedId, loadInbox]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  // Socket updates
  useEffect(() => {
    const s = connectSocket();

    const onInboxUpdated = () => loadInbox();

    const onMessage = (evt) => {
      const tid = evt?.threadId;
      const msg = mapRealtimeCounselorMessage(evt);
      if (!tid || !msg) return;

      setItems((prev) =>
        (prev || []).map((t) => {
          if (t.id !== tid) return t;

          const isOpenNow = tid === selectedId && Array.isArray(t.messages);
          const nextUnread = msg.by === "Participant" && !isOpenNow ? Number(t.unread || 0) + 1 : Number(t.unread || 0);

          return {
            ...t,
            lastMessage: msg.text,
            lastMessageAt: evt?.message?.createdAt || new Date().toISOString(),
            unread: nextUnread,
            messages: isOpenNow ? [...t.messages, msg] : t.messages,
          };
        })
      );

      // auto-scroll if viewing
      if (tid === selectedId) {
        requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      }
    };

    s.on("inbox:updated", onInboxUpdated);
    s.on("message:new", onMessage);

    return () => {
      s.off("inbox:updated", onInboxUpdated);
      s.off("message:new", onMessage);
    };
  }, [loadInbox, selectedId]);

  // Open first thread after load
  useEffect(() => {
    if (!items.length) return;
    if (!selectedId) return;
    // load messages if not loaded
    const cur = items.find((x) => x.id === selectedId);
    if (cur && cur.messages === null) openThread(selectedId);
  }, [items, selectedId, openThread]);

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: list */}
        <div className="lg:w-[360px] rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="font-[Nunito] font-extrabold text-slate-900">Inbox</div>
              {loading ? <div className="text-[12px] font-bold text-slate-400">Loading…</div> : null}
            </div>
            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student…"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            {error ? <div className="mt-3 text-[12px] font-bold text-rose-600">{error}</div> : null}
          </div>

          <div className="max-h-[420px] lg:max-h-[680px] overflow-y-auto">
            {!filtered.length ? (
              <div className="p-5 text-[13px] text-slate-500">No conversations yet.</div>
            ) : (
              filtered.map((t) => {
                const active = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => openThread(t.id)}
                    className={cls(
                      "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition",
                      active && "bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-[Nunito] font-extrabold text-[13px] text-slate-900 truncate">
                            {t.displayName}
                          </div>
                          {t.visibility === "masked" ? (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-slate-100 text-slate-600 font-bold">
                              Anonymous
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-[2px] rounded-full bg-emerald-50 text-emerald-700 font-bold">
                              Identified
                            </span>
                          )}
                        </div>
                        {t.studentNumber ? (
                          <div className="text-[11px] text-slate-500 font-bold">#{t.studentNumber}</div>
                        ) : null}
                        <div className="mt-1 text-[12px] text-slate-500 truncate">
                          {t.lastMessage || "No messages yet"}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-bold text-slate-400">{timeLabel(t.lastMessageAt)}</div>
                        {t.unread > 0 ? (
                          <div className="mt-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-2 rounded-full text-[11px] font-extrabold bg-slate-900 text-white">
                            {t.unread}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: chat */}
        <div className="flex-1 rounded-3xl border border-slate-200 bg-white overflow-hidden flex flex-col min-h-[520px]">
          {!selected ? (
            <div className="flex-1 grid place-items-center text-slate-500">Select a conversation.</div>
          ) : (
            <>
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-[Nunito] font-extrabold text-slate-900 truncate">{selected.displayName}</div>
                  <div className="text-[12px] text-slate-500 truncate">
                    {selected.visibility === "masked" ? "Student is anonymous to you" : "Student is identified to you"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeThread}
                  className="px-4 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-[Nunito] font-extrabold text-[12.5px]"
                >
                  Close thread
                </button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 px-4 sm:px-5 py-4 space-y-3">
                {selected.messages === null ? (
                  <div className="text-[13px] text-slate-500">Loading messages…</div>
                ) : (selected.messages || []).length === 0 ? (
                  <div className="text-[13px] text-slate-500">No messages yet.</div>
                ) : (
                  (selected.messages || []).map((m) => {
                    const mine = m.by === "Counselor";
                    return (
                      <div key={m.id} className={cls("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cls(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 border shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                            mine ? "bg-white border-slate-200" : "bg-slate-900 border-slate-900"
                          )}
                          style={{ color: mine ? "#0f172a" : "#fff" }}
                        >
                          <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                          <div className={cls("mt-1 text-[10px] font-bold", mine ? "text-slate-400" : "text-slate-300")}>
                            {m.at}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-slate-200 bg-white px-4 sm:px-5 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={1}
                    placeholder="Type a reply…"
                    className="flex-1 min-h-[44px] max-h-[140px] resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] outline-none focus:ring-2 focus:ring-slate-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!draft.trim()}
                    className={cls(
                      "shrink-0 rounded-2xl px-4 py-3 font-[Nunito] font-extrabold text-[13px] transition",
                      !draft.trim() ? "opacity-60 cursor-not-allowed" : "bg-slate-900 text-white hover:opacity-95"
                    )}
                  >
                    Send
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 font-bold">
                  Enter to send • Shift+Enter for new line
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
