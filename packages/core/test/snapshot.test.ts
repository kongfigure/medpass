import { describe, expect, it } from "vitest";
import { LIMITS, decodeSnapshot, encodeSnapshot, sanitizeSnapshot, type Snapshot } from "../src";

const sample: Snapshot = {
  v: 1,
  createdAt: "2026-10-22T20:00:00.000Z",
  owner: "Dad",
  meds: [
    { name: "Warfarin", dose: "5 mg daily", prescriber: "Dr. Lim", notes: "After surgery" },
    { name: "Lisinopril", dose: "10 mg" },
  ],
  avoid: [{ name: "Ibuprofen", reason: "Bled heavily when taken with warfarin" }],
};

describe("snapshot codec", () => {
  it("round-trips a snapshot", async () => {
    const encoded = await encodeSnapshot(sample);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeSnapshot(encoded)).toEqual(sample);
  });

  it("round-trips non-Latin text", async () => {
    const s: Snapshot = { ...sample, owner: "阿爸", meds: [{ name: "华法林", notes: "每天一次" }] };
    expect(await decodeSnapshot(await encodeSnapshot(s))).toEqual(s);
  });

  it("produces a link short enough for a QR code on a typical list", async () => {
    expect((await encodeSnapshot(sample)).length).toBeLessThan(500);
  });

  it("rejects garbage", async () => {
    await expect(decodeSnapshot("not a snapshot!")).rejects.toThrow(/not a valid/);
    await expect(decodeSnapshot("AAAA")).rejects.toThrow(/not a valid/);
    await expect(decodeSnapshot("")).rejects.toThrow(/not a valid/);
  });

  it("rejects a decompression bomb", async () => {
    const big: Snapshot = { ...sample, meds: [{ name: "x", notes: "y".repeat(LIMITS.maxField) }] };
    // Build an oversized payload by hand: highly compressible, huge once expanded.
    const huge = JSON.stringify({ ...big, filler: "a".repeat(LIMITS.maxDecodedBytes * 4) });
    const stream = new Blob([new TextEncoder().encode(huge)])
      .stream()
      .pipeThrough(new CompressionStream("deflate-raw"));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    let binary = "";
    for (const b of compressed) binary += String.fromCharCode(b);
    const encoded = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    await expect(decodeSnapshot(encoded)).rejects.toThrow(/too large/);
  });
});

describe("sanitizeSnapshot", () => {
  it("drops entries without names and trims fields", () => {
    const clean = sanitizeSnapshot({
      v: 1,
      createdAt: "2026-10-22T20:00:00Z",
      meds: [{ name: "  " }, { name: " Warfarin ", dose: "  " }, null, 5],
      avoid: [{ name: "", reason: "x" }],
    });
    expect(clean.meds).toEqual([{ name: "Warfarin", dose: undefined, prescriber: undefined, notes: undefined }]);
    expect(clean.avoid).toEqual([]);
  });

  it("caps list and field lengths", () => {
    const clean = sanitizeSnapshot({
      v: 1,
      createdAt: "2026-10-22T20:00:00Z",
      meds: Array.from({ length: 500 }, () => ({ name: "n".repeat(1000) })),
      avoid: [],
    });
    expect(clean.meds).toHaveLength(LIMITS.maxMeds);
    expect(clean.meds[0].name).toHaveLength(LIMITS.maxField);
  });

  it("rejects wrong versions, shapes, and dates", () => {
    expect(() => sanitizeSnapshot(null)).toThrow();
    expect(() => sanitizeSnapshot({ v: 2, createdAt: "2026-10-22", meds: [], avoid: [] })).toThrow();
    expect(() => sanitizeSnapshot({ v: 1, createdAt: "nope", meds: [], avoid: [] })).toThrow();
    expect(() => sanitizeSnapshot({ v: 1, createdAt: "2026-10-22", meds: "x", avoid: [] })).toThrow();
  });
});
