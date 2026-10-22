import type { CheckReport, Finding, Severity } from "@medpass/core";

const SEVERITY_LABEL: Record<Severity, string> = {
  avoid: "Do not combine",
  major: "Serious caution",
  monitor: "Ask before combining",
};

/** Each severity has its own shape, so meaning never depends on color alone. */
export function SeverityIcon({ severity }: { severity: Severity }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", "aria-hidden": true, fill: "none" } as const;
  if (severity === "avoid") {
    return (
      <svg {...common} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M6 18L18 6" />
      </svg>
    );
  }
  if (severity === "major") {
    return (
      <svg {...common} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L22 20H2z" />
        <path d="M12 10v4.5M12 17.2v.1" />
      </svg>
    );
  }
  return (
    <svg {...common} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.1" />
    </svg>
  );
}

export function FindingCard({ finding }: { finding: Finding }) {
  const { interaction: i, drugA, drugB } = finding;
  return (
    <article className={`finding finding-${i.severity}`}>
      <header className="finding-head">
        <span className="finding-badge">
          <SeverityIcon severity={i.severity} />
          {SEVERITY_LABEL[i.severity]}
        </span>
        <h3>
          {drugA.name} and {drugB.name}
        </h3>
      </header>
      <p className="finding-summary">{i.summary}</p>
      <p>{i.why}</p>
      <p className="finding-action">
        <strong>What to do:</strong> {i.action}
      </p>
      <p className="finding-source">
        Source:{" "}
        <a href={i.source.url} target="_blank" rel="noopener noreferrer">
          {i.source.title}
        </a>
        , {i.source.section}. Checked {i.source.retrievedOn}.{i.source.note ? ` ${i.source.note}` : ""}
      </p>
    </article>
  );
}

export function Report({ report, showDisclaimer = true }: { report: CheckReport; showDisclaimer?: boolean }) {
  return (
    <section className="report" aria-live="polite">
      <p className={report.findings.length > 0 ? "report-statement has-findings" : "report-statement"}>
        {report.statement}
      </p>
      {report.unrecognized.length > 0 && report.findings.length > 0 && (
        <p className="report-unrecognized">
          Not checked, because we could not identify: {report.unrecognized.join(", ")}.
        </p>
      )}
      <div className="findings">
        {report.findings.map((f) => (
          <FindingCard key={`${f.interaction.id}-${f.drugA.id}-${f.drugB.id}`} finding={f} />
        ))}
      </div>
      {showDisclaimer && <p className="disclaimer">{report.disclaimer}</p>}
    </section>
  );
}
