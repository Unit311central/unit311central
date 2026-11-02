import { proxyWolfTestGroundHls } from "@/lib/wolf/live-stream-handler";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return proxyWolfTestGroundHls(request, path);
}
