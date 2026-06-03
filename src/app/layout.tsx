import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CurrencyProvider } from "@/context/CurrencyProvider";
import { CurrencySelector } from "@/components/CurrencySelector";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Penlabs Lighting Calculator — Pen Homes",
    template: "%s",
  },
  description:
    "Design the perfect light for any space. Calculate lumens, fixture counts, spacing, layered zones, cost and energy — engineered to the Pen Homes standard.",
  applicationName: "Penlabs Lighting Calculator",
  manifest: "/manifest.webmanifest",
  keywords: [
    "lighting calculator",
    "lumens calculator",
    "recessed lighting",
    "fixture spacing",
    "room lighting design",
    "Pen Homes",
    "Penlabs",
  ],
  authors: [{ name: "Pen Homes" }],
  openGraph: {
    title: "Penlabs Lighting Calculator — Pen Homes",
    description:
      "Engineer light from the first sketch: lumens, fixtures, spacing, cost and energy — to the Pen Homes standard.",
    type: "website",
    siteName: "Penlabs Lighting Calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Penlabs Lighting Calculator — Pen Homes",
    description:
      "Engineer light from the first sketch: lumens, fixtures, spacing, cost and energy.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2EFE9" },
    { media: "(prefers-color-scheme: dark)", color: "#1F2521" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegister />
        <ThemeProvider>
        <CurrencyProvider>
          <div className="min-h-screen bg-background">
            <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-display text-lg leading-none">
                      P
                    </div>
                    <div className="leading-tight">
                      <div className="font-display text-lg tracking-tight text-foreground">
                        Penlabs Lighting
                      </div>
                      <div className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                        by Pen Homes
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-5">
                    <Link
                      href="/calculator"
                      className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-brand-bronze transition-colors"
                    >
                      Calculator
                    </Link>
                    <Link
                      href="/designer"
                      className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-brand-bronze transition-colors"
                    >
                      Designer
                    </Link>
                    <Link
                      href="/project"
                      className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-brand-bronze transition-colors"
                    >
                      Projects
                    </Link>
                    <Link
                      href="/lumens-calculator"
                      className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-brand-bronze transition-colors"
                    >
                      Lumens
                    </Link>
                    <CurrencySelector />
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </nav>
            <main className="container mx-auto px-4 py-10">{children}</main>
            <footer className="border-t border-border bg-background/80 backdrop-blur-sm mt-16">
              <div className="container mx-auto px-4 py-8 space-y-1 text-center">
                <p className="font-display text-sm tracking-wide text-foreground">
                  The Architecture of Intelligence
                </p>
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} Penlabs — a Pen Homes company. Intentional, invisible technology.
                </p>
                <p className="text-xs text-muted-foreground">
                  <Link href="/admin" className="hover:text-brand-bronze transition-colors">
                    Admin
                  </Link>
                </p>
              </div>
            </footer>
          </div>
        </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
