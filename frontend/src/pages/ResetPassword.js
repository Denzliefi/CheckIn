// src/pages/ResetPassword.js
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import signImg from "../assets/Sign.png";

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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();

  const token = useMemo(() => {
    const qs = new URLSearchParams(location.search);
    return (qs.get("token") || "").trim();
  }, [location.search]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = token && password.length >= 8 && password === confirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset link is missing or invalid. Please request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });

      setDone(true);

      // optional: redirect after a bit
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.message || "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="hidden md:block">
            <img src={signImg} alt="Reset password illustration" className="w-full h-auto rounded-2xl shadow-lg" />
          </div>

          <div className="bg-white/70 dark:bg-black/30 backdrop-blur-xl rounded-2xl shadow-xl border border-black/10 dark:border-white/10 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Reset Password</h1>
            <p className="text-sm opacity-80 mb-6">
              Set a new password for your account. Password must be at least 8 characters.
            </p>

            {error ? (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {done ? (
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                Password updated. Redirecting to login…
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/20 px-4 py-3 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/20 px-4 py-3 outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Spinner /> : null}
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>

            <div className="mt-5 text-sm opacity-80 flex items-center justify-between">
              <Link to="/login" className="underline">
                Back to login
              </Link>
              <Link to="/forgotpassword" className="underline">
                Request new link
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
