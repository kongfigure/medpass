import { normalizeName, resolveDrug } from "./normalize";
import type { CheckReport, Dataset, Drug, Finding, Interaction, Severity } from "./types";

export const DISCLAIMER =
  "MedPass is an organizer and conversation starter, not medical advice. " +
  "Always confirm with your pharmacist or doctor before starting, stopping, or combining medicines.";

const SEVERITY_ORDER: Record<Severity, number> = { avoid: 0, major: 1, monitor: 2 };

function matchesSide(side: string, drug: Drug, dataset: Dataset): boolean {
  if (side.startsWith("class:")) {
    const cls = dataset.classes.find((c) => c.id === side.slice(6));
    return !!cls && cls.members.includes(drug.id);
  }
  return side === drug.id;
}

function interactionBetween(
  interaction: Interaction,
  x: Drug,
  y: Drug,
  dataset: Dataset,
): boolean {
  if (x.id === y.id) return false;
  return (
    (matchesSide(interaction.a, x, dataset) && matchesSide(interaction.b, y, dataset)) ||
    (matchesSide(interaction.a, y, dataset) && matchesSide(interaction.b, x, dataset))
  );
}

function sortFindings(findings: Finding[]): Finding[] {
  return findings.sort(
    (p, q) => SEVERITY_ORDER[p.interaction.severity] - SEVERITY_ORDER[q.interaction.severity],
  );
}

function statementFor(findings: Finding[], unrecognized: string[]): string {
  if (findings.length > 0) {
    return `Found ${findings.length} known interaction warning${findings.length === 1 ? "" : "s"} in our sources.`;
  }
  const unchecked =
    unrecognized.length > 0
      ? ` We could not identify: ${unrecognized.join(", ")}, so ${unrecognized.length === 1 ? "it was" : "they were"} not checked.`
      : "";
  return (
    "No known conflict found in our sources. This does not mean the combination is safe: " +
    "our list is a small starter set and is not exhaustive." +
    unchecked
  );
}

/**
 * Check a NEW medicine against the patient's current list.
 * Names that cannot be identified are reported in `unrecognized`, never silently ignored.
 */
export function checkNewMedication(
  currentMeds: string[],
  newMed: string,
  dataset: Dataset,
): CheckReport {
  const unrecognized: string[] = [];
  const candidate = resolveDrug(newMed, dataset);
  if (!candidate) unrecognized.push(newMed);

  const current: Drug[] = [];
  for (const name of currentMeds) {
    const drug = resolveDrug(name, dataset);
    if (drug) current.push(drug);
    else unrecognized.push(name);
  }

  const findings: Finding[] = [];
  if (candidate) {
    for (const existing of current) {
      for (const interaction of dataset.interactions) {
        if (interactionBetween(interaction, existing, candidate, dataset)) {
          findings.push({ interaction, drugA: existing, drugB: candidate });
        }
      }
    }
  }
  sortFindings(findings);
  return {
    findings,
    unrecognized,
    statement: statementFor(findings, unrecognized),
    disclaimer: DISCLAIMER,
  };
}

/**
 * Does a medicine the patient is about to take match something on their own
 * "avoid" list? Only exact same-drug matches count (brand and generic names are
 * treated as the same drug). We deliberately do not infer related drugs here.
 */
export function matchesAvoidEntry(newMed: string, avoidName: string, dataset: Dataset): boolean {
  const a = resolveDrug(newMed, dataset);
  const b = resolveDrug(avoidName, dataset);
  if (a && b) return a.id === b.id;
  if (a || b) return false;
  return normalizeName(newMed) !== "" && normalizeName(newMed) === normalizeName(avoidName);
}

/** Check every pair on a medication list (e.g. for the share card). */
export function checkMedicationList(meds: string[], dataset: Dataset): CheckReport {
  const unrecognized: string[] = [];
  const resolved: Drug[] = [];
  for (const name of meds) {
    const drug = resolveDrug(name, dataset);
    if (drug) {
      if (!resolved.some((d) => d.id === drug.id)) resolved.push(drug);
    } else {
      unrecognized.push(name);
    }
  }

  const findings: Finding[] = [];
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      for (const interaction of dataset.interactions) {
        if (interactionBetween(interaction, resolved[i], resolved[j], dataset)) {
          findings.push({ interaction, drugA: resolved[i], drugB: resolved[j] });
        }
      }
    }
  }
  sortFindings(findings);
  return {
    findings,
    unrecognized,
    statement: statementFor(findings, unrecognized),
    disclaimer: DISCLAIMER,
  };
}
