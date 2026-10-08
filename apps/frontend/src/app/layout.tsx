import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
const editorial = localFont({
  src: "../assets/fonts/fraunces.woff2",
  variable: "--font-editorial",
  weight: "100 900",
  display: "swap",
});
const interfaceFont = localFont({
  src: "../assets/fonts/ibmplexsans.woff2",
  variable: "--font-interface",
  weight: "100 700",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Retrosum — Make sense of your business money",
  description:
    "A document-first finance demo with a source-backed dashboard and Retro, your AI copilot.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${editorial.variable} ${interfaceFont.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
