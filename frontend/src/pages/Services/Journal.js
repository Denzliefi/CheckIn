// src/pages/Journal.js
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/** CheckIn palette */
const CHECKIN_GREEN = "#B9FF66";
const CHECKIN_DARK = "#141414";

/** =========================
    STORAGE (Journal Entry per date)
========================= */
const ENTRIES_KEY = "journal_entries_v1";

/** Notes limit */
const NOTES_WORD_LIMIT = 100;

function loadEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // ✅ prevent crashes if storage is corrupted / not an object
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

/** ✅ safer write (localStorage can throw) */
function saveEntries(entries) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/** Keep PHQ shape for back-compat */
function ensureEntryShape(e) {
  const base = {
    mood: "",
    reason: "",
    notes: "",
    daySubmitted: false,
    daySubmittedAt: null,
    phq: { answers: Array(9).fill(null), submitted: false, score: null, completedAt: null },
  };
  if (!e) return base;
  return {
    ...base,
    ...e,
    notes: typeof e.notes === "string" ? e.notes : "",
    daySubmitted: !!e?.daySubmitted,
    daySubmittedAt: e?.daySubmittedAt || null,
    phq: {
      ...base.phq,
      ...(e.phq || {}),
      answers: Array.isArray(e?.phq?.answers)
        ? [...e.phq.answers].slice(0, 9).concat(Array(9).fill(null)).slice(0, 9)
        : Array(9).fill(null),
      submitted: !!e?.phq?.submitted,
      score: typeof e?.phq?.score === "number" ? e.phq.score : null,
      completedAt: e?.phq?.completedAt || null,
    },
  };
}
function getEntry(entries, date) {
  return ensureEntryShape(entries?.[date]);
}
function setEntry(entries, date, patch) {
  const prev = getEntry(entries, date);
  return {
    ...entries,
    [date]: {
      ...prev,
      ...patch,
      phq: patch?.phq ? { ...prev.phq, ...patch.phq } : prev.phq,
    },
  };
}

/** =========================
    Helpers
========================= */
const MOOD_MESSAGE = {
  Happy: "Protect your good energy today. Share it if you can.",
  Calm: "Nice. Keep this calm momentum going.",
  Okay: "You’re doing okay. Small steps still count.",
  Stressed: "Slow breath in, slower breath out — you’re safe.",
  Sad: "Be gentle with yourself today. You don’t have to rush.",
  Angry: "It’s okay to feel this way. Pause before reacting.",
  Fear: "You’re not alone. Take one grounding breath.",
  Surprise: "Unexpected moments happen. Stay present.",
  Disgust: "That reaction makes sense. Step back if needed.",
};

function safeText(s) {
  const t = (s || "").trim();
  return t ? t : "—";
}
function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function isDateKey(k) {
  return /^\d{4}-\d{2}-\d{2}$/.test(k);
}

/** Personalized wellness tips based on Saved Mood/Reason/Notes (NOT PHQ requirement) */
function tipsForEntry(entry) {
  const isSubmitted = !!entry?.daySubmitted;
  if (!isSubmitted) {
    return {
      personalized: false,
      label: "Wellness Tips",
      tips: [
        "Save today’s Mood, Reason, and Notes to unlock personalized tips.",
        "Quick reset: slow inhale (4s), slower exhale (6–8s) × 5 breaths.",
        "Do one small win: 5–10 minutes only.",
      ],
    };
  }

  const mood = (entry?.mood || "").trim();
  const reason = (entry?.reason || "").trim();
  const notes = (entry?.notes || "").trim();

  let core = [];
  const low = ["Sad", "Angry", "Stressed", "Fear", "Disgust"].includes(mood);
  const high = ["Happy", "Calm"].includes(mood);

  if (low) {
    core = [
      "Grounding: name 5 things you see, 4 you feel, 3 you hear.",
      "Body reset: drink water + stretch shoulders/neck for 2 minutes.",
      "Pick ONE task only (smallest next step).",
    ];
  } else if (high) {
    core = [
      "Protect your good day: keep sleep + meals consistent.",
      "Share the energy: message one friend / family member.",
      "Do a 5-minute tidy or walk to keep momentum.",
    ];
  } else {
    core = [
      "Balance check: 10-minute focus + 2-minute break.",
      "Move a little: short walk or light stretching.",
      "Write 1 sentence: what helped today?",
    ];
  }

  const addOns = [];
  if (reason === "School") addOns.push("School tip: do the easiest task first to break procrastination.");
  if (reason === "Family") addOns.push("Family tip: set a small boundary (ex: “I need 10 minutes”).");
  if (reason === "Friends") addOns.push("Friends tip: clarify one thing with a short message instead of overthinking.");
  if (reason === "Health") addOns.push("Health tip: gentle routine (water, light food, rest).");
  if (reason === "Other") addOns.push("Try naming the main trigger in 1 short sentence—clarity lowers stress.");

  const noteAdd = notes ? ["Your note matters—re-read it and highlight one thing you did well."] : [];

  return {
    personalized: true,
    label: "Wellness Tips",
    tips: [...core, ...addOns.slice(0, 1), ...noteAdd].slice(0, 4),
  };
}

