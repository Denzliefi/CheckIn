import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="h-16 px-9 border-b border-border bg-white flex items-center justify-between">
      {/* BRAND */}
      <div className="flex items-center gap-2.5">
        <span className="text-[22px] font-extrabold text-[#7cdc3b]">✓</span>
        <span className="text-[18px] font-extrabold">CheckIn</span>
      </div>

      {/* NAV LINKS */}
      <nav className="hidden lg:flex gap-[26px] text-[14px] font-semibold">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `hover:opacity-70 ${isActive ? "font-bold text-green" : ""}`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `hover:opacity-70 ${isActive ? "font-bold text-green" : ""}`
          }
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/appointment"
          className={({ isActive }) =>
            `hover:opacity-70 ${isActive ? "font-bold text-green" : ""}`
          }
        >
          Appointment
        </NavLink>

        <NavLink
          to="/phq9"
          className={({ isActive }) =>
            `hover:opacity-70 ${isActive ? "font-bold text-green" : ""}`
          }
        >
          PHQ-9
        </NavLink>
      </nav>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-1.5">
        <NavLink
          to="/"
          className="h-[30px] px-[18px] rounded-full border border-greenBorder bg-gradient-to-b from-[#C9FF86] to-green text-[13px] font-extrabold shadow-greenSoft hover:-translate-y-[1px] hover:shadow-greenHover transition"
        >
          Login
        </NavLink>

        <NavLink
          to="/signup"
          className="h-[30px] px-[18px] rounded-full border border-border bg-white text-[13px] font-bold hover:-translate-y-[1px] transition"
        >
          Sign-up
        </NavLink>
      </div>
    </header>
  );
}
