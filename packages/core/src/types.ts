export type Severity = "avoid" | "major" | "monitor";

export interface DrugClass {
  id: string;
  name: string;
  members: string[];
}

export interface Drug {
  id: string;
  name: string;
  aliases: string[];
}

export interface Source {
  title: string;
  section: string;
  url: string;
  note?: string;
  retrievedOn: string;
}

export interface Interaction {
  id: string;
  /** A drug id, or "class:<classId>" */
  a: string;
  /** A drug id, or "class:<classId>" */
  b: string;
  severity: Severity;
  summary: string;
  why: string;
  action: string;
  source: Source;
}

export interface Dataset {
  meta: {
    version: string;
    reviewedOn: string;
    scope: string;
    severityLevels: Record<Severity, string>;
  };
  classes: DrugClass[];
  drugs: Drug[];
  interactions: Interaction[];
}

export interface Finding {
  interaction: Interaction;
  /** The drug on the patient's list (or the first drug in a pair check) */
  drugA: Drug;
  /** The drug being checked against it */
  drugB: Drug;
}

export interface CheckReport {
  findings: Finding[];
  /** Names the user typed that we could not identify, so they were NOT checked. */
  unrecognized: string[];
  /** Always shown with the report. Never says a combination is safe. */
  statement: string;
  disclaimer: string;
}
