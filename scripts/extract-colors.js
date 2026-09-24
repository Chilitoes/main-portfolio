#!/usr/bin/env node
/**
 * Extracts a representative hue/saturation/lightness for every photo, for
 * the archive's vectorscope colour-browse view (hue = angle, saturation =
 * radius from centre — the same mapping a video vectorscope uses).
 *
 * A naive average of every pixel's HSL is dominated by whatever covers the
 * most area — sky, pavement, skin — and pulls almost every photo toward the
 * same washed-out beige. Getting a hue that actually tracks what a viewer
 * would call "the color of this photo" takes three corrections:
 *
 *   1. Saturation-weighted. Each pixel votes for its own hue weighted by its
 *      own saturation, so a vivid red umbrella in an otherwise grey street
 *      scene dominates the vote the way it dominates human perception of
 *      the photo's color — while the grey pavement (near-zero saturation,
 *      effectively hue-less) contributes almost nothing.
 *   2. Lightness-gated. HSL's saturation formula spikes toward 100% for
 *      pixels near pure black or pure white even when they're a whisper of
 *      JPEG noise with no perceptible color — e.g. rgb(0,1,4) computes as
 *      "100% saturated blue" despite being indistinguishable from black to
 *      the eye. A trapezoid weight (zero below 8% or above 92% lightness,
 *      full weight through the 20–80% midtones) stops that noise from
 *      outvoting real color.
 *   3. Dominant-CLUSTER mean, not a global one. Even with (1) and (2), a
 *      photo that's genuinely bimodal — a red torii gate against a
 *      blue-grey overcast sky, say — has two real, separated, comparably-
 *      sized votes. Circularly averaging red (~5deg) with blue (~225deg)
 *      lands the "mean" on magenta (~325deg): a hue that appears in
 *      neither the gate nor the sky and represents the photo to no one.
 *      The fix is to build a weighted hue histogram, find its peak cluster
 *      (the subject the eye actually goes to), and take the circular mean
 *      of *only* the pixels within that cluster. Confirmed by hand against
 *      several photos: this is what turns "torii gate photo → magenta"
 *      into "torii gate photo → red".
 *
 * Photos that are genuinely low-saturation throughout (b&w-ish, overcast,
 * fog) end up with a small output saturation, which is exactly correct —
 * they plot near the vectorscope's centre rather than being forced onto a
 * false hue.
 *
 * Reads every source photo under SCAN_DIRS (the same set optimize-images.js
 * walks) and writes color-data.js: a plain <script> (not JSX — it's a data
 * table, not a component) exposing window.PHOTO_COLORS keyed by the same
 * relative path data.jsx's ITEMS array uses, e.g. "Japan/IMG_2564.JPG".
 *
 * Re-run whenever photos are added/removed:  npm run extract-colors
 */

const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = [path.join(ROOT, 'images')]; // personal/images has no archive UI, skip
const SOURCE_EXT = /\.(jpe?g|png)$/i;
const VARIANT_PATTERN = /-(\d+)\.(webp|avif|jpe?g|png)$/i;
const OUT_FILE = path.join(ROOT, 'color-data.js');

