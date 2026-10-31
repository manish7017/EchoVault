import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FilmGrainOverlay from "@/components/FilmGrainOverlay";

export const metadata: Metadata = {
  title: "EchoVault — The Memories That Refuse to Disappear",
  description: "A privacy-first, local digital memory archive powered by open-weight AI models. Hacktoberfest Open-Source AI Challenge — Week 4: Ghost in the Machine.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0D0D0F] text-[#E8E0D2] min-h-screen flex flex-col antialiased selection:bg-[#D6A65C]/30 selection:text-[#E8E0D2]">
        <FilmGrainOverlay />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
