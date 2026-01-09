import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Pen Lighting Calculator - Professional Lighting Design by Pen Homes",
  description: "Calculate lumens, number of lights, and spacing for any room. Professional lighting calculator for recessed lights and fixtures.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <nav className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                  <div className="p-2 bg-primary rounded-lg">
                    <Lightbulb className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-primary">Pen Lighting</div>
                    <div className="text-xs text-muted-foreground font-normal">by Pen Homes</div>
                  </div>
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    href="/calculator"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Full Calculator
                  </Link>
                  <Link
                    href="/lumens-calculator"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Lumens Only
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-16">
            <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} Pen Lighting by Pen Homes. Professional lighting calculator.</p>
            </div>
          </footer>
        </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
