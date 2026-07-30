"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.className = saved;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.className = "dark";
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.className = next;
    localStorage.setItem("theme", next);
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center transition-colors duration-300"
      style={{ background: "var(--cream)", color: "var(--text-primary)" }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse, var(--sage-glow) 0%, transparent 60%)",
        }}
      />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors"
        style={{ borderColor: "rgba(142,165,149,0.2)" }}
      >
        {theme === "dark" ? "🌙" : "☀️"}
      </button>

      {/* Logo */}
      <Image
        src="/logo.png"
        alt="CrewRadr"
        width={96}
        height={96}
        className="relative z-10 mb-9 rounded-[22px]"
        style={{
          boxShadow: "0 8px 40px var(--sage-glow)",
        }}
        priority
      />

      {/* Heading */}
      <h1
        className="relative z-10 text-[clamp(2rem,5vw,3.2rem)] font-bold tracking-[-0.02em]"
      >
        CrewRadr is
        <br />
        <span style={{ color: "var(--sage-dark)" }}>coming soon</span>
      </h1>

      {/* Subtitle */}
      <p
        className="relative z-10 mt-3 max-w-[400px] text-[clamp(1rem,2vw,1.15rem)]"
        style={{ color: "var(--text-secondary)" }}
      >
        Real-time location sharing for trusted crews. We&apos;re putting the
        finishing touches on something great.
      </p>

      {/* Footer */}
      <div
        className="fixed bottom-6 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        &copy; {new Date().getFullYear()} CrewRadr
      </div>
    </div>
  );
}
