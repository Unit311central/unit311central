/**
 * Plain-language WHEP failures. Upstream HTML error pages stay off the player.
 */

export function describeWhepUpstreamBody(status: number, body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "Empty response.";
  if (isHtmlErrorPage(flat)) {
    if (
      status === 502 ||
      status === 503 ||
      status === 504 ||
      /waiting for service to respond/i.test(flat)
    ) {
      return "The live camera service is not responding.";
    }
    return "The live camera service returned a page instead of a video answer.";
  }
  return flat.slice(0, 180);
}

export function signallingFailureDetail(
  failure: { error?: string; upstreamStatus?: number; detail?: string } | null,
): string {
  const detail = failure?.detail ?? "";
  if (failure?.upstreamStatus === 404 || /no stream is available/i.test(detail)) {
    return "Brix is not on the air for stream key test. In Brix, start RTMP to rtmp://38.80.152.147:39908/live with key test. When Brix shows it is live, tap Reconnect here. WOLF can stay open in split screen or switch back from Brix.";
  }
  if (
    isHtmlErrorPage(detail) ||
    /live camera service is not responding|returned a page instead of a video answer/i.test(detail)
  ) {
    return "The live camera is not responding. Tap Reconnect.";
  }
  const upstream =
    typeof failure?.upstreamStatus === "number" ? ` Upstream HTTP ${failure.upstreamStatus}.` : "";
  return `${failure?.error ?? "WHEP did not return an SDP answer."}${upstream} ${detail}`.trim();
}

function isHtmlErrorPage(value: string): boolean {
  return /<!doctype|<html[\s>]|waiting for service to respond/i.test(value);
}
