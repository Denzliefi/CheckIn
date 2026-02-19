// frontend/src/components/Message/MessagesDrawer.js
import React, { useEffect, useMemo, useRef, useState } from "react";

const PH_TZ = "Asia/Manila";

function timeLabel(ts) {
  if (!ts) return "";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
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

function cls(...x) {
  return x.filter(Boolean).join(" ");
}

export default function MessagesDrawer({
  open,
  onClose,
  threads = [],
  onStartChat, // ({ visibility }) => Promise<void>
  onOpenThread, // (threadId) => Promise<void>
  onActiveThreadChange, // (threadId) => void
  onSendMessage, // ({ threadId, text }) => Promise<void>
  accent = "#B9FF66",
}) {
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [starting, setStarting] = useState(false);
  const [visibility, setVisibility] = useState("masked"); // masked | identified
  const [error, setError] = useState("");

  const list = useMemo(() => (Array.isArray(threads) ? threads : []), [threads]);
  const activeThread = useMemo(() => list.find((t) => t.id === activeId) || null, [list, activeId]);

  const scrollRef = useRef(null);

  // Pick default active thread
  useEffect(() => {
    if (!open) return;
    if (!list.length) {
      setActiveId("");
      return;
    }
    if (activeId && list.some((t) => t.id === activeId)) return;
    setActiveId(list[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, list.length]);

  useEffect(() => {
    if (!open) return;
    if (!activeId) return;
    onActiveThreadChange?.(activeId);
    // scroll
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function startChat() {
    if (!onStartChat) return;
    setStarting(true);
    setError("");
    try {
      await onStartChat({ visibility });
    } catch (e) {
      setError(String(e?.message || "Failed to start chat."));
    } finally {
      setStarting(false);
    }
  }

  async function openThread(threadId) {
    setActiveId(threadId);
    setError("");
    const t = list.find((x) => x.id === threadId);
    if (t && Array.isArray(t.messages) && t.messages.length) return;
    if (!onOpenThread) return;
    try {
      await onOpenThread(threadId);
    } catch (e) {
      setError(String(e?.message || "Failed to load conversation."));
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text) return;
    if (!activeThread) return;

    setDraft("");
    setError("");
    try {
      await onSendMessage?.({ threadId: activeThread.id, text });
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
      });
    } catch (e) {
      setError(String(e?.message || "Failed to send message."));
      setDraft(text); // restore
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-stretch justify-end"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{ background: "rgba(15, 23, 42, 0.35)", backdropFilter: "blur(6px)" }}
    >
      <div
        className={cls(
          "h-full w-full max-w-[980px] bg-white shadow-2xl border-l border-black/10",
          "flex flex-col"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-10 w-10 rounded-full grid place-items-center shrink-0"
              style={{ backgroundColor: `${accent}55` }}
            >
              💬
            </div>
            <div className="min-w-0">
              <div className="font-[Nunito] font-extrabold text-[15px] text-slate-900 truncate">
                Counselor Chat
              </div>
              <div className="font-[Lora] text-[12.5px] text-slate-500 truncate">
                {list.length ? "Your conversations" : "Start a conversation"}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onClose?.()}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-[Nunito] font-extrabold text-[13px]"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
          {/* Left list */}
          <div className="lg:w-[340px] border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
            <div className="px-4 py-3 flex items-center justify-between gap-2">
              <div className="text-[12px] font-extrabold text-slate-700 font-[Nunito]">
                Conversations
              </div>
              <span className="text-[11px] font-bold text-slate-400">{list.length}</span>
            </div>

            {list.length ? (
              <div className="max-h-[220px] lg:max-h-none overflow-y-auto">
                {list.map((t) => {
                  const isActive = t.id === activeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openThread(t.id)}
                      className={cls(
                        "w-full text-left px-4 py-3 border-t border-slate-100",
                        "hover:bg-slate-50 transition",
                        isActive && "bg-slate-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="font-[Nunito] font-extrabold text-[13px] text-slate-900 truncate">
                              {t.name || "Guidance Counselor"}
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
                          <div className="text-[12px] text-slate-500 truncate">
                            {t.lastMessage || "No messages yet"}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-[11px] font-bold text-slate-400">{t.lastTime || ""}</div>
                          {t.unread > 0 ? (
                            <div
                              className="mt-1 inline-flex items-center justify-center min-w-[20px] h-[20px] px-2 rounded-full text-[11px] font-extrabold text-slate-900"
                              style={{ backgroundColor: accent }}
                            >
                              {t.unread}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 pb-4">
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="font-[Nunito] font-extrabold text-slate-900 text-[13.5px]">
                    Start a new chat
                  </div>
                  <p className="mt-1 text-[12.5px] text-slate-600 font-[Lora]">
                    You can choose to hide your identity from counselors. (You are still logged in.)
                  </p>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[12px] font-extrabold text-slate-800 font-[Nunito]">
                        Hide my identity
                      </div>
                      <div className="text-[11px] text-slate-500">Counselor will see an alias only.</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVisibility((v) => (v === "masked" ? "identified" : "masked"))}
                      className={cls(
                        "relative inline-flex h-7 w-12 items-center rounded-full transition",
                        visibility === "masked" ? "bg-slate-900" : "bg-slate-300"
                      )}
                      aria-label="Toggle anonymity"
                    >
                      <span
                        className={cls(
                          "inline-block h-5 w-5 transform rounded-full bg-white transition",
                          visibility === "masked" ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>

                  {error ? (
                    <div className="mt-3 text-[12px] font-bold text-rose-600">{error}</div>
                  ) : null}

                  <button
                    type="button"
                    onClick={startChat}
                    disabled={starting || !onStartChat}
                    className={cls(
                      "mt-4 w-full rounded-xl px-4 py-3 font-[Nunito] font-extrabold text-[13px] transition",
                      starting ? "opacity-70 cursor-not-allowed" : "hover:brightness-95"
                    )}
                    style={{ backgroundColor: accent, color: "#141414" }}
                  >
                    {starting ? "Starting…" : "Start chat"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right chat */}
          <div className="flex-1 min-h-0 flex flex-col">
            {!activeThread ? (
              <div className="flex-1 grid place-items-center text-center px-6">
                <div className="max-w-md">
                  <div className="text-[14px] font-extrabold text-slate-900 font-[Nunito]">
                    {list.length ? "Select a conversation" : "Start a chat to begin"}
                  </div>
                  <div className="mt-1 text-[12.5px] text-slate-600 font-[Lora]">
                    Messages will appear here.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-[Nunito] font-extrabold text-[13.5px] text-slate-900 truncate">
                      {activeThread.name || "Guidance Counselor"}
                    </div>
                    <div className="text-[12px] text-slate-500 truncate">
                      {activeThread.visibility === "masked" ? "Anonymous to counselor" : "Identified to counselor"}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-400">{activeThread.status || "open"}</div>
                </div>

                {error ? (
                  <div className="px-4 sm:px-5 pt-3 text-[12px] font-bold text-rose-600">{error}</div>
                ) : null}

                <div
                  ref={scrollRef}
                  className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-4 sm:px-5 py-4 space-y-3"
                  style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                >
                  {(activeThread.messages || []).map((m) => {
                    const mine = m.from === "me";
                    return (
                      <div key={m.id} className={cls("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cls(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-[0_1px_0_rgba(0,0,0,0.04)] border",
                            mine ? "bg-white border-slate-200" : "bg-slate-900 border-slate-900"
                          )}
                          style={{ color: mine ? "#0f172a" : "#fff" }}
                        >
                          <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
                          <div
                            className={cls(
                              "mt-1 text-[10px] font-bold",
                              mine ? "text-slate-400" : "text-slate-300"
                            )}
                          >
                            {m.time || timeLabel(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-slate-200 bg-white px-4 sm:px-5 py-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={1}
                      placeholder="Type a message…"
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
                        !draft.trim() ? "opacity-60 cursor-not-allowed" : "hover:brightness-95"
                      )}
                      style={{ backgroundColor: accent, color: "#141414" }}
                    >
                      Send
                    </button>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 font-bold">
                    Tip: Press Enter to send, Shift+Enter for new line.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
