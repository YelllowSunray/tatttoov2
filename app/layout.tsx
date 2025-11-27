import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PasswordGate } from "@/components/PasswordGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tattoo Discovery - Find Your Perfect Dutch Artist",
  description: "Discover tattoo artists in the Netherlands whose work resonates with your personal aesthetic. Browse curated tattoos and find your Top 5 matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PasswordGate>
          <AuthProvider>
            {children}
          </AuthProvider>
        </PasswordGate>
      </body>
    </html>
  );
}
