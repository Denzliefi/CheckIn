// src/components/Navbar.js
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

// ✅ adjust path if needed
import logoOutlined from "../assets/logo-outlined 1.png";

// ✅ service images
import guidanceImg from "../assets/Guidance (1).png";
import journalImg from "../assets/Journal.png";
import phqImg from "../assets/Phq9.png";
import hotlineImg from "../assets/Hotline.png";

/** Simple Phone SVG (no emoji) */
function PhoneIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M6.6 10.8c1.7 3.2 3.4 4.9 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1 .4 2.2.7 3.4.8.5.1.9.5.9 1v3.5c0 .6-.5 1-1.1 1C11 21.3 2.7 13 2.7 2.2c0-.6.4-1.1 1-1.1h3.5c.5 0 .9.4 1 .9.2 1.2.4 2.3.8 3.4.1.4 0 .9-.3 1.2L6.6 10.8z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Gear / Settings SVG */
function SettingsIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M19.4 13.1c.05-.36.1-.73.1-1.1s-.05-.74-.1-1.1l1.7-1.3a.9.9 0 0 0 .2-1.2l-1.6-2.8a.9.9 0 0 0-1.1-.4l-2 .8a8 8 0 0 0-1.9-1.1l-.3-2.1A.9.9 0 0 0 13.5 1h-3a.9.9 0 0 0-.9.8l-.3 2.1c-.7.3-1.3.6-1.9 1.1l-2-.8a.9.9 0 0 0-1.1.4L2.7 7.4a.9.9 0 0 0 .2 1.2l1.7 1.3c-.05.36-.1.73-.1 1.1s.05.74.1 1.1L2.9 14.4a.9.9 0 0 0-.2 1.2l1.6 2.8c.2.4.7.5 1.1.4l2-.8c.6.5 1.2.8 1.9 1.1l.3 2.1c.1.4.5.8.9.8h3c.4 0 .8-.3.9-.8l.3-2.1c.7-.3 1.3-.6 1.9-1.1l2 .8c.4.1.9 0 1.1-.4l1.6-2.8a.9.9 0 0 0-.2-1.2l-1.7-1.3Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDown({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path
        d="M6.5 9.5l5.5 5.5 5.5-5.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// close dropdown when clicking outside
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default function Navbar() {
  const { pathname } = useLocation();
  const isSignup = pathname.startsWith("/sign-up");

  const [open, setOpen] = useState(false); // mobile menu
  const [servicesOpen, setServicesOpen] = useState(false); // desktop dropdown
  const [servicesMobileOpen, setServicesMobileOpen] = useState(false); // mobile accordion

  const servicesRef = useRef(null);
  useOnClickOutside(servicesRef, () => setServicesOpen(false));

  useEffect(() => {
    setOpen(false);
    setServicesOpen(false);
    setServicesMobileOpen(false);
  }, [pathname]);

  const services = [
    {
      to: "/services/counseling",
      label: "Guidance Counseling",
      desc: "Private support and guidance.",
      img: guidanceImg,
    },
    {
      to: "/services/journal",
      label: "Journal",
      desc: "Reflect and write safely.",
      img: journalImg,
    },
    {
      to: "/services/assessment",
      label: "PHQ-9 Assessment",
      desc: "Evidence-based screening tool.",
      img: phqImg,
    },
    {
      to: "/services/emergency",
      label: "Emergency Hotline",
      desc: "Quick access when urgent.",
      img: hotlineImg,
    },
  ];

  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/about-us", label: "About us" },
    { to: "/privacy-policy", label: "Privacy Policy" },
  ];

  const isServicesActive = pathname.startsWith("/services");

  // ✅ route path for profile settings
  const accountTo = "/profile-settings";

  // ✅ Emergency number (911)
  const EMERGENCY_TEL = "911";
  // Use tel:911 (works on most mobile devices). Desktop browsers may not call.
  const emergencyHref = `tel:${EMERGENCY_TEL}`;

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-white/85 backdrop-blur border-b border-black/10">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-7">
          <div className="h-[74px] sm:h-[82px] flex items-center justify-between">
            {/* BRAND */}
            <NavLink to="/" className="flex items-center gap-3 select-none">
              <img
                src={logoOutlined}
                alt="CheckIn"
                className="h-[40px] sm:h-[46px] lg:h-[50px] w-auto object-contain"
              />

              <div className="hidden xl:block leading-tight">
                <div className="text-[16px] sm:text-[17px] font-extrabold text-[#141414]">
                  CheckIn
                </div>
                <div className="text-[12px] font-semibold text-black/50 -mt-[2px]">
                  mental well-being
                </div>
              </div>
            </NavLink>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-8">
              <nav className="flex items-center gap-8 text-[15px] font-semibold text-[#141414]">
                {/* Home */}
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `relative px-2 py-2 transition hover:opacity-80 ${
                      isActive ? "font-extrabold" : "font-semibold"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>Home</span>
                      <span
                        className={`absolute left-2 right-2 -bottom-[2px] h-[3px] rounded-full transition ${
                          isActive ? "bg-[#B9FF66]" : "bg-transparent"
                        }`}
                      />
                    </>
                  )}
                </NavLink>

                {/* SERVICES DROPDOWN */}
                <div
                  className="relative"
                  ref={servicesRef}
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setServicesOpen((v) => !v)}
                    className={[
                      "relative px-2 py-2 transition hover:opacity-80",
                      isServicesActive ? "font-extrabold" : "font-semibold",
                      "inline-flex items-center gap-2",
                    ].join(" ")}
                    aria-haspopup="menu"
                    aria-expanded={servicesOpen}
                  >
                    <span>Services</span>
                    <ChevronDown
                      className={`h-[18px] w-[18px] transition ${
                        servicesOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                    <span
                      className={`absolute left-2 right-2 -bottom-[2px] h-[3px] rounded-full transition ${
                        isServicesActive ? "bg-[#B9FF66]" : "bg-transparent"
                      }`}
                    />
                  </button>

                  <div className={`absolute left-0 top-full pt-3 ${servicesOpen ? "block" : "hidden"}`}>
                    <div className="w-[420px] rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-black/5 flex items-center justify-between">
                        <div>
                          <p className="text-[12px] font-extrabold text-black/60">Services</p>
                          <p className="text-[12px] font-semibold text-black/45 -mt-[2px]">
                            Choose a module to open
                          </p>
                        </div>

                        <span className="text-[12px] font-extrabold px-3 py-1 rounded-full bg-[#B9FF66]/60">
                          Student tools
                        </span>
                      </div>

                      <div className="p-3">
                        <div className="grid grid-cols-1 gap-2">
                          {services.map((s) => (
                            <NavLink
                              key={s.to}
                              to={s.to}
                              onClick={() => setServicesOpen(false)}
                              className={({ isActive }) =>
                                `group flex items-center gap-4 rounded-2xl px-3 py-3 transition
                                 hover:bg-black/5 ${isActive ? "bg-[#B9FF66]/45" : ""}`
                              }
                            >
                              <div className="h-[54px] w-[54px] rounded-2xl bg-white border border-black/10 overflow-hidden flex items-center justify-center">
                                <img
                                  src={s.img}
                                  alt={s.label}
                                  className="h-[40px] w-[40px] object-contain"
                                  draggable="false"
                                />
                              </div>

                              <div className="flex-1 leading-tight">
                                <div className="text-[14px] font-extrabold text-[#141414]">
                                  {s.label}
                                </div>
                                <div className="text-[12px] text-black/55 mt-1">{s.desc}</div>
                              </div>

                              <div className="text-black/40 group-hover:text-black/70 transition">
                                <ChevronDown className="h-[18px] w-[18px] -rotate-90" />
                              </div>
                            </NavLink>
                          ))}
                        </div>
                      </div>

                      <div className="px-5 py-3 border-t border-black/5">
                        <p className="text-[12px] font-semibold text-black/45">
                          Confidential • Student-friendly • Fast access
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* other links */}
                {links.slice(1).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `relative px-2 py-2 transition hover:opacity-80 ${
                        isActive ? "font-extrabold" : "font-semibold"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.label}</span>
                        <span
                          className={`absolute left-2 right-2 -bottom-[2px] h-[3px] rounded-full transition ${
                            isActive ? "bg-[#B9FF66]" : "bg-transparent"
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {/* AUTH + SETTINGS + CALL */}
              <div className="flex items-center gap-3">
                {/* login/sign-up pill */}
                <div className="relative inline-flex h-10 rounded-full border-2 border-[#8b8b8b] bg-white overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 w-1/2 bg-[#B9FF66] transition-transform duration-300 ease-out ${
                      isSignup ? "translate-x-full" : "translate-x-0"
                    }`}
                  />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-[#8b8b8b]" />

                  <NavLink
                    to="/login"
                    end
                    className={({ isActive }) =>
                      `relative z-10 inline-flex items-center justify-center w-28 text-[14px] font-extrabold ${
                        isActive ? "text-[#141414]" : "text-[#141414]/80"
                      }`
                    }
                  >
                    Login
                  </NavLink>

                  <NavLink
                    to="/sign-up"
                    className={({ isActive }) =>
                      `relative z-10 inline-flex items-center justify-center w-28 text-[14px] font-extrabold ${
                        isActive ? "text-[#141414]" : "text-[#141414]/80"
                      }`
                    }
                  >
                    Sign-up
                  </NavLink>
                </div>

                {/* ✅ Account Settings icon (DESKTOP ONLY) */}
                <NavLink
                  to={accountTo}
                  aria-label="Account settings"
                  className="
                    relative h-10 w-10
                    rounded-full
                    bg-[#B9FF66]
                    flex items-center justify-center
                    shadow-md
                    transition-all duration-300
                    hover:scale-110 hover:-translate-y-[1px]
                    active:scale-95
                    border border-black/10
                  "
                >
                  <span className="relative z-10 text-black">
                    <SettingsIcon className="h-[18px] w-[18px]" />
                  </span>
                </NavLink>

                {/* ✅ Emergency call icon (911) */}
                <a
                  href={emergencyHref}
                  aria-label={`Call emergency ${EMERGENCY_TEL}`}
                  className="
                    relative h-10 w-10
                    rounded-full
                    bg-[#F59E0B]
                    flex items-center justify-center
                    shadow-md
                    transition-all duration-300
                    hover:scale-110 hover:-translate-y-[1px]
                    active:scale-95
                  "
                  title={`Call ${EMERGENCY_TEL}`}
                >
                  <span className="absolute inset-0 rounded-full bg-[#F59E0B]/30 animate-ping" />
                  <span className="relative z-10 text-white">
                    <PhoneIcon className="h-[18px] w-[18px]" />
                  </span>
                </a>
              </div>
            </div>

            {/* MOBILE RIGHT */}
            <div className="lg:hidden flex items-center gap-3">
              {/* ✅ Settings icon hidden on Mobile/Tablet (removed) */}

              {/* ✅ Emergency call icon (911) */}
              <a
                href={emergencyHref}
                aria-label={`Call emergency ${EMERGENCY_TEL}`}
                className="
                  relative h-11 w-11
                  rounded-full
                  bg-[#F59E0B]
                  flex items-center justify-center
                  shadow-md
                  transition-all duration-300
                  hover:scale-110 hover:-translate-y-[1px]
                  active:scale-95
                "
                title={`Call ${EMERGENCY_TEL}`}
              >
                <span className="absolute inset-0 rounded-full bg-[#F59E0B]/30 animate-ping" />
                <span className="relative z-10 text-white">
                  <PhoneIcon className="h-[20px] w-[20px]" />
                </span>
              </a>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={open}
                className="
                  h-11 w-11 rounded-full
                  border-2 border-black/15
                  inline-flex items-center justify-center
                  hover:bg-black/5 transition
                "
              >
                <div className="relative w-6 h-6">
                  <span
                    className={`absolute left-0 right-0 h-[2px] bg-[#141414] transition-all duration-200 ${
                      open ? "top-3 rotate-45" : "top-1"
                    }`}
                  />
                  <span
                    className={`absolute left-0 right-0 h-[2px] bg-[#141414] transition-all duration-200 ${
                      open ? "opacity-0" : "top-3 opacity-100"
                    }`}
                  />
                  <span
                    className={`absolute left-0 right-0 h-[2px] bg-[#141414] transition-all duration-200 ${
                      open ? "top-3 -rotate-45" : "top-5"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            open ? "max-h-[760px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="mx-auto max-w-[1400px] px-4 sm:px-7 pb-6">
            <div className="rounded-2xl border border-black/10 bg-white shadow-sm p-4">
              <nav className="flex flex-col gap-1 text-[15px] font-semibold text-[#141414]">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 transition hover:bg-black/5 ${
                      isActive ? "bg-[#B9FF66]/60 font-extrabold" : ""
                    }`
                  }
                >
                  Home
                </NavLink>

                {/* SERVICES MOBILE ACCORDION */}
                <button
                  type="button"
                  onClick={() => setServicesMobileOpen((v) => !v)}
                  className={`w-full rounded-xl px-3 py-3 transition hover:bg-black/5 flex items-center justify-between ${
                    isServicesActive ? "bg-[#B9FF66]/40" : ""
                  }`}
                  aria-expanded={servicesMobileOpen}
                >
                  <span className={isServicesActive ? "font-extrabold" : "font-semibold"}>
                    Services
                  </span>
                  <ChevronDown
                    className={`h-[18px] w-[18px] transition ${
                      servicesMobileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    servicesMobileOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pl-1 pr-1 py-2 space-y-2">
                    {services.map((s) => (
                      <NavLink
                        key={s.to}
                        to={s.to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-black/5 ${
                            isActive ? "bg-[#B9FF66]/60 font-extrabold" : "bg-white"
                          }`
                        }
                      >
                        <div className="h-10 w-10 rounded-xl bg-white border border-black/10 overflow-hidden flex items-center justify-center shrink-0">
                          <img
                            src={s.img}
                            alt={s.label}
                            className="h-7 w-7 object-contain"
                            draggable="false"
                          />
                        </div>
                        <span>{s.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>

                {links.slice(1).map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-3 transition hover:bg-black/5 ${
                        isActive ? "bg-[#B9FF66]/60 font-extrabold" : ""
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}

                <NavLink
                  to={accountTo}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 transition hover:bg-black/5 flex items-center justify-between ${
                      isActive ? "bg-[#B9FF66]/60 font-extrabold" : ""
                    }`
                  }
                >
                  <span>Account settings</span>
                  <SettingsIcon className="h-[18px] w-[18px] text-black/60" />
                </NavLink>
              </nav>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `h-11 rounded-xl border-2 border-black/15 font-extrabold text-[14px] inline-flex items-center justify-center hover:opacity-80 transition ${
                      isActive ? "bg-[#B9FF66]/70" : "bg-white"
                    }`
                  }
                >
                  Login
                </NavLink>

                <NavLink
                  to="/sign-up"
                  className={({ isActive }) =>
                    `h-11 rounded-xl border-2 border-black/15 font-extrabold text-[14px] inline-flex items-center justify-center hover:opacity-80 transition ${
                      isActive ? "bg-[#B9FF66]/70" : "bg-white"
                    }`
                  }
                >
                  Sign-up
                </NavLink>
              </div>

              <p className="mt-4 text-center text-[12px] font-semibold text-black/45">
                CheckIn — building calm, supportive spaces.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
