import { BOARD_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/board-dashboard";
import { BUSINESS_PRODUCTIVITY_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/business-productivity-dashboard";
import { CORPORATE_INFORMATION_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/corporate-information-dashboard";
import { FUNDRAISING_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/fundraising-dashboard";
import { HUMAN_RESOURCES_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/human-resources-dashboard";
import { MARKETING_EVENTS_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/marketing-events-dashboard";
import { OPERATIONS_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/operations-dashboard";
import { SETTINGS_GENERAL_TUTORIAL } from "@/lib/guided-tutorials/content/settings-general";
import { SUPPORT_DESK_TICKETS_TUTORIAL } from "@/lib/guided-tutorials/content/support-desk-tickets";
import { TECHNOLOGY_MANAGEMENT_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/technology-management-dashboard";
import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** Wave 2 newly authored central tutorials — P1 module entry points. */
export const WAVE_2_TUTORIAL_DEFINITIONS: readonly TutorialDefinition[] = [
  FUNDRAISING_DASHBOARD_TUTORIAL,
  BOARD_DASHBOARD_TUTORIAL,
  CORPORATE_INFORMATION_DASHBOARD_TUTORIAL,
  OPERATIONS_DASHBOARD_TUTORIAL,
  MARKETING_EVENTS_DASHBOARD_TUTORIAL,
  TECHNOLOGY_MANAGEMENT_DASHBOARD_TUTORIAL,
  HUMAN_RESOURCES_DASHBOARD_TUTORIAL,
  BUSINESS_PRODUCTIVITY_DASHBOARD_TUTORIAL,
  SUPPORT_DESK_TICKETS_TUTORIAL,
  SETTINGS_GENERAL_TUTORIAL,
] as const;
