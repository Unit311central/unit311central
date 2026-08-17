import { round2 } from "@/lib/software-billing/period-utils";

import type { OpenAiCostBucket } from "@/lib/software-billing/openai-client";



export type OpenAiCostAggregation = {

  lineCount: number;

  totalBilled: number;

  currency: string;

  byLineItem: Record<string, number>;

  byProject: Record<string, number>;

  byProjectLineItem: Record<string, Record<string, number>>;

  byDay: Array<{

    chargeDate: string;

    serviceName: string;

    billedCost: number;

    effectiveCost: number;

    projectId: string | null;

  }>;

};



export function aggregateOpenAiCostBuckets(buckets: OpenAiCostBucket[]): OpenAiCostAggregation {

  const byLineItem: Record<string, number> = {};

  const byProject: Record<string, number> = {};

  const byProjectLineItem: Record<string, Record<string, number>> = {};

  const byDay: OpenAiCostAggregation["byDay"] = [];

  let lineCount = 0;

  let totalBilled = 0;

  let currency = "USD";



  for (const bucket of buckets) {

    const chargeDate = new Date(bucket.startTime * 1000).toISOString().slice(0, 10);

    for (const result of bucket.results) {

      lineCount += 1;

      totalBilled += result.amount;

      currency = result.currency || currency;

      byLineItem[result.lineItem] = round2((byLineItem[result.lineItem] ?? 0) + result.amount);



      const projectKey = result.projectId || "unattributed";

      byProject[projectKey] = round2((byProject[projectKey] ?? 0) + result.amount);

      if (!byProjectLineItem[projectKey]) byProjectLineItem[projectKey] = {};

      byProjectLineItem[projectKey][result.lineItem] = round2(

        (byProjectLineItem[projectKey][result.lineItem] ?? 0) + result.amount,

      );



      byDay.push({

        chargeDate,

        serviceName: result.lineItem,

        billedCost: round2(result.amount),

        effectiveCost: round2(result.amount),

        projectId: result.projectId || null,

      });

    }

  }



  return {

    lineCount,

    totalBilled: round2(totalBilled),

    currency,

    byLineItem,

    byProject,

    byProjectLineItem,

    byDay,

  };

}


