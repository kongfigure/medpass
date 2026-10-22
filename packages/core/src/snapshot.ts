/**
 * A Snapshot is the read-only copy of a medication list that a patient hands to a new
 * doctor or dentist. It is packed into the URL *fragment* (the part after '#'), which
 * browsers never send to a server, so the data stays between the patient and whoever
 * they give the link to.
 */

export interface SnapshotMed {
  name: string;
  dose?: string;
  prescriber?: string;
  notes?: string;
}

export interface SnapshotAvoid {
  name: string;
  reason: string;
}

export interface Snapshot {
  v: 1;
  createdAt: string; // ISO date-time
  owner?: string;
  meds: SnapshotMed[];
  avoid: SnapshotAvoid[];
}

export const LIMITS = {
  maxMeds: 60,
  maxAvoid: 40,
  maxField: 240,
  maxOwner: 80,
  /** Hard cap on decompressed size, to refuse decompression bombs. */
  maxDecodedBytes: 64 * 1024,
} as const;

function clip(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function clipOptional(value: unknown, max: number): string | undefined {
  const s = clip(value, max).trim();
  return s ? s : undefined;
}

/** Validate untrusted input and return a clean Snapshot. Throws on anything malformed. */
export function sanitizeSnapshot(input: unknown): Snapshot {
  if (typeof input !== "object" || input === null) throw new Error("Invalid snapshot");
  const raw = input as Record<string, unknown>;
  if (raw.v !== 1) throw new Error("Unsupported snapshot version");
  if (!Array.isArray(raw.meds) || !Array.isArray(raw.avoid)) throw new Error("Invalid snapshot");

  const created = typeof raw.createdAt === "string" ? new Date(raw.createdAt) : null;
  if (!created || Number.isNaN(created.getTime())) throw new Error("Invalid snapshot date");

  const meds: SnapshotMed[] = [];
  for (const item of raw.meds.slice(0, LIMITS.maxMeds)) {
    if (typeof item !== "object" || item === null) continue;
    const m = item as Record<string, unknown>;
    const name = clip(m.name, LIMITS.maxField).trim();
    if (!name) continue;
    meds.push({
      name,
      dose: clipOptional(m.dose, LIMITS.maxField),
      prescriber: clipOptional(m.prescriber, LIMITS.maxField),
      notes: clipOptional(m.notes, LIMITS.maxField),
    });
  }

  const avoid: SnapshotAvoid[] = [];
  for (const item of raw.avoid.slice(0, LIMITS.maxAvoid)) {
    if (typeof item !== "object" || item === null) continue;
    const a = item as Record<string, unknown>;
    const name = clip(a.name, LIMITS.maxField).trim();
    if (!name) continue;
    avoid.push({ name, reason: clip(a.reason, LIMITS.maxField).trim() });
  }

  return {
    v: 1,
    createdAt: created.toISOString(),
    owner: clipOptional(raw.owner, LIMITS.maxOwner),
    meds,
    avoid,
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function readAll(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Snapshot is too large");
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export async function encodeSnapshot(snapshot: Snapshot): Promise<string> {
  const clean = sanitizeSnapshot(snapshot);
  const bytes = new TextEncoder().encode(JSON.stringify(clean));
  const compressed = await readAll(
    new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw")),
    LIMITS.maxDecodedBytes,
  );
  return toBase64Url(compressed);
}

export async function decodeSnapshot(encoded: string): Promise<Snapshot> {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length > 200_000) {
    throw new Error("This link is not a valid MedPass snapshot");
  }
  try {
    const compressed = fromBase64Url(encoded);
    const bytes = await readAll(
      new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw")),
      LIMITS.maxDecodedBytes,
    );
    return sanitizeSnapshot(JSON.parse(new TextDecoder().decode(bytes)));
  } catch (error) {
    if (error instanceof Error && error.message === "Snapshot is too large") throw error;
    throw new Error("This link is not a valid MedPass snapshot");
  }
}
