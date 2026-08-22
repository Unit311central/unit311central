import { BUSINESS_CENTRAL_CLIENTS_TUTORIAL } from "@/lib/guided-tutorials/content/business-central-clients";
import { BUSINESS_CENTRAL_PIPELINE_TUTORIAL } from "@/lib/guided-tutorials/content/business-central-pipeline";
import { EXECUTIVE_ASSISTANT_TUTORIAL } from "@/lib/guided-tutorials/content/executive-assistant";
import { FINANCIALS_ACCOUNTS_RECEIVABLE_TUTORIAL } from "@/lib/guided-tutorials/content/financials-accounts-receivable";
import { FINANCIALS_JOURNAL_TUTORIAL } from "@/lib/guided-tutorials/content/financials-journal";
import { FINANCIALS_WISE_TUTORIAL } from "@/lib/guided-tutorials/content/financials-wise";
import { HOME_TUTORIAL } from "@/lib/guided-tutorials/content/home";
import { INTELLIGENCE_COMPETITOR_TUTORIAL } from "@/lib/guided-tutorials/content/intelligence-competitor-intelligence";
import { SALES_MANAGEMENT_DASHBOARD_TUTORIAL } from "@/lib/guided-tutorials/content/sales-management-dashboard";
import { SALES_MANAGEMENT_PIPELINE_TUTORIAL } from "@/lib/guided-tutorials/content/sales-management-pipeline";
import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** Wave 1 newly authored central tutorials (8). Pre-existing reference tutorials register separately. */
export const WAVE_1_TUTORIAL_DEFINITIONS: readonly TutorialDefinition[] = [
  HOME_TUTORIAL,
  EXECUTIVE_ASSISTANT_TUTORIAL,
  BUSINESS_CENTRAL_CLIENTS_TUTORIAL,
  BUSINESS_CENTRAL_PIPELINE_TUTORIAL,
  SALES_MANAGEMENT_DASHBOARD_TUTORIAL,
  SALES_MANAGEMENT_PIPELINE_TUTORIAL,
  INTELLIGENCE_COMPETITOR_TUTORIAL,
  FINANCIALS_JOURNAL_TUTORIAL,
  FINANCIALS_ACCOUNTS_RECEIVABLE_TUTORIAL,
  FINANCIALS_WISE_TUTORIAL,
] as const;
