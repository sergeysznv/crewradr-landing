import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F4F0' },
    { media: '(prefers-color-scheme: dark)', color: '#1A2327' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "CrewRadr — Real-Time Situational Awareness & Fleet Safety",
  description: "Real-time location radar, predictive driving telematics, severe weather Doppler overlays, and emergency check-ins for trusted crews and fleets.",
  icons: "/logo-32.png",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    languages: {
      en: "/?lang=en",
      es: "/?lang=es",
      fr: "/?lang=fr",
      ar: "/?lang=ar",
      zh: "/?lang=zh",
      ru: "/?lang=ru",
    },
  },
  openGraph: {
    title: "CrewRadr — Real-Time Situational Awareness & Fleet Safety",
    description: "Real-time location radar, predictive driving telematics, severe weather Doppler overlays, and emergency telemetry for land, sea, air, and road.",
    locale: "en_US",
    alternateLocale: ["es_ES", "fr_FR", "ar_AR", "zh_CN", "ru_RU"],
    siteName: "CrewRadr",
    type: "website",
    url: "https://crewradr.app",
    images: [
      {
        url: "https://crewradr.app/logo-512.png",
        width: 512,
        height: 512,
        alt: "CrewRadr Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "CrewRadr — Real-Time Situational Awareness & Fleet Safety",
    description: "Real-time location radar, predictive driving telematics, severe weather Doppler overlays, and emergency telemetry for land, sea, air, and road.",
    images: ["https://crewradr.app/logo-512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `var t=localStorage.getItem('theme');if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.className=t;var l=localStorage.getItem('lang');if(l){document.documentElement.lang=l;if(l==='ar')document.documentElement.dir='rtl';}`,
          }}
        />
      </head>
      <body className="transition-colors duration-300">{children}</body>
    </html>
  );
}
