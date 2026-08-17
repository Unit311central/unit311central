export function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function endOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

export function previousUtcMonthRange(reference = new Date()) {
  const currentStart = startOfUtcMonth(reference);
  const previousStart = new Date(
    Date.UTC(currentStart.getUTCFullYear(), currentStart.getUTCMonth() - 1, 1),
  );
  return {
    from: previousStart.toISOString(),
    to: currentStart.toISOString(),
  };
}

export function currentUtcMonthRange(reference = new Date()) {
  const start = startOfUtcMonth(reference);
  const end = endOfUtcMonth(reference);
  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

export function toUnixSeconds(iso: string) {
  return Math.floor(new Date(iso).getTime() / 1000);
}

export function projectLinearSpendToPeriodEnd(
  spendToDate: number,
  periodStartIso: string,
  reference = new Date(),
) {
  const start = new Date(periodStartIso).getTime();
  const end = reference.getTime();
  const elapsedMs = Math.max(end - start, 60_000);
  const dayMs = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.max(elapsedMs / dayMs, 1 / 24);
  const monthStart = startOfUtcMonth(reference);
  const monthEnd = endOfUtcMonth(reference);
  const totalDays = Math.max((monthEnd.getTime() - monthStart.getTime()) / dayMs, 1);
  return round2((spendToDate / elapsedDays) * totalDays);
}

export function previousBillingWindow(currentStartIso: string, currentEndIso: string) {
  const start = new Date(currentStartIso).getTime();
  const end = new Date(currentEndIso).getTime();
  const duration = Math.max(end - start, 24 * 60 * 60 * 1000);
  return {
    from: new Date(start - duration).toISOString(),
    to: new Date(start).toISOString(),
  };
}
