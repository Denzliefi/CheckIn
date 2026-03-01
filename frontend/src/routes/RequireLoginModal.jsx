import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/auth";
import LoginRequiredModal from "../components/ui/LoginRequiredModal";

const MSG_PENDING =
  "account is pending please contact the guidance office for further clarifications";
const MSG_TERMINATED =
  "account is terminated please contact the guidance office for further clarifications";

export default function RequireLoginModal({ featureName = "this feature" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthed, user } = useAuth();

  const [open, setOpen] = useState(false);

  const fromPath = useMemo(() => location.pathname, [location.pathname]);

  const role = String(user?.role || "").trim().toLowerCase();
  const status = String(user?.status || "active").trim().toLowerCase();

  const isStudent = role === "student";
  const isBlocked = isAuthed && isStudent && (status === "pending" || status === "terminated");

  useEffect(() => {
    if (!isAuthed) setOpen(true);
    else if (isBlocked) setOpen(true);
    else setOpen(false);
  }, [isAuthed, isBlocked]);

  // ✅ Allowed if logged in AND not blocked
  if (isAuthed && !isBlocked) return <Outlet />;

  // ❌ Blocked (either not logged in OR account is pending/terminated)
  const isLoginBlock = !isAuthed;

  return (
    <LoginRequiredModal
      open={open}
      featureName={featureName}
      title={isLoginBlock ? "LOGIN REQUIRED" : status === "pending" ? "ACCOUNT PENDING" : "ACCOUNT TERMINATED"}
      description={
        isLoginBlock
          ? undefined
          : status === "pending"
            ? MSG_PENDING
            : MSG_TERMINATED
      }
      subtext={isLoginBlock ? undefined : null}
      hideSecondary={!isLoginBlock} // ✅ only show one button for pending/terminated
      primaryLabel={isLoginBlock ? "Login" : "Okay"}
      secondaryLabel="Not now"
      onClose={() => {
        setOpen(false);
        navigate("/", { replace: true });
      }}
      onPrimary={() => {
        setOpen(false);
        if (isLoginBlock) {
          navigate("/login", { replace: true, state: { from: fromPath } });
        } else {
          navigate("/", { replace: true });
        }
      }}
      onSecondary={() => {
        setOpen(false);
        navigate("/", { replace: true });
      }}
    />
  );
}
