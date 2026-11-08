/** WOLF Central Tools views for the plantation challenge responses. */
export const WOLF_PLANTATION_CHALLENGE_VIEWS = [
  "wolf-plantation-overview",
  "wolf-plantation-details",
] as const;

export type WolfPlantationChallengeView = (typeof WOLF_PLANTATION_CHALLENGE_VIEWS)[number];

export function isWolfPlantationChallengeView(view: string): view is WolfPlantationChallengeView {
  return (WOLF_PLANTATION_CHALLENGE_VIEWS as readonly string[]).includes(view);
}
