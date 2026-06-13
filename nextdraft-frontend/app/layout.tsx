import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "NextDraft — AI Resume Optimizer",
  description:
    "Upload your resume, paste a job description, and let AI apply safe, ATS-friendly improvements.",
  keywords: ["resume", "ATS", "AI", "job", "career", "optimizer"],
  authors: [{ name: "NextDraft" }],
  openGraph: {
    title: "NextDraft — AI Resume Optimizer",
    description: "AI-powered, ATS-friendly resume optimization in one click.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextDraft — AI Resume Optimizer",
    description: "AI-powered, ATS-friendly resume optimization in one click.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
              Loading...
            </div>
          }
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
