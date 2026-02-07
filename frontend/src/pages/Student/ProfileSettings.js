// frontend/src/pages/Student/ProfileSettings.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utils/auth";

const PRIMARY_GREEN = "#B9FF66";
const GREEN_GLOW = "rgba(185, 255, 102, 0.22)";
const GREEN_SOFT = "rgba(185, 255, 102, 0.08)";

const TEXT_MAIN = "#0F172A";
const TEXT_MUTED = "#475569";
const TEXT_SOFT = "#64748B";

const DEFAULT_CAMPUS = "Arellano University Andres Bonifacio Campus";

const EMPTY_PROFILE = {
  firstName: "",
  lastName: "",
  studentNumber: "",
  email: "",
  campus: "",
  course: "",
  accountCreation: "",
};

const SECTIONS = [
  {
    title: "Student Details",
    subtitle: "Personal information",
    items: [
      { label: "First Name", key: "firstName" },
      { label: "Last Name", key: "lastName" },
      { label: "Student Number", key: "studentNumber", mono: true, breakAll: true },
      { label: "Email", key: "email", breakAll: true },
      { label: "Account Creation", key: "accountCreation", mono: true, breakAll: true },
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

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return safeText(value);
    return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return safeText(value);
  }
}

function Spinner({ size = 18 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

/* ======================
   API BASE (Local + Render)
   - Uses REACT_APP_API_URL (ex: http://localhost:5000 or https://checkin-backend-4xic.onrender.com)
   - Falls back to relative /api/* for local CRA proxy setups
====================== */
const API_BASE = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

async function fetchJsonSafe(url, options) {
  const res = await fetch(url, options);
  const raw = await res.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  return { res, data, raw };
}

/** Fetch the current user's profile from backend (JWT in Authorization header) */
async function fetchMyProfile() {
  const token = getToken();
  if (!token) throw new Error("Not authorized");

  const urls = [
    API_BASE ? `${API_BASE}/api/auth/me` : "/api/auth/me",
    API_BASE ? `${API_BASE}/api/users/me` : "/api/users/me",
    API_BASE ? `${API_BASE}/api/users/profile` : "/api/users/profile",
  ];

  let lastErr = null;

  for (const url of urls) {
    try {
      const { res, data, raw } = await fetchJsonSafe(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.status === 404) continue;

      if (res.status === 401 || res.status === 403) {
        throw new Error("Not authorized");
      }

      if (!res.ok) {
        const msg = (data?.message || raw || "Failed to load profile.").toString();
        throw new Error(msg);
      }

      // Some APIs return { user: {...} } — unwrap safely
      return data?.user ?? data;
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("Failed to load profile.");
}

function looksLikeHandle(name, username, email) {
  const n = String(name || "").trim();
  if (!n) return false;

  const nLower = n.toLowerCase();
  const uLower = String(username || "").trim().toLowerCase();
  const emailPrefix = String(email || "").split("@")[0]?.trim().toLowerCase();

  // Exact match with username or email prefix = likely handle
  if (uLower && nLower === uLower) return true;
  if (emailPrefix && nLower === emailPrefix) return true;

  // No spaces + has digits = likely not a real first name
  if (!/\s/.test(n) && /\d/.test(n)) return true;

  return false;
}

export default function ProfileSettings() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    // If token missing, redirect
    if (!getToken()) {
      navigate("/login", { replace: true });
      return;
    }

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setPageError("");

        const p = await fetchMyProfile();
        if (!alive) return;

        const backendFirst = (p?.firstName || "").trim();
        const backendLast = (p?.lastName || "").trim();
        const backendFull = (p?.fullName || "").trim();
        const backendUsername = (p?.username || "").trim();
        const backendEmail = (p?.email || "").trim();

        // Fallback from fullName only when it looks like a real "First Last"
        const split = splitName(backendFull);
        let firstName = backendFirst || split.firstName || "";
        let lastName = backendLast || split.lastName || "";

        // If the backend sends an email-handle/username as "firstName" (common with older records),
        // don't show it as a real name.
        const firstLooksHandle = looksLikeHandle(firstName, backendUsername, backendEmail);
        const fullLooksHandle = looksLikeHandle(backendFull, backendUsername, backendEmail);

        // Case A: first/last missing and computed from fullName, but fullName is a handle
        if (!backendFirst && !backendLast && firstLooksHandle && !lastName) {
          firstName = "";
          lastName = "";
        }

        // Case B: backendFirst exists but is actually a handle and last name is missing
        if (backendFirst && firstLooksHandle && !backendLast) {
          // If fullName is a proper spaced name, split it instead
          if (backendFull && backendFull.includes(" ") && !fullLooksHandle) {
            const s2 = splitName(backendFull);
            firstName = s2.firstName;
            lastName = s2.lastName;
          } else {
            firstName = "";
            lastName = "";
          }
        }

        const campus = (p?.campus || "").trim() || DEFAULT_CAMPUS;

        setProfile({
          firstName,
          lastName,
          studentNumber: p?.studentNumber || "",
          email: backendEmail || "",
          campus,
          course: (p?.course || "").trim(),
          accountCreation: formatDate(p?.accountCreation || p?.createdAt || p?.created_on || ""),
        });
      } catch (e) {
        if (!alive) return;

        const msg = e?.message || "Failed to load profile";

        // If auth error, push to login
        if (String(msg).toLowerCase().includes("not authorized")) {
          navigate("/login", { replace: true });
          return;
        }

        setPageError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  const resolved = useMemo(() => {
    const data = profile || EMPTY_PROFILE;
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.map((it) => ({ ...it, value: safeText(data[it.key]) })),
    }));
  }, [profile]);

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
            <header className="max-w-3xl mx-auto sm:mx-0 text-center sm:text-left">
              <h1
                id="profile-settings-title"
                className="font-extrabold tracking-tight text-2xl sm:text-3xl lg:text-[34px] break-words leading-tight"
                style={{ fontFamily: "Nunito, sans-serif", color: TEXT_MAIN }}
              >
                Profile Settings
              </h1>

              <p className="mt-2.5 text-sm sm:text-base text-gray-600 break-words leading-relaxed" style={{ fontFamily: "Lora, serif", color: TEXT_MUTED }}>
                This information is <strong style={{ color: TEXT_MAIN }}>read-only</strong>. Corrections must be requested via the{" "}
                <strong style={{ color: TEXT_MAIN }}>Guidance Office</strong>.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
                {loading && (
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-green-200/70 bg-green-50/60 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-gray-700 whitespace-nowrap"
                    style={{ fontFamily: "Nunito, sans-serif", boxShadow: `0 0 0 2px ${GREEN_GLOW}` }}
                  >
                    <Spinner size={16} />
                    Loading profile…
                  </div>
                )}

                {pageError && !loading && (
                  <div className="rounded-[16px] border-2 border-black bg-red-50 px-4 py-3 text-[13px] text-black">
                    <span className="font-extrabold">Error:</span> {pageError}
                  </div>
                )}

                <span
                  className="inline-flex items-center gap-2 rounded-full border border-green-200/70 bg-green-50/60 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-gray-700 whitespace-nowrap"
                  style={{ fontFamily: "Nunito, sans-serif", boxShadow: `0 0 0 2px ${GREEN_GLOW}` }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PRIMARY_GREEN }} aria-hidden="true" />
                  System Locked
                </span>
              </div>
            </header>

            <main className="mt-8 sm:mt-9">
              <div className="rounded-xl border border-gray-200/70 bg-white overflow-hidden shadow-md">
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${PRIMARY_GREEN} 0%, #84CC16 100%)` }} aria-hidden="true" />

                <div className="px-3 sm:px-5 lg:px-6 py-5 sm:py-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    {resolved.map((section) => {
                      const sectionId = `${section.title.toLowerCase().replace(/\s+/g, "-")}-heading`;

                      return (
                        <section key={section.title} aria-labelledby={sectionId} className="min-w-0">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="h-2.5 w-2.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: PRIMARY_GREEN }} aria-hidden="true" />
                            <div className="min-w-0">
                              <h2
                                id={sectionId}
                                className="font-extrabold text-base sm:text-lg lg:text-xl break-words leading-tight"
                                style={{ fontFamily: "Nunito, sans-serif", color: TEXT_MAIN }}
                              >
                                {section.title}
                              </h2>
                              <p className="mt-1 text-xs sm:text-sm lg:text-base break-words leading-relaxed" style={{ fontFamily: "Lora, serif", color: TEXT_SOFT }}>
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
                                      style={{ color: TEXT_MAIN, fontFamily: "Nunito, sans-serif" }}
                                    >
                                      {item.value}
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
                  <h3 className="font-extrabold text-base sm:text-lg break-words leading-tight" style={{ fontFamily: "Nunito, sans-serif", color: TEXT_MAIN }}>
                    Guidance Office Only
                  </h3>
                  <p className="mt-1.5 text-sm break-words leading-relaxed" style={{ fontFamily: "Lora, serif", color: TEXT_MUTED }}>
                    Report any incorrect information directly to the <strong style={{ color: TEXT_MAIN }}>Guidance Office</strong>.
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
