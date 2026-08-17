import { getOpenAiAdminApiKey, OPENAI_API_BASE } from "@/lib/software-billing/openai-config";

export class OpenAiBillingApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "OpenAiBillingApiError";
    this.status = status;
  }
}

export type OpenAiCostBucket = {
  startTime: number;
  endTime: number;
  results: Array<{
    lineItem: string;
    projectId: string | null;
    amount: number;
    currency: string;
  }>;
};

export type OpenAiCostsPage = {
  buckets: OpenAiCostBucket[];
  nextPage: string | null;
};

async function openAiFetch(path: string): Promise<Response> {
  const key = getOpenAiAdminApiKey();
  if (!key) {
    throw new OpenAiBillingApiError("OPENAI_ADMIN_API_KEY is not configured.", 503);
  }
  return fetch(`${OPENAI_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
}

function parseCostsPage(payload: Record<string, unknown>): OpenAiCostsPage {
  const data = Array.isArray(payload.data) ? payload.data : [];
  const buckets: OpenAiCostBucket[] = data.map((row) => {
    const bucket = row as Record<string, unknown>;
    const results = Array.isArray(bucket.results) ? bucket.results : [];
    return {
      startTime: Number(bucket.start_time ?? 0),
      endTime: Number(bucket.end_time ?? 0),
      results: results.map((item) => {
        const result = item as Record<string, unknown>;
        const amount = (result.amount ?? {}) as Record<string, unknown>;
        return {
          lineItem: String(result.line_item ?? "unknown"),
          projectId: result.project_id ? String(result.project_id) : null,
          amount: Number(amount.value ?? 0),
          currency: String(amount.currency ?? "usd").toUpperCase(),
        };
      }),
    };
  });

  return {
    buckets,
    nextPage: payload.next_page ? String(payload.next_page) : null,
  };
}

export async function fetchOpenAiCostsPage(input: {
  startTime: number;
  endTime?: number;
  page?: string | null;
  limit?: number;
}): Promise<OpenAiCostsPage> {
  const params = new URLSearchParams();
  params.set("start_time", String(input.startTime));
  if (input.endTime != null) params.set("end_time", String(input.endTime));
  params.set("bucket_width", "1d");
  params.append("group_by[]", "line_item");
  params.append("group_by[]", "project_id");
  params.set("limit", String(input.limit ?? 180));
  if (input.page) params.set("page", input.page);

  const response = await openAiFetch(`/organization/costs?${params.toString()}`);
  const text = await response.text();
  if (!response.ok) {
    throw new OpenAiBillingApiError(
      `OpenAI costs API failed (${response.status}): ${text.slice(0, 200)}`,
      response.status,
    );
  }
  return parseCostsPage(JSON.parse(text) as Record<string, unknown>);
}

export async function fetchAllOpenAiCosts(input: {
  startTime: number;
  endTime?: number;
}): Promise<OpenAiCostBucket[]> {
  const buckets: OpenAiCostBucket[] = [];
  let page: string | null = null;
  do {
    const result = await fetchOpenAiCostsPage({
      startTime: input.startTime,
      endTime: input.endTime,
      page,
    });
    buckets.push(...result.buckets);
    page = result.nextPage;
  } while (page);
  return buckets;
}
