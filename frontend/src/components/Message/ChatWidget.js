// frontend/src/components/Message/ChatWidget.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FloatingMessagesPill from "./FloatingMessagesPill";
import MessagesDrawer from "./MessagesDrawer";
import { connectSocket } from "../../api/socket";
import { ensureThread, fetchThread, markThreadRead } from "../../api/messages.api";

/**
 * Drop this once (e.g., in App.js or a Layout) to enable student chat:
 * <ChatWidget />
 */
export default function ChatWidget({ accent = "#B9FF66" }) {
  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState("");
  const [unread, setUnread] = useState(0);

  const sessionKeyRef = useRef("");
  const socketRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || threads[0] || null,
    [threads, activeThreadId]
  );

  const rebuildUnread = useCallback((ts) => {
    const total = (ts || []).reduce((sum, t) => sum + (Number(t.unread) || 0), 0);
    setUnread(total);
  }, []);

  const upsertThread = useCallback((next) => {
    setThreads((prev) => {
      const idx = prev.findIndex((t) => t.id === next.id);
      if (idx < 0) return [next, ...prev];
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...next };
      return copy;
    });
  }, []);

  const ensureSocket = useCallback((sessionKey) => {
    if (socketRef.current) return socketRef.current;

    const s = connectSocket({ sessionKey });
    socketRef.current = s;

    s.on("message:new", ({ threadId, message, thread }) => {
      // Update thread summary + append message
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === threadId);
        const base = idx >= 0 ? prev[idx] : { id: threadId, messages: [] };

        const normalized = {
          id: threadId,
          status: thread?.status || base.status,
          lastMessage: thread?.lastMessage || base.lastMessage,
          lastTime: "now",
          unread: thread?.unreadStudent ?? base.unread ?? 0,
          messages: [...(base.messages || []), { id: message.id, from: message.by === "Counselor" ? "counselor" : "me", text: message.text, time: message.at, createdAt: message.createdAt }],
        };

        const nextArr = [...prev];
        if (idx < 0) nextArr.unshift(normalized);
        else nextArr[idx] = normalized;

        rebuildUnread(nextArr);
        return nextArr;
      });
    });

    s.on("thread:updated", ({ threadId, thread }) => {
      if (!threadId || !thread) return;
      // only update if already exists
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.id === threadId);
        if (idx < 0) return prev;
        const nextArr = [...prev];
        nextArr[idx] = { ...nextArr[idx], lastMessage: thread.lastMessage || nextArr[idx].lastMessage };
        rebuildUnread(nextArr);
        return nextArr;
      });
    });

    return s;
  }, [rebuildUnread]);

  // Called by MessagesDrawer when user starts student/anonymous session
  const handleStartSession = useCallback(async ({ mode, email, sessionKey }) => {
    sessionKeyRef.current = sessionKey || sessionKeyRef.current || "";
    const { thread } = await ensureThread({ mode, email, sessionKey: sessionKeyRef.current });

    const threadId = thread.id;
    setActiveThreadId(threadId);

    // load messages
    const data = await fetchThread(threadId, { sessionKey: sessionKeyRef.current, limit: 200 });
    const items = Array.isArray(data?.items) ? data.items : [];

    const formatted = {
      id: threadId,
      status: thread.status,
      lastMessage: thread.lastMessage || "",
      lastTime: thread.lastSeen || "",
      unread: thread.unreadStudent || 0,
      messages: items.map((m) => ({
        id: m.id,
        from: m.by === "Counselor" ? "counselor" : "me",
        text: m.text,
        time: m.at,
        createdAt: m.createdAt,
      })),
    };

    upsertThread(formatted);
    rebuildUnread([formatted]);

    const s = ensureSocket(sessionKeyRef.current);
    s.emit("thread:join", { threadId });

    return { threadId };
  }, [ensureSocket, rebuildUnread, upsertThread]);

  const onSendMessage = useCallback(async ({ threadId, text }) => {
    const s = socketRef.current;
    const payload = { threadId, text };

    // Prefer socket (real-time + server saves)
    if (s && s.connected) {
      const ack = await new Promise((resolve) => {
        s.emit("message:send", payload, resolve);
      });

      if (!ack?.ok) throw new Error(ack?.message || "Send failed");
      return { item: ack.item };
    }

    // Fallback to REST if socket not connected
    const { item, thread } = await (await import("../../api/messages.api")).sendMessage({
      threadId,
      text,
      sessionKey: sessionKeyRef.current,
    });

    // update local
    upsertThread((prev) => ({
      ...prev,
      id: threadId,
      lastMessage: thread?.lastMessage || "",
      messages: [...((prev && prev.messages) || []), { id: item.id, from: "me", text: item.text, time: item.at, createdAt: item.createdAt }],
    }));

    return { item };
  }, [upsertThread]);

  // mark read when opening
  useEffect(() => {
    if (!open || !activeThreadId) return;
    markThreadRead(activeThreadId, { sessionKey: sessionKeyRef.current }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeThreadId]);

  return (
    <>
      <FloatingMessagesPill
        accent={accent}
        unread={unread}
        onClick={() => setOpen(true)}
      />

      <MessagesDrawer
        open={open}
        onClose={() => setOpen(false)}
        threads={threads}
        initialThreadId={activeThread?.id || ""}
        onStartSession={handleStartSession}
        onSendMessage={onSendMessage}
        title="Messages"
      />
    </>
  );
}
