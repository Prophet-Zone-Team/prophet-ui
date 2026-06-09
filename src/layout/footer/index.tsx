import { SOCIALS_LIST } from "@/config/social";
import Link from "next/link";

function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#E9E9E9] py-4 px-10 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-2 font-[Sora] text-[#909090] text-xs font-normal">
      <div className="flex justify-center md:justify-start items-center order-3 md:order-1">
        &copy; {currentYear} Prophet. All rights reserved.
      </div>
      <div className="flex justify-center items-center gap-2.5 order-1 md:order-2">
        {
          SOCIALS_LIST.map((social, index) => (
            <Link
              key={index}
              href={social.url}
              target="_blank"
              className="shrink-0 size-9 bg-white border border-[#EBEBEB] rounded-lg flex items-center justify-center hover:bg-[#EBEBEB] duration-150"
              aria-label={social.label}
            >
              <img src={social.icon} alt={social.label} className="w-3 h-3 shrink-0 object-center object-contain" />
            </Link>
          ))
        }
      </div>
      <div className="flex justify-center md:justify-end items-center gap-10 order-2 md:order-3">
        <div className="shrink-0">Privacy Policy</div>
        <div className="shrink-0">Terms of Service</div>
        {/* <Link
          href="/privacy-policy"
          className="shrink-0 hover:opacity-70 duration-150"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms-of-service"
          className="shrink-0 hover:opacity-70 duration-150"
        >
          Terms of Service
        </Link> */}
      </div>
    </footer>
  );
}

export default AppFooter;
