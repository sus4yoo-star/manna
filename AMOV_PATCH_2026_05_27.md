# MANNA Patch Notes — 2026.05.27

This release covers TWO bundles of work:

## Bundle 1 — Foundation cleanup + AMOV branding (already in v1)

1. `AddToHomePrompt.tsx` dead-code component removed
2. `install-prompt.tsx` `HIDE_KEY` renamed `manna_install_prompt_hidden_until` (so it no longer collides with SELAH on the same browser)
3. viewport `maximumScale: 1, userScalable: false` removed → pinch-zoom restored
4. `Powered by AMOV` footer component across home, install, login, sidebar

## Bundle 2 — Wellbeing UX & accessibility (this round)

### 1. Text size control (A − / A / A +)
- `components/font-size-provider.tsx` — context provider persisted in localStorage (`manna_font_size`)
- `components/chat/font-size-control.tsx` — dropdown with three steps (sm 14px / md 16px / lg 19px)
- Lives in the chat header next to the language switcher
- Scales: user bubbles, assistant section content, "당신에게 건네는 말" body, the typing textarea
- Implemented via CSS variable `--chat-font-size` so layout never breaks

### 2. Crisis-keyword auto-card
- `lib/crisis-detect.ts` — conservative bilingual matcher (자살, 자해, 죽고 싶, suicide, kill myself, self-harm, abuse signals…)
- `components/chat/crisis-card.tsx` — warm amber card above the message stream
- Korean speakers see: **1393 자살예방상담전화**, **1577-0199 정신건강위기상담**, **1388 청소년전화**, **119 응급**
- English / other languages see: **988**, **911**, **findahelpline.com**
- Detection happens client-side at send-time, in addition to (not instead of) the model's response
- Dismissable; hidden again when switching sessions or starting a new chat
- This matches the rose card on `/business` so the messaging is consistent across the app

### 3. "이 글 나누기" share / copy
- `<prayer>` section (renamed "당신에게 건네는 말" in the UI) gets two pill buttons: 이 글 나누기 (Web Share API) + 복사 (clipboard)
- On mobile, taps invoke the native share sheet (KakaoTalk, Messages, etc.)
- Desktop / unsupported browsers gracefully fall back to clipboard copy
- Language stays neutral throughout — no religious framing, consistent with MANNA's faith-agnostic voice

### 4. Session search
- Search input below the "New Chat" button in the sidebar
- Filters chat titles in real time (case-insensitive)
- "검색 결과가 없어요" message when filter has no matches
- Only appears when there's at least one session

### 5. Voice input (Web Speech API)
- Mic button in the chat input bar (only shown if `SpeechRecognition` is supported)
- Locale-aware: maps the UI language to BCP-47 (ko → ko-KR, en → en-US, etc.)
- Interim results stream into the textarea as the user speaks; baseline text preserved
- Tap again to stop; auto-stops on `onend`/error
- Bilingual error messaging via `feature-strings.ts`

## New files
```
src/lib/feature-strings.ts                           Korean + English strings + hotlines
src/lib/crisis-detect.ts                             Bilingual regex matcher
src/components/font-size-provider.tsx                Context + localStorage
src/components/chat/font-size-control.tsx            Header dropdown
src/components/chat/crisis-card.tsx                  Hotline UI
```

## Modified files
```
src/components/chat/chat-app.tsx                     FontSizeProvider, crisis state, dispatcher
src/components/chat/chat-window.tsx                  Header FontSizeControl, CrisisCard slot
src/components/chat/chat-sidebar.tsx                 Search field + filter
src/components/chat/chat-input.tsx                   Mic + listening + responsive textarea
src/components/chat/message-bubble.tsx               Share/copy buttons + font-size variable
```

## Architectural notes

- New feature strings live in `feature-strings.ts`, not the main `i18n.ts`. Reason: backfilling 30 languages every release is unrealistic. The new module ships Korean + English and falls back to English for the other 28 locales. Localizing later is a single-file change.
- Font-size scales chat content only. UI chrome stays fixed so the layout doesn't fight the user's choice.
- Crisis detection is intentionally **conservative** to avoid a surveillance feel. The phrase set focuses on unmistakable distress signals; common Korean verbs like 죽다 are only triggered with a clear intent suffix.
- Hotline copy on the crisis card mirrors the messaging on `/business` so users see consistent resources whether they're reading the legal page or hit a hard moment in chat.

