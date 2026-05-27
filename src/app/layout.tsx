import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { LanguageProvider } from "@/components/language-provider";
import { ServiceWorker } from "@/components/service-worker";
import { InstallPrompt } from "@/components/install-prompt";
import { Splash } from "@/components/splash";
import { normalizeLang, isRTL } from "@/lib/i18n";
import type { LangCode } from "@/lib/types";

export const metadata: Metadata = {
  metadataBase: new URL("https://themanna.netlify.app"),

  title: {
    default: "MANNA — Walk with you, wherever you are",
    template: "%s | MANNA",
  },

  description:
    "당신의 마음 동행 · 힘든 순간, 판단하지 않고 함께 걷겠습니다. 당신은 혼자가 아닙니다.",

  applicationName: "MANNA",
  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    title: "MANNA",
    statusBarStyle: "black-translucent",
  },

  /* Some iOS versions (notably older Safari builds) only honour
   * the literal apple-mobile-web-app-capable / mobile-web-app-capable
   * meta tags. Next.js's metadata API SHOULD emit these from
   * appleWebApp.capable above, but we set them explicitly here too
   * so the standalone display mode is never missed. */
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "MANNA",
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
      "당신의 마음 동행 · 힘든 순간, 판단하지 않고 함께 걷겠습니다. 당신은 혼자가 아닙니다.",
    url: "https://themanna.netlify.app",
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
      "당신의 마음 동행 · 힘든 순간, 판단하지 않고 함께 걷겠습니다. 당신은 혼자가 아닙니다.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#03212a",
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom for accessibility — MANNA must stay reachable for
  // users who rely on the browser zoom (older eyes, motor-impaired users).
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read the language cookie on the server so SSR already renders in the
  // user's chosen language (prevents the English flash for Korean users).
  // Wrapped in try/catch so a misbehaving cookie store can never bring the
  // whole site down with a server-side exception — we just fall back to Korean.
  let initialLang: LangCode = "ko";
  try {
    const cookieStore = await cookies();
    const cookieLang = cookieStore.get("manna_lang")?.value;
    if (cookieLang) initialLang = normalizeLang(cookieLang);
  } catch {
    /* keep the "ko" default */
  }

  return (
    <html
      lang={initialLang}
      dir={isRTL(initialLang) ? "rtl" : "ltr"}
      suppressHydrationWarning
    >
      <body
        className="min-h-dvh antialiased"
        style={{ backgroundColor: "#03212a" }}
      >
        <Splash />
        <LanguageProvider initialLang={initialLang}>
          {children}
          <ServiceWorker />
          <InstallPrompt />
        </LanguageProvider>
      </body>
    </html>
  );
}
