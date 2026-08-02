/**
 * Microsoft Clarity Data Export API client (server-only).
 * https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api
 */

export type ClarityMetricBlock = {
  metricName: string;
  information: Array<Record<string, string | number | null | undefined>>;
};

export function getClarityApiToken(): string {
  return process.env.CLARITY_API_TOKEN?.trim() ?? "";
}

export async function fetchClarityLiveInsights(options?: {
  numOfDays?: 1 | 2 | 3;
  dimension1?: string;
}): Promise<{ ok: true; data: ClarityMetricBlock[] } | { ok: false; error: string }> {
  const token = getClarityApiToken();
  if (!token) {
    return {
      ok: false,
      error:
        "CLARITY_API_TOKEN is not configured. Generate a token in Clarity → Settings → Data Export.",
    };
  }

  const params = new URLSearchParams({
    numOfDays: String(options?.numOfDays ?? 3),
  });
  if (options?.dimension1) params.set("dimension1", options.dimension1);

  try {
    const response = await fetch(
      `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        error: `Clarity API ${response.status}: ${text.slice(0, 240)}`,
      };
    }
    const data = JSON.parse(text) as ClarityMetricBlock[];
    return { ok: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Clarity export failed.",
    };
  }
}

export function metricRows(
  blocks: ClarityMetricBlock[],
  metricName: string,
): Array<Record<string, string | number | null | undefined>> {
  const block = blocks.find(
    (b) => b.metricName?.toLowerCase() === metricName.toLowerCase(),
  );
  return block?.information ?? [];
}

export function sumNumeric(
  rows: Array<Record<string, string | number | null | undefined>>,
  ...keys: string[]
): number {
  return rows.reduce((sum, row) => {
    for (const key of keys) {
      const raw = row[key];
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n)) return sum + n;
    }
    return sum;
  }, 0);
}
