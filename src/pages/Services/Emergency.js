import { useEffect, useMemo, useRef, useState } from "react";

/** Fade-up on scroll (runs once) */
function useInView(options = { threshold: 0.18 }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        obs.unobserve(el);
      }
    }, options);

    obs.observe(el);
    return () => obs.disconnect();
  }, [options]);

  return [ref, inView];
}

/** --- Doodle SVG pieces (no images) --- */
function DoodleStars({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M30 30l6 14 14 6-14 6-6 14-6-14-14-6 14-6 6-14Z"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M115 22l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M170 72l5 12 12 5-12 5-5 12-5-12-12-5 12-5 5-12Z"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M45 110c9-7 20-10 32-8"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="1 10"
      />
    </svg>
  );
}

function DoodleSquiggle({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 55c24-28 52 28 76 0s52 28 76 0 52 28 76 0"
        stroke="#141414"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 72c18-12 34 12 52 0s34 12 52 0"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="10 10"
      />
    </svg>
  );
}

function DoodleHeart({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M60 98C26 72 14 56 14 38c0-13 10-23 23-23 10 0 18 6 23 14 5-8 13-14 23-14 13 0 23 10 23 23 0 18-12 34-46 60Z"
        stroke="#141414"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <path
        d="M32 30c6-10 18-10 24 0"
        stroke="#141414"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.6 10.8c1.7 3.2 3.4 4.9 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1 .4 2.2.7 3.4.8.5.1.9.5.9 1v3.5c0 .6-.5 1-1.1 1C11 21.3 2.7 13 2.7 2.2c0-.6.4-1.1 1-1.1h3.5c.5 0 .9.4 1 1 .2 1.2.4 2.3.8 3.4.2.4.1.9-.2 1.2L6.6 10.8Z"
        stroke="#141414"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2l8 4v7c0 5-3.6 8.7-8 9-4.4-.3-8-4-8-9V6l8-4Z"
        stroke="#141414"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v6"
        stroke="#141414"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 17h.01"
        stroke="#141414"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SoftCard({ children, className = "" }) {
  return (
    <div
      className={[
        "relative rounded-[22px] border-2 border-black/70 bg-white",
        "shadow-[0_10px_30px_rgba(0,0,0,0.08)]",
        "backdrop-blur-[1px]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function EmergencyCard({ item, delay = 0 }) {
  const [ref, inView] = useInView({ threshold: 0.25 });

  // keep tel: safe even with +63, spaces, dashes, parentheses
  const safeNumber = (item.number || "").replace(/[^\d+]/g, "");

  return (
    <div
      ref={ref}
      className="transition-transform"
      style={{
        transform: inView ? "translateY(0)" : "translateY(12px)",
        opacity: inView ? 1 : 0,
        transitionDelay: `${delay}ms`,
        transitionProperty: "transform, opacity",
        transitionDuration: "650ms",
        transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <SoftCard className="overflow-hidden">
        <DoodleStars className="absolute -top-5 -right-6 w-[150px] opacity-20 rotate-6 pointer-events-none" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="w-[48px] h-[48px] rounded-[16px] border-2 border-black/70 bg-[#B9FF66] flex items-center justify-center">
                {item.icon}
              </div>
            </div>

            <div className="min-w-0">
              <p
                className="text-[12.5px] font-extrabold tracking-wide uppercase text-black/60"
                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
              >
                {item.tag}
              </p>

              <h3
                className="text-[20px] sm:text-[22px] font-bold leading-tight text-[#141414]"
                style={{ fontFamily: "Lora, serif" }}
              >
                {item.title}
              </h3>

              <p
                className="mt-2 text-[14px] sm:text-[15px] text-black/70 leading-relaxed"
                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
              >
                {item.desc}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={item.href || `tel:${safeNumber}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-black/70 bg-[#B9FF66] px-4 py-2 text-[14px] font-extrabold text-[#141414] hover:brightness-[0.98] active:scale-[0.99] transition"
                  style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                >
                  <PhoneIcon className="w-5 h-5" />
                  {item.number}
                </a>

                {item.note ? (
                  <span
                    className="text-[13px] text-black/60"
                    style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                  >
                    {item.note}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <DoodleSquiggle className="mt-5 w-[220px] opacity-25" />
        </div>
      </SoftCard>
    </div>
  );
}

export default function Emergency() {
  const [heroRef, heroInView] = useInView({ threshold: 0.2 });

  const items = useMemo(
    () => [
      {
        tag: "Emergency",
        title: "National Emergency Hotline",
        number: "911",
        desc: "For urgent life-threatening situations. Share your location clearly and follow instructions.",
        note: "Use for immediate emergencies.",
        icon: <ShieldIcon className="w-7 h-7" />,
      },
      {
        tag: "Mental Health",
        title: "NCMH Crisis Hotline",
        number: "1553",
        desc: "24/7 crisis support and referral for emotional distress. If you can’t connect, try again or use their mobile lines (Smart/TNT: 0919-057-1553; Globe/TM: 0917-899-8727).",
        note: "24/7 (PH).",
        icon: <DoodleHeart className="w-7 h-7" />,
      },
      {
        tag: "Crisis Support",
        title: "In Touch: Crisis Line",
        number: "(02) 8893 7603",
        desc: "Free, anonymous, and confidential emotional support with trained responders—helpful when you need someone to talk to right now.",
        note: "24/7 (PH).",
        icon: <ShieldIcon className="w-7 h-7" />,
      },
      {
        tag: "Suicide Prevention",
        title: "HOPELINE",
        number: "(02) 8804 4673",
        desc: "Suicide prevention and emotional crisis support. You can also reach HOPELINE via 0917-558-4673 (Globe) or 0918-873-4673 (Smart).",
        note: "24/7 (PH).",
        icon: <DoodleHeart className="w-7 h-7" />,
      },
      {
        tag: "Child Protection",
        title: "Bantay Bata Helpline",
        number: "163",
        desc: "For child-related concerns (abuse, neglect, violence, counseling, and guidance). If a child is in immediate danger, call emergency services too.",
        note: "Helpline for children & families.",
        icon: <ShieldIcon className="w-7 h-7" />,
      },
      {
        tag: "Campus",
        title: "Guidance / Counselor",
        number: "School Office",
        href: "#",
        desc: "For support and referral, contact your school guidance office when you can.",
        note: "Replace with your school contact.",
        icon: <ShieldIcon className="w-7 h-7" />,
      },
    ],
    []
  );

  return (
    <section className="relative w-full bg-[#fbfbfb] overflow-hidden">
      {/* soft doodle background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-10 -left-10 w-[260px] opacity-[0.18] rotate-[-10deg]">
          <DoodleStars />
        </div>
        <div className="absolute top-[140px] -right-12 w-[340px] opacity-[0.14] rotate-[12deg]">
          <DoodleSquiggle />
        </div>
        <div className="absolute bottom-[70px] left-[8%] w-[140px] opacity-[0.12] rotate-[-6deg]">
          <DoodleHeart />
        </div>
        <div className="absolute -bottom-10 right-[6%] w-[380px] opacity-[0.12] rotate-[6deg]">
          <DoodleSquiggle />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8 md:px-[70px] py-12 sm:py-14">
        {/* ✅ HERO BANNER (no cardboard box) */}
        <div
          ref={heroRef}
          className="relative overflow-hidden rounded-[28px]"
          style={{
            transform: heroInView ? "translateY(0)" : "translateY(14px)",
            opacity: heroInView ? 1 : 0,
            transition:
              "transform 700ms cubic-bezier(.2,.8,.2,1), opacity 700ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {/* Banner background */}
          <div className="relative border-2 border-black/70 bg-[#E9ECE7]">
            {/* decorative doodles */}
            <DoodleStars className="absolute -top-8 -right-10 w-[260px] opacity-25 rotate-6 pointer-events-none" />
            <DoodleSquiggle className="absolute -bottom-10 -left-12 w-[420px] opacity-20 -rotate-6 pointer-events-none" />
            <DoodleHeart className="absolute top-6 right-6 w-[58px] opacity-80 pointer-events-none" />

            <div className="px-6 sm:px-10 md:px-14 py-10 sm:py-12 md:py-14">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center">
                {/* LEFT */}
                <div className="md:col-span-7">
                  <p
                    className="inline-flex items-center gap-2 rounded-full border-2 border-black/70 bg-white/70 px-4 py-2 text-[12.5px] font-extrabold text-[#141414]"
                    style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B9FF66] border-2 border-black/70" />
                    Emergency Support
                  </p>

                  <h1
                    className="mt-4 text-[32px] sm:text-[40px] md:text-[52px] leading-[1.05] font-bold text-[#141414]"
                    style={{ fontFamily: "Lora, serif" }}
                  >
                    You’re not alone. <br /> Help is here.
                  </h1>

                  <p
                    className="mt-4 text-[14.5px] sm:text-[16px] text-black/70 leading-relaxed max-w-[62ch]"
                    style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                  >
                    If you’re in immediate danger, call emergency services right
                    away. For emotional crisis support, contact a hotline below
                    or reach your guidance office.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <a
                      href="tel:911"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-black/70 bg-[#B9FF66] px-5 py-3 text-[14px] font-extrabold text-[#141414] hover:brightness-[0.98] active:scale-[0.99] transition"
                      style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                    >
                      <PhoneIcon className="w-5 h-5" />
                      Call 911
                    </a>

                    <span
                      className="text-[12.5px] text-black/60"
                      style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                    >
                      If it’s not safe to call, move to a safer place and ask
                      someone nearby for help.
                    </span>
                  </div>
                </div>

                {/* RIGHT: quick steps */}
                <div className="md:col-span-5">
                  <div className="rounded-[20px] border-2 border-black/60 bg-white/75 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <div
                        className="text-[12px] font-extrabold tracking-wide uppercase text-black/55"
                        style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                      >
                        Quick steps
                      </div>
                      <div className="w-[40px] h-[40px] rounded-[16px] border-2 border-black/60 bg-[#B9FF66] flex items-center justify-center">
                        <DoodleHeart className="w-[24px]" />
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {[
                        { t: "Breathe", d: "In for 4 seconds, out for 6 seconds." },
                        { t: "Share location", d: "Tell your exact place / landmark." },
                        { t: "Stay with someone", d: "If possible, don’t stay alone." },
                      ].map((s, idx) => (
                        <div
                          key={idx}
                          className="rounded-[16px] border-2 border-black/50 bg-white/80 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-[32px] h-[32px] rounded-[12px] border-2 border-black/60 bg-[#B9FF66] flex items-center justify-center font-extrabold text-[#141414]">
                              {idx + 1}
                            </div>
                            <div>
                              <div
                                className="text-[16px] font-bold text-[#141414]"
                                style={{ fontFamily: "Lora, serif" }}
                              >
                                {s.t}
                              </div>
                              <div
                                className="text-[13.5px] text-black/65 leading-relaxed"
                                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                              >
                                {s.d}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <DoodleSquiggle className="mt-4 w-[220px] opacity-20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARDS */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item, i) => (
            <EmergencyCard key={i} item={item} delay={i * 120} />
          ))}

          {/* NOTE BOX (soft) */}
          <SoftCard className="overflow-hidden bg-[#B9FF66]/60">
            <DoodleStars className="absolute -top-6 -right-7 w-[180px] opacity-20 rotate-6 pointer-events-none" />
            <div className="p-7">
              <h3
                className="text-[22px] font-bold text-[#141414]"
                style={{ fontFamily: "Lora, serif" }}
              >
                If you’re in danger
              </h3>
              <ul
                className="mt-3 space-y-2 text-[14.5px] text-black/70"
                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
              >
                <li>• Go to a safer area (public place / near a guard / with people).</li>
                <li>• Ask someone nearby to call for you if you can’t.</li>
                <li>• Share your location with a trusted contact.</li>
              </ul>
            </div>
          </SoftCard>
        </div>

        <p
          className="mt-10 text-center text-[12.5px] text-black/55"
          style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
        >
          Replace “School Office” with your real campus contact when you have it.
        </p>
      </div>
    </section>
  );
}
