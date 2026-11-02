"use client";

import WolfGroundWebRtcWorkspace from "@/components/wolf/WolfGroundWebRtcWorkspace";
import { WOLF_SKY_RTMP_URL, WOLF_SKY_WEBRTC_PATH } from "@/lib/wolf/webrtc-playback";

export default function WolfSkyWorkspace() {
  return (
    <WolfGroundWebRtcWorkspace
      title="WOLF Sky"
      eyebrow="WOLF Sky"
      description="Live RGB from the DJI Neo. Paste the RTMP address into DJI Fly, then start the stream."
      signallingPath={WOLF_SKY_WEBRTC_PATH}
      publishUrl={WOLF_SKY_RTMP_URL}
      lowDelay
      idleDetail="Waiting for the DJI Neo on live/sky. This page plays WebRTC only."
    />
  );
}
