import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from "next/font/google";
import { Shell } from "@/components/os/Shell";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI Wrangler — Local Domination OS",
  description: "Applied AI operating system for home-services agencies. CRM, Twilio dialer, SMS, Zernio ads, and AI builds — without mixing customers.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}>
      <body className="h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
