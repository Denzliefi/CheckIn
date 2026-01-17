// src/pages/ProfileSettings.js
import React from "react";

/* ===================== THEME ===================== */
const ACCENT = "#B9FF66";
const TEXT_MAIN = "#141414";
const TEXT_MUTED = "rgba(20,20,20,0.82)";
const TEXT_SOFT = "rgba(20,20,20,0.6)";

/* ===================== DATA ===================== */
const profileData = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  studentId: "2024-000000",
  email: "student@pup.edu.ph",
  campus: "Andres Bonifacio Campus",
  course: "Bachelor of Science in Information Technology",
};

export default function ProfileSettings() {
  return (
    <div className="min-h-[calc(100vh-82px)] w-full bg-[#f7f8fb] px-4 pt-16 pb-12 flex justify-center">
      <div className="w-full max-w-[900px]">
        <div className="relative rounded-[28px] bg-white border border-black/10 shadow-[0_25px_60px_rgba(0,0,0,0.08)] overflow-hidden">
          {/* Soft shapes */}
          <div
            className="absolute -top-32 -right-32 h-80 w-80 rounded-full"
            style={{ background: `${ACCENT}40` }}
          />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-black/5" />

          <div className="relative px-6 py-8 sm:px-10 sm:py-12">
            {/* Header */}
            <div className="text-center max-w-[720px] mx-auto">
              <h1
                className="font-[Nunito] text-[30px] sm:text-[36px] font-extrabold tracking-tight"
                style={{ color: TEXT_MAIN }}
              >
                Profile Settings
              </h1>

              <p
                className="mt-3 font-[Lora] text-[15px] sm:text-[16px] leading-relaxed"
                style={{ color: TEXT_MUTED }}
              >
                This information is <strong>read-only</strong>. Any corrections must be handled by the{" "}
                <strong>Guidance Office only</strong>.
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/10 bg-white shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ACCENT }} />
                <span className="font-[Nunito] text-[12.5px] font-extrabold tracking-wide">
                  READ ONLY
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Details */}
              <Card title="Student Details" subtitle="System-provided information">
                <InfoItem label="First Name" value={profileData.firstName} />
                <InfoItem label="Last Name" value={profileData.lastName} />
                <InfoItem label="Student ID" value={profileData.studentId} mono />
                <InfoItem label="Email Address" value={profileData.email} />
              </Card>

              {/* Academic Info */}
              <Card title="Academic Information" subtitle="Campus & course details">
                <InfoItem label="Campus" value={profileData.campus} />
                <InfoItem label="Course" value={profileData.course} multiline />
              </Card>
            </div>

            {/* Notice */}
            <div className="mt-10 flex justify-center">
              <div className="w-full max-w-[760px] rounded-2xl border border-black/10 bg-white px-6 py-5 shadow-sm flex gap-4">
                <div className="h-10 w-10 rounded-xl border border-black/10 bg-[#f7f7f7] flex items-center justify-center shrink-0">
                  <LockIcon />
                </div>

                <div>
                  <div className="font-[Nunito] font-extrabold text-[15px]" style={{ color: TEXT_MAIN }}>
                    Guidance Office Only
                  </div>

                  <p className="mt-1 font-[Lora] text-[14.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                    If any information shown here is incorrect, please report it directly to the{" "}
                    <strong>Guidance Office</strong>. Students cannot modify these details themselves.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End */}
      </div>
    </div>
  );
}

/* ===================== UI ===================== */
function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white shadow-sm px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-[Nunito] font-extrabold text-[16px]" style={{ color: TEXT_MAIN }}>
            {title}
          </h3>
          <p className="mt-1 font-[Lora] text-[13.5px]" style={{ color: TEXT_SOFT }}>
            {subtitle}
          </p>
        </div>

        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-[Nunito] font-extrabold border border-black/10"
          style={{ backgroundColor: `${ACCENT}35`, color: TEXT_MAIN }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-black/50" />
          Locked
        </span>
      </div>

      {/* ✅ Instead of table/rows → spaced info blocks */}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function InfoItem({ label, value, multiline = false, mono = false }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fbfbfb] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-[Nunito] text-[13px] font-extrabold uppercase tracking-wide text-black/45">
            {label}
          </div>

          <div
            className={[
              "mt-1 font-[Nunito] text-[16px] font-extrabold text-[#141414]",
              mono ? "font-mono tracking-tight" : "",
              multiline ? "leading-relaxed break-words" : "truncate",
            ].join(" ")}
            title={value}
          >
            {value}
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-[Nunito] font-extrabold text-black/50">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
          locked
        </span>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.5 10V8.4C7.5 5.9 9.5 4 12 4s4.5 1.9 4.5 4.4V10"
        stroke="#141414"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7.2 10h9.6c.7 0 1.2.5 1.2 1.2v7.1c0 .7-.5 1.2-1.2 1.2H7.2c-.7 0-1.2-.5-1.2-1.2v-7.1c0-.7.5-1.2 1.2-1.2Z"
        stroke="#141414"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
