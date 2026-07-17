import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kingdom Within — Malkuta Protocol",
  description: "A deterministic scripture geometry instrument translating sacred text into verifiable frequency, color, and form.",
  metadataBase: new URL("https://kingdomwithin.thehouseofjoshi.com"),
  openGraph: {
    type: "website",
    siteName: "Kingdom Within",
    title: "Kingdom Within — Malkuta Protocol",
    description: "A precision instrument translating scripture into verifiable harmonic frequency and deterministic geometric form.",
    images: [{ url: "/og/kingdom-within-social.png", width: 1200, height: 630, alt: "Kingdom Within Malkuta Protocol precision instrument interface" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kingdom Within — Malkuta Protocol",
    description: "Scripture → signal → form.",
    images: ["/og/kingdom-within-social.png"],
  },
  icons: { icon: "/house-of-joshi-mark.png", apple: "/house-of-joshi-mark.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
