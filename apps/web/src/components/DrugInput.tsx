import { defaultDataset, resolveDrug, suggestDrugs } from "@medpass/core";
import { useId } from "react";

/** Names offered in the autocomplete list: generic names plus brand names. */
const OPTIONS = Array.from(
  new Set(defaultDataset.drugs.flatMap((d) => [d.name, ...d.aliases.map((a) => a[0].toUpperCase() + a.slice(1))])),
).sort((a, b) => a.localeCompare(b));

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function DrugInput({ label, value, onChange, placeholder, autoFocus }: Props) {
  const listId = useId();
  const hintId = useId();
  const trimmed = value.trim();
  const drug = trimmed ? resolveDrug(trimmed, defaultDataset) : null;
  const suggestions = trimmed && !drug ? suggestDrugs(trimmed, defaultDataset) : [];

  let hint: React.ReactNode = null;
  if (drug) {
    hint = <>Recognized as {drug.name}. It can be checked.</>;
  } else if (suggestions.length > 0) {
    hint = (
      <>
        Not recognized. Did you mean{" "}
        {suggestions.map((s, i) => (
          <span key={s.id}>
            {i > 0 && " or "}
            <button type="button" className="link-button" onClick={() => onChange(s.name)}>
              {s.name}
            </button>
          </span>
        ))}
        ?
      </>
    );
  } else if (trimmed) {
    hint = <>Not in our starter list, so it can be saved but not checked for interactions.</>;
  }

  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        value={value}
        list={listId}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCapitalize="words"
        spellCheck={false}
        aria-describedby={hint ? hintId : undefined}
      />
      <datalist id={listId}>
        {OPTIONS.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      {hint && (
        <span id={hintId} className={drug ? "hint hint-ok" : "hint"}>
          {hint}
        </span>
      )}
    </label>
  );
}
