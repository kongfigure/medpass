# Safety and privacy decisions

MedPass handles health information and talks about drug risks, so the design choices below were made on purpose.
If you change any of them, change this document too.

## What the app will and will not say

1. **It never says a combination is safe.** The strongest statement is: "No known conflict found in our
   sources. This does not mean the combination is safe." This is covered by tests in both the TypeScript and Swift packages.
2. **It says what it could not check.** If a medicine name is not recognized, the result lists it as not checked.
   An unrecognized name must never look like a clean result.
3. **It does not guess.** Name matching is exact (generic names, brand names, doses and forms stripped). A near-miss
   such as "ibuprofin" produces a suggestion the user taps to confirm. The app never runs a check on a guess.
4. **It does not escalate the label.** Severity comes from the label's own wording:
   - `avoid`: the label contraindicates the pair or says to avoid it.
   - `major`: the label describes a serious risk and calls for caution.
   - `monitor`: the label says the pair may cause a problem and advises monitoring or checking with a clinician.
5. **Severity is never color alone.** Each level has a text label and its own shape.
6. **Every warning shows its source,** the label section, and the date it was checked, with a note when the
   source is an older label version or a third-party copy of the label text.
7. **Every screen points back to a pharmacist or doctor.** The tone is a conversation starter ("ask before combining"), not an instruction to stop a medicine.

## Adding or changing an interaction

1. Find the statement in a primary source: an FDA label (DailyMed or accessdata.fda.gov), or an FDA safety communication.
2. Record the label section, the URL, and the date you read it. Quote nothing you did not read.
3. Write the plain-language summary so it says no more than the label does.
4. Add the entry to `data/interactions.json`, run `./scripts/sync-dataset.sh`, and run `npm test`.
   The integrity tests fail if a drug reference is unknown, a source is missing, or the iOS copy differs.

## Current source caveats

- Warfarin, tramadol, and sildenafil entries were read from MedLibrary pages that reproduce FDA label text. Confirm on DailyMed.
- The metronidazole entry was read from a third-party site reproducing the label. Confirm on DailyMed.
- The clopidogrel (2019) and lisinopril (2014) entries come from older label versions on accessdata.fda.gov. Newer versions may differ.
- The opioid and benzodiazepine entry comes from an FDA Safety Labeling Change Notification whose retrieved copy shows no letter date.

## Privacy

- Medicines, avoid-list entries, and buddy settings are stored only on the device (browser storage on the web, a file in Application Support on iOS). There are no accounts and no analytics.
- Typing a medicine name into the app does not send it anywhere. Matching runs on the device.
- A shared link contains the list **inside the URL fragment** (the part after `#`). Browsers do not send the fragment to servers, so the
  site hosting the app never receives it. Anyone who has the link can read the list, and the app says so before the link is created.
- A shared snapshot is treated as untrusted input: it is validated, strings and list lengths are capped, and decompression is limited to 64 KB so a crafted link cannot exhaust memory.
- Shared data is rendered as text by React, never as HTML.
- The service worker caches only the app shell. It never touches medication data.

## Not a medical device

MedPass does not diagnose, treat, or give dosing advice. It is a personal organizer that surfaces published warnings.
