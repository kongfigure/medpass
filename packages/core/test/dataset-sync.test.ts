import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

describe("dataset copies", () => {
  it("keeps the iOS package copy identical to data/interactions.json", () => {
    const master = readFileSync(resolve(root, "data/interactions.json"), "utf8");
    const ios = readFileSync(resolve(root, "ios/MedKit/Sources/MedKit/Resources/interactions.json"), "utf8");
    expect(ios, "Run scripts/sync-dataset.sh to refresh the iOS copy").toBe(master);
  });
});
