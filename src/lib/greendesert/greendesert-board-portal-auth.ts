import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { GREENDESERT_BOARD_PORTAL_PATH } from "@/lib/greendesert/greendesert-board-portal-data";
import { PLATFORM_SESSION_COOKIE, readPlatformSessionToken } from "@/lib/platform-session-token";

export type GreenDesertBoardPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
};

export async function requireGreenDesertBoardPortalAccess(): Promise<{
  session: GreenDesertBoardPortalSession;
}> {
  const jar = await cookies();
  const token = jar.get(PLATFORM_SESSION_COOKIE)?.value;
  if (!token) {
    redirect("/board/login");
  }

  const session = await readPlatformSessionToken(token);
  if (!session) {
    redirect("/board/login");
  }

  if (session.userType !== "external") {
    redirect("/board/login");
  }

  const allowed = session.redirectPath.replace(/\/$/, "") || "/";
  if (allowed !== `/${GREENDESERT_BOARD_PORTAL_PATH}`) {
    redirect("/board/login");
  }

  return {
    session: {
      userId: session.sub,
      username: session.username,
      displayName: session.displayName,
      userType: session.userType,
      redirectPath: session.redirectPath,
      clientId: null,
    },
  };
}
