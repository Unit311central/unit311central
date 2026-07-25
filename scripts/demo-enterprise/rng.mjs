/** Seeded PRNG for reproducible Demo regenerations. */

export function createRng(seed = 3112025) {
  let state = seed >>> 0;
  function next() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  }
  return {
    next,
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick(list) {
      return list[Math.floor(next() * list.length)];
    },
    shuffle(list) {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    bool(p = 0.5) {
      return next() < p;
    },
    money(min, max, decimals = 2) {
      const n = min + next() * (max - min);
      return Number(n.toFixed(decimals));
    },
  };
}

/** Days ago from today (UTC date string YYYY-MM-DD). */
export function daysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function monthsAgo(months, day = 15) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

/** Add calendar days to an ISO date (YYYY-MM-DD). */
export function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function sqlStr(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function sqlUuid(seedKey) {
  // Deterministic UUIDv4-like from string hash (version nibble fixed to 4).
  let h = 2166136261;
  for (let i = 0; i < seedKey.length; i += 1) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hex = (n, w) => (n >>> 0).toString(16).padStart(w, "0").slice(-w);
  const a = hex(h, 8);
  const b = hex(h * 3, 4);
  const c = `4${hex(h * 5, 3)}`;
  const d = `8${hex(h * 7, 3)}`;
  const e = hex(h * 11, 8) + hex(h * 13, 4);
  return `${a}-${b}-${c}-${d}-${e.slice(0, 12)}`;
}
