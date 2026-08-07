/** Full-screen hi-res backdrop for Talanton workspace login + password reset. */
export const TALANTON_LOGIN_BACKGROUND = "/images/workspaces/talanton-portfolio-login-bg.png";

/** Full-bleed cover — production-line photo reads clearly behind the login card. */
export const TALANTON_LOGIN_BACKGROUND_CLASS =
  "object-cover object-center opacity-[0.58] sm:opacity-[0.62]";

/** Green-tinted fade — lighter so workers and products stay visible. */
export const TALANTON_LOGIN_OVERLAY_CLASS =
  "absolute inset-0 bg-gradient-to-b from-[#041410]/58 via-[#061a14]/68 to-[#020617]/82";

export const TALANTON_LOGIN_BACKGROUND_QUALITY = 95;

export {
  BOARD_PORTAL_LOGIN_BACKGROUND as TALANTON_BOARD_LOGIN_BACKGROUND,
  BOARD_PORTAL_LOGIN_BACKGROUND_CLASS as TALANTON_BOARD_LOGIN_BACKGROUND_CLASS,
  BOARD_PORTAL_LOGIN_OVERLAY_CLASS as TALANTON_BOARD_LOGIN_OVERLAY_CLASS,
} from "@/lib/board-portal-login-branding";
