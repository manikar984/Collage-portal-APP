import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./portal.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Helios Institute of Technology",
  description: "Student academic portal for Helios Institute of Technology.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
