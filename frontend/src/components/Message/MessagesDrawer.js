// src/components/MessagesDrawer.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

const CHECKIN_GREEN = "#B9FF66";
const TEXT_MAIN = "#141414";

// 24h expiry from chat creation
const EXPIRE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year (avoid front-end expiry blocking real threads)

// session storage key (per session as requested)
const SS_KEY = "counselor_chat_session_v1";

/** ✅ SSR-safe media hook */
function useMedia(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();

    if (m.addEventListener) m.addEventListener("change", onChange);
    else m.addListener(onChange);

    return () => {
      if (m.removeEventListener) m.removeEventListener("change", onChange);
      else m.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

function safeParse(v, fallback) {
  try {
    if (!v) return fallback;
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function isValidEmail(email) {
  const e = String(email || "").trim();
  if (!e) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(e);
}

function sameDay(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function dayLabel(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isToday = sameDay(d, now);
  const isYday = sameDay(d, yesterday);

  if (isToday) return "Today";
  if (isYday) return "Yesterday";

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MessagesDrawer({
  open,
  onClose,
  threads = [],
  initialThreadId = "",
  onSendMessage, // async ({ threadId, text }) => messageObject
  title = "Messages",
}) {
  const PAGE_SIZE = 10;

  // views:
  // "mode" -> choose Student/Anonymous
  // "email" -> student email required
  // "chat" -> counselor chat
  const [view, setView] = useState("mode");

  const [mode, setMode] = useState(null); // "student" | "anonymous" | null
  const [studentEmail, setStudentEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [activeId, setActiveId] = useState(initialThreadId || threads?.[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // expiry session
  const [createdAtMs, setCreatedAtMs] = useState(null);
  const [expiresAtMs, setExpiresAtMs] = useState(null);

  // responsive flags
  const isMobile = useMedia("(max-width: 520px)");
  const isSmallHeight = useMedia("(max-height: 640px)");

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) || null,
    [threads, activeId]
  );

  const counselorClosed = useMemo(() => {
    const t = activeThread;
    if (!t) return false;
    return (
      t.status === "closed" ||
      t.closed === true ||
      t.endedBy === "counselor" ||
      t.closedByCounselor === true
    );
  }, [activeThread]);

  // normalize messages
  const normalizedMessages = useMemo(() => {
    const all = activeThread?.messages || [];
    return all.map((m, idx) => ({
      ...m,
      _idx: idx,
      createdAt: m.createdAt || m.time || Date.now(),
    }));
  }, [activeThread]);

  const visibleMessages = useMemo(() => {
    const all = normalizedMessages;
    const start = Math.max(0, all.length - visibleCount);
    return all.slice(start);
  }, [normalizedMessages, visibleCount]);

  // date separators + bubble grouping
  const chatRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < visibleMessages.length; i++) {
      const m = visibleMessages[i];
      const prev = visibleMessages[i - 1];
      const next = visibleMessages[i + 1];

      const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
      const sameAsPrevSender = !!prev && prev.from === m.from;
      const sameAsNextSender = !!next && next.from === m.from;

      const isStart = !sameAsPrevSender || showDay;
      const isEnd = !sameAsNextSender;

      if (showDay) rows.push({ type: "day", key: `day-${m._idx}`, label: dayLabel(m.createdAt) });

      rows.push({ type: "msg", key: m.id || `m-${m._idx}`, msg: m, isStart, isEnd });
    }
    return rows;
  }, [visibleMessages]);

  // ---------- Session persistence (per session) ----------
  function loadSession() {
    if (typeof window === "undefined") return null;
    return safeParse(window.sessionStorage.getItem(SS_KEY), null);
  }
  function saveSession(next) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(SS_KEY, JSON.stringify(next));
  }
  function clearSession() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(SS_KEY);
  }

  function resetToStart() {
    setView("mode");
    setMode(null);
    setStudentEmail("");
    setEmailTouched(false);
    setDraft("");
    setVisibleCount(PAGE_SIZE);
    setCreatedAtMs(null);
    setExpiresAtMs(null);
    setActiveId(initialThreadId || threads?.[0]?.id || "");
    clearSession();
  }

  // ✅ On open: restore from sessionStorage (resume until expiry)
  useEffect(() => {
    if (!open) return;

    const saved = loadSession();
    const defaultThreadId = initialThreadId || threads?.[0]?.id || "";
    setActiveId((prev) => prev || defaultThreadId);

    if (!saved) {
      setView("mode");
      setMode(null);
      setStudentEmail("");
      setEmailTouched(false);
      setDraft("");
      setVisibleCount(PAGE_SIZE);
      setCreatedAtMs(null);
      setExpiresAtMs(null);
      return;
    }

    const now = Date.now();
    if (saved?.expiresAtMs && now >= saved.expiresAtMs) {
      resetToStart();
      return;
    }

    setView(saved.view || "mode");
    setMode(saved.mode || null);
    setStudentEmail(saved.studentEmail || "");
    setCreatedAtMs(saved.createdAtMs || null);
    setExpiresAtMs(saved.expiresAtMs || null);
    setActiveId(saved.activeId || defaultThreadId);
    setVisibleCount(saved.visibleCount || PAGE_SIZE);
    setDraft("");
    setEmailTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // persist whenever key state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    saveSession({
      view,
      mode,
      studentEmail,
      createdAtMs,
      expiresAtMs,
      activeId,
      visibleCount,
    });
  }, [view, mode, studentEmail, createdAtMs, expiresAtMs, activeId, visibleCount]);

  // ✅ Expiry timer: if expired -> reset
  useEffect(() => {
    if (!open) return;
    if (!expiresAtMs) return;

    const id = window.setInterval(() => {
      if (Date.now() >= expiresAtMs) resetToStart();
    }, 15_000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expiresAtMs]);

  // refs for scroll control
  const chatEndRef = useRef(null);
  const chatBodyRef = useRef(null);

  // ✅ stable "load older messages" scroll restore
  const pendingScrollRestoreRef = useRef(null);

  function onChatScroll(e) {
    const el = e.currentTarget;
    if (el.scrollTop > 16) return;

    const total = normalizedMessages.length || 0;
    if (visibleCount >= total) return;

    pendingScrollRestoreRef.current = el.scrollHeight;
    setVisibleCount((c) => Math.min(total, c + PAGE_SIZE));
  }

  useEffect(() => {
    if (!open) return;
    if (view !== "chat") return;
    const el = chatBodyRef.current;
    if (!el) return;

    // restore after older messages render
    if (pendingScrollRestoreRef.current != null) {
      const prevHeight = pendingScrollRestoreRef.current;
      pendingScrollRestoreRef.current = null;
      el.scrollTop = el.scrollHeight - prevHeight;
    }
  }, [open, view, visibleMessages.length]);

  // ✅ always start at bottom when entering chat / switching thread
  useEffect(() => {
    if (!open) return;
    if (view !== "chat") return;

    requestAnimationFrame(() => {
      const el = chatBodyRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [open, view, activeId]);

  // responsive drawer style
  const drawerStyle = useMemo(() => {
    if (isMobile) {
      return {
        ...styles.drawer,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        borderRadius: 0,
        border: "none",
      };
    }

    return {
      ...styles.drawer,
      width: 420,
      height: isSmallHeight ? 560 : 640,
      right: 18,
      bottom: 18,
      borderRadius: 22,
      border: "1px solid rgba(20,20,20,0.10)",
    };
  }, [isMobile, isSmallHeight]);

  const overlayStyle = useMemo(() => {
    return {
      ...styles.overlay,
      background: isMobile ? "rgba(0,0,0,0.45)" : styles.overlay.background,
    };
  }, [isMobile]);

  const headerStyle = useMemo(() => {
    if (!isMobile) return styles.header;
    return { ...styles.header, padding: "12px 14px", gridTemplateColumns: "44px 1fr 44px" };
  }, [isMobile]);

  const headerBtnStyle = useMemo(() => {
    if (!isMobile) return styles.headerBtn;
    return { ...styles.headerBtn, width: 44, height: 44, borderRadius: 14 };
  }, [isMobile]);

  const isOpen = !!open;

  // ✅ expiry start (write immediately to sessionStorage)
  function ensureChatSessionStarted() {
    const saved = loadSession() || {};

    if (saved?.createdAtMs && saved?.expiresAtMs) {
      setCreatedAtMs(saved.createdAtMs);
      setExpiresAtMs(saved.expiresAtMs);
      return;
    }

    const now = Date.now();
    const next = { ...saved, createdAtMs: now, expiresAtMs: now + EXPIRE_MS };
    saveSession(next);
    setCreatedAtMs(next.createdAtMs);
    setExpiresAtMs(next.expiresAtMs);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || !activeThread) return;
    if (counselorClosed) return;
    if (expiresAtMs && Date.now() >= expiresAtMs) return;

    setDraft("");
    try {
      await onSendMessage?.({ threadId: activeThread.id, text });

      requestAnimationFrame(() => {
        const el = chatBodyRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (e) {
      console.error(e);
      setDraft(text);
    }
  }

  function goToChat(threadId) {
    setActiveId(threadId);
    setVisibleCount(PAGE_SIZE);
    ensureChatSessionStarted();
    setView("chat");
  }

  function chooseMode(nextMode) {
    setMode(nextMode);
    setDraft("");
    setVisibleCount(PAGE_SIZE);

    const threadId = initialThreadId || threads?.[0]?.id || "";

    if (nextMode === "anonymous") {
      setStudentEmail("");
      setEmailTouched(false);
      goToChat(threadId);
      return;
    }

    setView("email");
  }

  function continueStudent() {
    setEmailTouched(true);
    if (!isValidEmail(studentEmail)) return;

    const threadId = initialThreadId || threads?.[0]?.id || "";
    goToChat(threadId);
  }

  function endConversationByUser() {
    // optional confirm to prevent accidental reset
    const ok = window.confirm?.("End this conversation? It will reset to the beginning.");
    if (ok === false) return;
    resetToStart();
  }

  // ---------- UI ----------
  return !isOpen ? null : (
    <>
      <div style={overlayStyle} onClick={onClose} />

      <div style={drawerStyle} role="dialog" aria-label="Messages">
        <div style={headerStyle}>
          {view === "chat" ? (
            <button
              style={headerBtnStyle}
              onClick={endConversationByUser}
              aria-label="End conversation"
              title="End conversation"
            >
              End
            </button>
          ) : (
            <span style={{ width: isMobile ? 44 : 34 }} />
          )}

          <div style={styles.headerTitleWrap}>
            <div style={styles.headerTitleRow}>
              <span style={styles.headerTitle}>{view === "chat" ? "Counselor Chat" : title}</span>
              {mode ? (
                <span style={styles.modeBadge}>{mode === "student" ? "Student" : "Anonymous"}</span>
              ) : null}
            </div>
          </div>

          <button style={headerBtnStyle} onClick={onClose} aria-label="Close" title="Close">
            ✕
          </button>
        </div>

        {view === "mode" ? (
          <div style={styles.centerWrap}>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>Continue to counselor chat</div>
              <div style={styles.panelText}>
                Choose how you want to start. You can end the conversation anytime. Conversations expire after{" "}
                <b>24 hours</b> and will reset.
              </div>

              <div style={{ height: 12 }} />

              <button type="button" style={styles.bigChoiceBtn} onClick={() => chooseMode("student")}>
                <div style={styles.choiceTitle}>Continue as Student</div>
                <div style={styles.choiceSub}>Email required for follow-up if counselor doesn’t respond.</div>
              </button>

              <button type="button" style={styles.bigChoiceBtnAlt} onClick={() => chooseMode("anonymous")}>
                <div style={styles.choiceTitle}>Continue as Anonymous</div>
                <div style={styles.choiceSub}>No email required. Chat still expires after 24 hours.</div>
              </button>
            </div>
          </div>
        ) : view === "email" ? (
          <div style={styles.centerWrap}>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>Student email</div>
              <div style={styles.panelText}>
                Your email is required so we can follow up if the counselor doesn’t respond in chat. Stored{" "}
                <b>only for this session</b>.
              </div>

              <div style={{ height: 14 }} />

              <label style={styles.label}>Email address</label>
              <input
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    continueStudent();
                  }
                }}
                placeholder="name@school.edu"
                style={{
                  ...styles.input,
                  ...(emailTouched && !isValidEmail(studentEmail) ? styles.inputError : null),
                }}
              />

              {emailTouched && !isValidEmail(studentEmail) ? (
                <div style={styles.errorText}>Please enter a valid email.</div>
              ) : (
                <div style={styles.hintText}>Example: name@school.edu</div>
              )}

              <div style={{ height: 14 }} />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" style={styles.secondaryBtn} onClick={resetToStart}>
                  Back
                </button>

                <button
                  type="button"
                  style={{
                    ...styles.primaryBtn,
                    ...(isValidEmail(studentEmail) ? null : styles.primaryBtnDisabled),
                  }}
                  onClick={continueStudent}
                  disabled={!isValidEmail(studentEmail)}
                >
                  Continue to Chat
                </button>
              </div>
            </div>
          </div>
        ) : (
          // CHAT VIEW
          <div style={styles.chatWrap}>
            <div style={styles.systemWrap}>
              <div style={styles.systemBubble}>
                <div style={styles.systemTitle}>Your privacy is valued.</div>
                <div style={styles.systemText}>
                  Counselors will reply as soon as possible. If this is an emergency, contact your local hotline.
                </div>
              </div>

              {!activeThread ? (
                <div style={styles.closedBanner}>
                  No counselor conversation is available yet.
                  <button type="button" style={styles.closedBannerBtn} onClick={resetToStart}>
                    Restart
                  </button>
                </div>
              ) : counselorClosed ? (
                <div style={styles.closedBanner}>
                  This conversation has been closed by the counselor.
                  <button type="button" style={styles.closedBannerBtn} onClick={resetToStart}>
                    Start new conversation
                  </button>
                </div>
              ) : null}

              {expiresAtMs ? (
                <div style={styles.expireHint}>
                  Expires:{" "}
                  <b>
                    {new Date(expiresAtMs).toLocaleString(undefined, {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </b>
                </div>
              ) : null}
            </div>

            <div ref={chatBodyRef} style={styles.chatBody} onScroll={onChatScroll}>
              <div style={styles.topFade} aria-hidden="true" />

              {normalizedMessages.length > visibleCount ? (
                <div style={styles.loadMoreHint}>Loading earlier messages…</div>
              ) : (
                <div style={styles.loadMoreHintDim}>Start of conversation</div>
              )}

              {chatRows.map((row) => {
                if (row.type === "day") {
                  return (
                    <div key={row.key} style={styles.dayRow}>
                      <span style={styles.dayChip}>{row.label}</span>
                    </div>
                  );
                }

                const m = row.msg;
                const isMe = m.from === "me";

                const bubbleStyle = {
                  ...styles.bubble,
                  ...(isMe ? styles.bubbleMe : styles.bubbleThem),
                  ...(row.isStart ? null : isMe ? styles.bubbleMeMid : styles.bubbleThemMid),
                  ...(row.isEnd ? null : isMe ? styles.bubbleMeMid2 : styles.bubbleThemMid2),
                };

                return (
                  <div
                    key={row.key}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: row.isEnd ? 12 : 6,
                    }}
                  >
                    <div style={bubbleStyle}>
                      <div style={styles.bubbleText}>{m.text}</div>
                      {row.isEnd && m.time ? <div style={styles.bubbleTime}>{m.time}</div> : null}
                    </div>
                  </div>
                );
              })}

              <div ref={chatEndRef} />
            </div>

            <div style={styles.inputBar}>
              <button style={styles.iconBtn} type="button" aria-label="Emoji" title="Emoji">
                🙂
              </button>

              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={counselorClosed ? "Conversation closed." : "Type a message…"}
                style={{
                  ...styles.textarea,
                  ...(counselorClosed || !activeThread ? styles.textareaDisabled : null),
                }}
                rows={1}
                disabled={counselorClosed || !activeThread}
              />

              <button style={styles.iconBtn} type="button" aria-label="Attach" title="Attach">
                📎
              </button>

              <button
                style={{
                  ...styles.sendIcon,
                  ...(draft.trim() && !counselorClosed && activeThread ? null : styles.sendIconDisabled),
                }}
                type="button"
                onClick={handleSend}
                disabled={!draft.trim() || counselorClosed || !activeThread}
                aria-label="Send"
                title="Send"
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * ✅ Your styles are kept the same.
 * (No changes below)
 */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.25)",
    zIndex: 9998,
  },

  drawer: {
    position: "fixed",
    zIndex: 9999,
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 18px 48px rgba(0,0,0,0.22)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    color: TEXT_MAIN,
  },

  header: {
    padding: "12px 12px",
    display: "grid",
    gridTemplateColumns: "34px 1fr 34px",
    alignItems: "center",
    borderBottom: "1px solid rgba(20,20,20,0.08)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.86))",
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(20,20,20,0.10)",
    background: "rgba(20,20,20,0.04)",
    color: TEXT_MAIN,
    cursor: "pointer",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 900,
    fontSize: 14,
  },

  headerTitleWrap: { minWidth: 0, paddingLeft: 10, paddingRight: 10 },
  headerTitleRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  headerTitle: { color: TEXT_MAIN, fontFamily: "Lora, serif", fontWeight: 900, fontSize: 19, letterSpacing: "0.2px" },
  modeBadge: {
    borderRadius: 999,
    padding: "4px 10px",
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(185,255,102,0.35)",
    fontFamily: "Nunito, sans-serif",
    fontWeight: 900,
    fontSize: 12,
    color: TEXT_MAIN,
  },

  centerWrap: { flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 14 },
  panel: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 18,
    border: "1px solid rgba(20,20,20,0.10)",
    background: "rgba(255,255,255,0.80)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
    padding: 16,
  },
  panelTitle: { fontFamily: "Lora, serif", fontWeight: 900, fontSize: 18, color: TEXT_MAIN },
  panelText: { marginTop: 6, fontFamily: "Nunito, sans-serif", fontWeight: 750, fontSize: 14, color: "rgba(20,20,20,0.72)", lineHeight: 1.55 },

  bigChoiceBtn: {
    width: "100%",
    textAlign: "left",
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(185,255,102,0.55)",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
    marginBottom: 10,
  },
  bigChoiceBtnAlt: {
    width: "100%",
    textAlign: "left",
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "rgba(255,255,255,0.86)",
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(0,0,0,0.06)",
  },
  choiceTitle: { fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 16, color: TEXT_MAIN },
  choiceSub: { marginTop: 4, fontFamily: "Nunito, sans-serif", fontWeight: 750, fontSize: 13, color: "rgba(20,20,20,0.70)", lineHeight: 1.45 },

  label: { display: "block", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 13, color: "rgba(20,20,20,0.78)", marginBottom: 6 },
  input: { width: "100%", borderRadius: 14, border: "1px solid rgba(20,20,20,0.12)", background: "rgba(255,255,255,0.92)", padding: "12px 12px", outline: "none", fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 14, color: TEXT_MAIN },
  inputError: { borderColor: "rgba(255,59,48,0.65)", boxShadow: "0 0 0 4px rgba(255,59,48,0.10)" },
  hintText: { marginTop: 6, fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 12, color: "rgba(20,20,20,0.55)" },
  errorText: { marginTop: 6, fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 12, color: "#FF3B30" },

  primaryBtn: { flex: 1, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: CHECKIN_GREEN, color: TEXT_MAIN, cursor: "pointer", padding: "12px 12px", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 14 },
  primaryBtnDisabled: { opacity: 0.55, cursor: "not-allowed" },
  secondaryBtn: { width: 110, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", background: "rgba(20,20,20,0.04)", color: TEXT_MAIN, cursor: "pointer", padding: "12px 12px", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 14 },

  chatWrap: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 },

  systemWrap: { padding: "10px 12px 0" },
  systemBubble: { borderRadius: 16, border: "1px dashed rgba(20,20,20,0.18)", background: "rgba(255,255,255,0.80)", padding: "12px 12px" },
  systemTitle: { fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 13, color: TEXT_MAIN, letterSpacing: "0.2px" },
  systemText: { marginTop: 6, fontFamily: "Nunito, sans-serif", fontWeight: 750, fontSize: 13, color: "rgba(20,20,20,0.72)", lineHeight: 1.5 },

  closedBanner: { marginTop: 10, borderRadius: 16, border: "1px solid rgba(255,59,48,0.25)", background: "rgba(255,59,48,0.08)", padding: "10px 12px", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 13, color: "rgba(20,20,20,0.85)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  closedBannerBtn: { borderRadius: 999, border: "1px solid rgba(0,0,0,0.10)", background: "rgba(255,255,255,0.85)", padding: "8px 10px", cursor: "pointer", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 12, color: TEXT_MAIN, whiteSpace: "nowrap" },

  expireHint: { marginTop: 10, fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 12, color: "rgba(20,20,20,0.55)" },

  chatBody: { padding: 12, overflow: "auto", flex: 1, background: "radial-gradient(circle at 18% 30%, rgba(185,255,102,0.16) 0 2px, transparent 3px), radial-gradient(circle at 68% 70%, rgba(185,255,102,0.12) 0 2px, transparent 3px), linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.92))" },
  topFade: { position: "sticky", top: 0, height: 14, marginTop: -12, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0))", zIndex: 2 },

  loadMoreHint: { textAlign: "center", padding: "10px 0 12px", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 12, color: "rgba(20,20,20,0.58)" },
  loadMoreHintDim: { textAlign: "center", padding: "10px 0 12px", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 12, color: "rgba(20,20,20,0.38)" },

  dayRow: { display: "flex", justifyContent: "center", margin: "8px 0 12px" },
  dayChip: { padding: "6px 10px", borderRadius: 999, background: "rgba(20,20,20,0.06)", border: "1px solid rgba(20,20,20,0.08)", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 12, color: "rgba(20,20,20,0.65)" },

  bubble: { maxWidth: "82%", padding: "12px 13px", borderRadius: 18, border: "1px solid rgba(20,20,20,0.08)", boxShadow: "0 8px 18px rgba(0,0,0,0.06)" },
  bubbleMe: { background: CHECKIN_GREEN, color: TEXT_MAIN, borderColor: "rgba(0,0,0,0.10)", borderTopRightRadius: 10 },
  bubbleThem: { background: "rgba(255,255,255,0.95)", color: TEXT_MAIN, borderTopLeftRadius: 10 },
  bubbleMeMid: { borderTopRightRadius: 8 },
  bubbleMeMid2: { borderBottomRightRadius: 8 },
  bubbleThemMid: { borderTopLeftRadius: 8 },
  bubbleThemMid2: { borderBottomLeftRadius: 8 },

  bubbleText: { fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 15, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" },
  bubbleTime: { marginTop: 8, fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 11, opacity: 0.65, textAlign: "right" },

  inputBar: { padding: 10, paddingBottom: "calc(10px + env(safe-area-inset-bottom))", borderTop: "1px solid rgba(20,20,20,0.08)", display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,0.92)" },
  iconBtn: { width: 40, height: 40, borderRadius: 14, border: "1px solid rgba(20,20,20,0.10)", background: "rgba(20,20,20,0.04)", color: TEXT_MAIN, cursor: "pointer", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 16 },

  textarea: { flex: 1, minHeight: 40, maxHeight: 120, resize: "none", borderRadius: 16, border: "1px solid rgba(20,20,20,0.10)", background: "rgba(255,255,255,0.86)", color: TEXT_MAIN, padding: "11px 12px", outline: "none", fontFamily: "Nunito, sans-serif", fontWeight: 800, fontSize: 14, lineHeight: 1.45 },
  textareaDisabled: { opacity: 0.7, cursor: "not-allowed" },

  sendIcon: { width: 40, height: 40, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: CHECKIN_GREEN, color: TEXT_MAIN, cursor: "pointer", fontFamily: "Nunito, sans-serif", fontWeight: 900, fontSize: 18, display: "grid", placeItems: "center" },
  sendIconDisabled: { opacity: 0.55, cursor: "not-allowed" },
};
