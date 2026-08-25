import type { IntelligenceRecord } from "@/lib/intelligence/types";
import { SAEC_SLUG } from "@/lib/saec-surface";

const SLUG = SAEC_SLUG;

export function saecCompanyIntelligenceRecords(): IntelligenceRecord[] {
  return [
    {
      id: "saec-ci-market-growth",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Gauteng commercial lift demand",
      summary: "New retail and hospital projects driving 8% YoY installation enquiries in Gauteng.",
      severity: "medium",
      categories: [{ id: "market", label: "Market" }],
      tags: [{ id: "gauteng", label: "Gauteng" }],
      entityRefs: [],
    },
    {
      id: "saec-ci-maintenance",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Maintenance contract retention",
      summary: "Portfolio SLA renewals at 94% · two shopping-centre contracts up for Q4 negotiation.",
      severity: "low",
      categories: [{ id: "operations", label: "Operations" }],
      tags: [{ id: "maintenance", label: "Maintenance" }],
      entityRefs: [],
    },
    {
      id: "saec-ci-modernisation",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Modernisation pipeline",
      summary: "R 18.2M qualified modernisation backlog across three Gauteng assets.",
      severity: "medium",
      categories: [{ id: "projects", label: "Projects" }],
      tags: [{ id: "modernisation", label: "Modernisation" }],
      entityRefs: [],
    },
    {
      id: "saec-ci-safety",
      workspaceSlug: SLUG,
      domainId: "company-intelligence",
      title: "Safety performance",
      summary: "Zero lost-time incidents in trailing 12 months · QMS audit scheduled Sep 2026.",
      severity: "low",
      categories: [{ id: "qms", label: "QMS" }],
      tags: [{ id: "safety", label: "Safety" }],
      entityRefs: [],
    },
  ];
}

export function saecClientIntelligenceRecords(): IntelligenceRecord[] {
  return [
    {
      id: "saec-cli-growthpoint",
      workspaceSlug: SLUG,
      domainId: "client-intelligence",
      title: "Growthpoint Properties",
      summary: "Active maintenance SLA · Ponte City modernisation in engineering design phase.",
      severity: "low",
      score: { value: 88, band: "healthy", label: "Healthy" },
      categories: [{ id: "property", label: "Property owner" }],
      tags: [{ id: "sla", label: "Maintenance SLA" }],
      entityRefs: [{ entityType: "client", entityId: "growthpoint", label: "Growthpoint Properties" }],
    },
    {
      id: "saec-cli-hyprop",
      workspaceSlug: SLUG,
      domainId: "client-intelligence",
      title: "Hyprop Investments",
      summary: "Centurion Mall KLK installation progressing · commissioning target Nov 2026.",
      severity: "medium",
      score: { value: 82, band: "healthy", label: "On track" },
      categories: [{ id: "retail", label: "Shopping centre" }],
      tags: [{ id: "installation", label: "Installation" }],
      entityRefs: [{ entityType: "client", entityId: "hyprop", label: "Hyprop Investments" }],
    },
    {
      id: "saec-cli-va",
      workspaceSlug: SLUG,
      domainId: "client-intelligence",
      title: "V&A Waterfront",
      summary: "Escalator replacement programme · Western Cape service team allocated.",
      severity: "medium",
      score: { value: 79, band: "watch", label: "Watch" },
      categories: [{ id: "retail", label: "Mixed-use" }],
      tags: [{ id: "escalator", label: "Escalator" }],
      entityRefs: [{ entityType: "client", entityId: "va-waterfront", label: "V&A Waterfront" }],
    },
    {
      id: "saec-cli-hospital",
      workspaceSlug: SLUG,
      domainId: "client-intelligence",
      title: "Netcare hospital cluster",
      summary: "Preventive maintenance contract · two emergency call-outs resolved within SLA this month.",
      severity: "low",
      score: { value: 91, band: "healthy", label: "Healthy" },
      categories: [{ id: "healthcare", label: "Healthcare" }],
      tags: [{ id: "service", label: "Service" }],
      entityRefs: [{ entityType: "client", entityId: "netcare", label: "Netcare" }],
    },
  ];
}

export function saecMarketIntelligenceRecords(): IntelligenceRecord[] {
  return [
    {
      id: "saec-mi-competition",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "Competitive landscape",
      summary: "Otis and KONE maintaining national service footprint · mid-market installers competing on modernisation pricing.",
      severity: "medium",
      categories: [{ id: "competition", label: "Competition" }],
      tags: [{ id: "competitors", label: "Competitors" }],
      entityRefs: [],
    },
    {
      id: "saec-mi-regulation",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "SANS 10400 lift compliance",
      summary: "Updated inspection requirements for public buildings — training rollout for field engineers Aug 2026.",
      severity: "high",
      categories: [{ id: "regulatory", label: "Regulatory" }],
      tags: [{ id: "compliance", label: "Compliance" }],
      entityRefs: [],
    },
    {
      id: "saec-mi-construction",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "Construction pipeline",
      summary: "Sandton and Umhlanga mixed-use towers entering lift specification phase Q3–Q4 2026.",
      severity: "medium",
      categories: [{ id: "construction", label: "Construction" }],
      tags: [{ id: "pipeline", label: "Pipeline" }],
      entityRefs: [],
    },
    {
      id: "saec-mi-technology",
      workspaceSlug: SLUG,
      domainId: "market-intelligence",
      title: "MRL and IoT monitoring",
      summary: "Growing demand for machine-room-less lifts with remote fault diagnostics on premium retail assets.",
      severity: "low",
      categories: [{ id: "technology", label: "Technology" }],
      tags: [{ id: "mrl", label: "MRL" }],
      entityRefs: [],
    },
  ];
}
