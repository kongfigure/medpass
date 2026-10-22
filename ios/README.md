# MedPass for iOS

> **Status: written but not yet compiled.** The Swift code in this folder was written in a Linux
> environment with no Swift toolchain, so nothing here has been built or run. Expect to fix a few
> compile errors on the first build. The web app and the TypeScript core are the tested reference;
> `MedKit` is a line-by-line port of that logic.

## What is here

| Folder | What it is |
| --- | --- |
| `MedKit/` | Swift package: dataset models, name matching, and the interaction checker. Foundation only, with XCTest tests that mirror the TypeScript ones. |
| `MedPassApp/` | SwiftUI app sources (iOS 17+): medicines, avoid list, check-before-taking, and the buddy. |

Sharing a list with a doctor is **not** in the iOS app yet. The web app does that today.

## Step 1: run the package tests first

```bash
cd ios/MedKit
swift test
```

These tests should pass before you touch the app. If they fail, fix `MedKit` first. Everything else depends on it.

## Step 2: create the Xcode project

The `.xcodeproj` is not checked in, because Xcode generates it better than any hand-written file.

1. In Xcode: **File → New → Project → iOS → App**. Name it `MedPass`, interface **SwiftUI**, language **Swift**, and save it inside `ios/`.
2. **Untick "Create Git repository"** (the repo already exists).
3. Delete the generated `MedPassApp.swift` and `ContentView.swift`.
4. Drag every file from `ios/MedPassApp/` into the project. Tick **Copy items if needed: off** and add them to the `MedPass` target.
5. Add the local package: select the project, then the `MedPass` target, then **General → Frameworks, Libraries, and Embedded Content → + → Add Other… → Add Local…**, and choose `ios/MedKit`.
6. Build and run on a simulator.

## Keeping the dataset in sync

The master dataset is `data/interactions.json`. Swift packages cannot read outside their own folder, so
`MedKit` holds a copy. After editing the master, run:

```bash
./scripts/sync-dataset.sh
```

A TypeScript test fails if the two copies differ.

## Known gaps

- Share link and QR code (web only for now).
- No pill-bottle scanning yet.
- Not compiled. See the note at the top.
