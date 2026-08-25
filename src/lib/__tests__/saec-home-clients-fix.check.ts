import assert from "node:assert/strict";
import test from "node:test";

import {
  buildClientsDashboardActivity,
  buildClientsDashboardKpis,
} from "@/lib/clients-dashboard-insights";
import {
  buildExecutiveHomeLiveNarrative,
  buildExecutiveHomeLiveKpis,
} from "@/lib/executive-home-dashboard";
import {
  getSaecFixtureClients,
  getSaecFixtureProjects,
  isSaecBusinessCentralFixtures,
} from "@/lib/saec/business-central-data";
import { SAEC_REPORTING_CURRENCY, SAEC_SLUG, SAEC_WORKSPACE_LOGO_SRC } from "@/lib/saec-surface";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";

const LEGACY_MARKERS = [
  "Northstar",
  "Dublin Pharma",
  "Edge gateway",
  "Edge Controller",
  "MES connector",
  "Predictive maintenance",
  "Northstar Industrial",
];

function assertNoLegacyMarkers(text: string, label: string) {
  for (const marker of LEGACY_MARKERS) {
    assert.equal(
      text.includes(marker),
      false,
      `${label} must not include legacy marker "${marker}"`,
    );
  }
}

test("SAEC slug resolves to ZAR and logo path", () => {
  assert.equal(resolveSlugReportingCurrency(SAEC_SLUG), SAEC_REPORTING_CURRENCY);
  assert.equal(SAEC_WORKSPACE_LOGO_SRC, "/images/workspaces/saec/logo.png");
});

test("SAEC fixtures exclude Northstar demo records", () => {
  const clients = getSaecFixtureClients();
  const projects = getSaecFixtureProjects();

  assert.ok(clients.length >= 5, "SAEC should ship representative client fixtures");
  assert.ok(projects.length >= 5, "SAEC should ship representative project fixtures");

  for (const client of clients) {
    assertNoLegacyMarkers(JSON.stringify(client), `client ${client.id}`);
    assert.equal(client.region, "Other");
  }

  for (const project of projects) {
    assertNoLegacyMarkers(JSON.stringify(project), `project ${project.id}`);
    assert.ok(
      project.clientName.includes("Northstar") === false,
      "projects must not reference Northstar clients",
    );
  }
});

test("SAEC Home narrative uses SAEC portfolio data only", () => {
  const clients = getSaecFixtureClients();
  const projects = getSaecFixtureProjects();
  const narrative = buildExecutiveHomeLiveNarrative({
    financials: null,
    projects,
    clients,
    reportingCurrency: SAEC_REPORTING_CURRENCY,
  });

  const blob = JSON.stringify(narrative);
  assertNoLegacyMarkers(blob, "executive home narrative");

  const kpis = buildExecutiveHomeLiveKpis({
    projects,
    clients,
    financials: null,
    reportingCurrency: SAEC_REPORTING_CURRENCY,
  });
  assertNoLegacyMarkers(JSON.stringify(kpis), "executive home KPIs");
});

test("SAEC Clients dashboard derives client-centric activity", () => {
  const clients = getSaecFixtureClients();
  const projects = getSaecFixtureProjects();

  const kpis = buildClientsDashboardKpis(clients, projects, [], []);
  assert.ok(kpis.totalClients >= 5);
  assert.ok((kpis.activeProjects ?? 0) > 0);

  const activity = buildClientsDashboardActivity({
    clients,
    projects,
    tickets: [],
    users: [],
    limit: 20,
  });

  for (const event of activity) {
    assertNoLegacyMarkers(JSON.stringify(event), `activity ${event.id}`);
    assert.notEqual(event.kind, undefined);
  }

  const legacyProjectActivity = activity.filter(
    (event) =>
      event.kind === "project_created" &&
      LEGACY_MARKERS.some((marker) => event.title.includes(marker) || event.detail.includes(marker)),
  );
  assert.equal(legacyProjectActivity.length, 0);
});

test("isSaecBusinessCentralFixtures gates SAEC slug only", () => {
  assert.equal(isSaecBusinessCentralFixtures("saec"), true);
  assert.equal(isSaecBusinessCentralFixtures("demo"), false);
  assert.equal(isSaecBusinessCentralFixtures("onwardair"), false);
});
