import type { Metadata, Viewport } from "next";
import { Source_Sans_3, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const sans = Source_Sans_3({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const mono = Source_Code_Pro({
  variable: "--font-app-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MergePDF: merge, split and reorder PDF pages",
  description:
    "Drop in one or more PDFs, drag the page thumbnails into the order you want, rotate or delete what you do not need, and save one file back out.",
  authors: [{ name: "Jeffrey Hamilton" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MergePDF",
    description:
      "Merge, split, rotate and reorder PDF pages in the browser.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MergePDF",
    description:
      "Merge, split, rotate and reorder PDF pages in the browser.",
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
        className={`${sans.variable} ${mono.variable} antialiased bg-background text-foreground`}
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
