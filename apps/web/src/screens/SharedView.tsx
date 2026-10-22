import { decodeSnapshot, type Snapshot } from "@medpass/core";
import { useEffect, useState } from "react";
import { PassportSheet } from "../components/PassportSheet";

export function SharedView({ encoded }: { encoded: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    decodeSnapshot(encoded)
      .then((s) => !cancelled && setSnapshot(s))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "This link could not be opened."));
    return () => {
      cancelled = true;
    };
  }, [encoded]);

  return (
    <main className="shared">
      <p className="shared-banner no-print">
        You are viewing a read-only copy shared with you. Nothing here is saved or sent anywhere.
      </p>
      {error && (
        <div className="empty" role="alert">
          <p>{error}.</p>
          <p>Ask the person who shared it to send the link again, making sure the whole link was copied.</p>
        </div>
      )}
      {snapshot && <PassportSheet snapshot={snapshot} />}
      <div className="shared-footer no-print">
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <a className="link" href={`${window.location.pathname}#/`}>
          Make my own MedPass list
        </a>
      </div>
    </main>
  );
}
