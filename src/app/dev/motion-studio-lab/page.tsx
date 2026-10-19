import { notFound } from "next/navigation";

import MotionStudioLabClient from "./MotionStudioLabClient";

/**
 * Development-only Motion Studio playback lab (Playwright / manual QA).
 * Not available in production builds.
 */
export default function MotionStudioLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <MotionStudioLabClient />;
}
