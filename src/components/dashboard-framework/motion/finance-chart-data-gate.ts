/** Keep chart series at zero until the section is viewport-revealed (Recharts draws final data when animation is off). */

export function financeGateSeriesRows<T extends Record<string, unknown>>(
  rows: T[],
  revealValues: boolean,
  zeroKeys: (keyof T)[],
): T[] {
  if (revealValues) return rows;
  return rows.map((row) => {
    const next = { ...row };
    for (const key of zeroKeys) {
      if (key in next) (next as Record<string, unknown>)[key as string] = 0;
    }
    return next;
  });
}
