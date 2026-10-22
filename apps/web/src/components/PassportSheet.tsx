import { checkMedicationList, defaultDataset, type Snapshot } from "@medpass/core";
import { useMemo } from "react";
import { Report } from "./Report";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

/**
 * The page a doctor or dentist sees. It reads from a Snapshot only, so the same
 * component renders both the preview (for the patient) and the shared link.
 */
export function PassportSheet({ snapshot }: { snapshot: Snapshot }) {
  const report = useMemo(
    () => checkMedicationList(snapshot.meds.map((m) => m.name), defaultDataset),
    [snapshot],
  );

  return (
    <article className="sheet">
      <header className="sheet-head">
        <h2>{snapshot.owner ? `${snapshot.owner}'s medication list` : "Medication list"}</h2>
        <p className="sheet-date">Made on {formatDate(snapshot.createdAt)}. It may have changed since.</p>
      </header>

      <section aria-labelledby="sheet-meds">
        <h3 id="sheet-meds">Current medicines</h3>
        {snapshot.meds.length === 0 ? (
          <p className="muted">No medicines listed.</p>
        ) : (
          <table className="sheet-table">
            <thead>
              <tr>
                <th scope="col">Medicine</th>
                <th scope="col">Dose</th>
                <th scope="col">Prescribed by</th>
                <th scope="col">Notes</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.meds.map((m, i) => (
                <tr key={`${m.name}-${i}`}>
                  <th scope="row">{m.name}</th>
                  <td data-label="Dose">{m.dose ?? ""}</td>
                  <td data-label="Prescribed by">{m.prescriber ?? ""}</td>
                  <td data-label="Notes">{m.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section aria-labelledby="sheet-avoid" className="sheet-avoid">
        <h3 id="sheet-avoid">Medicines to avoid, noted by the patient</h3>
        {snapshot.avoid.length === 0 ? (
          <p className="muted">None noted.</p>
        ) : (
          <ul>
            {snapshot.avoid.map((a, i) => (
              <li key={`${a.name}-${i}`}>
                <strong>{a.name}</strong>
                {a.reason ? `: ${a.reason}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sheet-check">
        <h3 id="sheet-check">Known interaction warnings on this list</h3>
        <Report report={report} />
      </section>
    </article>
  );
}
