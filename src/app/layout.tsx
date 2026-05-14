import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Playfair_Display,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import { WardrobeProvider } from "@/src/context/WardrobeContext";
import { ThemeProvider } from "@/src/components/ThemeProvider";
import SystemHealthGuard from "@/src/utils/SystemHealthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
});

export const metadata: Metadata = {
  title: "F.AVA AI | Virtual Wardrobe",
  description: "A beginner-friendly fashion avatar app",
  icons: {
    icon: "/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${jakarta.variable} antialiased bg-brand-cream text-brand-forest dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WardrobeProvider>
            <SystemHealthGuard>
              <Navbar />
              {children}
            </SystemHealthGuard>
          </WardrobeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
