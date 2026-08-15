import {
  getAbhiBoardInsightsTool,
  getAbhiExecutiveBriefingTool,
  getAbhiOrgHealthTool,
  queryAbhiActionsTool,
} from "@/lib/ai-operating-assistant/abhi-executive-tools";
import {
  generateAbhiPlatformAccessPdfTool,
  generateAbhiProjectHealthPdfTool,
  generateAbhiQuarterlyFinancialDeltaPdfTool,
  generateAbhiRegulatoryImpactPdfTool,
  queryAbhiProjectPortfolioTool,
} from "@/lib/abhi/ea-pdf-tools";

import type { EaPackToolHandler } from "../handlers-registry";

export const abhiPackToolHandlers: Record<string, EaPackToolHandler> = {
  "abhi.getExecutiveBriefing": getAbhiExecutiveBriefingTool,
  "abhi.getOrgHealth": getAbhiOrgHealthTool,
  "abhi.queryActions": queryAbhiActionsTool,
  "abhi.getBoardInsights": getAbhiBoardInsightsTool,
  "abhi.generateRegulatoryImpactPdf": generateAbhiRegulatoryImpactPdfTool,
  "abhi.generateQuarterlyFinancialDeltaPdf": generateAbhiQuarterlyFinancialDeltaPdfTool,
  "abhi.generateProjectHealthPdf": generateAbhiProjectHealthPdfTool,
  "abhi.queryProjectPortfolio": queryAbhiProjectPortfolioTool,
  "abhi.generatePlatformAccessPdf": generateAbhiPlatformAccessPdfTool,
};
