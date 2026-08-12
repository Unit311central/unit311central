/** Alternating professional header washes — blue / teal, fading right. */
export const MODULE_REVIEW_HEADER_BLUE =
  "linear-gradient(90deg, #0b2d63 0%, #1e40af 58%, #60a5fa 100%)";

export const MODULE_REVIEW_HEADER_TEAL =
  "linear-gradient(90deg, #0c4a6e 0%, #0f766e 58%, #5eead4 100%)";

export function moduleReviewAlternatingHeader(columnIndex: number) {
  return columnIndex % 2 === 0 ? MODULE_REVIEW_HEADER_BLUE : MODULE_REVIEW_HEADER_TEAL;
}

/** Grey tile body with light cross-hatch texture. */
export const MODULE_REVIEW_TILE_SURFACE = {
  backgroundColor: "#e8edf3",
  backgroundImage: [
    "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(226,232,240,0.55) 100%)",
    "repeating-linear-gradient(135deg, rgba(15,23,42,0.03) 0 1px, transparent 1px 7px)",
    "repeating-linear-gradient(45deg, rgba(15,23,42,0.02) 0 1px, transparent 1px 9px)",
  ].join(", "),
};

export const MODULE_REVIEW_EA_SUBHEADER = {
  background:
    "linear-gradient(90deg, rgba(15,118,110,0.18) 0%, rgba(241,245,249,0.92) 100%)",
  borderColor: "rgba(15,118,110,0.35)",
  color: "#0f766e",
};
