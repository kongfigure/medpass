import { Blob } from "../components/Blob";
import { ACCESSORIES, BUDDY_COLORS } from "../buddy";
import type { AppState } from "../store";

interface Props {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}

export function BuddyScreen({ state, update }: Props) {
  const { buddy } = state;
  const set = (patch: Partial<typeof buddy>) => update((prev) => ({ ...prev, buddy: { ...prev.buddy, ...patch } }));

  function toggle(id: string) {
    set({
      accessories: buddy.accessories.includes(id)
        ? buddy.accessories.filter((a) => a !== id)
        : [...buddy.accessories, id],
    });
  }

  return (
    <div className="screen">
      <section aria-labelledby="buddy-title" className="buddy-stage">
        <h2 id="buddy-title">Your buddy</h2>
        <Blob config={buddy} size={220} />
        <label className="field buddy-name">
          <span className="field-label">Name</span>
          <input value={buddy.name} maxLength={20} onChange={(e) => set({ name: e.target.value })} />
        </label>
      </section>

      <fieldset className="choices">
        <legend>Color</legend>
        <div className="swatches">
          {BUDDY_COLORS.map((c) => (
            <label key={c.id} className="swatch" title={c.label}>
              <input
                type="radio"
                name="buddy-color"
                value={c.id}
                checked={buddy.color === c.id}
                onChange={() => set({ color: c.id })}
              />
              <span className="swatch-dot" style={{ background: c.id }} />
              <span className="sr-only">{c.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="choices">
        <legend>Accessories</legend>
        <div className="chips">
          {ACCESSORIES.map((a) => (
            <label key={a.id} className="chip">
              <input type="checkbox" checked={buddy.accessories.includes(a.id)} onChange={() => toggle(a.id)} />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
