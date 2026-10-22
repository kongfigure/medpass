import { checkMedicationList, defaultDataset } from "@medpass/core";
import { useEffect, useMemo, useState } from "react";
import type { Mood } from "./buddy";
import { Blob } from "./components/Blob";
import { BuddyScreen } from "./screens/BuddyScreen";
import { CheckScreen } from "./screens/CheckScreen";
import { MedsScreen } from "./screens/MedsScreen";
import { ShareScreen } from "./screens/ShareScreen";
import { SharedView } from "./screens/SharedView";
import { useAppState } from "./store";

type Tab = "meds" | "check" | "share" | "buddy";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "meds", label: "My meds", icon: "M7 4h10a3 3 0 013 3v10a3 3 0 01-3 3H7a3 3 0 01-3-3V7a3 3 0 013-3zm0 4h10M7 12h6" },
  { id: "check", label: "Check", icon: "M20 6L9 17l-5-5" },
  { id: "share", label: "Share", icon: "M12 3v12m0-12l-4 4m4-4l4 4M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5" },
  { id: "buddy", label: "Buddy", icon: "M12 4c5 0 8 3 8 8s-3 8-8 8-8-3-8-8 3-8 8-8zm-3 7h.01M15 11h.01M9.5 15c1.5 1.2 3.5 1.2 5 0" },
];

function useHashRoute(): string {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export function App() {
  const hash = useHashRoute();
  const shared = hash.startsWith("#/share/") ? hash.slice("#/share/".length) : null;
  if (shared !== null) return <SharedView encoded={shared} />;
  return <Home />;
}

function Home() {
  const [state, update] = useAppState();
  const [tab, setTab] = useState<Tab>("meds");

  const report = useMemo(
    () => checkMedicationList(state.meds.map((m) => m.name), defaultDataset),
    [state.meds],
  );

  let mood: Mood = "happy";
  let message = "Your list is saved on this device. Show it at every new appointment.";
  if (state.meds.length === 0) {
    mood = "sleepy";
    message = "Add the medicines you take, and I will keep them handy.";
  } else if (report.findings.length > 0) {
    mood = "concerned";
    message = "I found something worth asking your pharmacist about. Check My meds.";
  }

  return (
    <div className="app">
      <header className="top no-print">
        <Blob config={state.buddy} mood={mood} size={96} />
        <div className="bubble" role="status">
          <p className="bubble-name">{state.buddy.name}</p>
          <p>{message}</p>
        </div>
      </header>

      <main id="main">
        {tab === "meds" && <MedsScreen state={state} update={update} />}
        {tab === "check" && <CheckScreen state={state} />}
        {tab === "share" && <ShareScreen state={state} update={update} />}
        {tab === "buddy" && <BuddyScreen state={state} update={update} />}
        {tab !== "share" && (
          <p className="app-note no-print">
            MedPass is an organizer, not medical advice. Confirm every medicine decision with your doctor or pharmacist.
          </p>
        )}
      </main>

      <nav className="tabs no-print" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="tab"
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
