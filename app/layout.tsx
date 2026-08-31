import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptForge — generatore di prompt per AI",
  description:
    "Costruisci prompt strutturati per Claude, GPT, Gemini e generatori di immagini. Locale e istantaneo, con affinamento opzionale via AI.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0d10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