// Sampling at 48x48 (2304 px) is plenty to characterise the colour balance
// of a photo and keeps the whole run under a couple of seconds.
const SAMPLE = 48;
const HIST_BINS = 72;          // 5deg per bin
const CLUSTER_WINDOW_DEG = 35; // half-width of the dominant-cluster window

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.isFile() && SOURCE_EXT.test(e.name) && !VARIANT_PATTERN.test(e.name)) out.push(full);
  }
  return out;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4;
  }
  return { h: h * 60, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to255 = (v) => Math.round((v + m) * 255);
  return '#' + [to255(r), to255(g), to255(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// 0 below 8% or above 92% lightness (JPEG-noise-in-black / blown-highlight
// territory, where HSL saturation is a mathematical artifact rather than a
// real color), ramping to full weight across the 20-80% midtone band.
function lightGate(l) {
  if (l <= 8 || l >= 92) return 0;
  if (l < 20) return (l - 8) / 12;
  if (l > 80) return (92 - l) / 12;
  return 1;
}

function circDist(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

async function colorOf(srcPath) {
  const { data, info } = await sharp(srcPath)
    .resize(SAMPLE, SAMPLE, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 3 (rgb) after removeAlpha
  const n = data.length / channels;

  // Pass 1: per-pixel HSL + a weighted histogram, to find the dominant
  // color cluster (see the module docstring for why a single global
  // circular mean isn't enough on its own).
  const pixels = new Array(n);
  const hist = new Float64Array(HIST_BINS);
  const binSize = 360 / HIST_BINS;
  for (let i = 0; i < n; i++) {
    const o = i * channels;
    const { h, s, l } = rgbToHsl(data[o], data[o + 1], data[o + 2]);
    const w = s * lightGate(l);
    pixels[i] = { h, s, l, w };
    hist[Math.floor(h / binSize) % HIST_BINS] += w;
  }

  // Light circular smoothing so a hue that straddles a bin edge doesn't
  // arbitrarily lose to a neighbour.
  const smooth = new Float64Array(HIST_BINS);
  for (let i = 0; i < HIST_BINS; i++) {
    smooth[i] = hist[(i - 1 + HIST_BINS) % HIST_BINS] * 0.25
      + hist[i] * 0.5
      + hist[(i + 1) % HIST_BINS] * 0.25;
  }
  let peakBin = 0;
  for (let i = 1; i < HIST_BINS; i++) if (smooth[i] > smooth[peakBin]) peakBin = i;
  const peakHue = (peakBin + 0.5) * binSize;

  // Pass 2: circular mean of hue, plus plain mean of saturation/lightness,
  // restricted to pixels within the dominant cluster's window. This is what
  // gives "the photo's color" rather than a meaningless blend of every hue
  // present.
  let sumSin = 0, sumCos = 0, sumW = 0, sumS = 0, sumL = 0, count = 0;
  for (const p of pixels) {
    if (circDist(p.h, peakHue) > CLUSTER_WINDOW_DEG) continue;
    const rad = (p.h * Math.PI) / 180;
    sumSin += Math.sin(rad) * p.w;
    sumCos += Math.cos(rad) * p.w;
    sumW += p.w;
    sumS += p.s;
    sumL += p.l;
    count++;
  }

  // sumW≈0 means even the "dominant" cluster has essentially no saturated
  // pixels — a genuinely monochrome/flat photo. Report it as neutral rather
  // than let atan2 return a meaningless angle from floating-point noise.
  let hue = sumW > 1e-6 ? (Math.atan2(sumSin, sumCos) * 180) / Math.PI : 0;
  if (hue < 0) hue += 360;
  const sat = count ? sumS / count : 0;
  const light = count ? sumL / count : 50;

  return {
    h: Math.round(hue),
    s: Math.round(sat),
    l: Math.round(light),
    hex: hslToHex(hue, Math.max(sat, 6), light), // floor sat so near-grey hex isn't pure grey-on-grey
  };
}

async function main() {
  const sources = [];
  for (const dir of SCAN_DIRS) {
    try { await walk(dir, sources); } catch (e) {
      if (e.code === 'ENOENT') continue;
      throw e;
    }
  }
  console.log(`Found ${sources.length} source image(s).`);

  const start = Date.now();
  const result = {};
  const CONCURRENCY = 6;
  const queue = sources.map((p) => ({ p, rel: path.relative(path.join(ROOT, 'images'), p).split(path.sep).join('/') }));
  let done = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const { p, rel } = queue.shift();
      try {
        result[rel] = await colorOf(p);
      } catch (err) {
        console.error(`  ✗ ${rel} — ${err.message}`);
      }
      done++;
      if (done % 20 === 0) process.stdout.write(`  ...${done}/${sources.length}\n`);
    }
  });
  await Promise.all(workers);

  const sortedKeys = Object.keys(result).sort();
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = result[k];

  const header =
    `// AUTO-GENERATED by scripts/extract-colors.js — do not hand-edit.\n` +
    `// Re-run \`npm run extract-colors\` after adding/removing photos.\n` +
    `// Keyed by the same relative path data.jsx's ITEMS array uses\n` +
    `// (e.g. "Japan/IMG_2564.JPG"): { h: hue 0-360, s: saturation 0-100,\n` +
    `// l: lightness 0-100, hex: representative swatch }.\n`;
  const body = `window.PHOTO_COLORS = ${JSON.stringify(sorted)};\n`;
  await fs.writeFile(OUT_FILE, header + body);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nWrote ${sortedKeys.length} entries to ${path.relative(ROOT, OUT_FILE)} in ${elapsed}s.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
