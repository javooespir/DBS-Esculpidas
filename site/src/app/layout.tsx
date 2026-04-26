import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "DBS Esculpidas | Nail Studio en Ituzaingó",
  description:
    "Uñas esculpidas, nail art y manicura profesional en Ituzaingó, Buenos Aires. Turnos disponibles — seguinos en Instagram para ver los últimos diseños.",
  keywords: ["uñas esculpidas", "nail art", "manicura", "Ituzaingó", "Buenos Aires", "nail studio"],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "DBS Esculpidas | Nail Studio",
    description: "Uñas que hablan por vos. Ituzaingó, Buenos Aires.",
    type: "website",
    locale: "es_AR",
    url: "https://dbsesculpidas.encende.click",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "DBS Esculpidas Logo",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${dmSans.variable}`}
    >
      <body className="min-h-dvh flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
