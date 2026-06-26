#!/usr/bin/env node
/*
 * stamp-assets.js — content-hash cache busting for index.html.
 *
 * Runs at the tail of `npm run build` (after JSX has been compiled to dist/).
 * For every LOCAL <script src="..."> / <link href="..."> that points at a
 * .js or .css file, it appends `?v=<8-char sha256 of the file's contents>`,
 * replacing any `?v=` that's already there. External URLs (https://) are left
 * untouched — the React CDN bundles are already version-pinned + SRI'd.
 *
 * Why: the SFTP deploy mirrors files as-is with no cache headers, so a
 * returning visitor could otherwise pair a freshly-deployed index.html with a
 * stale, browser-cached dist/app.js. A per-file content hash makes each asset
 * URL change only when that asset actually changes, so caches update exactly
 * when they should and never when they shouldn't.
 *
 * Idempotent: re-running with unchanged assets produces an identical file.
 * The committed index.html carries no hashes; CI stamps them at build time.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');

let html = fs.readFileSync(htmlPath, 'utf8');

// Matches src="..." or href="..." capturing the path up to an optional ?query.
const ASSET_RE = /\b(src|href)="([^"?]+\.(?:js|css))(\?v=[a-f0-9]+)?"/g;

let stamped = 0;
let missing = 0;

html = html.replace(ASSET_RE, (full, attr, assetPath) => {
  // Leave absolute / protocol-relative URLs alone.
  if (/^(https?:)?\/\//.test(assetPath)) return full;

  const filePath = path.join(root, assetPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`[stamp-assets] referenced asset not found, skipping: ${assetPath}`);
    missing++;
    return full;
  }
  const hash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex')
    .slice(0, 8);
  stamped++;
  return `${attr}="${assetPath}?v=${hash}"`;
});

fs.writeFileSync(htmlPath, html);
console.log(`[stamp-assets] stamped ${stamped} asset(s)${missing ? `, ${missing} missing` : ''}.`);
