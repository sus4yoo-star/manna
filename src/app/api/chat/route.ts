import { NextRequest } from "next/server";
import { buildSystemPrompt, classifyIntent } from "@/lib/prompt";
import { normalizeLang, detectLangFromText } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { loadUserMemory, updateUserMemory } from "@/lib/selah-memory";
import type { LangCode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InMsg {
  role: "user" | "assistant";
  content: string;
}

interface Body {
  messages: InMsg[];
  lang?: string;
  bibleMode?: boolean;
  /** Optional data-URL of an image attached to the latest user turn. */
  image?: string;
  /** Current chat session id, used for future memory features. */
  sessionId?: string | null;
}

function lastUserText(messages: InMsg[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content || "";
  }
  return "";
}

export async function POST(req: NextRequest) {
  // Only signed-in users may reach the model — protects the API key.
  let supabase: any;
  let userId = "";
  try {
    supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Please sign in to continue." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    userId = user.id;
  } catch {
    return new Response(
      JSON.stringify({ error: "Authentication check failed." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "OPENAI_API_KEY is not configured. Add it in your environment variables.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  if (messages.length === 0) {
    return new Response("No messages", { status: 400 });
  }

  const userText = lastUserText(messages);
  // Prefer the explicit UI language, but respect the language actually
  // written if it clearly differs.
  const uiLang = normalizeLang(body.lang);
  const detected = detectLangFromText(userText);
  const lang: LangCode = (detected || uiLang) as LangCode;

  const image =
    typeof body.image === "string" && body.image.startsWith("data:image/")
      ? body.image
      : "";
  const hasImage = Boolean(image);

  const bibleMode = Boolean(body.bibleMode);
  let intent = classifyIntent(userText);
  // A screenshot (often a KakaoTalk/messenger conversation) without a
  // clear Bible/general request is almost always an emotional situation.
  if (hasImage && intent === "general") intent = "emotional";
  const memory = await loadUserMemory(supabase, userId);
  const system = buildSystemPrompt({ lang, bibleMode, intent, hasImage, memory });

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Build the upstream messages. The latest user turn carries the image
  // as a vision content block when present.
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      lastUserIdx = i;
      break;
    }
  }
  const chatMessages = messages.map((m, i) => {
    if (hasImage && i === lastUserIdx) {
      return {
        role: m.role,
        content: [
          {
            type: "text",
            text:
              String(m.content || "") ||
              "Please look at the attached image and respond.",
          },
          { type: "image_url", image_url: { url: image, detail: "auto" } },
        ],
      };
    }
    return { role: m.role, content: String(m.content || "") };
  });

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.85,
      top_p: 0.95,
      presence_penalty: 0.4,
      frequency_penalty: 0.35,
      max_tokens: 1500,
      messages: [
        { role: "system", content: system },
        ...chatMessages,
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    let detail = "";
    try {
      const j = await upstream.json();
      detail = j?.error?.message || "";
    } catch {
      /* ignore */
    }
    const status = upstream.status === 401 ? 401 : 502;
    return new Response(
      JSON.stringify({
        error:
          status === 401
            ? "OpenAI authentication failed (401). Check OPENAI_API_KEY."
            : `OpenAI request failed${detail ? `: ${detail}` : "."}`,
      }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Transform OpenAI's SSE stream into a clean text stream of content
  // deltas. The client renders the typing animation and parses the
  // structured XML once complete.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";
      let assistantText = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") {
              await updateUserMemory({
                supabase,
                userId,
                apiKey,
                model,
                lang,
                previousMemory: memory,
                userText,
                assistantText,
              });
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (delta) {
                assistantText += delta;
                controller.enqueue(encoder.encode(delta));
              }
            } catch {
              /* skip malformed chunk */
            }
          }
        }
      } catch {
        /* upstream closed */
      } finally {
        if (assistantText.trim()) {
          await updateUserMemory({
            supabase,
            userId,
            apiKey,
            model,
            lang,
            previousMemory: memory,
            userText,
            assistantText,
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Manna-Intent": intent,
      "X-Manna-Lang": lang,
    },
  });
}
