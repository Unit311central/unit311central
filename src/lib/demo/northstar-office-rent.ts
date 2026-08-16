/** Northstar demo — three offices at £5,000/month each (rent SSOT). */
export const NORTHSTAR_OFFICE_RENT_MONTHLY_GBP = 5_000;
export const NORTHSTAR_OFFICE_COUNT = 3;
export const NORTHSTAR_TOTAL_RENT_MONTHLY_GBP =
  NORTHSTAR_OFFICE_RENT_MONTHLY_GBP * NORTHSTAR_OFFICE_COUNT;

export const NORTHSTAR_OFFICE_RENT_LABEL = `£${NORTHSTAR_OFFICE_RENT_MONTHLY_GBP.toLocaleString("en-GB")} / month`;
