import { WOLF_AI_WILDLIFE_VISION_DURATION_SEC } from "@/lib/wolf/ai-wildlife-vision/config";
import {
  getSimulatedDetectionsAt,
  getSimulatedUniqueCountsAt,
} from "@/lib/wolf/ai-wildlife-vision/simulated-detections";
import type { WildlifeVisionDetectionProvider } from "@/lib/wolf/ai-wildlife-vision/types";

export type WildlifeVisionProviderMode = "simulated" | "live";

class SimulatedWildlifeVisionDetectionProvider implements WildlifeVisionDetectionProvider {
  readonly mode = "simulated" as const;
  readonly durationSec = WOLF_AI_WILDLIFE_VISION_DURATION_SEC;

  getDetectionsAt(timeSec: number) {
    return getSimulatedDetectionsAt(timeSec);
  }

  getUniqueCountsAt(timeSec: number) {
    return getSimulatedUniqueCountsAt(timeSec);
  }
}

/** Placeholder for future live CV integration. */
class LiveWildlifeVisionDetectionProvider implements WildlifeVisionDetectionProvider {
  readonly mode = "live" as const;
  readonly durationSec = WOLF_AI_WILDLIFE_VISION_DURATION_SEC;

  getDetectionsAt() {
    return [];
  }

  getUniqueCountsAt() {
    return getSimulatedUniqueCountsAt(0);
  }
}

export function createWildlifeVisionDetectionProvider(
  mode: WildlifeVisionProviderMode = "simulated",
): WildlifeVisionDetectionProvider {
  if (mode === "live") {
    return new LiveWildlifeVisionDetectionProvider();
  }
  return new SimulatedWildlifeVisionDetectionProvider();
}
