import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const nunito = localFont({
  src: "../fonts/nunito-variable-latin.woff2",
  weight: "200 1000",
  variable: "--font-nunito",
  display: "swap",
});

const notoBengali = localFont({
  src: "../fonts/noto-bengali-variable-bengali.woff2",
  weight: "100 900",
  variable: "--font-noto-bengali",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shishu — gentle learning for little ones",
  description:
    "A calm, multilingual learning app for children ages 2–12. Letters, numbers, words, and gentle science. Free, open source, low-stimulation.",
  manifest: "./manifest.webmanifest",
  icons: {
    icon: [
      { url: "./icons/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "./icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "./icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6B9080",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${notoBengali.variable}`}>
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
