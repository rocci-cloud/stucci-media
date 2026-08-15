import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../lib/require-admin";

/**
 * AI assist endpoint for the article editor.
 *
 * Provider-agnostic on purpose: the editor posts a task plus the text it
 * wants worked on, and this route dispatches to whichever provider is
 * configured by env var. Nothing here is hardcoded to one vendor, so
 * switching is a config change, not a code change.
 *
 * If no provider is configured it returns a 501 with a clear message
 * rather than silently doing nothing or faking a result — the editor
 * surfaces that as "AI assist isn't connected yet", which is the honest
 * state of this feature until a key is added.
 */

export const runtime = "nodejs";

type AiTask = "titles" | "clarity" | "expand" | "summarize" | "internal-links" | "tone-check";

const TASK_PROMPTS: Record<AiTask, string> = {
  titles:
    "Write 5 alternative headlines for this article. Direct and specific, no clickbait, no colons-and-subtitle constructions. One per line, nothing else.",
  clarity:
    "Rewrite this passage for clarity. Keep the author's voice, keep every fact, keep roughly the same length. Return only the rewritten text.",
  expand:
    "Expand this passage with more depth and specificity. Do not invent facts, statistics, quotes, names, or dates — only develop what is already stated. Return only the expanded text.",
  summarize:
    "Summarize this article as 3 short bullet points answering 'why this matters'. One per line, no bullet characters, no preamble.",
  "internal-links":
    "Identify 3-6 phrases in this text that would make good internal links to related coverage, and say what each should link to. One per line as 'phrase — what to link to'.",
  "tone-check":
    "Review this text for tone problems: hedging, corporate filler, passive voice, unsupported claims stated as fact, and anything that reads as editorializing inside straight reporting. List each issue on its own line with the offending phrase quoted. If there are none, say so in one line.",
};

const SYSTEM_PROMPT =
  "You are an editing assistant for Stucci Media, an independent news site covering politics, veterans, investigations, free speech, and current events. The house voice is direct, plain, and professional — no corporate filler, no hype, no hedging. Never invent facts, quotes, sources, statistics, or dates. Return only the requested output with no preamble or commentary.";

type ProviderResult = { text: string } | { error: string; status: number };

async function callAnthropic(prompt: string, text: string): Promise<ProviderResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `${prompt}\n\n---\n\n${text}` }],
    }),
  });

  if (!response.ok) {
    return { error: `The AI provider returned ${response.status}.`, status: 502 };
  }
  const data = (await response.json()) as { content?: { type: string; text?: string }[] };
  const out = (data.content ?? [])
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();
  return out ? { text: out } : { error: "The AI provider returned an empty response.", status: 502 };
}

/**
 * OpenAI and xAI (Grok) both speak the OpenAI chat-completions shape, so
 * one function covers both — only the base URL and key differ.
 */
async function callOpenAiCompatible(
  baseUrl: string,
  apiKey: string,
  defaultModel: string,
  prompt: string,
  text: string
): Promise<ProviderResult> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || defaultModel,
      max_tokens: 1500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `${prompt}\n\n---\n\n${text}` },
      ],
    }),
  });

  if (!response.ok) {
    return { error: `The AI provider returned ${response.status}.`, status: 502 };
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const out = data.choices?.[0]?.message?.content?.trim();
  return out ? { text: out } : { error: "The AI provider returned an empty response.", status: 502 };
}

function dispatch(prompt: string, text: string): Promise<ProviderResult> | null {
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(prompt, text);
  if (process.env.OPENAI_API_KEY) {
    return callOpenAiCompatible("https://api.openai.com/v1", process.env.OPENAI_API_KEY, "gpt-4o", prompt, text);
  }
  if (process.env.XAI_API_KEY) {
    return callOpenAiCompatible("https://api.x.ai/v1", process.env.XAI_API_KEY, "grok-2-latest", prompt, text);
  }
  return null;
}

const MAX_INPUT_CHARS = 20000;

export async function POST(request: Request) {
  const session = await requireStaffSession();
  if (!session) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  let body: { task?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const task = body.task as AiTask | undefined;
  const text = (body.text ?? "").trim();

  if (!task || !(task in TASK_PROMPTS)) {
    return NextResponse.json({ error: "Unknown task." }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ error: "There's nothing to work on yet — write something first." }, { status: 400 });
  }

  const pending = dispatch(TASK_PROMPTS[task], text.slice(0, MAX_INPUT_CHARS));
  if (!pending) {
    return NextResponse.json(
      {
        error:
          "AI assist isn't connected yet. Add ANTHROPIC_API_KEY, OPENAI_API_KEY, or XAI_API_KEY to this project's environment variables to turn it on.",
      },
      { status: 501 }
    );
  }

  try {
    const result = await pending;
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ text: result.text });
  } catch {
    return NextResponse.json({ error: "Couldn't reach the AI provider." }, { status: 502 });
  }
}
