import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrewRadr — Coming Soon",
  description: "Real-time location sharing for trusted crews. Coming soon.",
  icons: "/logo.png",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme — must run before any paint.
            Sets data-theme on <html> synchronously, before CSS is parsed.
            Uses 'theme' key shared with admin.crewradr.app. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(!t)t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';document.documentElement.className=t})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