## Pre-deploy checklist

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=                  (optional; default claude-sonnet-4-6)
```

- [ ] Run `npm install && npm run build` and resolve any local typing issues
- [ ] Test mic permission on Galaxy Chrome + iOS Safari
- [ ] Test crisis card with a Korean keyword on a staging session
- [ ] Verify localStorage persistence: change text size, refresh, confirm sticky
- [ ] Confirm that on `manna.amov.kr` the install-prompt no longer interferes with SELAH's dismissal state

## What's NOT in this release

- Multilingual crisis hotlines beyond KR/EN — easy to add country-by-country in `hotlinesFor()`
- Pause-and-resume voice (current implementation is single-turn)
- Server-side crisis logging — intentional. Detection stays client-side for privacy.

---

## 2026.05.27 evening fixes (after first user feedback)

### 1. SSR error recovery
- `src/app/error.tsx` added — root error boundary. Replaces the white
  "Application error" screen with a calm on-brand recovery card.
- `src/app/layout.tsx` cookies() access wrapped in try/catch.

### 2. Font-size now scales the whole chat area
- Welcome heading, description, examples buttons, and the "thinking…"
  indicator all read `var(--chat-font-size)`.
- Steps widened: 14px / 17px / 21px (was 14/16/19).

### 3. Positive emotions in welcome examples
- Removed 화가 나요 / 실패한 것 같아요.
- Added 🥹 감사한 일이 있어요 / ✨ 기쁜 일을 나누고 싶어요.
- English equivalents updated symmetrically.

---

## 2026.05.27 — Round 5 (senior + share + privacy)

### New components
- **Splash** (`src/components/splash.tsx`) — full-screen logo fade replaces the
  white loading flash on first paint. SSR-rendered, inline keyframes so it
  works before any CSS bundle finishes downloading.
- **ViewSettingsProvider** + **ViewSettingsMenu** — bundles font-size (sm/md/lg),
  high-contrast toggle, and TTS auto-speak into one header dropdown.
- **IntroTour** — 3-step guide shown once per device.
- **PinGate** — optional 4-digit privacy lock (FNV-1a hash, sessionStorage).
- **CrossLinkCard** — soft cross-promo from SELAH ↔ MANNA after 3+ chats.
- **PrayerShareActions** rebuilt:
  - Favorite ⭐ (localStorage, sidebar Favorites tab)
  - TTS play/stop + auto-read on assistant arrival
  - "Save as image" → 1080×1080 PNG card (no html2canvas dependency, pure SVG)
  - Web Share (with file when supported → IG Story / KakaoTalk image post)
  - Copy

### New routes
- `/today` — daily verse / one-line reflection card with share button.

### New libraries
- `lib/tts.ts` — Web Speech Synthesis wrapper, 17-language BCP-47 mapping.
- `lib/favorites.ts` — localStorage favorites with 200-entry cap.
- `lib/auto-delete.ts` — never / 30d / 90d preference + threshold helper.
- `lib/share-card.ts` — SVG → PNG card builder, CJK-aware text wrapping.

### Sidebar
- "전체 대화" / "즐겨찾기" tab toggle.
- "이 대화 잊어주세요" menu item (extra confirmation copy).

### High-contrast mode
- `<html data-contrast="high">` triggers overrides in `globals.css`.
- Cream text → pure white, backgrounds → near-black, borders → 35% white.

### Service worker
- Bumped to `selah-shell-v3` / `manna-shell-v3` → forces fresh shell pull.
- Pre-caches `/`, `/today`, manifest, splash logo, app icons.
- Stale-while-revalidate for all GETs except `/api`, `/auth`, supabase, and
  `_next/data`.

### Manifest
- SELAH `background_color`/`theme_color` aligned with layout body color
  (`#07111f`) so the PWA install splash doesn't flash a different navy.

### Deferred (next round)
- PDF journal export (jsPDF dep)
- Mood-over-time chart (recharts dep)
- Kakao SDK deep integration (App Key)
- Push reminders (notification infra)
- Sentry telemetry (env config)
- Rate-limit & model auto-fallback (server-side)
- Anonymous share-count counter (DB schema)
