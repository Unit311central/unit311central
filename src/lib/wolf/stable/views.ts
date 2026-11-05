/** WOLF Central Stable Management views. Demonstration module, not a customer workspace record. */
export const WOLF_STABLE_VIEWS = ["wolf-stable-overview", "wolf-stable", "wolf-stable-facility"] as const;

export type WolfStableView = (typeof WOLF_STABLE_VIEWS)[number];

export function isWolfStableView(view: string): view is WolfStableView {
  return (WOLF_STABLE_VIEWS as readonly string[]).includes(view);
}
