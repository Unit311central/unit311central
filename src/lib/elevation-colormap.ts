export type ElevationRange = {
  min: number;
  max: number;
};

export function elevationColor(t: number): [number, number, number] {
  const clamped = Math.min(1, Math.max(0, t));
  const stops: Array<[number, [number, number, number]]> = [
    [0, [37, 99, 235]],
    [0.25, [6, 182, 212]],
    [0.5, [34, 197, 94]],
    [0.75, [234, 179, 8]],
    [1, [239, 68, 68]],
  ];

  for (let index = 0; index < stops.length - 1; index += 1) {
    const [startT, startColor] = stops[index];
    const [endT, endColor] = stops[index + 1];

    if (clamped <= endT) {
      const localT = (clamped - startT) / (endT - startT);
      return [
        Math.round(startColor[0] + (endColor[0] - startColor[0]) * localT),
        Math.round(startColor[1] + (endColor[1] - startColor[1]) * localT),
        Math.round(startColor[2] + (endColor[2] - startColor[2]) * localT),
      ];
    }
  }

  return stops[stops.length - 1][1];
}

export function formatElevationMeters(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)} m`;
}

export const ELEVATION_RAMP_CSS =
  "linear-gradient(to top, #2563eb 0%, #06b6d4 20%, #22c55e 40%, #eab308 60%, #f59e0b 80%, #ef4444 100%)";
