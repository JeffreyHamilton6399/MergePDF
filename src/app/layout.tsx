import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MergePDF — Merge, split & rearrange PDFs privately in your browser",
  description:
    "Merge, split, rotate, and rearrange PDF pages entirely in your browser. Drop multiple PDFs, drag page thumbnails to reorder, merge into one file. No uploads, no sign-up, no ads. Your documents never leave your device.",
  keywords: [
    "merge PDF",
    "split PDF",
    "rotate PDF",
    "rearrange PDF pages",
    "PDF editor",
    "private PDF",
    "client-side PDF",
  ],
  authors: [{ name: "Jeffrey Hamilton" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MergePDF — Private in-browser PDF tools",
    description:
      "Merge, split, rotate, and rearrange PDF pages entirely in your browser. No uploads, no sign-up, no ads.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MergePDF — Private in-browser PDF tools",
    description:
      "Merge, split, rotate, and rearrange PDF pages entirely in your browser. No uploads, no sign-up, no ads.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
