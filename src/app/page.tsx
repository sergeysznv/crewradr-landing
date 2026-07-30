"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useVersionCheck } from "@/hooks/use-version-check";

function getInitialTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);
  useVersionCheck();

  // Sync when another tab changes localStorage
  useEffect(() => {
    const onStorage = () => {
      const saved = localStorage.getItem("theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center transition-colors duration-300 bg-[var(--bg)] text-[var(--text)]">
      {/* Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(ellipse, var(--sage-glow) 0%, transparent 60%)" }}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
        style={{ borderColor: "rgba(142,165,149,0.2)" }}
      >
        {theme === "dark" ? "\u{1F319}" : "\u{2600}\u{FE0F}"}
      </button>

      {/* Logo */}
      <Image
        src="/logo.png"
        alt="CrewRadr"
        width={96}
        height={96}
        className="relative z-10 mb-9 rounded-[22px]"
        style={{ boxShadow: "0 8px 40px var(--sage-glow)" }}
        priority
      />

      {/* Heading */}
      <h1 className="relative z-10 text-[clamp(2rem,5vw,3.2rem)] font-bold tracking-[-0.02em] text-[var(--text)]">
        CrewRadr is
        <br />
        <span style={{ color: "var(--sage-dark)" }}>coming soon</span>
      </h1>

      {/* Subtitle */}
      <p className="relative z-10 mt-3 max-w-[400px] text-[clamp(1rem,2vw,1.15rem)] text-[var(--text-muted)]">
        Real-time location sharing for trusted crews. We&apos;re putting the
        finishing touches on something great.
      </p>

      {/* Footer */}
      <div className="fixed bottom-6 text-sm text-[var(--text-muted)]">
        &copy; {new Date().getFullYear()} CrewRadr
      </div>
    </div>
  );
}
