import { useEffect, useRef, useState } from "react";
import heroImg from "../../assets/Hero.png";
import bottomParallaxImg from "../../assets/Parallax.png";

export default function Hero() {
  const [offset, setOffset] = useState(0);
  const [visible, setVisible] = useState(false);

  const rafRef = useRef(null);
  const sectionRef = useRef(null);

  /* ================= PARALLAX ================= */
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setOffset(window.scrollY || 0);
        rafRef.current = null;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  /* ================= FADE-UP ================= */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const heroY = -(offset * 0.14);
  const bottomY = offset * 0.22;

  return (
    <section
      ref={sectionRef}
      className="w-full bg-white overflow-hidden font-nunito"
    >
      {/* ================= TOP HERO ================= */}
      <div className="mx-auto max-w-[1500px] px-8 sm:px-14 lg:px-20 py-24 lg:py-32">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          {/* LEFT CONTENT */}
          <div
            className={`
              max-w-[720px]
              transition-all duration-700 ease-out
              ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
            `}
          >
            {/* ✅ HEADING MATCHING YOUR IMAGE */}
            <h1
              className="
                font-lora
                text-[44px] sm:text-[52px] lg:text-[60px]
                leading-[1.05]
                tracking-[-0.015em]
                font-extrabold
                text-[#141414]
              "
            >
              Take a Minute to Check In
              <br />
              With Yourself.
            </h1>

            <p
              className="
                mt-6
                max-w-[640px]
                text-[16px] sm:text-[17px] lg:text-[18px]
                leading-[1.8]
                text-[#1A1A1A]
              "
            >
              A quick, confidential PHQ-9 self-check designed to support your
              mental well-being. Because school is tough—and your mental health
              deserves attention too.
            </p>

            <button
              className="
                mt-12
                inline-flex items-center justify-center
                rounded-xl
                border-2 border-black
                bg-[#B9FF66]
                px-10 py-5
                text-[15px]
                font-extrabold
                text-[#141414]
                transition-all duration-200 ease-out
                hover:-translate-y-[3px]
                hover:shadow-[0_14px_30px_rgba(185,255,102,0.55)]
                active:translate-y-0
              "
            >
              Take an Assessment Now !
            </button>
          </div>

          {/* RIGHT IMAGE */}
          <div
            className={`
              relative flex justify-center lg:justify-end
              transition-all duration-900 ease-out delay-150
              ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}
            `}
          >
            {/* Floating plus icons */}
            
            {/* PARALLAX HERO IMAGE */}
            <div
              className="will-change-transform"
              style={{
                transform: `translate3d(0, ${heroY}px, 0)`,
              }}
            >
              <img
                src={heroImg}
                alt="Mental Health Illustration"
                className="
                  w-full
                  max-w-[540px] sm:max-w-[680px] lg:max-w-[780px]
                  object-contain
                  select-none
                "
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM PARALLAX ================= */}
      <div
        className={`
          relative w-screen overflow-hidden
          transition-all duration-700 ease-out delay-300
          ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
        `}
      >
        <div className="h-[280px] sm:h-[340px] lg:h-[420px] w-screen overflow-hidden">
          <img
            src={bottomParallaxImg}
            alt="Parallax section"
            className="h-full w-full object-cover will-change-transform select-none"
            style={{
              transform: `translate3d(0, ${bottomY}px, 0)`,
            }}
            draggable={false}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-white/30" />
      </div>
    </section>
  );
}
