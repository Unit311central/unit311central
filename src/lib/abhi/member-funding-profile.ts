/**
 * Organisation profiles that drive funding opportunity matching.
 */

export type AbhiMemberOrgProfile = {
  clientId: string;
  organisationName: string;
  country: string;
  organisationType: string;
  industry: string;
  sector: string;
  capabilities: string[];
  universityCollaboration: boolean;
  nhsCollaboration: boolean;
  memberSince: string;
  nextRenewal: string;
  membershipStatus: "Active" | "Pending" | "Lapsed";
  workingGroupCount: number;
  keywords: string[];
};

const ABBOTT_PROFILE: AbhiMemberOrgProfile = {
  clientId: "abhi-cli-abbott-diagnostics-ltd",
  organisationName: "Abbott Diagnostics Ltd",
  country: "United Kingdom",
  organisationType: "Large Enterprise",
  industry: "Diagnostics",
  sector: "Medical Technology",
  capabilities: [
    "Laboratory Diagnostics",
    "Point Of Care Diagnostics",
    "Digital Diagnostics",
  ],
  universityCollaboration: true,
  nhsCollaboration: true,
  memberSince: "2018",
  nextRenewal: "2026-10-24",
  membershipStatus: "Active",
  workingGroupCount: 1,
  keywords: [
    "diagnostics",
    "laboratory",
    "point of care",
    "digital diagnostics",
    "nhs",
    "medtech",
    "ivd",
    "clinical pathway",
    "commercial deployment",
  ],
};

const DEFAULT_PROFILE = (clientId: string, organisationName: string): AbhiMemberOrgProfile => ({
  clientId,
  organisationName,
  country: "United Kingdom",
  organisationType: "Member Company",
  industry: "HealthTech",
  sector: "Medical Technology",
  capabilities: ["MedTech", "Market Access"],
  universityCollaboration: false,
  nhsCollaboration: true,
  memberSince: "2022",
  nextRenewal: "2026-12-31",
  membershipStatus: "Active",
  workingGroupCount: 1,
  keywords: ["medtech", "nhs", "healthtech", "innovation"],
});

export function getAbhiMemberOrgProfile(
  clientId: string,
  organisationName: string,
): AbhiMemberOrgProfile {
  if (clientId === ABBOTT_PROFILE.clientId || /abbott/i.test(organisationName)) {
    return ABBOTT_PROFILE;
  }
  return DEFAULT_PROFILE(clientId, organisationName);
}
