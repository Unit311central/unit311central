/**
 * Semantic text utilities — shared normalisation and token scoring.
 */

import { normalizeEaMessage } from "@/lib/ai-operating-assistant/capabilities/message-normalize";

const STOPWORDS = new Set([
  "a", "an", "the", "our", "my", "your", "we", "us", "me", "i", "is", "are", "was", "were",
  "what", "how", "many", "much", "do", "does", "did", "can", "could", "would", "should",
  "give", "show", "list", "find", "get", "tell", "please", "for", "of", "in", "at", "to",
  "and", "or", "with", "have", "has", "had", "be", "been", "being",
]);

export function tokenizeForSemanticMatch(text: string): string[] {
  const normalized = normalizeEaMessage(text);
  return normalized
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function scoreSemanticOverlap(
  message: string,
  keywords: string[],
  phrases: string[] = [],
  negativeKeywords: string[] = [],
): number {
  const normalized = normalizeEaMessage(message);
  const tokens = new Set(tokenizeForSemanticMatch(message));

  for (const neg of negativeKeywords) {
    if (normalized.includes(normalizeEaMessage(neg))) return 0;
  }

  let score = 0;
  for (const phrase of phrases) {
    const p = normalizeEaMessage(phrase);
    if (p && normalized.includes(p)) score = Math.max(score, 90);
  }

  let keywordHits = 0;
  for (const kw of keywords) {
    const k = normalizeEaMessage(kw);
    if (!k) continue;
    if (normalized.includes(k)) {
      keywordHits += k.includes(" ") ? 3 : 1;
    } else if (tokens.has(k)) {
      keywordHits += 1;
    } else if (k.length >= 5 && fuzzyTokenMatch(message, k)) {
      keywordHits += 2;
    }
  }

  if (keywordHits > 0) {
    score = Math.max(score, Math.min(85, 50 + keywordHits * 12));
  }

  return score;
}

/** Light fuzzy: token edit distance ≤ 1 for words ≥ 5 chars */
export function fuzzyTokenMatch(message: string, target: string): boolean {
  const t = normalizeEaMessage(target);
  if (!t) return false;
  const normalized = normalizeEaMessage(message);
  if (normalized.includes(t)) return true;
  const tokens = tokenizeForSemanticMatch(message);
  for (const token of tokens) {
    if (token.length < 5 || t.length < 5) continue;
    if (levenshtein(token, t) <= 1) return true;
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
