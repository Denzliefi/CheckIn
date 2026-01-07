import { useEffect, useRef, useState } from "react";
import mentalImg from "../../assets/Mental.png";
import parallaxImg from "../../assets/Parallax-2.png";

export default function LandingHero() {
  const [bgOffset, setBgOffset] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setBgOffset((window.scrollY || 0) * 0.18);
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

  return (
    <section className="w-full bg-white">
      {/* MAIN HERO */}
      <div className="w-full px-[70px] pt-[55px] pb-[40px]">
        <div className="max-w-[1200px] mx-auto flex items-start justify-between gap-14">
          
          {/* LEFT CONTENT */}
          <div className="max-w-[600px]">
            {/* 🔥 BIGGER TITLE — NUNITO */}
            <h1 className="font-nunito text-[46px] font-extrabold leading-[1.15] text-black">
              Let’s make things happen.
            </h1>

            {/* 🔥 BIGGER, READABLE DESCRIPTION — LORA */}
            <p className="font-lora mt-5 text-[18px] leading-[1.8] text-black/85 max-w-[560px]">
              Reach out to us for guidance, support, and mental wellness care.
              Through CheckIn, students can access guided assessments, reflect
              on their well-being, and take steps toward appropriate help in a
              safe and supportive space.
            </p>

            <div className="mt-10 flex items-center gap-12">
              <button className="h-[42px] px-10 rounded-[10px] bg-[#B9FF66] text-[15px] font-semibold text-black shadow hover:brightness-95 transition">
                Register Now !
              </button>

              <button className="h-[42px] px-12 rounded-[10px] bg-[#B9FF66] text-[15px] font-semibold text-black shadow hover:brightness-95 transition">
                Login
              </button>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="shrink-0">
            <img
              src={mentalImg}
              alt="Mental Health and Wellness"
              className="w-[460px] h-auto object-contain"
              draggable="false"
            />
          </div>
        </div>
      </div>

      {/* PARALLAX STRIP */}
      <div
        className="h-[160px] w-full"
        style={{
          backgroundImage: `url(${parallaxImg})`,
          backgroundSize: "cover",
          backgroundPosition: `center calc(50% + ${bgOffset}px)`,
        }}
      />
    </section>
  );
}
