/**
 * Natural-language detection for ABHI "create training course from document".
 */

const PHRASES = [
  /create (a |an )?(training )?course from/i,
  /turn this (document|policy|pdf|file|handbook|sop) into (a )?(training )?course/i,
  /generate (a |an )?(training )?course from/i,
  /make (a |an )?(lms |training )?course (from|out of)/i,
  /build (a |an )?(training )?course from (this )?(document|policy|pdf|file)/i,
  /course from this (document|policy|pdf|file|handbook)/i,
];

export function resolveAbhiLmsCourseIntent(message: string): boolean {
  const text = String(message || "").trim();
  if (!text) return false;
  return PHRASES.some((re) => re.test(text));
}
