/** Full-screen hi-res backdrop for Talanton workspace login + password reset. */
export const TALANTON_LOGIN_BACKGROUND = "/images/workspaces/talanton-portfolio-login-bg.png";

/** Full-bleed cover — production-line photo reads clearly behind the login card. */
export const TALANTON_LOGIN_BACKGROUND_CLASS =
  "object-cover object-center opacity-[0.58] sm:opacity-[0.62]";

/** Green-tinted fade — lighter so workers and products stay visible. */
export const TALANTON_LOGIN_OVERLAY_CLASS =
  "absolute inset-0 bg-gradient-to-b from-[#041410]/58 via-[#061a14]/68 to-[#020617]/82";

export const TALANTON_LOGIN_BACKGROUND_QUALITY = 95;

/** Full-screen backdrop for Talanton /portals/login (Overview Portal entry). */
export const TALANTON_PORTALS_LOGIN_BACKGROUND = "/images/workspaces/talanton-portals-login-bg.png";

/** Laptop + holographic UI — keep detail visible behind the login card. */
export const TALANTON_PORTALS_LOGIN_BACKGROUND_CLASS =
  "object-cover object-[center_42%] opacity-[0.64] sm:object-[center_40%] sm:opacity-[0.68]";

/** Navy-green fade — enough contrast for form text without hiding the scene. */
export const TALANTON_PORTALS_LOGIN_OVERLAY_CLASS =
  "absolute inset-0 bg-gradient-to-b from-[#020617]/48 via-[#041410]/58 to-[#020617]/78";

export {
  BOARD_PORTAL_LOGIN_BACKGROUND as TALANTON_BOARD_LOGIN_BACKGROUND,
  BOARD_PORTAL_LOGIN_BACKGROUND_CLASS as TALANTON_BOARD_LOGIN_BACKGROUND_CLASS,
  BOARD_PORTAL_LOGIN_OVERLAY_CLASS as TALANTON_BOARD_LOGIN_OVERLAY_CLASS,
} from "@/lib/board-portal-login-branding";
