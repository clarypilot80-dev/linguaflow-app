import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinguaFlow — Language Learning Platform",
  description: "Master French through shadowing, AI-powered practice, and spaced repetition. Your all-in-one language learning companion.",
  keywords: ["language learning", "French", "shadowing", "TTS", "AI", "spaced repetition"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
