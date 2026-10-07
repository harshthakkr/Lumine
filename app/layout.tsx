import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Luminé — Book makeup artists in New York", template: "%s · Luminé" },
  description:
    "Discover and book vetted makeup artists in New York for weddings, events, shoots and everyday glam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="bg-neutral-light antialiased">
        {children}
      </body>
      <GoogleAnalytics gaId="G-EPC6BJRW3L" />
    </html>
  );
}
