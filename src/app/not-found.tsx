"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import {
  LOCALE_DIRS,
  resolveLocale,
  t,
  type LocaleCode,
} from "@/i18n";

export default function NotFound() {
  // Same hydration-safe pattern as the landing page: the static export
  // prerenders "en", the real locale is resolved after mount.
  const [locale, setLocale] = useState<LocaleCode>("en");

  useEffect(() => {
    const resolved = resolveLocale(window.location.search);
    setLocale(resolved);
    document.documentElement.lang = resolved;
    document.documentElement.dir = LOCALE_DIRS[resolved];
    document.title = t(resolved, "notFoundTitle");
  }, []);

  return (
    <div
      dir={LOCALE_DIRS[locale]}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center bg-[#F5F4F0] dark:bg-[#1A2327] text-[#1A2327] dark:text-[#EDE8E0] transition-colors duration-300"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(142,165,149,0.25)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse,rgba(142,165,149,0.12)_0%,transparent_60%)]" />

      <Image
        src="/logo-96.png" alt="CrewRadr" width={72} height={72}
        className="relative z-10 mb-8 rounded-[18px] opacity-90"
        style={{ boxShadow: "0 8px 40px rgba(142,165,149,0.25)" }}
      />

      <p className="relative z-10 text-sm font-semibold tracking-[0.2em] text-[#6E8679]">
        404
      </p>

      <h1 className="relative z-10 mt-2 text-[clamp(1.5rem,4vw,2.2rem)] font-bold tracking-[-0.02em]">
        {t(locale, "notFoundTitle")}
      </h1>

      <p className="relative z-10 mt-3 max-w-[400px] text-[clamp(0.95rem,2vw,1.1rem)] text-[#5A6568] dark:text-[#9AA5A8]">
        {t(locale, "notFoundBody")}
      </p>

      <a
        href="/"
        className="relative z-10 mt-8 rounded-xl border px-6 py-2.5 text-sm font-semibold transition-colors hover:border-[#8EA595] hover:text-[#6E8679]"
        style={{ borderColor: "rgba(142,165,149,0.2)" }}
      >
        {t(locale, "backHome")}
      </a>
    </div>
  );
}
