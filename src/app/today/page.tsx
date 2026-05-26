"use client";

import * as React from "react";
import Link from "next/link";
import { Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmovFooter } from "@/components/amov-footer";
import { LanguageSelector } from "@/components/language-selector";
import { useLanguage } from "@/components/language-provider";
import { getFeatureStrings } from "@/lib/feature-strings";

/**
 * "오늘의 한 마디" — a daily reflection card for MANNA.
 *
 * Faith-neutral on purpose: a short truth-tinted sentence + a tiny note.
 * Deterministic by day so the same calendar day shows the same card.
 */
const KO_BANK: { line: string; note: string }[] = [
  {
    line: "오늘 가장 작은 친절은, 자기 자신에게 한 번 부드러워지는 일입니다.",
    note: "잘 해내야 할 것 같은 마음을 잠시 내려놓아도 괜찮아요.",
  },
  {
    line: "지금 흔들리고 있다면, 그건 당신이 멈추지 않고 계속 걷고 있다는 증거입니다.",
    note: "흔들림은 약함이 아니라, 길 위에 있다는 신호예요.",
  },
  {
    line: "당신이 다 알아내지 못해도, 다음 한 걸음은 분명히 존재합니다.",
    note: "전부 보지 못해도, 바로 앞은 보입니다.",
  },
  {
    line: "감정은 사실이 아니지만, 진짜입니다. 두 가지를 동시에 인정해도 됩니다.",
    note: "느낀다고 다 행동할 필요는 없어요. 그저 인정해 주는 것만으로 가벼워집니다.",
  },
  {
    line: "사랑하는 사람이 같은 처지였다면, 당신은 그에게 무엇이라 말해줬을까요.",
    note: "그 말을 오늘 자신에게도 들려주세요.",
  },
  {
    line: "쉼은 게으름이 아니라, 다시 살아갈 힘을 만드는 일입니다.",
    note: "오늘 5분이라도 일에서 손을 떼는 시간을 자신에게 허락해 보세요.",
  },
  {
    line: "당신이 누구인지는, 가장 어두운 날이 결정하지 않습니다.",
    note: "오늘 하루는 하루일 뿐. 당신의 전부가 아닙니다.",
  },
];

function todayIndex(bankLen: number): number {
  const days = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return ((days % bankLen) + bankLen) % bankLen;
}

export default function TodayPage() {
  const { lang } = useLanguage();
  const fs = getFeatureStrings(lang);
  const [busyShare, setBusyShare] = React.useState(false);

  const entry = React.useMemo(() => KO_BANK[todayIndex(KO_BANK.length)], []);
  const shareText = `${entry.line}\n\n${entry.note}\n\nmanna.amov.kr`;

  const onShare = async () => {
    setBusyShare(true);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ text: shareText });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
    } catch {
      /* user cancelled */
    } finally {
      setBusyShare(false);
    }
  };

  return (
    <main className="selah-aurora selah-scroll flex min-h-dvh flex-col items-center overflow-y-auto px-6 pb-12 pt-[max(48px,calc(env(safe-area-inset-top)+24px))]">
      <div className="absolute right-5 top-[max(20px,env(safe-area-inset-top))]">
        <LanguageSelector compact />
      </div>

      <div className="flex w-full max-w-md flex-col items-center">
        <div className="relative mb-5 flex h-20 w-28 items-center justify-center animate-fade-in">
          <img
            src="/symbol-transparent.png"
            alt=""
            className="relative h-20 w-28 object-contain drop-shadow-[0_0_22px_rgba(212,175,55,0.38)]"
          />
        </div>

        <p className="mb-1 text-center text-[12px] tracking-[0.18em] text-selah-cream3 animate-rise" style={{ animationDelay: "0.08s" }}>
          {fs.todayTitle}
        </p>
        <p className="mb-7 text-center text-[13px] text-selah-cream3 animate-rise" style={{ animationDelay: "0.12s" }}>
          {fs.todaySubtitle}
        </p>

        <blockquote
          className="mb-5 w-full rounded-2xl border border-selah-gold/15 bg-selah-gold/[0.04] px-6 py-6 text-left animate-rise"
          style={{ animationDelay: "0.18s" }}
        >
          <p className="font-serif text-[18px] italic leading-relaxed text-selah-cream/95">
            “{entry.line}”
          </p>
        </blockquote>

        <p className="mb-8 text-center text-[15px] leading-relaxed text-selah-cream2 animate-rise" style={{ animationDelay: "0.26s" }}>
          {entry.note}
        </p>

        <button
          type="button"
          onClick={onShare}
          disabled={busyShare}
          className="mb-3 inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-selah-gold/30 px-5 py-3 text-[14px] font-medium text-selah-gold transition hover:bg-selah-gold/[0.08] active:scale-[0.98] animate-rise"
          style={{ animationDelay: "0.32s" }}
        >
          <Share2 className="h-4 w-4" />
          {fs.todayShare}
        </button>

        <Button asChild size="lg" className="w-full max-w-xs animate-rise" style={{ animationDelay: "0.36s" }}>
          <Link href="/chat">
            {fs.todayOpenApp}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <AmovFooter />
      </div>
    </main>
  );
}
