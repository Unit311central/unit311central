import { NextRequest, NextResponse } from "next/server";

import { createOpenAIClient } from "@/lib/ai-operating-assistant/openai-client";
import {
  openaiVoiceForGender,
  stripTextForSpeech,
  type ExecutiveVoiceGender,
} from "@/lib/executive-assistant-voice";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_CHARS = 4000;

export async function POST(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: {
    text?: unknown;
    gender?: unknown;
    speed?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = stripTextForSpeech(typeof body.text === "string" ? body.text : "");
  if (!text) {
    return NextResponse.json({ error: "text is required." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: `text exceeds ${MAX_CHARS} characters.` }, { status: 400 });
  }

  const gender: ExecutiveVoiceGender = body.gender === "female" ? "female" : "male";
  const speedRaw = typeof body.speed === "number" ? body.speed : 1;
  const speed = Math.min(1.5, Math.max(0.75, speedRaw));
  const voice = openaiVoiceForGender(gender);

  try {
    const client = createOpenAIClient();
    const speech = await client.audio.speech.create({
      model: "tts-1",
      voice,
      input: text,
      speed,
      response_format: "mp3",
    });

    const arrayBuffer = await speech.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-Voice": voice,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TTS failed";
    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
