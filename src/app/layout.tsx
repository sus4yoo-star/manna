import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { ServiceWorker } from "@/components/service-worker";
import { InstallPrompt } from "@/components/install-prompt";

export const metadata: Metadata = {
  metadataBase: new URL("https://amov-manna.netlify.app"),

  title: {
    default: "MANNA — Walk with you, wherever you are",
    template: "%s | MANNA",
  },

  description:
    "종교와 배경에 상관없이, 힘든 순간 판단 없이 함께 걷는 마음 동행. 당신은 혼자가 아닙니다.",

  applicationName: "MANNA",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "MANNA",
    statusBarStyle: "black-translucent",
  },

  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },

  openGraph: {
    title: "MANNA — Walk with you, wherever you are",
    description:
      "종교와 배경에 상관없이, 힘든 순간 판단 없이 함께 걷는 마음 동행. 당신은 혼자가 아닙니다.",
    url: "https://amov-manna.netlify.app",
    siteName: "MANNA",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MANNA",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "MANNA — Walk with you, wherever you are",
    description:
      "종교와 배경에 상관없이, 힘든 순간 판단 없이 함께 걷는 마음 동행. 당신은 혼자가 아닙니다.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#03212a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <LanguageProvider>
          {children}
          <ServiceWorker />
          <InstallPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
