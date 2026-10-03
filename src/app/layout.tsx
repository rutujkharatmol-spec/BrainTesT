import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom stays enabled: blocking it fails WCAG 1.4.4, and this app is
  // used by schoolchildren who may need to enlarge text.
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "NeuroCogniLab | AIIMS Kalyani Physiology Cognitive Lab",
  description: "NeuroCogniLab — High-Precision Neurocognitive Testing & Psychometric Assessment Battery.",
  manifest: "/manifest.json",
  icons: {
    apple: "/favicon_io/apple-touch-icon.png",
    icon: "/favicon_io/favicon.ico",
    shortcut: "/favicon_io/favicon-32x32.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NeuroCogniLab",
  },
};

import { AppProvider } from "@/components/AppContext";
import Navbar from "@/components/Navbar";
import ServiceWorkerUpdater from "@/components/ServiceWorkerUpdater";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <AppProvider>
          <Navbar />
          <main>{children}</main>
          <ServiceWorkerUpdater />
        </AppProvider>
      </body>
    </html>
  );
}
