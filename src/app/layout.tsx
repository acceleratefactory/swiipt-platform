import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/app/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Cabinet Grotesk is not yet on Google Fonts standard import
// Use local font or CSS @import in globals.css
// Fallback: use Plus Jakarta Sans for headings too until Cabinet Grotesk is configured

export const metadata: Metadata = {
  title: "Swiipt — Save. Move. Arrive.",
  description:
    "Save toward any destination. Book flights and holidays. Process visas, residency and citizenship. One platform.",
  openGraph: {
    title: "Swiipt",
    description: "Your money moves you to the world.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
