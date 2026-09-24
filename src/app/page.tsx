"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { CountryFlag } from "@/components/CountryFlag";
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
  const [locale, setLocale] = useState<LocaleCode>("en");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useVersionCheck();

  useEffect(() => {
    setTheme(getTheme());
    setMounted(true);
    const search = window.location.search;
    const resolved = resolveLocale(search);
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

  const legalPrefix = locale === "en" ? "" : `/${locale}`;

  return (
    <div
      dir={LOCALE_DIRS[locale]}
      className="min-h-screen bg-[#F6F4EE] dark:bg-[#1E2121] text-[#262017] dark:text-[#F0F3F1] transition-colors duration-300 selection:bg-[#8EA595]/30"
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-[#8EA595]/20 bg-[#F6F4EE]/85 dark:bg-[#1E2121]/85 px-6 py-4 backdrop-blur-md">
        <a href="/" className="flex items-center gap-3 font-bold text-xl tracking-tight">
          <Image src="/logo-96.png" alt="CrewRadr" width={34} height={34} className="rounded-lg shadow-sm" />
          <span>CrewRadr</span>
        </a>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#5C635F] dark:text-[#B4BCB8]">
          <a href="#features" className="hover:text-[#6E8679] dark:hover:text-[#8EA595] transition-colors">
            {t(locale, "navFeatures")}
          </a>
          <a href="#safety" className="hover:text-[#6E8679] dark:hover:text-[#8EA595] transition-colors">
            {t(locale, "navSafety")}
          </a>
          <a href="#pricing" className="hover:text-[#6E8679] dark:hover:text-[#8EA595] transition-colors">
            {t(locale, "navPricing")}
          </a>
          <a href="#faq" className="hover:text-[#6E8679] dark:hover:text-[#8EA595] transition-colors">
            {t(locale, "navFaq")}
          </a>
        </div>

        <div className="flex items-center gap-3">
          {/* Language picker */}
          <div className="flex items-center gap-2">
            <CountryFlag code={locale} className="w-5 h-3.5 rounded-xs border border-[#8EA595]/30 shadow-xs" />
            <select
              aria-label={t(locale, "language")}
              value={locale}
              onChange={(e) => changeLocale(e.target.value as LocaleCode)}
              className="h-9 rounded-lg border border-[#8EA595]/30 bg-transparent px-2 text-xs font-semibold text-[#262017] dark:text-[#F0F3F1] cursor-pointer"
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code} className="text-[#262017]">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={t(locale, "toggleTheme")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#8EA595]/30 text-sm hover:border-[#8EA595]"
          >
            {mounted ? (theme === "dark" ? "\u{1F319}" : "\u{2600}\u{FE0F}") : "\u{2600}\u{FE0F}"}
          </button>

          {/* Private Beta Access CTA */}
          <a
            href="#contact"
            className="hidden sm:inline-flex items-center rounded-xl bg-[#6E8679] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-transform hover:scale-102 hover:bg-[#5F7A6C]"
          >
            Early Access &rarr;
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-10 h-[450px] w-[550px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(142,165,149,0.25)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse,rgba(142,165,149,0.14)_0%,transparent_70%)]" />

        <div className="relative inline-flex items-center gap-2 rounded-full border border-[#8EA595]/30 bg-[#8EA595]/10 px-3.5 py-1 text-xs font-semibold text-[#4D6558] dark:text-[#C5D3CB] mb-6">
          <span>{t(locale, "heroBadge")}</span>
        </div>

        <h1 className="relative max-w-4xl text-[clamp(2.4rem,5.5vw,4.2rem)] font-bold tracking-[-0.03em] leading-[1.12]">
          {t(locale, "heroTitle")}
        </h1>

        <p className="relative mt-5 max-w-2xl text-[clamp(1.05rem,2vw,1.25rem)] text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
          {t(locale, "heroSubtitle")}
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#contact"
            className="rounded-xl bg-[#6E8679] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#5F7A6C] hover:shadow-lg"
          >
            Request Private Beta Access
          </a>
          <a
            href="#pricing"
            className="rounded-xl border border-[#8EA595]/40 bg-[#FDFCFA] dark:bg-[#262929] px-6 py-3 text-sm font-bold text-[#262017] dark:text-[#F0F3F1] transition-colors hover:border-[#8EA595]"
          >
            {t(locale, "navPricing")}
          </a>
        </div>

        {/* Live Radar Mock Preview Card */}
        <div className="relative mt-12 w-full max-w-3xl rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8EA595]/20 pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-[#262017] dark:text-[#F0F3F1]">
                Live Satellite & Radar Beacon
              </span>
            </div>
            <span className="rounded-full bg-[#8EA595]/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#4D6558] dark:text-[#C5D3CB]">
              WebSocket Connected · 150ms
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
            <div className="rounded-xl border border-[#8EA595]/20 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 p-3">
              <span className="text-[11px] font-semibold text-[#5C635F] dark:text-[#B4BCB8]">Safe Landing Zone</span>
              <p className="mt-1 font-bold text-sm text-[#262017] dark:text-[#F0F3F1]">🏠 Home Base (Within 75m)</p>
              <span className="mt-1 inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Auto check-in logged
              </span>
            </div>

            <div className="rounded-xl border border-[#8EA595]/20 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 p-3">
              <span className="text-[11px] font-semibold text-[#5C635F] dark:text-[#B4BCB8]">Telematics & Driving</span>
              <p className="mt-1 font-bold text-sm text-[#262017] dark:text-[#F0F3F1]">🚗 42 mph · Score: 98/100</p>
              <span className="mt-1 inline-block text-[10px] text-[#5C635F] dark:text-[#B4BCB8]">
                Normal driving dynamics
              </span>
            </div>

            <div className="rounded-xl border border-[#8EA595]/20 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 p-3">
              <span className="text-[11px] font-semibold text-[#5C635F] dark:text-[#B4BCB8]">Weather Overlays</span>
              <p className="mt-1 font-bold text-sm text-[#262017] dark:text-[#F0F3F1]">⛈️ Doppler Radar Live</p>
              <span className="mt-1 inline-block text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                No active NWS hazard polygons
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-tight">
            {t(locale, "featuresHeader")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5C635F] dark:text-[#B4BCB8]">
            {t(locale, "featuresSub")}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1 */}
          <div className="rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8EA595]/15 text-2xl mb-4">
              🧭
            </div>
            <h3 className="font-bold text-base text-[#262017] dark:text-[#F0F3F1]">{t(locale, "f1Title")}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
              {t(locale, "f1Desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8EA595]/15 text-2xl mb-4">
              🛡️
            </div>
            <h3 className="font-bold text-base text-[#262017] dark:text-[#F0F3F1]">{t(locale, "f2Title")}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
              {t(locale, "f2Desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8EA595]/15 text-2xl mb-4">
              🌧️
            </div>
            <h3 className="font-bold text-base text-[#262017] dark:text-[#F0F3F1]">{t(locale, "f3Title")}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
              {t(locale, "f3Desc")}
            </p>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8EA595]/15 text-2xl mb-4">
              🚗
            </div>
            <h3 className="font-bold text-base text-[#262017] dark:text-[#F0F3F1]">{t(locale, "f4Title")}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
              {t(locale, "f4Desc")}
            </p>
          </div>

          {/* Card 5 */}
          <div className="rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8EA595]/15 text-2xl mb-4">
              🔐
            </div>
            <h3 className="font-bold text-base text-[#262017] dark:text-[#F0F3F1]">{t(locale, "f5Title")}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
              {t(locale, "f5Desc")}
            </p>
          </div>

          {/* Card 6 */}
          <div className="rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8EA595]/15 text-2xl mb-4">
              🗺️
            </div>
            <h3 className="font-bold text-base text-[#262017] dark:text-[#F0F3F1]">{t(locale, "f6Title")}</h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
              {t(locale, "f6Desc")}
            </p>
          </div>
        </div>
      </section>

      {/* Safety & Telematics Strip */}
      <section id="safety" className="border-y border-[#8EA595]/25 bg-[#EFECE5] dark:bg-[#262929] px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <p className="text-3xl font-extrabold text-[#6E8679] dark:text-[#8EA595]">{t(locale, "statEncValue")}</p>
              <p className="mt-1 text-xs text-[#5C635F] dark:text-[#B4BCB8] font-semibold">{t(locale, "statEncLabel")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#6E8679] dark:text-[#8EA595]">{t(locale, "statZeroValue")}</p>
              <p className="mt-1 text-xs text-[#5C635F] dark:text-[#B4BCB8] font-semibold">{t(locale, "statZeroLabel")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#6E8679] dark:text-[#8EA595]">{t(locale, "statSyncValue")}</p>
              <p className="mt-1 text-xs text-[#5C635F] dark:text-[#B4BCB8] font-semibold">{t(locale, "statSyncLabel")}</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-[#6E8679] dark:text-[#8EA595]">Universal</p>
              <p className="mt-1 text-xs text-[#5C635F] dark:text-[#B4BCB8] font-semibold">Land, Sea, Air & Road</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold tracking-tight">
            {t(locale, "pricingHeader")}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#5C635F] dark:text-[#B4BCB8]">
            {t(locale, "pricingSub")}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Deckhand */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C635F] dark:text-[#B4BCB8]">
                {t(locale, "tierDeckhandName")}
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{t(locale, "tierDeckhandPrice")}</span>
                <span className="text-xs text-[#5C635F] dark:text-[#B4BCB8]">{t(locale, "tierDeckhandPeriod")}</span>
              </div>
              <p className="mt-2 text-xs text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
                {t(locale, "tierDeckhandDesc")}
              </p>
              <ul className="mt-6 space-y-2 text-xs text-[#5C635F] dark:text-[#B4BCB8]">
                <li className="flex items-center gap-2">✓ Up to 6 crew members</li>
                <li className="flex items-center gap-2">✓ 7-day location history</li>
                <li className="flex items-center gap-2">✓ 3 Safe Landings</li>
                <li className="flex items-center gap-2">✓ Standard GPS radar</li>
              </ul>
            </div>
            <a
              href="#contact"
              className="mt-8 block rounded-xl border border-[#8EA595]/40 py-2.5 text-center text-xs font-bold hover:border-[#8EA595] transition-colors"
            >
              Request Private Beta Access
            </a>
          </div>

          {/* First Mate */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-[#6E8679] bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-md relative">
            <span className="absolute -top-3 right-4 rounded-full bg-[#6E8679] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
              Popular
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#6E8679] dark:text-[#8EA595]">
                {t(locale, "tierFirstMateName")}
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{t(locale, "tierFirstMatePrice")}</span>
                <span className="text-xs text-[#5C635F] dark:text-[#B4BCB8]">{t(locale, "tierFirstMatePeriod")}</span>
              </div>
              <p className="mt-2 text-xs text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
                {t(locale, "tierFirstMateDesc")}
              </p>
              <ul className="mt-6 space-y-2 text-xs text-[#5C635F] dark:text-[#B4BCB8]">
                <li className="flex items-center gap-2">✓ Up to 15 crew members</li>
                <li className="flex items-center gap-2">✓ 30-day location history</li>
                <li className="flex items-center gap-2">✓ 10 Safe Landings</li>
                <li className="flex items-center gap-2">✓ Live Weather Radar (Doppler)</li>
                <li className="flex items-center gap-2">✓ NWS Severe Hazard Polygons</li>
              </ul>
            </div>
            <a
              href="#contact"
              className="mt-8 block rounded-xl bg-[#6E8679] py-2.5 text-center text-xs font-bold text-white hover:bg-[#5F7A6C] transition-colors"
            >
              Join Early Access
            </a>
          </div>

          {/* Captain */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C635F] dark:text-[#B4BCB8]">
                {t(locale, "tierCaptainName")}
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{t(locale, "tierCaptainPrice")}</span>
                <span className="text-xs text-[#5C635F] dark:text-[#B4BCB8]">{t(locale, "tierCaptainPeriod")}</span>
              </div>
              <p className="mt-2 text-xs text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
                {t(locale, "tierCaptainDesc")}
              </p>
              <ul className="mt-6 space-y-2 text-xs text-[#5C635F] dark:text-[#B4BCB8]">
                <li className="flex items-center gap-2">✓ Up to 25 crew members</li>
                <li className="flex items-center gap-2">✓ 90-day history retention</li>
                <li className="flex items-center gap-2">✓ Unlimited Safe Landings</li>
                <li className="flex items-center gap-2">✓ Driving Telematics & Scorecards</li>
                <li className="flex items-center gap-2">✓ CSV & PDF Fleet Reports</li>
              </ul>
            </div>
            <a
              href="#contact"
              className="mt-8 block rounded-xl border border-[#8EA595]/40 py-2.5 text-center text-xs font-bold hover:border-[#8EA595] transition-colors"
            >
              Request Private Beta Access
            </a>
          </div>

          {/* Admiral */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C635F] dark:text-[#B4BCB8]">
                {t(locale, "tierAdmiralName")}
              </span>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold">{t(locale, "tierAdmiralPrice")}</span>
                <span className="text-xs text-[#5C635F] dark:text-[#B4BCB8]">{t(locale, "tierAdmiralPeriod")}</span>
              </div>
              <p className="mt-2 text-xs text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
                {t(locale, "tierAdmiralDesc")}
              </p>
              <ul className="mt-6 space-y-2 text-xs text-[#5C635F] dark:text-[#B4BCB8]">
                <li className="flex items-center gap-2">✓ Unlimited crew members</li>
                <li className="flex items-center gap-2">✓ 365-day history retention</li>
                <li className="flex items-center gap-2">✓ AI Risk & Arrival ETA Prediction</li>
                <li className="flex items-center gap-2">✓ Enterprise SSO & SCIM Directory</li>
                <li className="flex items-center gap-2">✓ Priority Telemetry Dispatch</li>
              </ul>
            </div>
            <a
              href="#contact"
              className="mt-8 block rounded-xl border border-[#8EA595]/40 py-2.5 text-center text-xs font-bold hover:border-[#8EA595] transition-colors"
            >
              Request Enterprise Beta
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold tracking-tight mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {[
            {
              q: "Does CrewRadr drain device battery with continuous GPS?",
              a: "No. CrewRadr uses adaptive sensor fusion that dynamically sleeps the GPS radio when stationary and relies on low-power accelerometer triggers to resume high-frequency telemetry only when movement is detected.",
            },
            {
              q: "Can crew members pause their location sharing?",
              a: "Yes. Every member retains complete sovereignty over their privacy. You can activate Ghost Mode or pause sharing with specific members at any time with a single tap.",
            },
            {
              q: "Does the app work in remote areas without cellular coverage?",
              a: "Yes. You can pre-download OpenStreetMap tile regions for offline use. While offline, telemetry events are queued locally and automatically uploaded when cell connection resumes.",
            },
            {
              q: "Is CrewRadr an official 911 emergency dispatch service?",
              a: "No. CrewRadr is a peer-to-peer situational awareness tool designed for family, team, and peer safety. It is not an authorized emergency service or 911 dispatch replacement. In life-threatening situations, always dial official emergency authorities.",
            },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] overflow-hidden">
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between p-4 text-left font-semibold text-sm text-[#262017] dark:text-[#F0F3F1]"
              >
                <span>{item.q}</span>
                <span className="text-base text-[#8EA595]">{activeFaq === idx ? "−" : "+"}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-xs text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed border-t border-[#8EA595]/15 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Contact & Consultation Section with TCPA/CTIA Compliant Opt-In */}
      <section id="contact" className="border-t border-[#8EA595]/20 bg-[#F6F4EE]/50 dark:bg-[#1E2121]/50 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="rounded-full bg-[#8EA595]/20 px-3.5 py-1 text-xs font-bold text-[#6E8679] dark:text-[#8EA595]">
            Contact &amp; Support
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Get in Touch with CrewRadr</h2>
          <p className="mt-2 text-xs text-[#5C635F] dark:text-[#B4BCB8]">
            Have questions regarding fleet deployment, custom situational integrations, or customer support? Reach out directly.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thank you! Your message has been received. Our team will contact you shortly.");
            }}
            className="mt-8 space-y-4 text-left rounded-2xl border border-[#8EA595]/30 bg-[#FDFCFA] dark:bg-[#262929] p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-semibold mb-1 text-[#262017] dark:text-[#F0F3F1]">
                  Your Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  className="w-full rounded-xl border border-[#8EA595]/30 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 px-3 py-2 text-xs focus:border-[#6E8679] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold mb-1 text-[#262017] dark:text-[#F0F3F1]">
                  Email Address *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="alex@example.com"
                  className="w-full rounded-xl border border-[#8EA595]/30 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 px-3 py-2 text-xs focus:border-[#6E8679] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-phone" className="block text-xs font-semibold mb-1 text-[#262017] dark:text-[#F0F3F1]">
                Mobile Phone Number <span className="text-[#5C635F] dark:text-[#B4BCB8] font-normal">(Optional)</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-xl border border-[#8EA595]/30 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 px-3 py-2 text-xs focus:border-[#6E8679] focus:outline-none"
              />
            </div>

            {/* Standalone, Unchecked Voluntary SMS Consent Checkbox */}
            <div className="rounded-xl border border-[#8EA595]/20 bg-[#8EA595]/5 p-3.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="sms-consent"
                  className="mt-0.5 h-4 w-4 rounded border-[#8EA595] text-[#6E8679] focus:ring-[#6E8679]"
                />
                <span className="text-[11px] text-[#5C635F] dark:text-[#B4BCB8] leading-relaxed">
                  I agree to receive transactional and consultation text messages (SMS) from CrewRadr at the phone number provided above. 
                  <strong> Consent is voluntary and not a condition of purchase or receiving services.</strong> Message frequency varies. 
                  Message and data rates may apply. Reply STOP to cancel at any time, HELP for help. View our{" "}
                  <a href={`/terms${legalPrefix}/`} className="underline hover:text-[#6E8679]">Terms of Service</a> and{" "}
                  <a href={`/privacy${legalPrefix}/`} className="underline hover:text-[#6E8679]">Privacy Policy</a>.
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-semibold mb-1 text-[#262017] dark:text-[#F0F3F1]">
                Message / Inquiries
              </label>
              <textarea
                id="contact-message"
                rows={3}
                placeholder="How can our crew help you?"
                className="w-full rounded-xl border border-[#8EA595]/30 bg-[#F6F4EE]/60 dark:bg-[#1E2121]/60 px-3 py-2 text-xs focus:border-[#6E8679] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#6E8679] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#5F7A6C] transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Statutory Disclaimer & Business Footer */}
      <footer className="border-t border-[#8EA595]/25 px-6 py-12 text-xs text-[#5C635F] dark:text-[#B4BCB8]">
        <div className="mx-auto max-w-4xl space-y-6">
          <p className="text-center leading-relaxed opacity-75">{t(locale, "emergencyNotice")}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left border-y border-[#8EA595]/15 py-6">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-[#262017] dark:text-[#F0F3F1] mb-2">
                <Image src="/logo-96.png" alt="CrewRadr" width={22} height={22} className="rounded-md" />
                CrewRadr
              </div>
              <p className="text-xs leading-relaxed">
                Situational awareness, severe weather radar overlays, and peer safety telematics for families, trusted circles, and fleets.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#262017] dark:text-[#F0F3F1] mb-2">
                Business &amp; Support Contact
              </h4>
              <p className="text-xs leading-relaxed space-y-1">
                <span><strong>Brand:</strong> CrewRadr</span><br />
                <span><strong>Support Email:</strong> <a href="mailto:support@crewradr.app" className="underline hover:text-[#6E8679]">support@crewradr.app</a></span><br />
                <span><strong>Hours:</strong> Mon–Fri, 9:00 AM – 6:00 PM EST</span>
              </p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#262017] dark:text-[#F0F3F1] mb-2">
                Legal &amp; Compliance
              </h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href={`/privacy${legalPrefix}/`} className="hover:text-[#6E8679] underline">{t(locale, "privacy")}</a></li>
                <li><a href={`/terms${legalPrefix}/`} className="hover:text-[#6E8679] underline">{t(locale, "terms")}</a></li>
                <li><a href="/contact/" className="hover:text-[#6E8679] underline">Contact &amp; Consultation</a></li>
                <li><a href="/sms-terms/" className="hover:text-[#6E8679] underline font-medium text-[#6E8679] dark:text-[#8EA595]">SMS &amp; Text Messaging Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold pt-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} CrewRadr. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="/contact/" className="hover:text-[#6E8679]">Contact</a>
              <span>·</span>
              <a href={`/privacy${legalPrefix}/`} className="hover:text-[#6E8679]">{t(locale, "privacy")}</a>
              <span>·</span>
              <a href={`/terms${legalPrefix}/`} className="hover:text-[#6E8679]">{t(locale, "terms")}</a>
              <span>·</span>
              <a href="/sms-terms/" className="hover:text-[#6E8679]">SMS Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
