// src/components/FloatingMessagesPill.js
import React from "react";

export default function FloatingMessagesPill({
  accent = "#B9FF66",
  unread = 0,
  onClick,
  hidden = false,
}) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label="Open Messages"
      title="Messages"
      className="fixed z-[10000] flex items-center gap-3 px-4 py-3 rounded-full shadow-2xl border border-black/10 bg-white/90 hover:bg-white transition"
      style={{
        right: "calc(16px + env(safe-area-inset-right))",
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        touchAction: "manipulation",
        pointerEvents: "auto",
      }}
    >
      <span
        className="h-11 w-11 md:h-12 md:w-12 rounded-full grid place-items-center"
        style={{ backgroundColor: `${accent}55`, color: "#141414" }}
      >
        💬
      </span>

      <div className="text-left leading-tight">
        <div className="font-[Nunito] font-extrabold text-[14.5px]" style={{ color: "#141414" }}>
          Messages
        </div>
        <div className="font-[Lora] text-[12.5px]" style={{ color: "rgba(20,20,20,0.70)" }}>
          {unread > 0 ? "You have new replies" : "Talk to a counselor"}
        </div>
      </div>

      {unread > 0 ? (
        <span className="ml-1 px-2 py-[2px] rounded-full text-[12px] font-[Nunito] font-extrabold text-white bg-red-500">
          {unread}
        </span>
      ) : null}
    </button>
  );
}
