import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

import seoConfig from "@/data/seo_config.json";

const rawEnvUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
const SITE_URL = (
  rawEnvUrl && !rawEnvUrl.includes("127.0.0.1") && !rawEnvUrl.includes("localhost")
    ? rawEnvUrl
    : (seoConfig?.canonicalUrl || "https://spycam-tan.vercel.app")
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SGS-Tracker | Le Tracker Valorant Intelligent & Live Overlay",
    template: "%s | SGS-Tracker",
  },
  description:
    "Tracker Valorant de nouvelle génération : mesurez votre niveau avec le SGS Performance Index (SPI), overlay live in-game sans latence, aim trainer 3D Cyber Assault, salons vocaux WebRTC et historique de matchs détaillé.",
  keywords: [
    "Valorant",
    "Valorant Tracker",
    "SGS-Tracker",
    "Spycam Valorant",
    "Stats Valorant",
    "Overlay Valorant",
    "Live Match Valorant",
    "SGS Performance Index",
    "Aim Trainer Valorant",
    "Vocal Valorant",
    "Valorant Leaderboard",
    "Killmap Valorant",
  ],
  authors: [{ name: "SGS Team", url: SITE_URL }],
  creator: "SGS Team",
  publisher: "SGS",
  applicationName: "SGS-Tracker",
  category: "Gaming",
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SGS-Tracker | Le Tracker Valorant Intelligent & Live Overlay",
    description:
      "Statistiques temps réel, note SPI sur 1000 points, overlay live sans latence, aim trainer 3D et salons vocaux pour progresser sur Valorant.",
    url: SITE_URL,
    siteName: "SGS-Tracker",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "SGS-Tracker - Valorant Intelligence & Performance Tracker",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SGS-Tracker | Valorant Performance Tracker & Live Overlay",
    description:
      "Mesurez votre SGS Performance Index (SPI), suivez vos stats en live et entraînez votre shoot avec SGS-Tracker.",
    images: ["/api/og"],
    creator: "@SGS_Tracker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0e13",
  colorScheme: "dark",
  viewportFit: "cover",
};

// Données structurées JSON-LD pour indexation IA et moteurs de recherche
const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "SGS-Tracker",
      description:
        "Plateforme d'analyse et tracker de performances pour le jeu Valorant avec overlay direct, aim trainer 3D et salons vocaux.",
      inLanguage: "fr-FR",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "SGS-Tracker",
      operatingSystem: "Windows, Web, Progressive Web App",
      applicationCategory: "GameApplication, UtilityApplication",
      description:
        "Tracker et assistant compétitif pour Valorant : calcul du score SPI (SGS Performance Index), détection de tilt, overlay in-game en lecture directe des journaux de jeu, cartes de chaleur de tir, aim trainer 3D et salons vocaux intégrés.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
      },
      featureList: [
        "SGS Performance Index (SPI sur 1000 pts)",
        "Overlay Live Match sans latence via ShooterGame logs",
        "3D Aim Trainer Cyber Assault",
        "Killmap et Heatmaps de précision de tir",
        "Salons Vocaux d'escouade WebRTC haute qualité",
        "Suivi de session et détection de tilt",
        "Export de cartes de match et profils en haute résolution",
      ],
    },
  ],
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
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                if (
                  localStorage.getItem("sgs_user_authenticated") === "true" ||
                  sessionStorage.getItem("spycam_guest_mode") === "true" ||
                  document.cookie.indexOf("sgs_auth=1") !== -1 ||
                  Boolean(localStorage.getItem("spycam_my_riot_id"))
                ) {
                  document.documentElement.classList.add("sgs-has-session");
                }
              } catch(e) {}
            })();`,
          }}
        />
        <meta name="google-adsense-account" content="ca-pub-3408630373286016" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3408630373286016"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans text-[var(--color-text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
