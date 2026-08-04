/**
 * OnwardAir Luminary Advisors — sourced from https://onwardair.tech/#team
 * Used to seed Board → Board Members (board_directors) when the workspace is empty.
 */

export type OnwardAirBoardMemberSeed = {
  fullName: string;
  roleTitle: string;
  organisation: string;
  notes: string;
  sortOrder: number;
};

export const ONWARDAIR_LUMINARY_ADVISORS: readonly OnwardAirBoardMemberSeed[] = [
  {
    fullName: "Dylan Taylor",
    roleTitle: "Advisor",
    organisation: "Voyager Technologies",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sortOrder: 10,
  },
  {
    fullName: "Cameron Burr",
    roleTitle: "Advisor",
    organisation: "Jet Capital",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sortOrder: 20,
  },
  {
    fullName: "Rick Perez",
    roleTitle: "Advisor",
    organisation: "1588 Ventures",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sortOrder: 30,
  },
  {
    fullName: "Chris Tucker",
    roleTitle: "Advisor",
    organisation: "Yale House Ventures",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sortOrder: 40,
  },
  {
    fullName: "Gabe Mena, MD",
    roleTitle: "Advisor",
    organisation: "MD Anderson",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sortOrder: 50,
  },
  {
    fullName: "GEN Duncan McNabb",
    roleTitle: "Advisor",
    organisation: "USAF (Ret.)",
    notes: "Luminary Advisor — onwardair.tech/#team",
    sortOrder: 60,
  },
] as const;
