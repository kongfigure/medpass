import type { Dataset, Drug } from "./types";

const DOSE_PATTERN =
  /\b\d+(\.\d+)?\s*(mg|mcg|µg|g|ml|iu|units?|%)\b(\s*\/\s*\d+(\.\d+)?\s*(mg|mcg|g|ml))?/gi;
const FORM_WORDS =
  /\b(tablets?|tabs?|capsules?|caps?|er|xr|sr|cr|dr|hcl|hydrochloride|sodium|oral|daily|twice|once)\b/gi;

/** Lowercase, strip doses/forms/punctuation, collapse whitespace. */
export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(DOSE_PATTERN, " ")
    .replace(FORM_WORDS, " ")
    .replace(/[^a-z0-9\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildIndex(dataset: Dataset): Map<string, Drug> {
  const index = new Map<string, Drug>();
  for (const drug of dataset.drugs) {
    index.set(normalizeName(drug.id), drug);
    index.set(normalizeName(drug.name), drug);
    for (const alias of drug.aliases) index.set(normalizeName(alias), drug);
  }
  return index;
}

const indexCache = new WeakMap<Dataset, Map<string, Drug>>();

function indexFor(dataset: Dataset): Map<string, Drug> {
  let index = indexCache.get(dataset);
  if (!index) {
    index = buildIndex(dataset);
    indexCache.set(dataset, index);
  }
  return index;
}

/**
 * Identify a drug from free text (generic name, brand name, with or without a dose).
 * Exact matches only: a wrong guess here could hide a real interaction.
 */
export function resolveDrug(input: string, dataset: Dataset): Drug | null {
  const normalized = normalizeName(input);
  if (!normalized) return null;
  const index = indexFor(dataset);
  const direct = index.get(normalized);
  if (direct) return direct;
  // "ibuprofen 200 mg tablets" -> "ibuprofen"; try each word as a fallback
  // only when exactly one distinct drug is found.
  const found = new Set<Drug>();
  for (const word of normalized.split(" ")) {
    const hit = index.get(word);
    if (hit) found.add(hit);
  }
  return found.size === 1 ? [...found][0] : null;
}

function editDistance(a: string, b: string): number {
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[b.length];
}

/**
 * Near-miss suggestions for typos ("ibuprofin"). These are only SUGGESTIONS for the
 * user to confirm. They are never used to run a check automatically.
 */
export function suggestDrugs(input: string, dataset: Dataset, limit = 3): Drug[] {
  const normalized = normalizeName(input);
  if (normalized.length < 4) return [];
  const scored: { drug: Drug; score: number }[] = [];
  for (const drug of dataset.drugs) {
    const names = [drug.id, drug.name, ...drug.aliases].map(normalizeName);
    const best = Math.min(...names.map((n) => editDistance(normalized, n)));
    const threshold = normalized.length >= 8 ? 2 : 1;
    if (best > 0 && best <= threshold) scored.push({ drug, score: best });
  }
  return scored.sort((x, y) => x.score - y.score).slice(0, limit).map((s) => s.drug);
}
