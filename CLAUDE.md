# MedPass

Patient-held medication passport. Web app (React + Vite), shared TypeScript core, Swift port for iOS.

## Layout
- `data/interactions.json`: master, sourced interaction dataset. Every entry needs a label source, section, and retrieval date.
- `packages/core`: matcher, name resolution, share-link codec. All logic lives here and is unit tested.
- `apps/web`: React PWA. Thin UI over core. State in localStorage only.
- `ios/MedKit`, `ios/MedPassApp`: Swift port and SwiftUI app. Written without a compiler; build and test on a Mac first.
- `docs/safety-and-privacy.md`: design rules. Read before changing wording or matching behavior.

## Commands
- Tests: `npm test`
- Typecheck core: `npm run typecheck --workspace @medpass/core`
- Dev server: `npm run dev`
- Production build: `npm run build`
- After editing the dataset: `./scripts/sync-dataset.sh` (a test fails if the iOS copy differs)
- iOS logic tests (on a Mac): `cd ios/MedKit && swift test`

## Rules
- Never write that a combination is "safe". Use "no known conflict found in our sources" with the caveat.
- Names that cannot be identified must be reported as not checked, never ignored.
- Never auto-correct a drug name; suggestions require user confirmation.
- Do not add an interaction without reading it in a primary source. Do not make the wording stronger than the label.
- Severity must always have a text label and a shape, not color alone.
- Keep medication data on the device. No analytics, no sending list contents to any server.
- Every behavior change in core needs a test, and the Swift port in `ios/MedKit` must match it.
