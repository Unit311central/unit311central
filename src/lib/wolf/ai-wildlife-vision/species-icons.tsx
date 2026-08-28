import type { WildlifeSpecies } from "@/lib/wolf/ai-wildlife-vision/types";

type SpeciesIconProps = {
  species: WildlifeSpecies;
  className?: string;
};

/** Compact silhouette icons for the live detection summary panel. */
export function WildlifeSpeciesIcon({ species, className = "h-5 w-5" }: SpeciesIconProps) {
  switch (species) {
    case "zebra":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3" y="8" width="18" height="10" rx="3" fill="currentColor" opacity="0.18" />
          <path
            d="M5 10h2v1H5zm3 0h2v1H8zm3 0h2v1h-2zm3 0h2v1h-2zm3 0h2v1h-2zM5 13h2v1H5zm3 0h2v1H8zm3 0h2v1h-2zm3 0h2v1h-2zm3 0h2v1h-2z"
            fill="currentColor"
          />
        </svg>
      );
    case "wildebeest":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M4 15c2-4 5-6 9-6 2 0 4 .6 5.5 1.8L21 9l-1 2-3.5-1.2c-1.2 2.2-3.4 3.7-6 4.2H4v-1z"
            fill="currentColor"
          />
          <path d="M7 16h2v2H7zM11 16h2v2h-2zM15 16h2v2h-2z" fill="currentColor" opacity="0.55" />
        </svg>
      );
    case "giraffe":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M9 4c0-1.1.9-2 2-2s2 .9 2 2v3h1c1 0 2 1 2 2v9c0 1.1-.9 2-2 2h-6c-1.1 0-2-.9-2-2V9c0-1 1-2 2-2h1V4z"
            fill="currentColor"
          />
          <circle cx="11" cy="3" r="1" fill="currentColor" />
          <circle cx="13" cy="3" r="1" fill="currentColor" />
        </svg>
      );
    case "eland":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M5 16c2-3 5-5 8-5 2.5 0 4.5 1 6 2.5L21 11l-1.5 1.8c-1.5 1.2-3.5 2-5.8 2.2H5v-1z"
            fill="currentColor"
          />
          <path d="M8 10c1.5-2 3-2.5 4.5-2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "impala":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M6 16c2-3 4.5-4.5 8-4.5 1.8 0 3.2.5 4.5 1.5L20 10l-1.2 1.6c-1.2 1-2.8 1.6-4.6 1.9H6v-1z"
            fill="currentColor"
          />
          <path d="M9 9.5c1-1.5 2-2 3.2-1.8" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      );
    case "buffalo":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M4 15c2.5-3.5 6-5.5 10-5.5 2.2 0 4 .7 5.5 2L21 9l-1.2 2.2c-1.4 1.8-3.6 3-6.2 3.3H4v-1z"
            fill="currentColor"
          />
          <path d="M7 8c1.5-1 3-1.2 4.5-.5M13 8c1.5-1 3-1.2 4.5-.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      );
    case "rhino":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M4 15c2-3.5 5.5-5.5 9.5-5.5 2.5 0 4.5.8 6 2.2L21 10l-1.3 1.8c-1.4 1.4-3.4 2.3-5.7 2.5H4v-1z"
            fill="currentColor"
          />
          <path d="M16 12.5c1.2.8 2.2 1 3.2.8" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
    default:
      return null;
  }
}
