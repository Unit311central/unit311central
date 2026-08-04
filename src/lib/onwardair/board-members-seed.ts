/**
 * OnwardAir Board Members seed — Founder/CEO + Luminary Advisors
 * (https://onwardair.tech/#team). Used for board_directors when workspace is OA.
 */

export type OnwardAirBoardMemberSeed = {
  fullName: string;
  roleTitle: string;
  organisation: string;
  notes: string;
  sortOrder: number;
};

/** Founder & CEO — always ensure this row exists for OnwardAir. */
export const ONWARDAIR_BOARD_FOUNDER: OnwardAirBoardMemberSeed = {
  fullName: "Scott Parazynski, MD",
  roleTitle: "Founder & CEO / Board Member",
  organisation: "OnwardAir",
  notes: "Founder & CEO — onwardair.tech/#team",
  sortOrder: 1,
};

export const ONWARDAIR_LUMINARY_ADVISORS: readonly OnwardAirBoardMemberSeed[] = [
  ONWARDAIR_BOARD_FOUNDER,
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
