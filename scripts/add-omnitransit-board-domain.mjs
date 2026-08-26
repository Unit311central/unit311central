/**
 * Attach omnitransit.unit311.com to the canonical unit311central Vercel project
 * and verify public DNS for the OmniTransit board portal.
 *
 * Prerequisites:
 *   - VERCEL_TOKEN with access to project unit311central (prj_lyDcefpA3tnfzWLiZ9Ui0xVk6nJD)
 *   - unit311.com registered and delegated to Vercel DNS (ns1.vercel-dns.com / ns2.vercel-dns.com)
 *
 * Usage:
 *   VERCEL_TOKEN=... node scripts/add-omnitransit-board-domain.mjs
 *   VERCEL_TOKEN=... node scripts/add-omnitransit-board-domain.mjs --verify-only
 */
import { execSync } from "node:child_process";
import {
  UNIT311_VERCEL_PROJECT_ID,
  UNIT311_VERCEL_PROJECT_NAME,
  refuseObsoleteVercelProject,
} from "./assert-canonical-unit311-repo.mjs";

const BOARD_HOST = "omnitransit.unit311.com";
const BRAND_APEX = "unit311.com";
const VERIFY_ONLY = process.argv.includes("--verify-only");

function api(path, method = "GET", body) {
  const token = process.env.VERCEL_TOKEN?.trim();
  if (!token) {
    console.error("VERCEL_TOKEN is required.");
    process.exit(1);
  }
  const args = [
    "curl",
    "-fsS",
    "-X",
    method,
    "-H",
    `Authorization: Bearer ${token}`,
    "-H",
    "Content-Type: application/json",
  ];
  if (body) {
    args.push("-d", JSON.stringify(body));
  }
  args.push(`https://api.vercel.com${path}`);
  const out = execSync(args.join(" "), { encoding: "utf8" });
  return out ? JSON.parse(out) : null;
}

function digShort(name, type = "A") {
  try {
    return execSync(`dig ${name} ${type} +short @8.8.8.8`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function verifyDns() {
  const apexNs = digShort(BRAND_APEX, "NS");
  const boardA = digShort(BOARD_HOST, "A");
  const boardCname = digShort(BOARD_HOST, "CNAME");
  console.log("DNS check (Google 8.8.8.8):");
  console.log(`  ${BRAND_APEX} NS:`, apexNs.length ? apexNs.join(", ") : "NXDOMAIN / missing");
  console.log(
    `  ${BOARD_HOST}:`,
    boardA.length ? `A ${boardA.join(", ")}` : boardCname.length ? `CNAME ${boardCname.join(", ")}` : "NXDOMAIN / missing",
  );
  const ok = apexNs.length > 0 && (boardA.length > 0 || boardCname.length > 0);
  return ok;
}

async function main() {
  if (VERIFY_ONLY) {
    const ok = verifyDns();
    process.exit(ok ? 0 : 1);
  }

  const project = process.env.VERCEL_PROJECT?.trim() || UNIT311_VERCEL_PROJECT_NAME;
  refuseObsoleteVercelProject(project, "add-omnitransit-board-domain.mjs");

  console.log(`Project: ${project} (${UNIT311_VERCEL_PROJECT_ID})`);
  console.log(`Adding domain ${BOARD_HOST}…`);

  const apexDomains = api(`/v9/projects/${UNIT311_VERCEL_PROJECT_ID}/domains`);
  const existing = (apexDomains?.domains ?? []).find((d) => d.name === BOARD_HOST);
  if (existing) {
    console.log(`${BOARD_HOST} already attached (verified: ${existing.verified})`);
  } else {
    const created = api(`/v10/projects/${UNIT311_VERCEL_PROJECT_ID}/domains`, "POST", {
      name: BOARD_HOST,
    });
    console.log("Domain add response:", created);
  }

  if (!digShort(BRAND_APEX, "NS").length) {
    console.warn(
      `\nWARNING: ${BRAND_APEX} has no public NS records (NXDOMAIN). Register the domain and set nameservers to Vercel before ${BOARD_HOST} can resolve.`,
    );
  }

  const dnsOk = verifyDns();
  if (!dnsOk) {
    console.warn(
      `\nDNS not ready. In Vercel → Domains → ${BRAND_APEX}, confirm apex NS and add ${BOARD_HOST} (or wildcard) when using Vercel DNS.`,
    );
    process.exit(2);
  }

  console.log("\nDNS looks configured. Verify HTTPS:");
  try {
    const headers = execSync(`curl -sI --max-time 20 https://${BOARD_HOST}/board`, {
      encoding: "utf8",
    });
    console.log(headers.split("\n").slice(0, 12).join("\n"));
  } catch (error) {
    console.error("HTTPS check failed:", error.message);
    process.exit(3);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
