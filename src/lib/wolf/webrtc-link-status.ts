/** Playback labels for the shared WOLF Ground WebRTC player. */

export type WolfWebRtcConnectionStatus =
  | "idle"
  | "gathering"
  | "signalling"
  | "connecting"
  | "connected"
  | "failed";

export type WolfWebRtcStreamStatus = "waiting" | "receiving" | "failed";

/** LIVE is only for a session that has decoded video frames. */
export type WolfGroundWebRtcLinkStatus = "connecting" | "live" | "offline" | "failed";

export function wolfGroundWebRtcLinkStatus(
  connection: WolfWebRtcConnectionStatus,
  stream: WolfWebRtcStreamStatus,
  detail: string,
): WolfGroundWebRtcLinkStatus {
  if (stream === "receiving") return "live";
  if (connection === "failed" || stream === "failed") {
    if (/no stream is available|not on the air|stream key test/i.test(detail)) return "offline";
    return "failed";
  }
  return "connecting";
}

export function wolfGroundWebRtcLinkLabel(status: WolfGroundWebRtcLinkStatus): string {
  switch (status) {
    case "connecting":
      return "CONNECTING";
    case "live":
      return "LIVE";
    case "offline":
      return "OFFLINE";
    case "failed":
      return "CONNECTION FAILED";
  }
}
