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

      {/* ================= BOTTOM PARALLAX (DESKTOP FIXED) ================= */}
      <div className="relative w-full">
        {/* Desktop: fixed background */}
        <div className="hidden lg:block relative h-[420px] overflow-hidden">
          {/* fixed background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bottomParallaxImg})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundAttachment: "fixed",
            }}
          />

          {/* black overlay */}
          <div className="absolute inset-0 bg-black/45" />

          {/* TEXT CONTENT */}
          <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
            <div className="max-w-[720px]">
              <h2
                className="
                  font-lora
                  text-white
                  text-[32px] sm:text-[38px] lg:text-[44px]
                  leading-[1.2]
                  font-bold
                "
              >
                It’s okay to pause.
              </h2>

              <p
                className="
                  mt-4
                  font-nunito
                  text-white/85
                  text-[15px] sm:text-[16px] lg:text-[17px]
                  leading-[1.8]
                "
              >
                Checking in with yourself is a small step, but it can make a real
                difference in how you feel today.
              </p>
            </div>
          </div>
        </div>


        {/* ================= MOBILE / TABLET ================= */}
        <div className="relative block lg:hidden h-[300px] sm:h-[360px] overflow-hidden">
          {/* background image */}
          <img
            src={bottomParallaxImg}
            alt="Parallax section"
            className="h-full w-full object-cover select-none"
            draggable={false}
          />

          {/* black overlay */}
          <div className="absolute inset-0 bg-black/45" />

          {/* centered text */}
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div className="max-w-[520px]">
              <h2
                className="
                  font-lora
                  text-white
                  text-[24px] sm:text-[28px]
                  leading-[1.25]
                  font-bold
                "
              >
                It’s okay to pause.
              </h2>

              <p
                className="
                  mt-3
                  font-nunito
                  text-white/85
                  text-[14.5px]
                  leading-[1.7]
                "
              >
                One honest check-in is enough for today.
              </p>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
