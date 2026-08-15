import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrewRadr — Coming Soon",
  description: "Real-time location sharing for trusted crews. Coming soon.",
  icons: "/logo-32.png",
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
    title: "CrewRadr — Coming Soon",
    description: "Real-time location sharing for trusted crews. Coming soon.",
    locale: "en_US",
    siteName: "CrewRadr",
    type: "website",
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
