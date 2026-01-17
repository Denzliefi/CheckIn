// src/pages/Login.js
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import TextInput from "../components/TextInput";
import PrimaryButton from "../components/PrimaryButton";
import GoogleButton from "../components/GoogleButton";

import heroImg from "../assets/mental-health.png";
import { signInWithGoogle } from "../auth";
import { setAuth, getUser, getToken } from "../utils/auth";

/* ======================
   SPINNER
====================== */
function Spinner({ size = 18 }) {
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
   EYE ICONS
====================== */
function EyeOpenIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeClosedIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.4 6.4C4.1 8.1 2.5 12 2.5 12s3.5 7 9.5 7c1.56 0 2.96-.29 4.2-.78"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.8 4.22A10.2 10.2 0 0 1 12 5c6 0 9.5 7 9.5 7s-1.34 2.67-4.02 4.62"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-[min(760px,94vw)] rounded-[22px] border-4 border-black bg-white shadow-[0_18px_0_rgba(0,0,0,0.18)] overflow-hidden">
        <div className="p-6 border-b border-black/10">
          <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-[0.12em]">
            TERMS & CONDITIONS
          </h2>
          <p className="text-[13px] text-black/60 mt-2">
            Please review and accept to continue.
          </p>
        </div>

        <div className="p-6 max-h-[52vh] overflow-y-auto text-[13px] sm:text-[14px] leading-relaxed text-black/75">
          <p className="font-bold text-black/80 mb-2">Summary (student-friendly)</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>CheckIn supports student well-being using tools like journaling and PHQ-9 self-assessment.</li>
            <li>
              CheckIn is <span className="font-semibold">not</span> a diagnostic tool and does not
              replace professional mental health care.
            </li>
            <li>You are responsible for keeping your account secure and using the platform respectfully.</li>
            <li>If you are in immediate danger, contact emergency services or your local hotline.</li>
          </ul>

          <div className="mt-5">
            <p className="font-bold text-black/80 mb-2">Full Terms</p>
            <p className="mb-3">
              By using CheckIn, you agree to follow these terms and to use the platform only for lawful,
              respectful, and appropriate purposes.
            </p>
            <p className="mb-3">
              CheckIn may store and process information you provide (such as journal entries and PHQ-9
              responses). Your content is private by default and remains under your control.
            </p>
            <p className="mb-3">
              CheckIn is provided “as is.” While we aim for reliability, we cannot guarantee the service
              will always be available or error-free.
            </p>
            <p>You may stop using CheckIn at any time. We may update these terms when needed.</p>
          </div>
        </div>

        <div className="p-6 border-t border-black/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <label className="flex items-center gap-2 text-[13px] font-bold">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="accent-greenBorder"
              disabled={loading}
            />
            I agree to the Terms & Conditions
          </label>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-[13px] font-extrabold rounded-[12px] border-2 border-black bg-white hover:bg-black/5
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 disabled:opacity-60"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!agreed || loading}
              onClick={onAgree}
              className={`px-5 py-2 text-[13px] font-extrabold rounded-[12px] border-2 border-black
                          flex items-center gap-2 justify-center
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25
                          ${
                            agreed && !loading
                              ? "bg-black text-white hover:opacity-90 active:scale-[0.99]"
                              : "bg-black/30 text-white cursor-not-allowed"
                          }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner size={16} />
                  <span className="leading-none">Loading</span>
                </span>
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
   HELPERS
====================== */
function redirectByRole(navigate, role) {
  if (role === "Admin") return navigate("/admin");
  if (role === "Consultant") return navigate("/consultant");
  return navigate("/dashboard");
}

function isBlank(v) {
  return !v || v.trim().length === 0;
}

export default function Login() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const [emailErr, setEmailErr] = useState("");
  const [passErr, setPassErr] = useState("");

  const [showPass, setShowPass] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);

  // ✅ focus (glow only when focused OR invalid)
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // ✅ touched = user interacted; attemptedSubmit = pressed login
  const [emailTouched, setEmailTouched] = useState(false);
  const [passTouched, setPassTouched] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const emailWrapRef = useRef(null);
  const passWrapRef = useRef(null);

  useEffect(() => {
    const savedTerms = localStorage.getItem("termsAccepted") === "true";
    setTermsAgreed(savedTerms);

    const token = getToken();
    const user = getUser();
    if (token && user?.role) {
      redirectByRole(navigate, user.role);
    }
  }, [navigate]);

  const focusFirstInvalid = (first) => {
    const ref = first === "email" ? emailWrapRef : passWrapRef;
    const el = ref.current?.querySelector("input, textarea, select");
    el?.focus?.();
  };

  const validate = () => {
    setAttemptedSubmit(true);
    setEmailTouched(true);
    setPassTouched(true);

    const eBlank = isBlank(emailOrUsername);
    const pBlank = isBlank(password);

    const nextEmailErr = eBlank ? "This field can’t be blank" : "";
    const nextPassErr = pBlank ? "This field can’t be blank" : "";

    setEmailErr(nextEmailErr);
    setPassErr(nextPassErr);

    if (nextEmailErr) return { ok: false, first: "email" };
    if (nextPassErr) return { ok: false, first: "pass" };
    return { ok: true, first: null };
  };

  const onEmailChange = (e) => {
    const v = e.target.value;
    setEmailOrUsername(v);

    if (!isBlank(v)) setEmailErr("");
    if (pageError) setPageError("");
  };

  const onPassChange = (e) => {
    const v = e.target.value;
    setPassword(v);

    if (!isBlank(v)) setPassErr("");
    if (pageError) setPageError("");
  };

  const requireTermsThen = async (fn) => {
    if (!termsAgreed) {
      setShowTerms(true);
      return;
    }
    await fn();
  };

  const handleAgreeTerms = () => {
    setTermsLoading(true);
    setTimeout(() => {
      localStorage.setItem("termsAccepted", "true");
      setTermsAgreed(true);
      setShowTerms(false);
      setTermsLoading(false);
    }, 500);
  };

  // ✅ RULE:
  // invalid => RED (even if focused)
  // focused + valid => GREEN
  // otherwise => no glow
  const inputGlow = ({ focused, invalid }) => {
    if (!focused && !invalid) return "";
    if (invalid)
      return "ring-2 ring-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.18)] border-transparent";
    return "ring-2 ring-[#B9FF66] shadow-[0_0_0_4px_rgba(185,255,102,0.22)] border-transparent";
  };

  // invalid flags
  const emailInvalid =
    (emailTouched || attemptedSubmit) && (isBlank(emailOrUsername) || !!emailErr);

  const passInvalid =
    (passTouched || attemptedSubmit) && (isBlank(password) || !!passErr);

  /* ======================
     EMAIL/PASSWORD LOGIN
  ====================== */
  const handleEmailLogin = async () => {
    if (submitting) return;

    const v = validate();
    if (!v.ok) {
      focusFirstInvalid(v.first);
      return;
    }

    await requireTermsThen(async () => {
      if (submitting) return;

      setSubmitting(true);
      setPageError("");

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailOrUsername: emailOrUsername.trim(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Login failed");

        setAuth(data.token, data.user);
        redirectByRole(navigate, data.user.role);
      } catch (err) {
        const msg = err?.message || "Login failed";
        setPageError(msg);

        // optional: make fields red too for bad creds
        setAttemptedSubmit(true);
        setEmailTouched(true);
        setPassTouched(true);

        if (/invalid|incorrect|wrong|credential/i.test(msg)) {
          setEmailErr("Invalid email/username or password");
          setPassErr("Invalid email/username or password");
        }
      } finally {
        setSubmitting(false);
      }
    });
  };

  /* ======================
     GOOGLE LOGIN
  ====================== */
  const handleGoogleLogin = async () => {
    if (submitting) return;

    await requireTermsThen(async () => {
      if (submitting) return;

      setSubmitting(true);
      setPageError("");

      try {
        const firebaseUser = await signInWithGoogle();

        const payload = {
          googleId: firebaseUser?.uid,
          email: firebaseUser?.email,
          fullName: firebaseUser?.displayName || "Google User",
        };

        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Google login failed");

        setAuth(data.token, data.user);
        redirectByRole(navigate, data.user.role);
      } catch (err) {
        setPageError(err?.message || "Google login failed");
      } finally {
        setSubmitting(false);
      }
    });
  };

  const eyeTabIndex = -1;

  return (
    <div className="relative">
      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        onAgree={handleAgreeTerms}
        agreed={termsAgreed}
        setAgreed={setTermsAgreed}
        loading={termsLoading}
      />

      <div className="flex justify-between gap-[60px] px-[90px] pt-[70px] pb-10 lg:flex-row flex-col items-center">
        <section className="w-[420px] mt-[18px] animate-slideIn max-w-[92vw]">
          <h1 className="text-[34px] font-black tracking-[.26em] mb-3">WELCOME</h1>
          <p className="text-[15px] text-muted mb-4">Welcome. Please enter your details.</p>

          {/* RESERVED SLOT: prevents jump */}
          <div className="min-h-[52px] mb-3">
            <div
              className={`transition-opacity duration-150 ${
                pageError ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-live="polite"
            >
              <div className="rounded-[14px] border-2 border-black bg-red-50 px-4 py-3 text-[13px] text-black">
                <span className="font-extrabold">Error:</span> {pageError || "—"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-[10px]">
            {/* EMAIL */}
            <div ref={emailWrapRef}>
              <TextInput
                label="Email or Username"
                type="text"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={onEmailChange}
                disabled={submitting}
                autoComplete="username"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => {
                  setEmailFocused(false);
                  setEmailTouched(true);
                  if (isBlank(emailOrUsername)) setEmailErr("This field can’t be blank");
                }}
                inputClassName={inputGlow({ focused: emailFocused, invalid: emailInvalid })}
              />

              <div className="min-h-[18px] mt-1">
                <p
                  className={`text-[12px] font-bold text-red-700 transition-opacity duration-150 ${
                    emailErr ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {emailErr || "—"}
                </p>
              </div>
            </div>

            {/* PASSWORD */}
            <div ref={passWrapRef}>
              <div className="relative">
                <TextInput
                  label="Password"
                  type={showPass ? "text" : "password"}
                  placeholder="********"
                  value={password}
                  onChange={onPassChange}
                  disabled={submitting}
                  autoComplete="current-password"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => {
                    setPassFocused(false);
                    setPassTouched(true);
                    if (isBlank(password)) setPassErr("This field can’t be blank");
                  }}
                  inputClassName={inputGlow({ focused: passFocused, invalid: passInvalid })}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 top-[38px] sm:top-[40px]
                             text-black/70 hover:text-black
                             rounded-[10px] p-2
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25
                             disabled:opacity-50"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  disabled={submitting}
                  tabIndex={eyeTabIndex}
                >
                  {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>

              <div className="min-h-[18px] mt-1">
                <p
                  className={`text-[12px] font-bold text-red-700 transition-opacity duration-150 ${
                    passErr ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {passErr || "—"}
                </p>
              </div>
            </div>

            {/* REMEMBER + FORGOT */}
            <div className="flex items-center justify-between text-[13px] mt-1">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-greenBorder" disabled={submitting} />
                Remember me
              </label>

              <button
                type="button"
                className="font-bold hover:underline bg-transparent p-0
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 rounded
                           disabled:opacity-60"
                onClick={() => navigate("/forgotpassword")}
                disabled={submitting}
              >
                Forgot password
              </button>
            </div>

            {/* LOGIN BUTTON */}
            <PrimaryButton
              disabled={submitting}
              onClick={handleEmailLogin}
              className={`mt-3 w-full relative flex items-center justify-center
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25
                ${
                  submitting
                    ? "opacity-90 cursor-not-allowed"
                    : "hover:brightness-[0.98] active:scale-[0.99]"
                }`}
            >
              <span className="relative w-full flex items-center justify-center">
                <span
                  className={`inline-flex items-center justify-center transition-opacity duration-150 ${
                    submitting ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Login
                </span>

                <span
                  className={`absolute inset-0 inline-flex items-center justify-center gap-2 transition-opacity duration-150 ${
                    submitting ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!submitting}
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Spinner size={16} />
                  </span>
                  <span className="leading-none">Logging in…</span>
                </span>
              </span>
            </PrimaryButton>

            {/* GOOGLE BUTTON */}
            <GoogleButton
              onClick={handleGoogleLogin}
              loading={submitting}
              disabled={submitting}
              className={`w-full relative flex items-center justify-center
                focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25
                ${
                  submitting
                    ? "opacity-80 cursor-not-allowed"
                    : "hover:brightness-[0.99] active:scale-[0.99]"
                }`}
            >
              <span className="relative w-full flex items-center justify-center">
                <span
                  className={`inline-flex items-center justify-center transition-opacity duration-150 ${
                    submitting ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Continue with Google
                </span>

                <span
                  className={`absolute inset-0 inline-flex items-center justify-center gap-2 transition-opacity duration-150 ${
                    submitting ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!submitting}
                >
                  <span className="inline-flex items-center justify-center w-5 h-5">
                    <Spinner size={16} />
                  </span>
                  <span className="leading-none">Signing in…</span>
                </span>
              </span>
            </GoogleButton>

            <p className="text-[12px] text-black/60 mt-3 leading-relaxed">
              By continuing, you agree to CheckIn’s{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-extrabold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 rounded"
                disabled={submitting}
              >
                Terms & Conditions
              </button>
              .
            </p>

            <p className="text-[13px] text-muted mt-3">
              Don&apos;t have an account?{" "}
              <Link
                to="/sign-up"
                className="font-extrabold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black/25 rounded"
              >
                Sign up for free!
              </Link>
            </p>
          </div>
        </section>

        <img src={heroImg} alt="Mental Health" className="w-[min(900px,62vw)] animate-fadeUp" />
      </div>
    </div>
  );
}
