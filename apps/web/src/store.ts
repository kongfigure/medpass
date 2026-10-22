import { useCallback, useEffect, useState } from "react";
import { DEFAULT_BUDDY, type BuddyConfig } from "./buddy";

export interface Med {
  id: string;
  name: string;
  dose: string;
  prescriber: string;
  notes: string;
}

export interface AvoidItem {
  id: string;
  name: string;
  reason: string;
}

export interface AppState {
  owner: string;
  meds: Med[];
  avoid: AvoidItem[];
  buddy: BuddyConfig;
}

const KEY = "medpass:v1";

const EMPTY: AppState = { owner: "", meds: [], avoid: [], buddy: DEFAULT_BUDDY };

export function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Read saved state defensively: anything malformed falls back to empty. */
function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return EMPTY;
    const meds = Array.isArray(data.meds)
      ? data.meds.filter(isRecord).map((m) => ({
          id: str(m.id) || uid(),
          name: str(m.name),
          dose: str(m.dose),
          prescriber: str(m.prescriber),
          notes: str(m.notes),
        }))
      : [];
    const avoid = Array.isArray(data.avoid)
      ? data.avoid.filter(isRecord).map((a) => ({
          id: str(a.id) || uid(),
          name: str(a.name),
          reason: str(a.reason),
        }))
      : [];
    const b = isRecord(data.buddy) ? data.buddy : {};
    const buddy: BuddyConfig = {
      name: str(b.name) || DEFAULT_BUDDY.name,
      color: str(b.color) || DEFAULT_BUDDY.color,
      accessories: Array.isArray(b.accessories)
        ? b.accessories.filter((x): x is string => typeof x === "string")
        : [],
    };
    return { owner: str(data.owner), meds: meds.filter((m) => m.name), avoid: avoid.filter((a) => a.name), buddy };
  } catch {
    return EMPTY;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode, full disk). The app keeps working in memory.
    }
  }, [state]);

  const update = useCallback((fn: (prev: AppState) => AppState) => setState(fn), []);
  return [state, update] as const;
}
