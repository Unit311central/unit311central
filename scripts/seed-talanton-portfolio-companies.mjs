/**
 * Seed portfolio_companies for Talanton Impact from the canonical mock list.
 * Idempotent: skips if rows already exist for the workspace.
 *
 *   node scripts/seed-talanton-portfolio-companies.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(filePath) {
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* */
  }
}

loadEnv(path.join(root, ".env.corporatecentre.runtime"));
loadEnv(path.join(root, ".env.unit311central.prod"));
loadEnv(path.join(root, ".env.vercel.lms"));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RISK_CYCLE = ["Low", "Medium", "High", "Medium", "Low", "Critical", "Medium"];

const SEEDS = [
  { name: "Ethical Apparel Africa", country: "Ghana", city: "Accra", sector: "Apparel & Manufacturing", employees: 420, investmentM: 4.2, ownership: 22, revenueM: 11.4, growth: 18, burnK: 95, moic: 1.6, contact: "Ama Mensah" },
  { name: "ARC Ride", country: "Kenya", city: "Nairobi", sector: "Mobility & Logistics", employees: 185, investmentM: 3.1, ownership: 18, revenueM: 6.8, growth: 24, burnK: 110, moic: 1.4, contact: "James Kariuki" },
  { name: "Burn Manufacturing", country: "Kenya", city: "Nairobi", sector: "Clean Energy", employees: 310, investmentM: 5.5, ownership: 15, revenueM: 14.2, growth: 12, burnK: 140, moic: 1.9, contact: "Wanjiru Otieno" },
  { name: "Kentegra Biotechnology", country: "Kenya", city: "Nairobi", sector: "Agri-biotech", employees: 96, investmentM: 2.8, ownership: 20, revenueM: 4.1, growth: 31, burnK: 75, moic: 1.3, contact: "Daniel Okello" },
  { name: "Long Miles Coffee", country: "Burundi", city: "Bujumbura", sector: "Agriculture & Food", employees: 140, investmentM: 2.2, ownership: 25, revenueM: 5.6, growth: 9, burnK: 40, moic: 1.7, contact: "Grace Ndayishimiye" },
  { name: "Pharmakina", country: "DRC", city: "Bukavu", sector: "Healthcare & Pharma", employees: 520, investmentM: 6.0, ownership: 12, revenueM: 18.5, growth: 7, burnK: 160, moic: 2.1, contact: "Jean Mukendi" },
  { name: "Moko Home + Living", country: "Kenya", city: "Nairobi", sector: "Consumer Goods", employees: 210, investmentM: 3.4, ownership: 19, revenueM: 8.9, growth: 16, burnK: 85, moic: 1.5, contact: "Faith Wambui" },
  { name: "Power Resources International", country: "Uganda", city: "Kampala", sector: "Energy Infrastructure", employees: 78, investmentM: 4.8, ownership: 16, revenueM: 7.2, growth: 21, burnK: 120, moic: 1.2, contact: "Peter Okello" },
  { name: "Auto Springs East Africa PLC", country: "Ethiopia", city: "Addis Ababa", sector: "Automotive Manufacturing", employees: 640, investmentM: 7.5, ownership: 10, revenueM: 22.0, growth: 11, burnK: 180, moic: 1.8, contact: "Helen Bekele" },
  { name: "BioFarms Limited", country: "Uganda", city: "Kampala", sector: "Agriculture & Food", employees: 155, investmentM: 2.6, ownership: 23, revenueM: 5.1, growth: 14, burnK: 55, moic: 1.4, contact: "Sarah Nalwanga" },
  { name: "Enda Sportswear", country: "Kenya", city: "Eldoret", sector: "Apparel & Manufacturing", employees: 88, investmentM: 1.9, ownership: 28, revenueM: 3.4, growth: 27, burnK: 48, moic: 1.3, contact: "Michael Kiprop" },
  { name: "Kijani Forestry", country: "Kenya", city: "Nairobi", sector: "Forestry & Climate", employees: 62, investmentM: 3.6, ownership: 21, revenueM: 2.8, growth: 35, burnK: 70, moic: 1.1, contact: "Amina Otieno" },
  { name: "Kivu Tilapia Farm Ltd", country: "Rwanda", city: "Rubavu", sector: "Aquaculture", employees: 74, investmentM: 2.1, ownership: 26, revenueM: 3.9, growth: 19, burnK: 42, moic: 1.5, contact: "Eric Habimana" },
  { name: "Masaka Farms", country: "Uganda", city: "Masaka", sector: "Agriculture & Food", employees: 118, investmentM: 2.4, ownership: 24, revenueM: 4.6, growth: 13, burnK: 38, moic: 1.6, contact: "Joseph Ssekandi" },
  { name: "OWP Pharmaceuticals", country: "Kenya", city: "Nairobi", sector: "Healthcare & Pharma", employees: 245, investmentM: 5.2, ownership: 14, revenueM: 12.7, growth: 15, burnK: 130, moic: 1.7, contact: "Fatima Diallo" },
  { name: "Pezesha", country: "Kenya", city: "Nairobi", sector: "Fintech & Inclusion", employees: 92, investmentM: 3.0, ownership: 17, revenueM: 5.8, growth: 29, burnK: 90, moic: 1.4, contact: "Brian Ouma" },
  { name: "poa! Internet", country: "Kenya", city: "Nairobi", sector: "Connectivity & Telecom", employees: 268, investmentM: 6.4, ownership: 13, revenueM: 15.3, growth: 22, burnK: 175, moic: 1.9, contact: "Nancy Wanjiku" },
  { name: "Rabboni Group", country: "Kenya", city: "Nairobi", sector: "Manufacturing & Distribution", employees: 330, investmentM: 4.0, ownership: 18, revenueM: 10.6, growth: 10, burnK: 100, moic: 1.5, contact: "Samuel Mwangi" },
  { name: "Taraji Afrika", country: "Tanzania", city: "Dar es Salaam", sector: "Agriculture & Food", employees: 104, investmentM: 2.0, ownership: 27, revenueM: 3.7, growth: 17, burnK: 45, moic: 1.3, contact: "Asha Juma" },
];

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", "talantonimpact")
    .maybeSingle();
  if (wsErr || !ws?.id) throw new Error(`talantonimpact missing: ${wsErr?.message || "not found"}`);

  const { count } = await admin
    .from("portfolio_companies")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ws.id);
  if ((count ?? 0) > 0) {
    console.log(`Already seeded (${count} rows). Skipping.`);
    return;
  }

  for (let index = 0; index < SEEDS.length; index++) {
    const seed = SEEDS[index];
    const slug = slugify(seed.name);
    const compliancePct = Math.min(98, Math.max(62, 88 - (index % 7) * 3 + (index % 3)));
    const outstandingTraining = Math.max(0, Math.round((100 - compliancePct) / 4) + (index % 5));
    const month = String((index % 6) + 1).padStart(2, "0");
    const day = String(10 + (index % 18)).padStart(2, "0");
    const row = {
      id: `ti-co-${slug}`,
      workspace_id: ws.id,
      client_id: `ti-cli-${slug}`,
      name: seed.name,
      country: seed.country,
      sector: seed.sector,
      region: seed.country === "Ghana" ? "West Africa" : "East Africa",
      city: seed.city,
      employee_count: seed.employees,
      investment_amount_usd: Math.round(seed.investmentM * 1_000_000),
      ownership_pct: seed.ownership,
      annual_revenue_usd: Math.round(seed.revenueM * 1_000_000),
      revenue_growth_pct: seed.growth,
      burn_rate_usd_monthly: seed.burnK * 1000,
      compliance_pct: compliancePct,
      risk_rating: RISK_CYCLE[index % RISK_CYCLE.length],
      roi_moic: seed.moic,
      last_quarterly_report_date: `2026-${month}-${day}`,
      outstanding_training: outstandingTraining,
      users_enrolled: Math.max(12, Math.round(seed.employees * 0.35) + (index % 9)),
      courses_assigned: 11,
      overview: `${seed.name} is a Talanton Impact portfolio company in ${seed.sector}, based in ${seed.city}, ${seed.country}. The investment supports growth, governance and measurable impact across the region.`,
      primary_contact: seed.contact,
      email: `${slugify(seed.contact)}@${slug}.impact`,
      phone: `+254 700 ${String(100000 + index * 137).slice(0, 6)}`,
      last_review: `2026-${month}-${day}`,
      sort_order: (index + 1) * 10,
      is_active: true,
    };
    const { error } = await admin.from("portfolio_companies").upsert(row, { onConflict: "id" });
    if (error) console.warn(seed.name, error.message);
  }

  const { count: after } = await admin
    .from("portfolio_companies")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", ws.id);
  console.log("Seeded portfolio_companies:", after);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
