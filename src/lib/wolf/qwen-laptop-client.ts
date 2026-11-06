import {
  parseQwenLaptopOverlay,
  qwenLaptopPrompt,
  type QwenLaptopAnswer,
} from "@/lib/wolf/qwen-laptop-overlay";

const EMPTY = { laptop: false, label: null, box: null } as const;

export function qwenOverlayConfig(): { apiKey: string; baseUrl: string; model: string } | null {
  const apiKey = process.env.QWEN_API_KEY?.trim() || process.env.WOLF_QWEN_API_KEY?.trim() || "";
  if (!apiKey) return null;
  const baseUrl = (
    process.env.QWEN_BASE_URL?.trim() || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  ).replace(/\/$/, "");
  const model = process.env.QWEN_VISION_MODEL?.trim() || "qwen-vl-plus";
  return { apiKey, baseUrl, model };
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
      return "";
    })
    .join("\n");
}

export async function askQwenAboutLaptop(
  jpeg: Uint8Array,
  fetchImpl: typeof fetch = fetch,
): Promise<QwenLaptopAnswer> {
  const config = qwenOverlayConfig();
  if (!config) {
    return {
      ...EMPTY,
      configured: false,
      error: "Qwen is not configured. Set QWEN_API_KEY on the server.",
    };
  }
  let response: Response;
  try {
    response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${Buffer.from(jpeg).toString("base64")}` },
              },
              { type: "text", text: qwenLaptopPrompt() },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ...EMPTY, configured: true, error: "Qwen could not read this frame." };
  }
  const payload = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  } | null;
  if (!response.ok || !payload) {
    return { ...EMPTY, configured: true, error: "Qwen could not read this frame." };
  }
  const text = messageText(payload.choices?.[0]?.message?.content);
  if (!text) return { ...EMPTY, configured: true, error: "Qwen could not read this frame." };
  return { ...parseQwenLaptopOverlay(text), configured: true, error: null };
}
