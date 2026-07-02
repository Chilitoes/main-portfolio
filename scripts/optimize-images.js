#!/usr/bin/env node
/**
 * Image optimization — generates responsive WebP and AVIF variants alongside
 * every JPEG in /images. Originals stay untouched as a final fallback.
 *
 *   images/Japan/IMG_2564.JPG
 *     → IMG_2564-480.webp  / IMG_2564-960.webp  / IMG_2564-1920.webp
 *     → IMG_2564-480.avif  / IMG_2564-960.avif  / IMG_2564-1920.avif
 *
 * Widths larger than the source are skipped automatically. Re-runs are
 * idempotent (skip output that already exists and is newer than the source).
 *
 * Quality targets are tuned for visual transparency vs. the original.
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = [
  path.join(ROOT, 'images'),
  path.join(ROOT, 'personal', 'images'),
];
const WIDTHS = [480, 960, 1920];
const FORMATS = [
  { ext: 'avif', encode: (s) => s.avif({ quality: 60, effort: 4 }) },
  { ext: 'webp', encode: (s) => s.webp({ quality: 82, effort: 5 }) },
];
const SOURCE_EXT = /\.(jpe?g|png)$/i;

// Skip files already produced by previous runs (the -480.webp pattern).
const VARIANT_PATTERN = /-(\d+)\.(webp|avif|jpe?g)$/i;

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.isFile() && SOURCE_EXT.test(e.name) && !VARIANT_PATTERN.test(e.name)) out.push(full);
  }
  return out;
}

async function shouldSkip(srcPath, outPath) {
  try {
    const [srcStat, outStat] = await Promise.all([fs.stat(srcPath), fs.stat(outPath)]);
    return outStat.mtimeMs >= srcStat.mtimeMs;
  } catch { return false; }
}

async function processOne(srcPath) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath).replace(SOURCE_EXT, '');
  const src = sharp(srcPath);
  const meta = await src.metadata();
  const srcWidth = meta.width;

  let written = 0, skipped = 0;
  const tasks = [];
  for (const w of WIDTHS) {
    // Don't upscale — cap at the source width — but ALWAYS emit every width
    // name. bgImage() constructs "-480/-960/-1920" URLs unconditionally, so
    // skipping a name (e.g. no -1920 for a 900px source) would leave the
    // image-set() pointing at 404s and the slot rendering blank.
    const targetWidth = w > srcWidth ? srcWidth : w;
    for (const { ext, encode } of FORMATS) {
      const outPath = path.join(dir, `${base}-${w}.${ext}`);
      if (await shouldSkip(srcPath, outPath)) { skipped++; continue; }
      const pipeline = encode(sharp(srcPath).resize({ width: targetWidth, withoutEnlargement: true }));
      tasks.push(pipeline.toFile(outPath).then(() => { written++; }));
    }
  }
  await Promise.all(tasks);
  return { written, skipped, src: path.relative(ROOT, srcPath) };
}

async function main() {
  const sources = [];
  for (const dir of SCAN_DIRS) {
    try { await walk(dir, sources); } catch (e) {
      if (e.code === 'ENOENT') continue; // optional dir missing — fine
      throw e;
    }
  }
  console.log(`Found ${sources.length} source image(s).`);

  const start = Date.now();
  let totalWritten = 0, totalSkipped = 0, processed = 0;

  // Limit concurrency so we don't spike memory on big JPEGs
  const CONCURRENCY = 4;
  const queue = [...sources];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const src = queue.shift();
      try {
        const { written, skipped, src: rel } = await processOne(src);
        totalWritten += written;
        totalSkipped += skipped;
        processed++;
        if (written) console.log(`  ✓ [${processed}/${sources.length}] ${rel}  (+${written} variants)`);
      } catch (err) {
        console.error(`  ✗ ${path.relative(ROOT, src)} — ${err.message}`);
      }
    }
  });
  await Promise.all(workers);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s — wrote ${totalWritten} new variant(s), skipped ${totalSkipped} (already fresh).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