/** Icons */
function IconChevron({ className = "", down = true }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d={down ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCalendar({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.5 9h15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6.5 6h11c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2h-11c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconWellness({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9-9.2C1.3 8 3.7 5.5 6.6 5.5c1.9 0 3.4 1 4.4 2.5 1-1.5 2.5-2.5 4.4-2.5 2.9 0 5.3 2.5 3.6 6.3C19 16.4 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M7.2 12h2.4l1.2-2.2 1.4 4.2 1.2-2h2.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconBolt({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M13 2L3 14h7l-1 8 12-14h-7l-1-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
function IconCheck({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** =========================
    CUTER EMOTE
========================= */
function MoodEmote({ mood = "Okay", size = 28, className = "" }) {
  const key = (mood || "Okay").toLowerCase();

  const palette =
    key === "angry"
      ? { fill: "#FF6A3D", stroke: "#D74322", blush: "#FFB7A3" }
      : key === "sad" || key === "fear" || key === "disgust"
      ? { fill: "#FFE28A", stroke: "#E2A700", blush: "#FFD0A6" }
      : key === "stressed"
      ? { fill: "#FFD34D", stroke: "#E2A700", blush: "#FFD0A6" }
      : { fill: "#FFD34D", stroke: "#E2A700", blush: "#FFD0A6" };

  const eyeMode = key === "calm" ? "closed" : key === "fear" || key === "surprise" ? "wide" : "normal";
  const tear = key === "sad";

  const mouth =
    key === "happy"
      ? { kind: "smile" }
      : key === "calm"
      ? { kind: "softsmile" }
      : key === "okay"
      ? { kind: "flat" }
      : key === "stressed"
      ? { kind: "zig" }
      : key === "sad"
      ? { kind: "frown" }
      : key === "angry"
      ? { kind: "angry" }
      : key === "fear"
      ? { kind: "tiny" }
      : key === "surprise"
      ? { kind: "o" }
      : key === "disgust"
      ? { kind: "tilt" }
      : { kind: "flat" };

  const brows =
    key === "angry"
      ? ["M8.2 9.6l3.2 1.2", "M15.8 9.6l-3.2 1.2"]
      : key === "stressed"
      ? ["M8.1 9.9c1.2-0.9 2.3-0.9 3.3 0", "M12.6 9.9c1.2-0.9 2.3-0.9 3.3 0"]
      : key === "fear"
      ? ["M8.1 9.2c1.2-1.2 2.3-1.2 3.3 0", "M12.6 9.2c1.2-1.2 2.3-1.2 3.3 0"]
      : key === "surprise"
      ? ["M8.2 9.1c1.2-0.8 2.2-0.8 3.2 0", "M12.6 9.1c1.2-0.8 2.2-0.8 3.2 0"]
      : key === "disgust"
      ? ["M8.2 10.0h3.0", "M12.6 9.1c1.0 0.3 2.0 0.8 3.0 1.4"]
      : ["M8.2 10.0h3.2", "M15.8 10.0h-3.2"];

  const Eye = ({ x, y, mode }) => {
    if (mode === "closed") {
      return (
        <path
          d={`M${x - 2.2} ${y} Q ${x} ${y + 1.6} ${x + 2.2} ${y}`}
          stroke="#171717"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    if (mode === "wide") {
      return (
        <>
          <circle cx={x} cy={y} r="1.7" fill="#FFF" stroke="#171717" strokeWidth="1.1" />
          <circle cx={x} cy={y + 0.2} r="0.85" fill="#171717" />
          <circle cx={x - 0.45} cy={y - 0.4} r="0.28" fill="#FFF" opacity="0.9" />
        </>
      );
    }
    return (
      <>
        <circle cx={x} cy={y} r="1.25" fill="#171717" />
        <circle cx={x - 0.4} cy={y - 0.45} r="0.25" fill="#FFF" opacity="0.8" />
      </>
    );
  };

  const Mouth = ({ kind }) => {
    if (kind === "o") return <circle cx="12" cy="16.2" r="1.6" fill="#171717" opacity="0.9" />;
    if (kind === "tiny")
      return (
        <path
          d="M10.6 16.1c1.0-0.7 1.8-0.7 2.8 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    if (kind === "smile")
      return (
        <path
          d="M8.2 15.0c1.9 2.5 5.7 2.5 7.6 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    if (kind === "softsmile")
      return (
        <path
          d="M8.7 15.5c1.6 1.2 5.0 1.2 6.6 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    if (kind === "flat")
      return <path d="M8.8 16.0h6.4" stroke="#171717" strokeWidth="1.7" strokeLinecap="round" fill="none" />;
    if (kind === "zig")
      return (
        <path
          d="M8.3 16.2c1.2-1.1 2.2 1.1 3.2 0 1.0-1.1 2.2-1.1 3.2 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    if (kind === "frown")
      return (
        <path
          d="M8.2 17.0c1.9-2.4 5.7-2.4 7.6 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    if (kind === "angry")
      return (
        <path
          d="M8.0 16.7c2.5-1.4 5.5-1.4 8.0 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    if (kind === "tilt")
      return (
        <path
          d="M9.0 16.4c1.4 1.1 2.4-1.1 3.6 0 1.2 1.1 2.2-1.1 3.4 0"
          stroke="#171717"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />
      );
    return null;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.3" fill={palette.fill} stroke={palette.stroke} strokeWidth="1.4" />
      <circle cx="7.7" cy="14.2" r="1.2" fill={palette.blush} opacity="0.55" />
      <circle cx="16.3" cy="14.2" r="1.2" fill={palette.blush} opacity="0.55" />
      <path d={brows[0]} stroke="#171717" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d={brows[1]} stroke="#171717" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <Eye x={9.2} y={12} mode={eyeMode} />
      <Eye x={14.8} y={12} mode={eyeMode} />
      <Mouth kind={mouth.kind} />
      {tear && (
        <path
          d="M7.1 14.2c1.0 1.4 1.0 2.5 0 3.7-1.0-1.2-1.0-2.3 0-3.7Z"
          fill="#4DA3FF"
          stroke="#2B7FE6"
          strokeWidth="0.7"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

/** Doodles */
function DoodleSpark({ className = "" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <path
        d="M60 10l7 18 18 7-18 7-7 18-7-18-18-7 18-7 7-18Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M20 70c12-10 24-10 36 0s24 10 36 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
function DoodleSquiggle({ className = "" }) {
  return (
    <svg viewBox="0 0 140 60" className={className} fill="none" aria-hidden="true">
      <path
        d="M5 35c12-18 22 18 34 0s22 18 34 0 22 18 34 0 22 18 34 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function DoodleHeart({ className = "" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path
        d="M32 54S10 40 10 24c0-7 5-12 12-12 6 0 9 3 10 6 1-3 4-6 10-6 7 0 12 5 12 12 0 16-22 30-22 30Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** UI helpers */
function Pill({ children, tone = "light" }) {
  const styles =
    tone === "green"
      ? { background: "rgba(185,255,102,0.60)", border: "rgba(0,0,0,0.14)", color: CHECKIN_DARK }
      : tone === "dark"
      ? { background: "rgba(20,20,20,0.92)", border: "rgba(0,0,0,0.12)", color: "white" }
      : tone === "warn"
      ? { background: "rgba(255, 214, 102,0.55)", border: "rgba(0,0,0,0.14)", color: CHECKIN_DARK }
      : { background: "rgba(0,0,0,0.03)", border: "rgba(0,0,0,0.12)", color: "rgba(0,0,0,0.70)" };

  return (
    <span
      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-extrabold"
      style={{ background: styles.background, borderColor: styles.border, color: styles.color }}
    >
      {children}
    </span>
  );
}
function Card({ title, right, children, className = "" }) {
  return (
    <div
      className={`rounded-[26px] border border-black/10 bg-white/80 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.08)] overflow-hidden ${className}`}
    >
      <div className="px-5 py-4 bg-black/[0.025] flex items-center justify-between">
        <div className="text-[14px] font-extrabold text-[#141414] flex items-center gap-2">{title}</div>
        {right}
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}
function Chip({ active, children, onClick, left, disabled }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={disabled ? {} : { y: -1 }}
      className="
        px-3.5 py-2.5 rounded-full border text-[12px] font-extrabold transition
        inline-flex items-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2
      "
      style={{
        borderColor: active ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.14)",
        background: active
          ? "linear-gradient(180deg, rgba(185,255,102,0.60), rgba(185,255,102,0.30))"
          : "rgba(255,255,255,0.85)",
        color: CHECKIN_DARK,
        boxShadow: active ? "0 14px 40px rgba(0,0,0,0.10)" : "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      {left}
      {children}
    </motion.button>
  );
}

/** =========================
    DUOLINGO-STYLE: Progress + Stepper
========================= */
function ProgressBar({ value = 0, labelLeft, labelRight }) {
  const reduce = useReducedMotion();
  const v = Math.max(0, Math.min(100, value));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-[11px] font-extrabold text-black/55">
        <span className="inline-flex items-center gap-1">
          <IconBolt className="h-4 w-4 text-black/45" />
          {labelLeft}
        </span>
        <span>{labelRight}</span>
      </div>

      <div className="mt-2 h-3 rounded-full bg-black/10 overflow-hidden border border-black/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(180deg, rgba(185,255,102,1), rgba(185,255,102,0.70))",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 26 }}
        />
      </div>
    </div>
  );
}

function StepDot({ done, active, label, index }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-7 w-7 rounded-full border flex items-center justify-center"
        style={{
          background: done
            ? CHECKIN_GREEN
            : active
            ? "rgba(0,0,0,0.07)"
            : "rgba(255,255,255,0.85)",
          borderColor: done
            ? "rgba(0,0,0,0.18)"
            : active
            ? "rgba(0,0,0,0.22)"
            : "rgba(0,0,0,0.12)",
          boxShadow: done ? "0 14px 40px rgba(185,255,102,0.30)" : active ? "0 10px 26px rgba(0,0,0,0.06)" : "none",
        }}
      >
        {done ? (
          <IconCheck className="h-4 w-4 text-black" />
        ) : (
          <span className="text-[11px] font-black text-black/60">{index + 1}</span>
        )}
      </div>

      <div
        className="text-[12px] font-extrabold"
        style={{ color: active ? "#141414" : "rgba(0,0,0,0.45)" }}
      >
        {label}
      </div>
    </div>
  );
}

function Stepper({ step, dayLocked, onJump }) {
  const steps = [
    { key: "mood", label: "Mood" },
    { key: "reason", label: "Reason" },
    { key: "notes", label: "Notes" },
    { key: "save", label: "Finish" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((s, idx) => {
        const isActive = step === s.key;

        const isDone =
          dayLocked ||
          (s.key === "mood"
            ? ["reason", "notes", "save"].includes(step)
            : s.key === "reason"
            ? ["notes", "save"].includes(step)
            : s.key === "notes"
            ? ["save"].includes(step)
            : false);

        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onJump?.(s.key)}
            disabled={dayLocked}
            className="
              group flex items-center gap-3 rounded-full px-3 py-2
              border border-black/10 bg-white/70 hover:bg-white transition
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            <StepDot done={isDone} active={isActive} label={s.label} index={idx} />
            {idx !== steps.length - 1 && (
              <span className="hidden sm:inline text-black/20 font-black">→</span>
            )}
          </button>
        );
      })}
    </div>
  );
}



/** Mood mapping for tracker */
function moodToLevel(mood) {
  if (!mood) return null;
  if (mood === "Angry") return 0;
  if (mood === "Stressed") return 1;
  if (mood === "Sad" || mood === "Fear" || mood === "Disgust") return 1;
  if (mood === "Okay" || mood === "Surprise") return 2;
  if (mood === "Calm" || mood === "Happy") return 3;
  return 2;
}

/** Graph helpers */
function buildSmoothPath(pts) {
  const p = pts.filter((x) => x.y !== null);
  if (p.length < 2) return "";
  const tension = 0.25;
  const d = [];
  d.push(`M ${p[0].x} ${p[0].y}`);
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

function MoodTracker({ series, title = "Mood Tracker", subtitle = "Saved mood for the last 14 days.", compact = false }) {
  const w = 980;
  const h = compact ? 128 : 160;
  const padX = 36;
  const padYTop = 32;
  const padYBottom = 30;

  const shouldReduceMotion = useReducedMotion();
  const gid = useId();
  const gradId = `g1-${gid}`;

  const days = series.length;
  const step = days > 1 ? (w - padX * 2) / (days - 1) : 0;

  const yForLevel = (lvl) => {
    const usable = h - padYTop - padYBottom;
    return padYTop + usable * (1 - lvl / 3);
  };

  const points = useMemo(() => {
    return series.map((d, i) => {
      const lvl = moodToLevel(d.mood);
      return {
        ...d,
        i,
        x: padX + i * step,
        y: lvl === null ? null : yForLevel(lvl),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, step]);

  const path = useMemo(() => buildSmoothPath(points), [points]);
  const lineTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.9, ease: "easeOut" };

  return (
    <div className="rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.07)] overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <div className="text-[15px] font-extrabold text-[#141414] flex items-center gap-2">
          {title}
          <span className="text-[11px] font-extrabold text-black/35">• last 14 days</span>
        </div>
        {!compact && <div className="text-[12px] text-black/45 mt-1">{subtitle}</div>}
      </div>

      <div className="px-3 pb-4">
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[720px]">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(185,255,102,0.30)" />
                <stop offset="100%" stopColor="rgba(185,255,102,0.00)" />
              </linearGradient>
            </defs>

            <rect
              x={padX}
              y={padYTop}
              width={w - padX * 2}
              height={h - padYTop - padYBottom}
              rx="14"
              fill={`url(#${gradId})`}
              opacity="0.55"
            />

            <line
              x1={padX}
              y1={h - padYBottom}
              x2={w - padX}
              y2={h - padYBottom}
              stroke="rgba(0,0,0,0.10)"
              strokeWidth="2"
            />

            {points.map((p) => (
              <line
                key={`grid-${p.i}`}
                x1={p.x}
                y1={h - padYBottom}
                x2={p.x}
                y2={padYTop + 10}
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ))}

            {path && (
              <>
                <motion.path
                  d={path}
                  fill="none"
                  stroke="rgba(0,0,0,0.10)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={lineTransition}
                />
                <motion.path
                  d={path}
                  fill="none"
                  stroke="rgba(185,255,102,0.95)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={lineTransition}
                />
              </>
            )}

            {points.map((p) => (
              <g key={p.key}>
                {p.y !== null ? (
                  <>
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="rgba(185,255,102,0.35)"
                      initial={{ scale: shouldReduceMotion ? 1 : 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                    />
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="rgba(20,20,20,0.9)"
                      initial={{ scale: shouldReduceMotion ? 1 : 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
                    />
                    <g transform={`translate(${p.x - 14}, ${p.y - 30})`}>
                      <MoodEmote mood={p.mood} size={28} />
                    </g>
                  </>
                ) : (
                  <circle cx={p.x} cy={h - padYBottom} r="3.5" fill="rgba(0,0,0,0.18)" />
                )}

                {p.label && (
                  <text
                    x={p.x}
                    y={h - 9}
                    textAnchor="middle"
                    fontSize="12"
                    fill="rgba(0,0,0,0.55)"
                    fontWeight="800"
                    className={p.i % 2 === 1 ? "hidden sm:block" : ""}
                  >
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

      /** History */
      function HistoryModal({
        open,
        onClose,
        items,
        entries,
        trackerSeriesForDate,
        initialSelectedDate = null,
      }) {
        const [page, setPage] = useState("list");
        const [selectedDate, setSelectedDate] = useState(null);

        const listScrollRef = useRef(null);
        const detailScrollRef = useRef(null);

        const scrollListTop = () => {
          requestAnimationFrame(() => {
            if (listScrollRef.current) listScrollRef.current.scrollTop = 0;
          });
        };
        const scrollDetailTop = () => {
          requestAnimationFrame(() => {
            if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0;
          });
        };

        // open behavior
        useEffect(() => {
          if (!open) return;

          const first = items?.[0]?.date || null;
          const initDate = initialSelectedDate || first;

          setSelectedDate(initDate);

          if (initialSelectedDate) {
            setPage("detail");
            scrollDetailTop();
          } else {
            setPage("list");
            scrollListTop();
          }
        }, [open, items, initialSelectedDate]);

        useEffect(() => {
          if (!open) return;
          const onKey = (e) => e.key === "Escape" && onClose();
          window.addEventListener("keydown", onKey);
          return () => window.removeEventListener("keydown", onKey);
        }, [open, onClose]);

        const detailEntry = useMemo(
          () => (selectedDate ? getEntry(entries, selectedDate) : null),
          [entries, selectedDate]
        );

        const detailTracker = useMemo(
          () => (selectedDate ? trackerSeriesForDate?.(selectedDate) || [] : []),
          [selectedDate, trackerSeriesForDate]
        );

        function goDetail(date) {
          setSelectedDate(date);
          setPage("detail");
          scrollDetailTop();
        }

        function goList() {
          setPage("list");
          scrollListTop();
        }

      return (
      <AnimatePresence>
          {open && (
           <motion.div
             className="fixed inset-0 z-[999] flex items-center justify-center px-4"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
              >
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />

            <motion.div
             role="dialog"
             aria-modal="true"
             aria-label="History"
             initial={{ y: 18, opacity: 0, scale: 0.98 }}
             animate={{ y: 0, opacity: 1, scale: 1 }}
             exit={{ y: 18, opacity: 0, scale: 0.98 }}
             transition={{ duration: 0.2 }}
             className="relative w-full max-w-3xl rounded-[24px] border border-black/10 bg-white shadow-xl overflow-hidden"
             >
            {/* HEADER */}
            <div
             className="p-6 flex items-start justify-between gap-3"
              style={{
               background: `radial-gradient(900px 260px at 15% 0%, ${CHECKIN_GREEN} 0%, transparent 62%)`,
                }}
                >
            <div>
              <div className="text-[16px] font-extrabold text-[#141414]">
              {page === "list" ? "History" : "History detail"}
           </div>
              <div className="text-[13px] text-black/60 mt-1">
              {page === "list"
              ? "Tap a date to open details."
              : "Tap Back to return."}
            </div>
        </div>

           <div className="flex items-center gap-2">
             {page === "detail" && (
              <button
              type="button"
              onClick={goList}
              className="h-9 rounded-full border border-black/15 bg-white px-3 text-[12px] font-extrabold text-black/70 hover:bg-black/5 transition"
              >
              Back
              </button>
              )}
              <button
              onClick={onClose}
              className="text-black/60 hover:text-black font-bold"
              aria-label="Close"
              >
              ✕
            </button>
        </div>
    </div>

            {/* BODY */}
          <div className="p-4">
            {page === "list" ? (
            <div className="w-full">
            {items.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-[13px] text-black/60">
             No saved entries yet.
            </div>
         ) : (
         <div
                            ref={listScrollRef}
                            className="max-h-[65vh] overflow-auto rounded-2xl border border-black/10"
                          >
                            {items.map((it, idx) => (
                              <button
                                key={it.date}
                                type="button"
                                onClick={() => goDetail(it.date)}
                                className="w-full text-left px-4 py-3 hover:bg-black/[0.03] transition"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-[13px] font-extrabold text-[#141414]">
                                    {it.date}
                                  </div>
                                  <div className="text-[12px] text-black/55 font-semibold">
                                    {it.dayLocked ? "Saved (locked)" : "Draft"}
                                  </div>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-black/65">
                                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                                    <span className="font-extrabold">Mood:</span> {it.mood || "—"}
                                  </span>
                                  <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                                    <span className="font-extrabold">Reason:</span> {it.reason || "—"}
                                  </span>
                                  {it.notesPreview && (
                                    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                                      <span className="font-extrabold">Note:</span> {it.notesPreview}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 text-[12px] text-black/45 font-semibold">
                                  Tap to view details →
                                </div>

                                {idx !== items.length - 1 && <div className="mt-3 h-px bg-black/10" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full">
                        {!selectedDate || !detailEntry ? (
                          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-[13px] text-black/60">
                            No date selected.
                          </div>
                        ) : (
                          <div
                            ref={detailScrollRef}
                            className="max-h-[65vh] overflow-auto rounded-2xl border border-black/10 bg-white"
                          >
                            <div className="p-4 border-b border-black/10" style={{ background: "rgba(0,0,0,0.02)" }}>
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-[13px] font-extrabold text-[#141414]">{selectedDate}</div>
                                  <div className="text-[12px] text-black/55 font-semibold mt-1">
                                    {detailEntry.daySubmitted ? "Saved (locked)" : "Draft"}
                                  </div>
                                </div>

                                <div
                                  className="h-9 rounded-full px-3 text-[12px] font-extrabold inline-flex items-center"
                                  style={{
                                    backgroundColor: CHECKIN_GREEN,
                                    color: CHECKIN_DARK,
                                    border: "1px solid rgba(0,0,0,0.15)",
                                  }}
                                >
                                  View only
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-black/65">
                                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                                  <span className="font-extrabold">Mood:</span> {safeText(detailEntry.mood)}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1" style={{ borderColor: "rgba(0,0,0,0.12)" }}>
                                  <span className="font-extrabold">Reason:</span> {safeText(detailEntry.reason)}
                                </span>
                                {detailEntry.daySubmitted && <Pill tone="dark">Locked</Pill>}
                              </div>
                            </div>

                            <div className="p-4 border-b border-black/10">
                              <div className="text-[12px] font-extrabold text-black/70">Notes</div>
                              <div className="mt-2 rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-[13px] text-black/70 whitespace-pre-wrap">
                                {safeText(detailEntry.notes)}
                              </div>
                            </div>

                            <div className="p-4">
                              <MoodTracker series={detailTracker} title="Mood Tracker" compact />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={onClose}
                        className="rounded-full px-4 py-2 text-[12px] font-extrabold"
                        style={{ backgroundColor: CHECKIN_DARK, color: "white" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        );
      }



      function NotesCard({ notes, setNotes, disabled = false }) {
        const [copied, setCopied] = useState(false);

        const words = useMemo(() => {
          const trimmed = (notes || "").trim();
          if (!trimmed) return 0;
          return trimmed.split(/\s+/).filter(Boolean).length;
        }, [notes]);

        async function copyNotes() {
          try {
            await navigator.clipboard.writeText(notes || "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {
            // ignore
          }
        }

        function onChange(e) {
          if (disabled) return;
          const value = e.target.value ?? "";
          const tokens = value.match(/\S+/g) || [];
          if (tokens.length <= NOTES_WORD_LIMIT) {
            setNotes(value);
            return;
          }

          // clamp to first N words (preserve spacing as much as possible)
          let count = 0;
          let i = 0;
          const len = value.length;
          while (i < len) {
            while (i < len && /\s/.test(value[i])) i++;
            if (i >= len) break;
            while (i < len && !/\s/.test(value[i])) i++;
            count++;
            if (count >= NOTES_WORD_LIMIT) break;
          }
          const clamped = value.slice(0, i).replace(/\s+$/g, "");
          setNotes(clamped);
        }

  return (
    <div className="rounded-[24px] border border-black/10 bg-white shadow-[0_14px_40px_rgba(0,0,0,0.07)] overflow-hidden">
      <div className="px-5 py-4 bg-black/[0.03] flex items-center justify-between">
        <div className="text-[14px] font-extrabold text-[#141414] flex items-center gap-2">
          Notes
          {disabled && <span className="text-[11px] font-extrabold text-black/60">• Read-only</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[12px] font-extrabold text-black/65">
            {words}/{NOTES_WORD_LIMIT} words
          </div>

          {disabled && (
            <button
              type="button"
              onClick={copyNotes}
              className="
                h-9 rounded-full border border-black/15 bg-white px-3
                text-[12px] font-extrabold text-black/75 hover:bg-black/5 transition
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 focus-visible:ring-offset-2
              "
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          )}
        </div>
      </div>

      <div className="p-5">
        {disabled ? (
          <>
            <div
              className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-[13px] text-black/80 whitespace-pre-wrap"
              style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
            >
              {safeText(notes)}
            </div>

            <div className="mt-3 text-[12px] text-black/60">Read-only: you already saved today.</div>
          </>
        ) : (
          <>
            <textarea
              value={notes}
              onChange={onChange}
              disabled={disabled}
              placeholder="Write a short note about your day (max 100 words)…"
              className="
                w-full min-h-[140px] rounded-2xl border border-black/10 bg-white px-4 py-3
                text-[13px] text-black/80 outline-none focus:border-black/25
                focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2
              "
            />
            <div className="mt-3 text-[12px] text-black/60">Keep it short: what happened + what helped.</div>
          </>
        )}
      </div>
    </div>
  );
}

/** =========================
    Main Journal Page
    ✅ Duolingo-style step flow
    ✅ Progress bar
    ✅ More “gamey” micro-interactions
========================= */
export default function Journal() {
  const shouldReduceMotion = useReducedMotion();

  const [TODAY, setTODAY] = useState(() => todayKey());

  useEffect(() => {
    const tick = () => setTODAY(todayKey());
    tick();
    const id = setInterval(tick, 60 * 1000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const [entries, setEntries] = useState(() => loadEntries());

  const savedEntry = useMemo(() => getEntry(entries, TODAY), [entries, TODAY]);

  const dayLocked = !!savedEntry.daySubmitted;
  const inputsDisabled = dayLocked;

  const [mood, setMood] = useState(savedEntry.mood || "");
  const [reason, setReason] = useState(savedEntry.reason || "");
  const [notes, setNotes] = useState(savedEntry.notes || "");
  const [moodCollapsed, setMoodCollapsed] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const saveTimer = useRef(null);
  const [storageError, setStorageError] = useState(false);

  // ✅ Duolingo-like “step”
  const step = useMemo(() => {
    if (dayLocked) return "save";
    if (!mood) return "mood";
    if (!reason) return "reason";
    if ((notes || "").trim().length < 1) return "notes";
    return "save";
  }, [dayLocked, mood, reason, notes]);

  const progress = useMemo(() => {
    let p = 0;
    if (mood) p += 34;
    if (reason) p += 33;
    if ((notes || "").trim().length > 0) p += 33;
    if (dayLocked) p = 100;
    return Math.min(100, p);
  }, [mood, reason, notes, dayLocked]);

  const focusMoodRef = useRef(null);
  const focusReasonRef = useRef(null);
  const focusNotesRef = useRef(null);

  const jumpToStep = useCallback(
    (k) => {
      if (inputsDisabled) return;
      if (k === "mood") {
        setMoodCollapsed(false);
        focusMoodRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      }
      if (k === "reason") focusReasonRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      if (k === "notes") focusNotesRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      if (k === "save") window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [inputsDisabled]
  );

  useEffect(() => {
    const e = getEntry(entries, TODAY);
    setMood(e.mood || "");
    setReason(e.reason || "");
    setNotes(e.notes || "");
  }, [TODAY, entries]);

  const isDirty = useMemo(() => {
    if (inputsDisabled) return false;
    const sameMood = (savedEntry.mood || "") === (mood || "");
    const sameReason = (savedEntry.reason || "") === (reason || "");
    const sameNotes = (savedEntry.notes || "") === (notes || "");
    return !(sameMood && sameReason && sameNotes);
  }, [inputsDisabled, savedEntry, mood, reason, notes]);

  const wellness = useMemo(() => tipsForEntry(savedEntry), [savedEntry]);

  const canSave = useMemo(() => {
    if (inputsDisabled) return false;
    return !!(mood && reason);
  }, [inputsDisabled, mood, reason]);

  function pulseSaved() {
    setSavedPulse(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedPulse(false), 1100);
  }

  function saveNow() {
    if (dayLocked) return;

    setEntries((prev) => {
      const prevSaved = getEntry(prev, TODAY);
      const nowISO = new Date().toISOString();

      const next = setEntry(prev, TODAY, {
        mood: (mood || "").trim(),
        reason: (reason || "").trim(),
        notes: notes ?? "",
        daySubmitted: true,
        daySubmittedAt: prevSaved.daySubmittedAt || nowISO,
      });

      const ok = saveEntries(next);
      setStorageError(!ok);
      return next;
    });

    pulseSaved();
  }

  function clearTodayDraft() {
    if (dayLocked) return;

    setMood("");
    setReason("");
    setNotes("");
    setMoodCollapsed(false);

    setEntries((prev) => {
      const next = setEntry(prev, TODAY, {
        mood: "",
        reason: "",
        notes: "",
        daySubmitted: false,
        daySubmittedAt: null,
      });

      const ok = saveEntries(next);
      setStorageError(!ok);
      return next;
    });
  }

  const trackerSeries = useMemo(() => {
    const list = [];
    const d = new Date(TODAY);
    for (let i = 0; i < 14; i++) {
      const x = new Date(d);
      x.setDate(d.getDate() - (13 - i));
      const yyyy = x.getFullYear();
      const mm = String(x.getMonth() + 1).padStart(2, "0");
      const dd = String(x.getDate()).padStart(2, "0");
      const key = `${yyyy}-${mm}-${dd}`;
      const label = `${Number(mm)}/${Number(dd)}`;
      const e = getEntry(entries, key);
      list.push({ key, label, mood: e.mood || null });
    }
    return list;
  }, [entries, TODAY]);

  const trackerSeriesForDate = useCallback(
    (baseDate) => {
      const list = [];
      const d = new Date(baseDate);
      for (let i = 0; i < 14; i++) {
        const x = new Date(d);
        x.setDate(d.getDate() - (13 - i));
        const yyyy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        const key = `${yyyy}-${mm}-${dd}`;
        const label = `${Number(mm)}/${Number(dd)}`;
        const e = getEntry(entries, key);
        list.push({ key, label, mood: e.mood || null });
      }
      return list;
    },
    [entries]
  );

  const moods = ["Happy", "Calm", "Okay", "Stressed", "Sad", "Angry", "Fear", "Surprise", "Disgust"];
  const reasons = ["School", "Family", "Friends", "Health", "Other"];

  const historyItems = useMemo(() => {
    const keys = Object.keys(entries || {}).filter(isDateKey);
    return keys
      .map((k) => {
        const e = getEntry(entries, k);
        const hasAnything = !!e.mood || !!e.reason || !!e.notes;
        if (!hasAnything) return null;

        const noteTrim = (e.notes || "").trim();
        const notesPreview = noteTrim ? (noteTrim.length > 22 ? `${noteTrim.slice(0, 22)}…` : noteTrim) : "";

        return { date: k, mood: e.mood || "", reason: e.reason || "", notesPreview, dayLocked: !!e.daySubmitted };
      })
      .filter(Boolean)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const nudgeText = useMemo(() => {
    if (dayLocked) return "Nice work — you’ve completed today’s check-in!";
    if (!mood) return "Step 1: pick your mood 👇";
    if (!reason) return "Step 2: pick the reason 👇";
    if (!(notes || "").trim()) return "Step 3: add a short note (even 1 sentence) ✍️";
    return "Final step: Save to lock today ✅";
  }, [dayLocked, mood, reason, notes]);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 520px at 18% 0%, rgba(185,255,102,0.38) 0%, rgba(185,255,102,0.0) 55%), linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 60%, #F7F7F7 100%)",
      }}
    >
      <BackgroundFX />

      <DoodleSpark className="absolute -top-8 -left-8 h-28 w-28 text-black/10 rotate-12" />
      <DoodleSquiggle className="absolute top-24 right-[-20px] h-16 w-44 text-black/10 rotate-[-8deg]" />
      <DoodleHeart className="absolute bottom-16 left-8 h-16 w-16 text-black/10" />
      <DoodleSpark className="absolute bottom-[-20px] right-10 h-24 w-24 text-black/10 -rotate-12" />

      <HistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={historyItems}
        entries={entries}
        trackerSeriesForDate={trackerSeriesForDate}
      />

      <div className="pt-[60px] sm:pt-[66px] pb-10 relative z-[1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* ✅ STICKY TOP BAR (Duolingo-ish) */}
          <div className="sticky top-[72px] z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-3">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
              className="
                relative rounded-[28px]
                border border-black/10
                bg-white/75 backdrop-blur-xl
                shadow-[0_22px_70px_rgba(0,0,0,0.10)]
                p-6
                flex flex-col gap-4
                overflow-hidden
              "
            >
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  background: `radial-gradient(900px 260px at 12% 0%, ${CHECKIN_GREEN} 0%, transparent 62%),
                              radial-gradient(700px 240px at 90% 20%, rgba(20,20,20,0.10) 0%, transparent 60%)`,
                }}
              />

              <motion.div
                className="absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage: "radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                  maskImage: "radial-gradient(800px 260px at 30% 20%, black 0%, transparent 70%)",
                  WebkitMaskImage: "radial-gradient(800px 260px at 30% 20%, black 0%, transparent 70%)",
                }}
                animate={shouldReduceMotion ? {} : { backgroundPosition: ["0px 0px", "24px 24px"] }}
                transition={shouldReduceMotion ? {} : { duration: 10, repeat: Infinity, ease: "linear" }}
              />

              {/* Header row */}
                 <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="relative">
                  <div className="text-[26px] font-black text-[#141414] leading-tight">How are you today?</div>
                  <div className="text-[13px] text-black/55 font-semibold mt-1">Quick check-in. Today only.</div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={nudgeText}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
                      className="mt-2 text-[12px] font-extrabold text-black/60"
                    >
                      {nudgeText}
                    </motion.div>
                  </AnimatePresence>

                  {storageError && (
                    <div className="mt-2 text-[11px] font-semibold text-red-600">
                      Storage error: couldn’t save on this device.
                    </div>
                  )}
                </div>

                  <div className="relative flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                  <div className="relative">
                    <IconCalendar className="h-5 w-5 text-black/45 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={TODAY}
                      min={TODAY}
                      max={TODAY}
                      onChange={() => {}}
                      className="
                        h-10 w-[190px] sm:w-auto
                        rounded-full
                        border border-black/15
                        bg-white/80 backdrop-blur
                        pl-11 pr-4
                        text-[13px] font-semibold text-black/70
                        cursor-not-allowed
                      "
                      disabled
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setHistoryOpen(true)}
                    className="
                      h-10 rounded-full
                      border border-black/15
                      bg-white/80 backdrop-blur
                      px-4
                      text-[13px] font-extrabold text-black/70
                      hover:bg-black/5 transition
                    "
                  >
                    History
                  </button>

                  <button
                    type="button"
                    onClick={clearTodayDraft}
                    disabled={inputsDisabled || (!mood && !reason && !notes)}
                    className="
                      h-10 rounded-full
                      border border-black/15
                      bg-white/80 backdrop-blur
                      px-4
                      text-[13px] font-extrabold text-black/70
                      hover:bg-black/5 transition
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    Clear
                  </button>

                  <motion.button
                    type="button"
                    onClick={saveNow}
                    disabled={inputsDisabled || !isDirty || !canSave}
                    whileHover={inputsDisabled || !isDirty || !canSave ? {} : { y: -1 }}
                    whileTap={inputsDisabled || !isDirty || !canSave ? {} : { scale: 0.98 }}
                    className="
                      h-10 rounded-full px-4
                      text-[13px] font-extrabold transition
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    style={{
                      backgroundColor: !inputsDisabled && isDirty && canSave ? CHECKIN_GREEN : "rgba(0,0,0,0.05)",
                      color: CHECKIN_DARK,
                      border: "1px solid rgba(0,0,0,0.15)",
                      boxShadow: !inputsDisabled && isDirty && canSave ? "0 18px 50px rgba(185,255,102,0.45)" : "none",
                    }}
                  >
                    Save
                  </motion.button>

                  <div className="ml-1" aria-live="polite">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={savedPulse ? "saved" : dayLocked ? "locked" : isDirty ? "dirty" : "idle"}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.18 }}
                      >
                        {savedPulse ? (
                          <Pill tone="green">Thank you 💚</Pill>
                        ) : dayLocked ? (
                          <Pill tone="dark">Locked today</Pill>
                        ) : isDirty ? (
                          <Pill tone="warn">Unsaved</Pill>
                        ) : (
                          <Pill>Saved</Pill>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

                  {/* Progress + Stepper */}
          {/* =========================
              PROGRESS + STEPS (MOBILE SAFE)
          ========================= */}
          <div className="mt-4 rounded-[20px] border border-black/10 bg-white/90 p-4 shadow-sm">
            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[12px] font-bold text-black/60">
                <span>Daily progress</span>
                <span>{progress}%</span>
              </div>

              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-black/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: "linear-gradient(180deg, #B9FF66, #A3F635)",
                  }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: "mood", label: "Mood" },
                { key: "reason", label: "Reason" },
                { key: "notes", label: "Notes" },
                { key: "save", label: "Done" },
              ].map((s) => {
                const isActive = step === s.key;
                const isDone =
                  dayLocked ||
                  (s.key === "mood" && ["reason", "notes", "save"].includes(step)) ||
                  (s.key === "reason" && ["notes", "save"].includes(step)) ||
                  (s.key === "notes" && step === "save");

                return (
                  <button
                    key={s.key}
                    type="button"
                    disabled={dayLocked}
                    onClick={() => jumpToStep(s.key)}
                    className={`
                      flex flex-col items-center justify-center
                      rounded-xl border px-2 py-2 text-[11px] font-bold
                      transition
                      ${
                        isDone
                          ? "bg-[#B9FF66]/70 border-black/20 text-black"
                          : isActive
                          ? "bg-black/5 border-black/30 text-black"
                          : "bg-white border-black/10 text-black/50"
                      }
                      disabled:opacity-60
                    `}
                  >
                    <div
                      className={`mb-1 h-6 w-6 rounded-full flex items-center justify-center text-[12px] font-black ${
                        isDone ? "bg-black text-white" : "bg-black/10 text-black/60"
                      }`}
                    >
                      {isDone ? "✓" : "•"}
                    </div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>


              {!inputsDisabled && !canSave && (
                <div className="relative text-[11px] text-black/45 font-semibold">
                  Select <span className="font-extrabold text-black">Mood</span> and{" "}
                  <span className="font-extrabold text-black">Reason</span> to enable Save.
                </div>
              )}
            </motion.div>
          </div>

          {/* Mood tracker */}
          <div className="mt-2">
            <MoodTracker series={trackerSeries} />
          </div>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Left */}
            <div className="flex flex-col gap-4">
              {/* MOOD */}
              <div ref={focusMoodRef} />
              <Card
                title={
                  <span className="flex items-center gap-2">
                    Mood{" "}
                    <span className="text-black/40 text-[12px] font-extrabold">(collapsible)</span>{" "}
                    {inputsDisabled && <Pill>Locked</Pill>}
                    {!inputsDisabled && step === "mood" && <Pill tone="warn">Start</Pill>}
                  </span>
                }
                right={
                  <button
                    type="button"
                    disabled={inputsDisabled}
                    onClick={() => setMoodCollapsed((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[12px] font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {moodCollapsed ? "Open" : "Close"}
                    <IconChevron className="h-4 w-4" down={moodCollapsed} />
                  </button>
                }
              >
                <motion.div
                  className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 flex items-center gap-3"
                  initial={false}
                  animate={
                    !inputsDisabled && step === "mood"
                      ? { boxShadow: "0 0 0 4px rgba(185,255,102,0.35)" }
                      : { boxShadow: "0 0 0 0px rgba(0,0,0,0)" }
                  }
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
                >
                  <div
                    className="h-12 w-12 rounded-2xl border border-black/10 bg-white flex items-center justify-center overflow-hidden"
                    style={{ boxShadow: "0 10px 24px rgba(0,0,0,0.05)" }}
                  >
                    <AnimatePresence mode="wait">
                      {mood ? (
                        <motion.div
                          key={mood}
                          initial={{ opacity: 0, scale: 0.85, rotate: -10, y: 6 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                          exit={{ opacity: 0, scale: 0.88, rotate: 8, y: -6 }}
                          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
                        >
                          <MoodEmote mood={mood} size={36} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          className="text-[12px] font-extrabold text-black/40"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          —
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex-1">
                    <div className="text-[12px] font-extrabold text-black/70">Current mood</div>

                    <div className="text-[14px] font-extrabold text-[#141414] mt-1">{mood || "Not selected"}</div>

                    <div className="text-[12px] text-black/55 font-semibold mt-1">
                      {(mood || "").trim()
                        ? MOOD_MESSAGE[(mood || "").trim()] || "Thanks for checking in."
                        : "Pick a mood to begin."}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <Pill>today only</Pill>
                  </div>
                </motion.div>

                <AnimatePresence initial={false}>
                  {!moodCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {moods.map((m) => (
                          <Chip
                            key={m}
                            active={mood === m}
                            onClick={() => {
                              if (inputsDisabled) return;
                              setMood(m);
                              // “Duolingo feel”: auto-open next
                        
                            }}
                            left={
                              <motion.span
                                initial={{ scale: 0.9 }}
                                animate={{ scale: mood === m ? 1.06 : 1 }}
                                transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 18 }}
                              >
                                <MoodEmote mood={m} size={18} />
                              </motion.span>
                            }
                            disabled={inputsDisabled}
                          >
                            {m}
                          </Chip>
                        ))}
                      </div>

                      <div className="mt-3 text-[12px] text-black/50">
                        {inputsDisabled ? (
                          <>
                            This day is <span className="font-extrabold text-black">locked</span>. You can’t edit.
                          </>
                        ) : (
                          <>
                            Changes are a <span className="font-extrabold text-black">draft</span> until you hit{" "}
                            <span className="font-extrabold text-black">Save</span>.
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* REASON */}
              <div ref={focusReasonRef} />
              <Card
                title={
                  <span className="flex items-center gap-2">
                    Reason {inputsDisabled && <Pill>Locked</Pill>}
                    {!inputsDisabled && step === "reason" && <Pill tone="warn">Next</Pill>}
                  </span>
                }
              >
                <motion.div
                  initial={false}
                  animate={
                    !inputsDisabled && step === "reason"
                      ? { boxShadow: "0 0 0 4px rgba(185,255,102,0.35)" }
                      : { boxShadow: "0 0 0 0px rgba(0,0,0,0)" }
                  }
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
                  className="rounded-2xl"
                >
                  <div className="flex flex-wrap gap-2">
                    {reasons.map((r) => (
                      <Chip
                        key={r}
                        active={reason === r}
                        onClick={() => {
                          if (inputsDisabled) return;
                          setReason(r);
                         
                        }}
                        disabled={inputsDisabled}
                      >
                        {r}
                      </Chip>
                    ))}
                  </div>
                </motion.div>

                <div className="mt-3 text-[12px] text-black/50">
                  {inputsDisabled ? (
                    <>
                      This day is <span className="font-extrabold text-black">locked</span>. You can’t edit.
                    </>
                  ) : (
                    <>
                      Changes are a <span className="font-extrabold text-black">draft</span> until you hit{" "}
                      <span className="font-extrabold text-black">Save</span>.
                    </>
                  )}
                </div>
              </Card>

              {/* NOTES */}
              <div ref={focusNotesRef} />
              <motion.div
                initial={false}
                animate={
                  !inputsDisabled && step === "notes"
                    ? { boxShadow: "0 0 0 4px rgba(185,255,102,0.35)", borderRadius: 28 }
                    : { boxShadow: "0 0 0 0px rgba(0,0,0,0)", borderRadius: 28 }
                }
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
              >
                <NotesCard notes={notes} setNotes={setNotes} disabled={inputsDisabled} />
              </motion.div>
            </div>

            {/* Right */}
            <div className="flex flex-col gap-4">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <IconWellness className="h-5 w-5 text-black/60" />
                    Wellness Tips
                  </span>
                }
                right={wellness.personalized ? <Pill tone="green">Personalized</Pill> : <Pill>General</Pill>}
              >
                <motion.div
                  className="rounded-2xl border border-black/10 bg-black/[0.02] p-5"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
                >
                  <div className="text-[13px] font-extrabold text-[#141414]">{wellness.label}</div>
                  <ul className="mt-3 text-[13px] text-black/70 leading-relaxed space-y-2">
                    {wellness.tips.map((t, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.06 + i * 0.05, duration: 0.2, ease: "easeOut" }}
                      >
                        <span className="mt-[6px] h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHECKIN_GREEN }} />
                        <span>{t}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {!wellness.personalized && (
                    <div className="mt-4 text-[12px] text-black/50">
                      Personalization unlocks after you <span className="font-extrabold text-black">Save</span> your{" "}
                      <span className="font-extrabold text-black">Mood</span>, <span className="font-extrabold text-black">Reason</span>, and{" "}
                      <span className="font-extrabold text-black">Notes</span>.
                    </div>
                  )}

          
                  
                
                </motion.div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundFX() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 z-[0]">
      <motion.div
        className="absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(185,255,102,0.95), rgba(185,255,102,0))",
          opacity: 0.55,
        }}
        animate={reduce ? {} : { x: [0, 40, -20, 0], y: [0, 20, 50, 0], scale: [1, 1.08, 0.98, 1] }}
        transition={reduce ? {} : { duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute top-[12%] -right-40 h-[620px] w-[620px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(1200px 520px at 18% 0%, rgba(185,255,102,0.26) 0%, rgba(185,255,102,0.0) 58%), radial-gradient(900px 520px at 85% 10%, rgba(20,20,20,0.10) 0%, rgba(20,20,20,0.0) 60%), linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 55%, #F6F7FB 100%)",
        }}
        animate={reduce ? {} : { x: [0, -30, 16, 0], y: [0, 30, -18, 0], scale: [1, 1.05, 1, 1] }}
        transition={reduce ? {} : { duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.35) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.14,
          maskImage: "radial-gradient(900px 520px at 30% 20%, black 0%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(900px 520px at 30% 20%, black 0%, transparent 70%)",
        }}
        animate={reduce ? {} : { backgroundPosition: ["0px 0px", "24px 24px"] }}
        transition={reduce ? {} : { duration: 10, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
