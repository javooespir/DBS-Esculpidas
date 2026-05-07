import type { Metadata } from "next";
import { Cormorant, Montserrat } from "next/font/google";
import "./globals.css";
import { BUSINESS } from "@/lib/constants";

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(BUSINESS.siteUrl),
  title: {
    default: `${BUSINESS.name} — ${BUSINESS.tagline}`,
    template: `%s · ${BUSINESS.name}`,
  },
  description: `Estudio de uñas premium en Ituzaingó. Esculpidas, capping, semipermanente y belleza de manos. Reservá tu turno online.`,
  keywords: ["uñas", "esculpidas", "manicura", "Ituzaingó", "semipermanente", "DBS"],
  openGraph: {
    title: `${BUSINESS.name}`,
    description: BUSINESS.tagline,
    locale: "es_AR",
    type: "website",
    siteName: BUSINESS.name,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
