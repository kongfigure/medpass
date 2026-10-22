import { checkMedicationList, defaultDataset } from "@medpass/core";
import { useMemo, useState } from "react";
import { DrugInput } from "../components/DrugInput";
import { Report } from "../components/Report";
import { uid, type AppState } from "../store";

interface Props {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}

export function MedsScreen({ state, update }: Props) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [prescriber, setPrescriber] = useState("");
  const [notes, setNotes] = useState("");

  const [avoidName, setAvoidName] = useState("");
  const [avoidReason, setAvoidReason] = useState("");

  const listReport = useMemo(
    () => checkMedicationList(state.meds.map((m) => m.name), defaultDataset),
    [state.meds],
  );

  function addMed(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    update((prev) => ({
      ...prev,
      meds: [...prev.meds, { id: uid(), name: clean, dose: dose.trim(), prescriber: prescriber.trim(), notes: notes.trim() }],
    }));
    setName("");
    setDose("");
    setPrescriber("");
    setNotes("");
  }

  function addAvoid(e: React.FormEvent) {
    e.preventDefault();
    const clean = avoidName.trim();
    if (!clean) return;
    update((prev) => ({
      ...prev,
      avoid: [...prev.avoid, { id: uid(), name: clean, reason: avoidReason.trim() }],
    }));
    setAvoidName("");
    setAvoidReason("");
  }

  return (
    <div className="screen">
      <section aria-labelledby="meds-title">
        <h2 id="meds-title">My medicines</h2>
        {state.meds.length === 0 ? (
          <p className="empty">Nothing here yet. Add the medicines you take now, including ones from past surgeries or other clinics.</p>
        ) : (
          <ul className="rows">
            {state.meds.map((m) => (
              <li key={m.id} className="row">
                <div>
                  <strong>{m.name}</strong>
                  {m.dose && <span className="row-meta"> {m.dose}</span>}
                  {(m.prescriber || m.notes) && (
                    <p className="row-sub">{[m.prescriber && `Prescribed by ${m.prescriber}`, m.notes].filter(Boolean).join(". ")}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => update((prev) => ({ ...prev, meds: prev.meds.filter((x) => x.id !== m.id) }))}
                  aria-label={`Remove ${m.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <form className="form" onSubmit={addMed}>
          <h3>Add a medicine</h3>
          <DrugInput label="Medicine name" value={name} onChange={setName} placeholder="For example, Warfarin or Advil" />
          <label className="field">
            <span className="field-label">Dose and how often</span>
            <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="5 mg once a day" />
          </label>
          <label className="field">
            <span className="field-label">Prescribed by</span>
            <input value={prescriber} onChange={(e) => setPrescriber(e.target.value)} placeholder="Doctor or clinic" />
          </label>
          <label className="field">
            <span className="field-label">Notes</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Started after surgery in March" />
          </label>
          <button type="submit" className="btn" disabled={!name.trim()}>
            Add to my list
          </button>
        </form>
      </section>

      {state.meds.length > 1 && (
        <section aria-labelledby="list-check-title">
          <h2 id="list-check-title">Checks on my list</h2>
          <Report report={listReport} showDisclaimer={false} />
        </section>
      )}

      <section aria-labelledby="avoid-title">
        <h2 id="avoid-title">Medicines to avoid</h2>
        <p className="muted">
          Write down anything that caused you or your family trouble, and why. Doctors who see your list will see this too.
        </p>
        {state.avoid.length > 0 && (
          <ul className="rows">
            {state.avoid.map((a) => (
              <li key={a.id} className="row">
                <div>
                  <strong>{a.name}</strong>
                  {a.reason && <p className="row-sub">{a.reason}</p>}
                </div>
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => update((prev) => ({ ...prev, avoid: prev.avoid.filter((x) => x.id !== a.id) }))}
                  aria-label={`Remove ${a.name} from avoid list`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="form" onSubmit={addAvoid}>
          <h3>Add one to avoid</h3>
          <DrugInput label="Medicine name" value={avoidName} onChange={setAvoidName} placeholder="For example, Ibuprofen" />
          <label className="field">
            <span className="field-label">What happened</span>
            <input value={avoidReason} onChange={(e) => setAvoidReason(e.target.value)} placeholder="Bled a lot when taken with warfarin" />
          </label>
          <button type="submit" className="btn" disabled={!avoidName.trim()}>
            Add to avoid list
          </button>
        </form>
      </section>
    </div>
  );
}
