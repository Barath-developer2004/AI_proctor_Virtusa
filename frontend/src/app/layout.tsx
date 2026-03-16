import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jatayu Proctor — Agentic AI Assessment",
  description: "Revolutionary AI-powered assessment platform with live proctoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-jatayu-dark antialiased">
        {/* Top Navigation Bar */}
        <nav className="sticky top-0 z-50 border-b border-jatayu-border bg-jatayu-panel/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="text-jatayu-accent">⚡</span>
              <span>Jatayu Proctor</span>
            </a>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/assessment" className="hover:text-white transition-colors">Assessment</a>
              <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
