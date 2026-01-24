// src/pages/ProfileSettings.js
import React, { useMemo } from "react";

const PRIMARY_GREEN = "#B9FF66";
const GREEN_GLOW = "rgba(185, 255, 102, 0.22)";
const GREEN_SOFT = "rgba(185, 255, 102, 0.08)";

const TEXT_MAIN = "#0F172A";
const TEXT_MUTED = "#475569";
const TEXT_SOFT = "#64748B";

const DEFAULT_PROFILE = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  studentId: "2201-267",
  email: "student@pup.edu.ph",
  campus: "Andres Bonifacio Campus",
  course: "Bachelor of Science in Information Technology",
};

const SECTIONS = [
  {
    title: "Student Details",
    subtitle: "Personal information",
    items: [
      { label: "First Name", key: "firstName" },
      { label: "Last Name", key: "lastName" },
      { label: "Student ID", key: "studentId", mono: true, breakAll: true },
      { label: "Email", key: "email", breakAll: true },
    ],
  },
  {
    title: "Academic Info",
    subtitle: "Campus & program",
    items: [
      { label: "Campus", key: "campus" },
      { label: "Course", key: "course", multiline: true, clampOnSmall: true },
    ],
  },
];

function safeText(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default function ProfileSettings({ profile }) {
  const data = profile ?? DEFAULT_PROFILE;

  const resolved = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((it) => ({ ...it, value: safeText(data[it.key]) })),
    }));
  }, [data]);

  return (
    <div
      className={[
        "min-h-[calc(100vh-82px)] w-full",
        "bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9]",
        "px-2 sm:px-6 lg:px-8 pb-10 flex justify-center",
        "pt-[max(2.75rem,env(safe-area-inset-top))] sm:pt-14 lg:pt-16",
      ].join(" ")}
    >
      <div className="w-full max-w-4xl xl:max-w-5xl">
        <div
          className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-xl"
          role="region"
          aria-labelledby="profile-settings-title"
        >
          <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `0 0 0 6px ${GREEN_GLOW}` }} aria-hidden="true" />

          <div className="relative px-4 sm:px-7 lg:px-9 py-7 sm:py-9">
            <div className="h-2 sm:h-3" aria-hidden="true" />

            <header className="max-w-3xl mx-auto sm:mx-0 text-center sm:text-left">
              <h1
                id="profile-settings-title"
                className="font-extrabold tracking-tight text-2xl sm:text-3xl lg:text-[34px] break-words leading-tight"
                style={{ fontFamily: "Nunito, sans-serif", color: TEXT_MAIN }}
              >
                Profile Settings
              </h1>

              <p
                className="mt-2.5 text-sm sm:text-base text-gray-600 break-words leading-relaxed"
                style={{ fontFamily: "Lora, serif", color: TEXT_MUTED }}
              >
                This information is <strong style={{ color: TEXT_MAIN }}>read-only</strong>. Corrections must be
                requested via the <strong style={{ color: TEXT_MAIN }}>Guidance Office</strong>.
              </p>

              <div className="mt-4 flex justify-center sm:justify-start gap-2.5 flex-wrap">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-green-200/70 bg-green-50/60 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-gray-700 whitespace-nowrap"
                  style={{ fontFamily: "Nunito, sans-serif", boxShadow: `0 0 0 2px ${GREEN_GLOW}` }}
                  aria-label="This profile is locked by the system"
                  title="System Locked"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIMARY_GREEN }} aria-hidden="true" />
                  System Locked
                </span>
              </div>
            </header>

            <main className="mt-8 sm:mt-9" aria-describedby="profile-readonly-description">
              <p id="profile-readonly-description" className="sr-only">
                All fields on this page are read-only and cannot be edited by students.
              </p>

              <div className="rounded-xl border border-gray-200/70 bg-white overflow-hidden shadow-md">
                <div
                  className="h-1.5"
                  style={{ background: `linear-gradient(90deg, ${PRIMARY_GREEN} 0%, #84CC16 100%)` }}
                  aria-hidden="true"
                />

                <div className="px-3 sm:px-5 lg:px-6 py-5 sm:py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {resolved.map((section) => {
                      const sectionId = `${section.title.toLowerCase().replace(/\s+/g, "-")}-heading`;

                      return (
                        <section key={section.title} aria-labelledby={sectionId} className="min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0 mt-1"
                                  style={{ backgroundColor: PRIMARY_GREEN }}
                                  aria-hidden="true"
                                />
                                <h2
                                  id={sectionId}
                                  className="font-extrabold text-base sm:text-lg lg:text-xl break-words leading-tight"
                                  style={{
                                    fontFamily: "Nunito, sans-serif",
                                    color: TEXT_MAIN,
                                    overflowWrap: "anywhere",
                                    wordBreak: "break-word",
                                  }}
                                  title={section.title}
                                >
                                  {section.title}
                                </h2>
                              </div>

                              <p
                                className="mt-1 text-xs sm:text-sm lg:text-base break-words leading-relaxed"
                                style={{ fontFamily: "Lora, serif", color: TEXT_SOFT }}
                              >
                                {section.subtitle}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-lg border border-gray-200/70 overflow-hidden">
                            {section.items.map((item, idx) => {
                              const labelId = `${section.title}-${item.label}`.toLowerCase().replace(/\s+/g, "-");

                              return (
                                <div
                                  key={item.label}
                                  className={[
                                    "px-3 sm:px-5 py-3.5",
                                    idx !== section.items.length - 1 ? "border-b border-gray-200/70" : "",
                                  ].join(" ")}
                                  style={{ background: idx % 2 === 0 ? GREEN_SOFT : "white" }}
                                  role="group"
                                  aria-labelledby={`${labelId}-label`}
                                >
                                  <div className="flex flex-col gap-2.5">
                                    <div className="min-w-0">
                                      <div
                                        id={`${labelId}-label`}
                                        className="text-xs font-extrabold uppercase tracking-wide text-gray-500"
                                        style={{ fontFamily: "Nunito, sans-serif" }}
                                      >
                                        {item.label}
                                      </div>

                                      <div
                                        className={[
                                          "mt-1 text-sm sm:text-base font-extrabold min-w-0 whitespace-normal",
                                          item.mono ? "font-mono tracking-tight" : "",
                                          item.breakAll ? "break-all" : "break-words",
                                        ].join(" ")}
                                        style={{
                                          color: TEXT_MAIN,
                                          overflowWrap: "anywhere",
                                          wordBreak: item.breakAll ? "break-all" : "break-word",
                                          fontFamily: "Nunito, sans-serif",
                                        }}
                                        title={item.value}
                                      >
                                        {item.value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>
            </main>

            <div className="mt-8 sm:mt-10 flex justify-center">
              <div
                className="w-full max-w-3xl rounded-xl border border-green-200/50 bg-green-50/20 px-4 sm:px-6 py-5 sm:py-6 shadow-md flex flex-col sm:flex-row gap-4 sm:gap-5 items-start"
                style={{ boxShadow: `0 0 0 4px ${GREEN_GLOW}` }}
                role="region"
                aria-labelledby="guidance-notice-heading"
              >
                <div
                  className="h-10 w-10 rounded-lg border border-green-200 flex items-center justify-center shrink-0 bg-green-50/40"
                  style={{ boxShadow: `0 0 0 3px ${GREEN_GLOW}` }}
                  aria-hidden="true"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={TEXT_MAIN} strokeWidth="2">
                    <path d="M7 11V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V11" strokeLinecap="round" />
                    <path
                      d="M6.8 11H17.2C18.1193 11 18.8 11.6807 18.8 12.6V18.4C18.8 19.3193 18.1193 20 17.2 20H6.8C5.88067 20 5.2 19.3193 5.2 18.4V12.6C5.2 11.6807 5.88067 11 6.8 11Z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h3
                      id="guidance-notice-heading"
                      className="font-extrabold text-base sm:text-lg break-words leading-tight"
                      style={{
                        fontFamily: "Nunito, sans-serif",
                        color: TEXT_MAIN,
                        overflowWrap: "anywhere",
                        wordBreak: "break-word",
                      }}
                    >
                      Guidance Office Only
                    </h3>
                  </div>

                  <p className="mt-1.5 text-sm break-words leading-relaxed" style={{ fontFamily: "Lora, serif", color: TEXT_MUTED }}>
                    Report any incorrect information directly to the{" "}
                    <strong style={{ color: TEXT_MAIN }}>Guidance Office</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
