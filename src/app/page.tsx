"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useVersionCheck } from "@/hooks/use-version-check";
import {
  LOCALES,
  LOCALE_DIRS,
  applyLocale,
  resolveLocale,
  t,
  type LocaleCode,
} from "@/i18n";

function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  // First render must stay English: the static export prerenders "en", and a
  // client-side locale resolution here would mismatch every text node, fail
  // hydration (React #418), and wipe the theme class set by the flash script.
  // Resolve and apply the real locale after mount instead.
  const [locale, setLocale] = useState<LocaleCode>("en");
  useVersionCheck();

  useEffect(() => {
    setTheme(getTheme());
    setMounted(true);
    const resolved = resolveLocale(window.location.search);
    setLocale(resolved);
    if (resolved !== "en") applyLocale(resolved);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.className = next;
    localStorage.setItem("theme", next);
  }

  function changeLocale(code: LocaleCode) {
    setLocale(code);
    applyLocale(code);
  }

  return (
    <div
      dir={LOCALE_DIRS[locale]}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center bg-[#F5F4F0] dark:bg-[#1A2327] text-[#1A2327] dark:text-[#EDE8E0] transition-colors duration-300"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse,rgba(142,165,149,0.25)_0%,transparent_60%)] dark:bg-[radial-gradient(ellipse,rgba(142,165,149,0.12)_0%,transparent_60%)]" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label={t(locale, "toggleTheme")}
        className="fixed right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition-colors hover:border-[#8EA595]"
        style={{ borderColor: "rgba(142,165,149,0.2)" }}
      >
        {mounted ? (theme === "dark" ? "\u{1F319}" : "\u{2600}\u{FE0F}") : "\u{2600}\u{FE0F}"}
      </button>

      {/* Language switcher */}
      <div className="fixed left-5 top-5">
        <select
          aria-label={t(locale, "language")}
          value={locale}
          onChange={(e) => changeLocale(e.target.value as LocaleCode)}
          className="h-10 rounded-xl border bg-transparent px-3 text-sm text-[#1A2327] dark:text-[#EDE8E0]"
          style={{ borderColor: "rgba(142,165,149,0.2)" }}
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code} className="text-[#1A2327]">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Logo */}
      <Image
        src="/logo-96.png" alt="CrewRadr" width={96} height={96}
        className="relative z-10 mb-9 rounded-[22px]"
        style={{ boxShadow: "0 8px 40px rgba(142,165,149,0.25)" }}
      />

      {/* Heading */}
      <h1 className="relative z-10 text-[clamp(2rem,5vw,3.2rem)] font-bold tracking-[-0.02em]">
        {t(locale, "headingPart1")}<br />
        <span className="text-[#6E8679]">{t(locale, "headingPart2")}</span>
      </h1>

      {/* Subtitle */}
      <p className="relative z-10 mt-3 max-w-[400px] text-[clamp(1rem,2vw,1.15rem)] text-[#5A6568] dark:text-[#9AA5A8]">
        {t(locale, "subtitle")}
      </p>

      {/* Footer */}
      <div className="fixed bottom-6 flex items-center gap-4 text-sm text-[#5A6568] dark:text-[#9AA5A8]">
        <span>&copy; {new Date().getFullYear()} CrewRadr</span>
        <a href="/privacy" className="hover:text-[#6E8679]">{t(locale, "privacy")}</a>
        <span aria-hidden>·</span>
        <a href="/terms" className="hover:text-[#6E8679]">{t(locale, "terms")}</a>
      </div>
    </div>
  );
}
