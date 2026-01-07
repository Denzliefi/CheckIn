import facebook from "../assets/Facebook.png";
import twitter from "../assets/Twitter.png";
import instagram from "../assets/Instagram.png";
import linkedin from "../assets/Linkedin.png";
import logoOutlined from "../assets/logo-outlined 1.png";

export default function Footer() {
  return (
    <footer className="w-full bg-[#B9FF66]">
      <div className="max-w-[1200px] mx-auto py-10 px-6">
        
        {/* SOCIAL ICONS */}
        <div className="flex justify-center items-center gap-6 mb-4">
          <img src={facebook} alt="Facebook" className="w-[37px] h-[37px]" />
          <img src={twitter} alt="Twitter" className="w-[37px] h-[37px]" />
          <img src={instagram} alt="Instagram" className="w-[37px] h-[37px]" />
          <img src={linkedin} alt="LinkedIn" className="w-[37px] h-[37px]" />
        </div>

        {/* TAGLINE */}
        <p className="text-center text-[13px] font-medium text-black mb-5">
          Student-Centered Mental Wellness Support
        </p>

        {/* LOGO */}
        <div className="flex justify-center mb-3">
          <img
            src={logoOutlined}
            alt="CheckIn Logo"
            className="w-[258px] h-[110px]"
          />
        </div>

        {/* COPYRIGHT */}
        <p className="text-center text-[12px] text-black/70 leading-relaxed">
          © 2024 All Rights Reserved <br />
          Arellano University – Andres Bonifacio Campus
        </p>

      </div>
    </footer>
  );
}
