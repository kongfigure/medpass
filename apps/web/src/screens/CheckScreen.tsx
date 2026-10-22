import { checkNewMedication, defaultDataset, matchesAvoidEntry, type CheckReport } from "@medpass/core";
import { useEffect, useRef, useState } from "react";
import { DrugInput } from "../components/DrugInput";
import { Report } from "../components/Report";
import type { AppState } from "../store";

interface Result {
  checked: string;
  report: CheckReport;
  avoidHits: { name: string; reason: string }[];
}

export function CheckScreen({ state }: { state: AppState }) {
  const [candidate, setCandidate] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);

  // Move focus to the result so it is announced and scrolled into view after checking.
  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);

  function run(e: React.FormEvent) {
    e.preventDefault();
    const name = candidate.trim();
    if (!name) return;
    setResult({
      checked: name,
      report: checkNewMedication(state.meds.map((m) => m.name), name, defaultDataset),
      avoidHits: state.avoid.filter((a) => matchesAvoidEntry(name, a.name, defaultDataset)),
    });
  }

  return (
    <div className="screen">
      <section aria-labelledby="check-title">
        <h2 id="check-title">Before I take something new</h2>
        <p className="muted">
          A doctor, dentist, or pharmacist offers you a new medicine. Type it here to compare it with your list
          {state.meds.length === 0 ? ", once you have added what you take now." : "."}
        </p>
        <form className="form" onSubmit={run}>
          <DrugInput label="New medicine" value={candidate} onChange={setCandidate} placeholder="For example, Ibuprofen or Flagyl" autoFocus />
          <button type="submit" className="btn" disabled={!candidate.trim()}>
            Check against my list
          </button>
        </form>
      </section>

      {result && (
        <section aria-labelledby="result-title">
          <h2 id="result-title" ref={resultHeading} tabIndex={-1}>
            Result for {result.checked}
          </h2>
          {result.avoidHits.map((a) => (
            <article key={a.name} className="finding finding-avoid">
              <header className="finding-head">
                <span className="finding-badge">On your avoid list</span>
                <h3>{a.name}</h3>
              </header>
              <p>{a.reason || "You noted this medicine to avoid."}</p>
              <p className="finding-action">
                <strong>What to do:</strong> Tell the person offering it, and ask for an alternative.
              </p>
            </article>
          ))}
          <Report report={result.report} showDisclaimer={false} />
        </section>
      )}
    </div>
  );
}
