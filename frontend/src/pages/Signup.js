import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import GoogleButton from "../components/GoogleButton";

import heroImg from "../assets/mental-health.png";
import { signInWithGoogle } from "../auth";

/* ======================
   COURSES (SINGLE LIST)
====================== */
const COURSES = [
  "Bachelor of Science in Nursing",
  "Bachelor of Elementary Education (SPED)",
  "Bachelor of Physical Education",
  "Bachelor of Secondary Education",
  "Bachelor of Science in Business Administration (BSBA)",
  "Bachelor of Science in Accounting Information System",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Hospitality Management (BSHM)",
  "Bachelor of Science in Tourism Management (BSTM)",
  "Bachelor of Science in Criminology",
  "Bachelor of Arts in English Language",
  "Bachelor of Arts in Psychology",
  "Bachelor of Arts in Political Science",
];

/* ======================
   SPINNER (for modal btn)
====================== */
function Spinner({ size = 16 }) {
  return (
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ======================
   TERMS MODAL
====================== */
function TermsModal({ open, onClose, onAgree, agreed, setAgreed, loading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-[760px] rounded-[22px] border-4 border-black bg-white shadow-[0_18px_0_rgba(0,0,0,0.18)] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-black/10">
          <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-[0.12em]">
            TERMS & CONDITIONS
          </h2>
          <p className="text-[13px] text-black/60 mt-2">
            Please review and accept to create your account.
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[55vh] overflow-y-auto text-[13px] sm:text-[14px] leading-relaxed text-black/75">
          <p className="font-bold text-black/80 mb-2">Summary</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              CheckIn supports student well-being using journaling and PHQ-9
              self-assessment.
            </li>
            <li>
              CheckIn is <span className="font-semibold">not</span> a diagnostic
              tool and does not replace professional care.
            </li>
            <li>Use the platform respectfully. Do not attempt unauthorized access or misuse.</li>
            <li>If you are in immediate danger, contact emergency services or your local hotline.</li>
          </ul>

          <div className="mt-5">
            <p className="font-bold text-black/80 mb-2">Full Terms</p>
            <p className="mb-3">
              By creating an account and using CheckIn, you agree to use the platform only for
              lawful and appropriate purposes. You must not misuse the service, violate security,
              or disrupt the platform.
            </p>
            <p className="mb-3">
              CheckIn may store and process information you provide (such as journal entries and
              PHQ-9 responses) to deliver features and improve performance. Your content is private
              by default and remains under your control unless you explicitly share it for support.
            </p>
            <p className="mb-3">
              CheckIn is provided “as is.” While we aim for reliability, we cannot guarantee
              uninterrupted availability.
            </p>
            <p>
              We may update these terms when necessary. Continued use of the platform constitutes
              acceptance of updated terms.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-black/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label className="flex items-center gap-2 text-[13px] font-bold">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="accent-greenBorder"
            />
            I agree to the Terms & Conditions
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-[13px] font-extrabold rounded-[12px] border-2 border-black bg-white hover:bg-black/5"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!agreed || loading}
              onClick={onAgree}
              className={`px-5 py-2 text-[13px] font-extrabold rounded-[12px] border-2 border-black
                flex items-center gap-2 justify-center
                ${
                  agreed
                    ? "bg-black text-white hover:opacity-90"
                    : "bg-black/30 text-white cursor-not-allowed"
                }
              `}
            >
              {loading ? (
                <>
                  <Spinner />
                  Loading
                </>
              ) : (
                "Agree & Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================
   CUSTOM DROPDOWN (FIX OVERLAP)
   - Controlled menu (no native select)
   - Scrollable list
   - Opens upward if not enough space below
====================== */
function CourseDropdown({ label, value, onChange, options, disabled }) {
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);

  const selectedLabel = value || "Select your course";

  const decideDirection = () => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuNeeded = 280; // approx menu height

    // open upward if not enough space below but enough above
    setOpenUp(spaceBelow < menuNeeded && spaceAbove > spaceBelow);
  };

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;

    decideDirection();

    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) close();
    };

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };

    const onResize = () => decideDirection();
    const onScroll = () => decideDirection();

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const handlePick = (opt) => {
    // mimic select event shape used in your setField
    onChange({ target: { value: opt } });
    close();
  };

  return (
    <div ref={wrapRef} className="relative">
      <span className="block text-[13px] font-extrabold text-black/80 mb-1">
        {label}
      </span>

      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className={`
          w-full text-left
          rounded-[14px] border-2 border-black bg-white
          px-4 pr-10
          py-3 sm:py-[14px]
          text-[14px] sm:text-[15px]
          leading-tight
          focus:outline-none focus:ring-2 focus:ring-black/20
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`${value ? "text-black" : "text-black/50"} block truncate`}>
          {selectedLabel}
        </span>

        {/* Arrow */}
        <span className="pointer-events-none absolute right-3 top-[42px] sm:top-[46px] -translate-y-1/2 text-black">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className={`
            absolute z-[999]
            w-full
            rounded-[14px] border-2 border-black bg-white
            shadow-[0_16px_0_rgba(0,0,0,0.14)]
            overflow-hidden
            ${openUp ? "bottom-[calc(100%+10px)]" : "top-[calc(100%+10px)]"}
          `}
        >
          {/* Scroll area */}
          <div className="max-h-[280px] overflow-y-auto">
            {/* Placeholder / first row */}
            <button
              type="button"
              onClick={() => handlePick("")}
              className={`
                w-full text-left px-4 py-3 text-[14px]
                hover:bg-black/5
                ${!value ? "font-extrabold" : "font-semibold"}
              `}
            >
              Select your course
            </button>

            {options.map((opt) => {
              const active = opt === value;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePick(opt)}
                  className={`
                    w-full text-left px-4 py-3 text-[14px]
                    hover:bg-black/5
                    ${active ? "bg-black text-white hover:bg-black" : "text-black"}
                  `}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Signup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    studentNumber: "",
    course: "",
    password: "",
    confirmPassword: "",
  });

  const setField = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  // terms flow
  const [showTerms, setShowTerms] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);

  useEffect(() => {
    const savedTerms = localStorage.getItem("termsAccepted") === "true";
    setTermsAgreed(savedTerms);
  }, []);

  const openTerms = () => setShowTerms(true);

  const handleAgreeTerms = () => {
    setTermsLoading(true);
    setTimeout(() => {
      localStorage.setItem("termsAccepted", "true");
      setTermsAgreed(true);
      setShowTerms(false);
      setTermsLoading(false);
    }, 450);
  };

  const requireTermsThen = async (fn) => {
    if (!termsAgreed) {
      setShowTerms(true);
      return;
    }
    await fn();
  };

  const handleGoogleSignup = async () => {
    await requireTermsThen(async () => {
      setLoading(true);
      setError("");

      try {
        const firebaseUser = await signInWithGoogle();
        const u = firebaseUser?.user || firebaseUser;

        const payload = {
          googleId: u?.uid,
          email: u?.email,
          fullName: u?.displayName || u?.email?.split("@")?.[0],
          course: form.course || "",
        };

        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Google signup failed (backend).");

        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/dashboard");
      } catch (error) {
        console.error(error);
        setError(error.message || "Google sign up failed");
      } finally {
        setLoading(false);
      }
    });
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();

    await requireTermsThen(async () => {
      setLoading(true);
      setError("");

      try {
        const firstName = form.firstName.trim();
        const lastName = form.lastName.trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ");

        if (
          !firstName ||
          !lastName ||
          !form.email ||
          !form.username ||
          !form.studentNumber ||
          !form.course ||
          !form.password
        ) {
          throw new Error("Please fill in all required fields.");
        }
        if (form.password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match.");

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName,
            firstName,
            lastName,
            email: form.email,
            username: form.username,
            studentNumber: form.studentNumber,
            course: form.course,
            password: form.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed.");

        if (data.token) localStorage.setItem("token", data.token);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/dashboard");
      } catch (err) {
        setError(err.message || "Signup failed.");
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="relative">
      {/* TERMS MODAL */}
      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAgree={handleAgreeTerms}
        agreed={termsAgreed}
        setAgreed={setTermsAgreed}
        loading={termsLoading}
      />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-[60px] px-5 sm:px-10 lg:px-[90px] pt-10 sm:pt-14 lg:pt-[70px] pb-10">
        {/* LEFT: SIGNUP FORM */}
        <section className="w-full max-w-[420px] lg:max-w-[420px] mt-[18px] animate-slideIn">
          <h1 className="text-[28px] sm:text-[34px] font-black tracking-[.22em] sm:tracking-[.26em] mb-3">
            SIGN UP
          </h1>

          <p className="text-[14px] sm:text-[15px] text-muted mb-6">
            Create your account. It only takes a minute.
          </p>

          {error && (
            <div className="mb-4 rounded-[14px] border-2 border-black bg-red-50 px-4 py-3 text-[13px] text-black">
              <span className="font-extrabold">Error:</span> {error}
            </div>
          )}

          <form className="flex flex-col gap-[6px]" onSubmit={handleCreateAccount}>
            {/* First + Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label="First Name"
                type="text"
                placeholder="Enter your first name"
                value={form.firstName}
                onChange={setField("firstName")}
              />
              <TextInput
                label="Last Name"
                type="text"
                placeholder="Enter your last name"
                value={form.lastName}
                onChange={setField("lastName")}
              />
            </div>

            <TextInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={setField("email")}
            />

            <TextInput
              label="Username"
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={setField("username")}
            />

            <TextInput
              label="Student number"
              type="text"
              placeholder="Enter your student number"
              value={form.studentNumber}
              onChange={setField("studentNumber")}
            />

            {/* ✅ FIXED dropdown (no native select overlap) */}
            <CourseDropdown
              label="Course"
              value={form.course}
              onChange={setField("course")}
              options={COURSES}
              disabled={loading}
            />

            <TextInput
              label="Password"
              type="password"
              placeholder="********"
              value={form.password}
              onChange={setField("password")}
            />

            <TextInput
              label="Confirm Password"
              type="password"
              placeholder="********"
              value={form.confirmPassword}
              onChange={setField("confirmPassword")}
            />

            {/* Terms row */}
            <div className="flex items-start gap-2 text-[13px] mt-2">
              <input
                type="checkbox"
                className="accent-greenBorder mt-[2px]"
                checked={termsAgreed}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTermsAgreed(checked);
                  if (!checked) {
                    localStorage.removeItem("termsAccepted");
                  } else {
                    openTerms();
                  }
                }}
              />
              <p className="text-black/70 leading-relaxed">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={openTerms}
                  className="font-extrabold underline text-black"
                >
                  Terms & Conditions
                </button>
                .
              </p>
            </div>

            <PrimaryButton className="mt-4 w-full" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </PrimaryButton>

            <GoogleButton onClick={handleGoogleSignup} loading={loading}>
              {loading ? "Connecting…" : "Continue with Google"}
            </GoogleButton>

            <p className="text-[13px] text-muted mt-4">
              Already have an account?{" "}
              <Link to="/" className="font-extrabold hover:underline">
                Login
              </Link>
            </p>
          </form>
        </section>

        {/* RIGHT: HERO IMAGE */}
        <img
          src={heroImg}
          alt="Mental Health"
          className="w-full max-w-[980px] lg:max-w-none lg:w-[min(900px,62vw)] animate-fadeUp"
        />
      </div>
    </div>
  );
}
