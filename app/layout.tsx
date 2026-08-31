import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptForge — prompt engineering strutturato",
  description:
    "Costruisci prompt professionali per Claude, GPT e Gemini: tag XML o markdown, few-shot, casi limite, difese anti-invenzione e punteggio di qualità. Tutto in locale, con rifinitura AI opzionale.",
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
