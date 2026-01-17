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

/** --- Minimal doodles --- */
function DoodleSpark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M60 10l8 20 20 8-20 8-8 20-8-20-20-8 20-8 8-20Z"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M18 88c14-10 32-10 46 0"
        stroke="#141414"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
    </svg>
  );
}

function DoodleWave({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 48c22-22 46 22 68 0s46 22 68 0 46 22 68 0"
        stroke="#141414"
        strokeWidth="2.6"
        strokeLinecap="round"
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
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icons */
function PhoneIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
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
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M12 2l8 4v7c0 5-3.6 8.7-8 9-4.4-.3-8-4-8-9V6l8-4Z"
        stroke="#141414"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 7v6" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="#141414" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SchoolIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      <path
        d="M12 3l10 5-10 5L2 8l10-5Z"
        stroke="#141414"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 11v6c0 2 3 4 6 4s6-2 6-4v-6"
        stroke="#141414"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M22 8v6" stroke="#141414" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Card */
function Card({ children, className = "" }) {
  return (
    <div
      className={[
        "relative rounded-[18px] border border-black/20 bg-white",
        "shadow-[0_10px_24px_rgba(0,0,0,0.06)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function EmergencyCard({ item, delay = 0 }) {
  const [ref, inView] = useInView({ threshold: 0.25 });

  const safeTel = (item.tel || "").replace(/[^\d+]/g, "");
  const href = item.mode === "call" ? `tel:${safeTel}` : item.href || "#";

  return (
    <div
      ref={ref}
      style={{
        transform: inView ? "translateY(0)" : "translateY(10px)",
        opacity: inView ? 1 : 0,
        transitionDelay: `${delay}ms`,
        transitionProperty: "transform, opacity",
        transitionDuration: "600ms",
        transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <Card className="overflow-hidden">
        <DoodleSpark className="absolute -top-6 -right-6 w-[120px] opacity-[0.10] pointer-events-none" />

        {/* ✅ smaller padding on tiny screens */}
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="shrink-0">
              <div className="w-[44px] h-[44px] sm:w-[46px] sm:h-[46px] rounded-[14px] border border-black/25 bg-[#B9FF66] flex items-center justify-center">
                {item.icon}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p
                className="text-[11px] sm:text-[12px] font-extrabold tracking-wide uppercase text-black/45"
                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
              >
                {item.tag}
              </p>

              <h3
                className="text-[16px] sm:text-[20px] font-bold leading-tight text-[#141414]"
                style={{ fontFamily: "Lora, serif" }}
              >
                {item.title}
              </h3>

              {item.subtext ? (
                <div className="mt-2">
                  <span
                    className="inline-flex items-center rounded-full border border-black/15 bg-[#B9FF66]/25 px-3 py-1 text-[12px] sm:text-[12.5px] font-extrabold text-[#141414]"
                    style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                  >
                    {item.subtext}
                  </span>
                </div>
              ) : null}

              <p
                className="mt-2 text-[13px] sm:text-[14px] text-black/65 leading-relaxed break-words"
                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
              >
                {item.desc}
              </p>

              {/* ✅ Responsive button: full width, max width so it won't become a circle */}
              <div className="mt-4 flex">
                <a
                  href={href}
                  className={[
                    "w-full max-w-[360px] sm:w-auto sm:max-w-none",
                    "inline-flex items-center justify-center gap-2",
                    "rounded-full border border-black/25 bg-[#B9FF66]",
                    "px-4 py-3",
                    "text-[14px] font-extrabold text-[#141414]",
                    "text-center leading-snug",
                    "hover:-translate-y-[1px] hover:shadow-[0_14px_22px_rgba(0,0,0,0.10)] hover:brightness-[0.99]",
                    "active:scale-[0.99] transition",
                  ].join(" ")}
                  style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                >
                  <PhoneIcon className="w-5 h-5 shrink-0" />
                  <span className="truncate sm:whitespace-nowrap">{item.primaryLabel}</span>
                </a>
              </div>
            </div>
          </div>

          <DoodleWave className="mt-5 w-[190px] opacity-[0.10]" />
        </div>
      </Card>
    </div>
  );
}

export default function Emergency() {
  const [heroRef, heroInView] = useInView({ threshold: 0.2 });

  const sections = useMemo(
    () => [
      {
        title: "For students & campus concerns",
        subtitle: "Campus-based help when you're safe.",
        items: [
          {
            tag: "Campus Support",
            title: "Guidance / Counselor Office (AUP)",
            subtext: "Student-first",
            desc: "If you need support, reach out to the Guidance Office for counseling and referrals.",
            icon: <SchoolIcon className="w-6 h-6" />,
            mode: "call",
            tel: "85797295", // ✅ calls 8-579-72-95
            primaryLabel: "Call Guidance", // ✅ NO number shown
          },
        ],
      },
      {
        title: "Urgent emergency",
        subtitle: "Call now if someone is in immediate danger.",
        items: [
          {
            tag: "Emergency",
            title: "National Emergency Hotline",
            subtext: "Immediate danger",
            desc: "Call for life-threatening emergencies and share your location.",
            icon: <ShieldIcon className="w-6 h-6" />,
            mode: "call",
            tel: "911",
            primaryLabel: "Call 911",
          },
        ],
      },
      {
        title: "Crisis & mental health support (PH)",
        subtitle: "Confidential support anytime you need it.",
        items: [
          {
            tag: "Mental Health",
            title: "NCMH Crisis Hotline",
            subtext: "24/7 support",
            desc:
              "Crisis support and referral. If you can’t connect: 0919-057-1553 (Smart/TNT) • 0917-899-8727 (Globe/TM).",
            icon: <DoodleHeart className="w-6 h-6" />,
            mode: "call",
            tel: "1553",
            primaryLabel: "Call 1553",
          },
          {
            tag: "Crisis Support",
            title: "In Touch: Crisis Line",
            subtext: "Confidential",
            desc: "Free and confidential emotional support with trained responders.",
            icon: <ShieldIcon className="w-6 h-6" />,
            mode: "call",
            tel: "+63288937603",
            primaryLabel: "Call In Touch",
          },
          {
            tag: "Suicide Prevention",
            title: "HOPELINE",
            subtext: "Crisis support",
            desc: "Suicide prevention support. Also: 0917-558-4673 • 0918-873-4673.",
            icon: <DoodleHeart className="w-6 h-6" />,
            mode: "call",
            tel: "+63288044673",
            primaryLabel: "Call HOPELINE",
          },
          {
            tag: "Child Protection",
            title: "Bantay Bata Helpline",
            subtext: "Child safety",
            desc: "For child-related concerns (abuse, neglect, violence, guidance).",
            icon: <ShieldIcon className="w-6 h-6" />,
            mode: "call",
            tel: "163",
            primaryLabel: "Call 163",
          },
        ],
      },
    ],
    []
  );

  return (
    <section className="relative w-full overflow-hidden bg-[#fbfbfb]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-[260px] bg-[#E9ECE7]" />
        <div className="absolute -top-10 -left-10 w-[180px] opacity-[0.10] rotate-[-10deg]">
          <DoodleSpark />
        </div>
        <div className="absolute top-[120px] -right-10 w-[260px] opacity-[0.08] rotate-[8deg]">
          <DoodleWave />
        </div>
        <div className="absolute bottom-[80px] left-[8%] w-[110px] opacity-[0.08] rotate-[-6deg]">
          <DoodleHeart />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-8 md:px-[70px] py-12 sm:py-14">
        <div
          ref={heroRef}
          className="relative rounded-[22px] border border-black/20 bg-white/75 backdrop-blur-[1px]"
          style={{
            transform: heroInView ? "translateY(0)" : "translateY(12px)",
            opacity: heroInView ? 1 : 0,
            transition:
              "transform 650ms cubic-bezier(.2,.8,.2,1), opacity 650ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          <DoodleWave className="absolute -bottom-10 -left-10 w-[320px] opacity-[0.10] pointer-events-none" />
          <DoodleSpark className="absolute -top-8 -right-8 w-[160px] opacity-[0.10] pointer-events-none" />

          <div className="p-6 sm:p-9 md:p-10">
            <p
              className="inline-flex items-center gap-2 rounded-full border border-black/20 bg-white px-4 py-2 text-[12.5px] font-extrabold text-[#141414]"
              style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#B9FF66] border border-black/25" />
              Student Emergency & Support
            </p>

            <h1
              className="mt-4 text-[26px] sm:text-[38px] md:text-[46px] leading-[1.08] font-bold text-[#141414]"
              style={{ fontFamily: "Lora, serif" }}
            >
              Help is one tap away.
            </h1>

            <p
              className="mt-4 text-[14px] sm:text-[16px] text-black/65 leading-relaxed max-w-[72ch]"
              style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
            >
              If it’s an emergency, call 911. If you’re safe, reach out to campus support.
            </p>

            <div className="mt-6">
              <a
                href="tel:911"
                className={[
                  "w-full max-w-[360px] sm:w-auto sm:max-w-none",
                  "inline-flex items-center justify-center gap-2 rounded-full border border-black/20 bg-[#B9FF66]",
                  "px-5 py-3 text-[14px] font-extrabold text-[#141414]",
                  "hover:-translate-y-[1px] hover:shadow-[0_14px_22px_rgba(0,0,0,0.10)] hover:brightness-[0.99]",
                  "active:scale-[0.99] transition",
                ].join(" ")}
                style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
              >
                <PhoneIcon className="w-5 h-5" />
                Call 911
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2
                    className="text-[20px] sm:text-[24px] font-bold text-[#141414]"
                    style={{ fontFamily: "Lora, serif" }}
                  >
                    {sec.title}
                  </h2>
                  <p
                    className="mt-1 text-[13px] sm:text-[13.5px] text-black/55"
                    style={{ fontFamily: "Nunito, system-ui, sans-serif" }}
                  >
                    {sec.subtitle}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 opacity-80">
                  <DoodleSpark className="w-[38px]" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {sec.items.map((item, i) => (
                  <EmergencyCard key={i} item={item} delay={i * 110} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
