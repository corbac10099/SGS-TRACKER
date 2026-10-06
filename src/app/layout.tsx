import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGS-Tracker - Valorant Performance Tracker",
  description: "Suivez vos performances et statistiques sur Valorant avec SGS-Tracker.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SGS-Tracker",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/spycam-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e13",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="google-adsense-account" content="ca-pub-3408630373286016" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3408630373286016"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-[var(--color-text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
