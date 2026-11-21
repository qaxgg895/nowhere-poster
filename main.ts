// VELMARA — a travel poster for a place that does not exist.
//
// main.ts is the entrypoint of this make.fun entry. It ships the poster
// image with the repository (poster.png) and writes it to /output/entry.png,
// the artifact the gate checks and the judge compares. The program runs in
// a sandbox with no network, so everything it needs travels in the repo.
//
// VELMARA: a cliffside town of whitewashed houses under a great stone arch,
// the sun setting through it over a turquoise bay — a place you cannot visit,
// drawn as a vintage Art Deco travel poster.

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(HERE, "poster.png");
const OUTPUT = "/output/entry.png";

// The gate's limits for this bounty: a whole PNG or JPEG, at most 1 MiB
// and at most 1024 by 1024 pixels. Check them here so a bad artifact fails
// loudly at build time instead of silently scoring 0.
const MAX_BYTES = 1_048_576;
const MAX_DIMENSION = 1024;

// A PNG starts with an 8-byte signature, then the IHDR chunk whose first
// 8 data bytes are the width and height as big-endian uint32s.
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function dimensionsOfPng(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("poster.png is not a PNG file");
  }
  if (bytes.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("poster.png has no IHDR chunk where one belongs");
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

const bytes = readFileSync(SOURCE);

if (bytes.length > MAX_BYTES) {
  throw new Error(`poster.png is ${bytes.length} bytes, over the ${MAX_BYTES} byte limit`);
}
const { width, height } = dimensionsOfPng(bytes);
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  throw new Error(`poster.png is ${width}x${height}, over the ${MAX_DIMENSION}x${MAX_DIMENSION} limit`);
}

mkdirSync("/output", { recursive: true });
writeFileSync(OUTPUT, bytes);

const sha256 = createHash("sha256").update(bytes).digest("hex");
console.log(`VELMARA poster written to ${OUTPUT}: ${width}x${height}, ${bytes.length} bytes, sha256 ${sha256}`);
