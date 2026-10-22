import { encodeSnapshot, type Snapshot } from "@medpass/core";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { PassportSheet } from "../components/PassportSheet";
import type { AppState } from "../store";

const QR_MAX_LENGTH = 1800;

interface Props {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}

export function ShareScreen({ state, update }: Props) {
  const [link, setLink] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const snapshot: Snapshot = useMemo(
    () => ({
      v: 1,
      createdAt: new Date().toISOString(),
      owner: state.owner.trim() || undefined,
      meds: state.meds.map((m) => ({
        name: m.name,
        dose: m.dose || undefined,
        prescriber: m.prescriber || undefined,
        notes: m.notes || undefined,
      })),
      avoid: state.avoid.map((a) => ({ name: a.name, reason: a.reason })),
    }),
    [state.owner, state.meds, state.avoid],
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("");
    encodeSnapshot(snapshot)
      .then(async (encoded) => {
        const url = `${window.location.origin}${window.location.pathname}#/share/${encoded}`;
        if (cancelled) return;
        setLink(url);
        if (url.length <= QR_MAX_LENGTH) {
          const png = await QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: "M" });
          if (!cancelled) setQr(png);
        } else {
          setQr("");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("Could not build the link. Try shortening the notes on your medicines.");
      });
    return () => {
      cancelled = true;
    };
  }, [snapshot]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("Link copied.");
    } catch {
      setStatus("Could not copy automatically. Select the link below and copy it.");
    }
  }

  const empty = state.meds.length === 0 && state.avoid.length === 0;

  return (
    <div className="screen">
      <section aria-labelledby="share-title" className="no-print">
        <h2 id="share-title">Show my list to a doctor</h2>
        <p className="muted">
          This makes a read-only copy of your list. The data travels inside the link itself and is not stored on any
          server. Anyone with the link can read it, so share it only with people you trust.
        </p>
        <label className="field">
          <span className="field-label">Name on the list</span>
          <input
            value={state.owner}
            onChange={(e) => update((prev) => ({ ...prev, owner: e.target.value }))}
            placeholder="Your name"
            autoComplete="name"
          />
        </label>

        {empty ? (
          <p className="empty">Add at least one medicine first, then come back here.</p>
        ) : (
          <div className="share-actions">
            {qr ? (
              <figure className="qr">
                <img src={qr} alt="QR code that opens your medication list" width={240} height={240} />
                <figcaption>Let the doctor scan this with a phone camera.</figcaption>
              </figure>
            ) : (
              link && <p className="muted">This list is too long for a QR code. Use the link or print it.</p>
            )}
            <div className="btn-row">
              <button type="button" className="btn" onClick={copy} disabled={!link}>
                Copy link
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                Print or save as PDF
              </button>
            </div>
            <p className="status" role="status">
              {status}
            </p>
          </div>
        )}
      </section>

      {!empty && (
        <section aria-labelledby="preview-title">
          <h2 id="preview-title" className="no-print">
            What the doctor will see
          </h2>
          <PassportSheet snapshot={snapshot} />
        </section>
      )}
    </div>
  );
}
