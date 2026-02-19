// frontend/src/pages/CounselorDashboard/Sections/Inbox.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMyUserId,
  getThreadRaw,
  listThreadsRaw,
  sendMessageRaw,
  markThreadRead,
  toInboxItems,
} from "../../../api/messages.api";
import {
  connectMessagesSocket,
  onMessageNew,
  onThreadCreated,
  onThreadUpdate,
} from "../../../api/messagesRealtime";

const PH_TZ = "Asia/Manila";

function formatClock(iso) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: PH_TZ,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function makeClientId() {
  return `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function Inbox() {
  const myId = getMyUserId();

  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [rightLoading, setRightLoading] = useState(false);
  const [error, setError] = useState("");

  const active = useMemo(() => items.find((x) => String(x.id) === String(activeId)) || null, [items, activeId]);

  const isReadOnly = useMemo(() => {
    const cId = active?._raw?.counselorId?._id || active?._raw?.counselorId;
    if (!cId) return false; // unclaimed -> can claim on reply
    return String(cId) !== String(myId);
  }, [active, myId]);

  const refreshList = useCallback(async () => {
    try {
      const res = await listThreadsRaw({ includeMessages: true, limit: 20 });
      const mapped = toInboxItems(res?.items || []);
      setItems(mapped);

      // keep selection stable
      if (!activeId && mapped.length) setActiveId(mapped[0].id);
    } catch (e) {
      setError(e?.message || "Failed to load inbox.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  const refreshThread = useCallback(async (threadId) => {
    if (!threadId) return;
    setRightLoading(true);
    try {
      const res = await getThreadRaw(threadId, { limit: 80 });
      const t = res?.item;
      const my = getMyUserId();

      const uiMsgs =
        (t?.messages || []).map((m) => ({
          id: String(m._id),
          by: String(m.senderId) === String(my) ? "Counselor" : "Participant",
          at: formatClock(m.createdAt),
          text: m.text,
          _raw: m,
        })) || [];

      setMessages(uiMsgs);
      markThreadRead(threadId).catch(() => {});
    } catch (e) {
      setError(e?.message || "Failed to load thread.");
    } finally {
      setRightLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load thread when active changes
  useEffect(() => {
    if (!activeId) return;
    refreshThread(activeId);
  }, [activeId, refreshThread]);

  // Realtime listeners
  useEffect(() => {
    const s = connectMessagesSocket();

    const offNew = onMessageNew((payload) => {
      const tid = String(payload?.threadId || "");
      const msg = payload?.message;
      if (!tid || !msg?._id) return;

      // If active thread, append deduped
      setMessages((prev) => {
        if (String(activeId) !== tid) return prev;
        const exists = prev.some((m) => String(m.id) === String(msg._id));
        if (exists) return prev;
        const my = getMyUserId();
        return [
          ...prev,
          {
            id: String(msg._id),
            by: String(msg.senderId) === String(my) ? "Counselor" : "Participant",
            at: formatClock(msg.createdAt),
            text: msg.text,
            _raw: msg,
          },
        ];
      });

      // Always refresh list quickly for ordering/unread/claimed status
      refreshList();
    });

    const offUpd = onThreadUpdate(() => refreshList());
    const offCreate = onThreadCreated(() => refreshList());

    return () => {
      try { offNew?.(); } catch {}
      try { offUpd?.(); } catch {}
      try { offCreate?.(); } catch {}
      try { s?.close?.(); } catch {}
    };
  }, [activeId, refreshList]);

  const handleSend = async () => {
    if (!activeId) return;
    const text = String(draft || "").trim();
    if (!text) return;

    setError("");
    setDraft("");

    // Optimistic message (single)
    const tmpId = `tmp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tmpId, by: "Counselor", at: "now", text, _optimistic: true },
    ]);

    try {
      const res = await sendMessageRaw({ threadId: activeId, text, clientId: makeClientId() });
      const real = res?.item;
      if (real?._id) {
        setMessages((prev) => {
          const exists = prev.some((m) => String(m.id) === String(real._id));
          const withoutTmp = prev.filter((m) => m.id !== tmpId);
          if (exists) return withoutTmp;
          return [
            ...withoutTmp,
            {
              id: String(real._id),
              by: "Counselor",
              at: formatClock(real.createdAt),
              text: real.text,
              _raw: real,
            },
          ];
        });
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      }

      markThreadRead(activeId).catch(() => {});
      refreshList();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      setDraft(text);
      setError(e?.message || "Failed to send. If someone already claimed it, refresh.");
    }
  };

  return (
    <div className="w-full">
      <div className="mb-3">
        <h2 className="text-[18px] font-semibold text-[#141414]">Inbox</h2>
        <p className="text-sm text-[rgba(20,20,20,0.66)]">
          Open inbox (system-wide). First reply claims the conversation.
        </p>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-[#ffd6d6] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        {/* Left list */}
        <div className="rounded-2xl border border-[#e9e9e9] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-[#141414]">Conversations</div>
            <button
              onClick={refreshList}
              className="rounded-lg border border-[#e9e9e9] bg-white px-3 py-1.5 text-xs font-semibold text-[#141414] hover:bg-[#f7f7f7]"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-3 text-sm text-[rgba(20,20,20,0.66)]">Loading…</div>
          ) : items.length ? (
            <div className="max-h-[520px] overflow-auto pr-1">
              {items.map((it) => {
                const selected = String(it.id) === String(activeId);
                const claimedBy = it?._raw?.counselorId?._id || it?._raw?.counselorId || null;
                const claimed = !!claimedBy;
                const mine = claimedBy && String(claimedBy) === String(myId);

                return (
                  <button
                    key={it.id}
                    onClick={() => setActiveId(it.id)}
                    className={[
                      "w-full text-left rounded-xl border px-3 py-3 mb-2 transition",
                      selected ? "border-[#B9FF66] bg-[#f6ffe8]" : "border-[#eeeeee] bg-white hover:bg-[#fafafa]",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-[#141414]">{it.name}</div>
                        <div className="mt-0.5 text-xs text-[rgba(20,20,20,0.66)]">
                          {claimed ? (mine ? "Claimed by you" : "Claimed") : "Unclaimed"}
                        </div>
                      </div>

                      {it.unread ? (
                        <div className="min-w-[24px] rounded-full bg-[#141414] px-2 py-0.5 text-center text-[11px] font-bold text-white">
                          {it.unread}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-2 line-clamp-2 text-xs text-[rgba(20,20,20,0.66)]">
                      {it.preview || it.thread?.[it.thread.length - 1]?.text || "—"}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 text-sm text-[rgba(20,20,20,0.66)]">No conversations yet.</div>
          )}
        </div>

        {/* Right chat */}
        <div className="rounded-2xl border border-[#e9e9e9] bg-white p-3">
          {!active ? (
            <div className="p-6 text-sm text-[rgba(20,20,20,0.66)]">Select a conversation.</div>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[#141414]">{active.name}</div>
                  <div className="text-xs text-[rgba(20,20,20,0.66)]">
                    {isReadOnly ? "Read-only (already claimed by another counselor)" : "Replying will claim this chat"}
                  </div>
                </div>
                <button
                  onClick={() => refreshThread(activeId)}
                  className="rounded-lg border border-[#e9e9e9] bg-white px-3 py-1.5 text-xs font-semibold text-[#141414] hover:bg-[#f7f7f7]"
                >
                  Reload
                </button>
              </div>

              <div className="h-[520px] overflow-auto rounded-xl border border-[#f1f1f1] bg-[#fbfbfb] p-3">
                {rightLoading ? (
                  <div className="text-sm text-[rgba(20,20,20,0.66)]">Loading messages…</div>
                ) : messages.length ? (
                  <div className="space-y-2">
                    {messages.map((m) => {
                      const mine = m.by === "Counselor";
                      return (
                        <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                          <div
                            className={[
                              "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                              mine ? "bg-[#B9FF66] text-[#141414]" : "bg-white text-[#141414] border border-[#ededed]",
                            ].join(" ")}
                          >
                            <div className="whitespace-pre-wrap break-words">{m.text}</div>
                            <div className="mt-1 text-[11px] text-[rgba(20,20,20,0.66)]">{m.at || ""}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-[rgba(20,20,20,0.66)]">No messages yet.</div>
                )}
              </div>

              <div className="mt-3 flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={2}
                  disabled={isReadOnly}
                  placeholder={isReadOnly ? "Read-only" : "Type a reply…"}
                  className="w-full resize-none rounded-xl border border-[#e9e9e9] bg-white px-3 py-2 text-sm outline-none focus:border-[#B9FF66]"
                />
                <button
                  onClick={handleSend}
                  disabled={isReadOnly || !draft.trim()}
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    isReadOnly || !draft.trim()
                      ? "bg-[#e9e9e9] text-[#888]"
                      : "bg-[#141414] text-white hover:opacity-90",
                  ].join(" ")}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
