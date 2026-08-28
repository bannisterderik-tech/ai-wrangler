import Script from "next/script";
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
    // suppressHydrationWarning on <html> only: the theme script below rewrites
    // data-theme before React hydrates, so the server's "dark" and the client's
    // actual value legitimately differ on this one element. Scoped here, it
    // silences that one attribute and nothing deeper in the tree.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}
    >
      <body className="h-full">
        {/*
          The theme, decided before first paint.

          The server renders data-theme="dark" and Shell used to correct it in an
          effect, which runs after the browser has painted — so a light user saw
          the dark UI flash on every navigation, and both logo variants were
          downloaded because the applied rule changed after load.

          next/script with beforeInteractive is the supported way to run
          something ahead of hydration; a bare <script> in the tree makes React
          warn that it will not execute on client renders.
        */}
        <Script id="theme" strategy="beforeInteractive">
          {"try{var t=localStorage.getItem('wrangler-theme');" +
            "if(!t)t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';" +
            "document.documentElement.setAttribute('data-theme',t)}catch(e){}"}
        </Script>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
