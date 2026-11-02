import { proxyWhepDelete, proxyWhepPost } from "@/lib/wolf/whep-proxy";
import { resolveSkyWhepUrl } from "@/lib/wolf/webrtc-playback";

export const dynamic = "force-dynamic";

function target() {
  return resolveSkyWhepUrl(process.env.WOLF_SKY_WHEP_URL);
}

export function POST(request: Request) {
  return proxyWhepPost(request, target);
}

export function DELETE(request: Request) {
  return proxyWhepDelete(request, target);
}
