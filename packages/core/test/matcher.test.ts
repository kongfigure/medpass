import { describe, expect, it } from "vitest";
import {
  checkMedicationList,
  checkNewMedication,
  defaultDataset as data,
  matchesAvoidEntry,
  normalizeName,
  resolveDrug,
  suggestDrugs,
} from "../src";

describe("dataset integrity", () => {
  const drugIds = new Set(data.drugs.map((d) => d.id));
  const classIds = new Set(data.classes.map((c) => c.id));

  it("has unique drug and interaction ids", () => {
    expect(new Set(data.drugs.map((d) => d.id)).size).toBe(data.drugs.length);
    expect(new Set(data.interactions.map((i) => i.id)).size).toBe(data.interactions.length);
  });

  it("only references known drugs and classes", () => {
    const known = (ref: string) =>
      ref.startsWith("class:") ? classIds.has(ref.slice(6)) : drugIds.has(ref);
    for (const i of data.interactions) {
      expect(known(i.a), `${i.id}.a = ${i.a}`).toBe(true);
      expect(known(i.b), `${i.id}.b = ${i.b}`).toBe(true);
    }
    for (const c of data.classes) {
      for (const m of c.members) expect(drugIds.has(m), `${c.id} member ${m}`).toBe(true);
    }
  });

  it("gives every interaction a source with url, section, and retrieval date", () => {
    for (const i of data.interactions) {
      expect(i.source.url).toMatch(/^https:\/\//);
      expect(i.source.section.length).toBeGreaterThan(0);
      expect(i.source.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("has no alias shared by two different drugs", () => {
    const seen = new Map<string, string>();
    for (const d of data.drugs) {
      for (const name of [d.id, d.name, ...d.aliases].map(normalizeName)) {
        const owner = seen.get(name);
        expect(owner === undefined || owner === d.id, `"${name}" is ambiguous`).toBe(true);
        seen.set(name, d.id);
      }
    }
  });

  it("never describes a combination as safe", () => {
    for (const i of data.interactions) {
      expect(`${i.summary} ${i.why} ${i.action}`.toLowerCase()).not.toMatch(/\bis safe\b|\bare safe\b|\bno risk\b/);
    }
  });
});

describe("name resolution", () => {
  it("resolves generic names, brand names, and doses", () => {
    expect(resolveDrug("Ibuprofen", data)?.id).toBe("ibuprofen");
    expect(resolveDrug("Advil", data)?.id).toBe("ibuprofen");
    expect(resolveDrug("Ibuprofen 200 mg tablets", data)?.id).toBe("ibuprofen");
    expect(resolveDrug("  COUMADIN 5mg ", data)?.id).toBe("warfarin");
    expect(resolveDrug("Eliquis", data)?.id).toBe("apixaban");
  });

  it("returns null for unknown or empty input", () => {
    expect(resolveDrug("zzzmed", data)).toBeNull();
    expect(resolveDrug("   ", data)).toBeNull();
  });

  it("does not guess when a phrase names two different drugs", () => {
    expect(resolveDrug("ibuprofen and warfarin", data)).toBeNull();
  });

  it("suggests near-misses but does not auto-resolve them", () => {
    expect(resolveDrug("ibuprofin", data)).toBeNull();
    expect(suggestDrugs("ibuprofin", data).map((d) => d.id)).toContain("ibuprofen");
  });
});

describe("checking a new medication", () => {
  it("flags an NSAID for someone on warfarin (the dentist scenario)", () => {
    const report = checkNewMedication(["Warfarin 5 mg"], "Ibuprofen 400 mg", data);
    expect(report.findings.map((f) => f.interaction.id)).toContain("warfarin-nsaid");
    expect(report.findings[0].interaction.severity).toBe("major");
    expect(report.statement).toMatch(/known interaction/);
  });

  it("flags metronidazole for someone on warfarin", () => {
    const report = checkNewMedication(["Coumadin"], "Flagyl", data);
    expect(report.findings.map((f) => f.interaction.id)).toEqual(["warfarin-metronidazole"]);
  });

  it("flags aspirin and NSAIDs for someone on apixaban", () => {
    const ids = checkNewMedication(["Eliquis"], "Aspirin", data).findings.map((f) => f.interaction.id);
    expect(ids).toEqual(["apixaban-aspirin"]);
    const ids2 = checkNewMedication(["Eliquis"], "Naproxen", data).findings.map((f) => f.interaction.id);
    expect(ids2).toEqual(["apixaban-nsaid"]);
  });

  it("matches in either direction", () => {
    const forward = checkNewMedication(["Plavix"], "Prilosec", data);
    const reverse = checkNewMedication(["Prilosec"], "Plavix", data);
    expect(forward.findings[0].interaction.id).toBe("clopidogrel-omeprazole");
    expect(reverse.findings[0].interaction.id).toBe("clopidogrel-omeprazole");
    expect(forward.findings[0].interaction.severity).toBe("avoid");
  });

  it("matches class-to-class pairs (opioid + benzodiazepine)", () => {
    const report = checkNewMedication(["Xanax"], "Percocet", data);
    expect(report.findings.map((f) => f.interaction.id)).toEqual(["opioid-benzodiazepine"]);
  });

  it("matches tramadol with an SSRI", () => {
    const report = checkNewMedication(["Zoloft"], "Ultram", data);
    expect(report.findings.map((f) => f.interaction.id)).toContain("tramadol-ssri");
  });

  it("sorts the most serious findings first", () => {
    const report = checkNewMedication(["Plavix", "Zoloft", "Warfarin"], "Prilosec", data);
    const severities = report.findings.map((f) => f.interaction.severity);
    expect(severities[0]).toBe("avoid");
  });

  it("never reports a drug interacting with itself", () => {
    const report = checkNewMedication(["Ibuprofen"], "Advil", data);
    expect(report.findings).toHaveLength(0);
  });

  it("says 'no known conflict', never 'safe', when nothing matches", () => {
    const report = checkNewMedication(["Warfarin"], "Vitamin D", data);
    expect(report.findings).toHaveLength(0);
    expect(report.statement).toMatch(/No known conflict found in our sources/);
    expect(report.statement).toMatch(/does not mean the combination is safe/);
    expect(report.unrecognized).toContain("Vitamin D");
    expect(report.statement).toMatch(/not checked/);
  });

  it("reports unrecognized names instead of ignoring them", () => {
    const report = checkNewMedication(["Warfarin", "Mystery Pill"], "Ibuprofen", data);
    expect(report.findings).toHaveLength(1);
    expect(report.unrecognized).toEqual(["Mystery Pill"]);
  });

  it("always includes the disclaimer", () => {
    expect(checkNewMedication([], "Ibuprofen", data).disclaimer).toMatch(/not medical advice/);
  });
});

describe("avoid-list matching", () => {
  it("treats brand and generic names as the same drug", () => {
    expect(matchesAvoidEntry("Advil", "Ibuprofen 200mg", data)).toBe(true);
  });

  it("does not infer related drugs", () => {
    expect(matchesAvoidEntry("Naproxen", "Ibuprofen", data)).toBe(false);
  });

  it("falls back to exact name match for drugs outside the dataset", () => {
    expect(matchesAvoidEntry("Mystery Pill", "mystery pill", data)).toBe(true);
    expect(matchesAvoidEntry("Mystery Pill", "Ibuprofen", data)).toBe(false);
    expect(matchesAvoidEntry("", "", data)).toBe(false);
  });
});

describe("checking a whole list", () => {
  it("finds interactions across the list and de-duplicates drugs", () => {
    const report = checkMedicationList(["Warfarin", "Coumadin", "Advil", "Eliquis"], data);
    const ids = report.findings.map((f) => f.interaction.id).sort();
    expect(ids).toEqual(["apixaban-nsaid", "warfarin-nsaid"]);
  });

  it("handles an empty list", () => {
    const report = checkMedicationList([], data);
    expect(report.findings).toHaveLength(0);
    expect(report.statement).toMatch(/No known conflict/);
  });
});
