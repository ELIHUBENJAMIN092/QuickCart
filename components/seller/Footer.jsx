import Image from "next/image";
import { assets } from "@/assets/assets";

export default function Footer() {
  return (
    <footer className="flex w-full flex-col-reverse items-center justify-between border-t border-brand-line bg-white px-5 text-left md:flex-row md:px-8">
      <div className="flex items-center gap-4">
        <Image className="hidden h-auto w-32 md:block" src={assets.logo} alt="COMPEL" />
        <div className="hidden h-5 w-px bg-brand-line md:block" />
        <p className="py-4 text-center text-xs text-brand-muted md:text-sm">
          © {new Date().getFullYear()} COMPEL · Administración
        </p>
      </div>
      <div className="flex items-center gap-3">
        <a href="https://www.facebook.com/CompelEcuadorImpresorasSuministrosEtiquetasNylon" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
          <Image src={assets.facebook_icon} alt="" />
        </a>
        <a href="https://www.instagram.com/compelecuador/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
          <Image src={assets.instagram_icon} alt="" />
        </a>
        <a href="https://www.youtube.com/@compelecuador7211" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
          <Image src={assets.youtube_icon} alt="" />
        </a>
      </div>
    </footer>
  );
}
