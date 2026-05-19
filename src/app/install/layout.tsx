import type { Metadata } from "next";

const TITLE = "MANNA를 앱처럼 사용하세요";
const DESC =
  "당신의 마음 동행 · 홈 화면에 추가하면 앱처럼 한 번에 열 수 있어요. 설치는 필요 없습니다.";
const URL = "https://themanna.netlify.app/install";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE,
    description: DESC,
    url: URL,
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
    title: TITLE,
    description: DESC,
    images: ["/og-image.png"],
  },
};

export default function InstallLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
