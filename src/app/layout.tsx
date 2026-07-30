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
      <body>{children}</body>
    </html>
  );
}
