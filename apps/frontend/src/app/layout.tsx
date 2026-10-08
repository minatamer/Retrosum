import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { headers } from "next/headers";
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
export default async function RootLayout({ children }: { children: ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  return (
    <html lang="en" className={`${editorial.variable} ${interfaceFont.variable}`}>
      <head>
        <meta name="retrosum-csp-nonce" content={nonce} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
