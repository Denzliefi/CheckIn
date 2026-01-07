import { useEffect, useRef, useState } from "react";

import facebook from "../assets/Facebook.png";
import twitter from "../assets/Twitter.png";
import instagram from "../assets/Instagram.png";
import linkedin from "../assets/Linkedin.png";
import logoOutlined from "../assets/logo-outlined 1.png";

export default function Footer() {
  const [visible, setVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    // ✅ Replay when you scroll away + back
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseFade =
    "transition-all duration-700 ease-out will-change-transform will-change-opacity";

  return (
    <footer ref={footerRef} className="w-full bg-[#B9FF66] overflow-hidden">
      <div className="max-w-[1200px] mx-auto py-10 px-6">
        {/* SOCIAL ICONS */}
        <div className="flex justify-center items-center gap-6 mb-4">
          {[facebook, twitter, instagram, linkedin].map((icon, i) => (
            <img
              key={i}
              src={icon}
              alt="Social"
              className={`
                w-[37px] h-[37px]
                ${baseFade}
                ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-90"}
                hover:scale-110 hover:-translate-y-1
              `}
              style={{
                transitionDelay: visible ? `${i * 90}ms` : "0ms",
              }}
              draggable="false"
            />
          ))}
        </div>

        {/* TAGLINE */}
        <p
          className={`
            text-center text-[13px] font-medium text-black mb-5
            ${baseFade}
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
          style={{ transitionDelay: visible ? "380ms" : "0ms" }}
        >
          Student-Centered Mental Wellness Support
        </p>

        {/* LOGO */}
        <div
          className={`
            flex justify-center mb-3
            ${baseFade}
            ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"}
          `}
          style={{ transitionDelay: visible ? "500ms" : "0ms" }}
        >
          <img
            src={logoOutlined}
            alt="CheckIn Logo"
            className="w-[258px] h-[110px]"
            draggable="false"
          />
        </div>

        {/* COPYRIGHT */}
        <p
          className={`
            text-center text-[12px] text-black/70 leading-relaxed
            ${baseFade}
            ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
          `}
          style={{ transitionDelay: visible ? "650ms" : "0ms" }}
        >
          © 2024 All Rights Reserved <br />
          Arellano University – Andres Bonifacio Campus
        </p>
      </div>
    </footer>
  );
}
