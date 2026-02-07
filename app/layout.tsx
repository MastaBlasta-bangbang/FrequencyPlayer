import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import KonstaProvider from "./KonstaProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Frequency Player",
  description: "Binaural Beats & Solfeggio Engine",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f8fafc',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <KonstaProvider>
          {children}
        </KonstaProvider>
      </body>
    </html>
  );
}