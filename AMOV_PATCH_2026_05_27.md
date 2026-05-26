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
