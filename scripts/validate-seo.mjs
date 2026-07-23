#!/usr/bin/env node
/**
 * SEO validator — runs before `vite build` (prebuild hook).
 * Checks index.html metadata, public/robots.txt and public/sitemap.xml.
 *
 * Skip with:  SKIP_SEO_VALIDATION=1 npm run build
 * Warn-only:  node scripts/validate-seo.mjs --warn-only
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const WARN_ONLY = process.argv.includes("--warn-only");

if (process.env.SKIP_SEO_VALIDATION === "1") {
  console.log("⚠️  SEO validacija preskočena (SKIP_SEO_VALIDATION=1)");
  process.exit(0);
}

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const TEMPLATE_TITLES = ["Lovable App", "Vite App", "Lovable Generated Project"];
const TEMPLATE_DESCS = ["Lovable Generated Project"];

// Detects an accidentally doubled domain suffix like "example.com.example.com".
function hasDoubledDomain(url) {
  try {
    const host = new URL(url).hostname;
    const parts = host.split(".");
    // look for a repeated 2-part TLD chunk at the end (e.g. rominab24.com.rominab24.com)
    if (parts.length >= 4) {
      const tail2 = parts.slice(-2).join(".");
      const prev2 = parts.slice(-4, -2).join(".");
      if (tail2 === prev2) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function readOrNull(p) {
  const full = resolve(ROOT, p);
  return existsSync(full) ? readFileSync(full, "utf8") : null;
}

// -------------------- index.html --------------------
function validateIndexHtml() {
  const html = readOrNull("index.html");
  if (!html) {
    err("index.html: datoteka ne postoji");
    return;
  }

  const langMatch = html.match(/<html[^>]*\blang\s*=\s*["']([^"']+)["']/i);
  if (!langMatch || !langMatch[1].trim()) err("index.html: <html lang> nedostaje");

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch) {
    err("index.html: <title> nedostaje");
  } else {
    const t = titleMatch[1].trim();
    if (TEMPLATE_TITLES.includes(t)) err(`index.html: <title> je template default ("${t}")`);
    if (t.length < 10) err(`index.html: <title> prekratak (${t.length} znakova, min 10)`);
    if (t.length > 60) warn(`index.html: <title> predugačak (${t.length} znakova, max 60)`);
  }

  const metaAttr = (name, attr = "name") => {
    const re = new RegExp(
      `<meta[^>]*\\b${attr}\\s*=\\s*["']${name}["'][^>]*\\bcontent\\s*=\\s*["']([^"']*)["']`,
      "i",
    );
    const m = html.match(re);
    return m ? m[1] : null;
  };

  const desc = metaAttr("description");
  if (!desc) {
    err("index.html: <meta name=\"description\"> nedostaje");
  } else {
    if (TEMPLATE_DESCS.includes(desc.trim()))
      err(`index.html: description je template default`);
    if (desc.length < 50) warn(`index.html: description kratak (${desc.length}, preporuka 50–160)`);
    if (desc.length > 160) warn(`index.html: description dugačak (${desc.length}, preporuka 50–160)`);
  }

  if (!metaAttr("viewport")) err("index.html: <meta name=\"viewport\"> nedostaje");

  for (const p of ["og:title", "og:description", "og:type", "og:url"]) {
    if (!metaAttr(p, "property")) err(`index.html: <meta property="${p}"> nedostaje`);
  }
  if (!metaAttr("twitter:card")) warn("index.html: <meta name=\"twitter:card\"> nedostaje");

  const ogUrl = metaAttr("og:url", "property");
  if (ogUrl && hasDoubledDomain(ogUrl))
    err(`index.html: og:url ima dupliranu domenu ("${ogUrl}")`);
}

// -------------------- robots.txt --------------------
function validateRobots() {
  const txt = readOrNull("public/robots.txt");
  if (!txt) {
    err("public/robots.txt: datoteka ne postoji");
    return;
  }
  if (!/^\s*User-agent\s*:/im.test(txt)) err("robots.txt: nema User-agent bloka");

  // Detect a global Disallow: / under User-agent: *
  const wildcardBlock = txt.match(/User-agent\s*:\s*\*[\s\S]*?(?=User-agent\s*:|$)/i);
  if (wildcardBlock && /^\s*Disallow\s*:\s*\/\s*$/im.test(wildcardBlock[0])) {
    warn("robots.txt: globalni 'Disallow: /' blokira sve crawlere");
  }

  const sitemaps = [...txt.matchAll(/^\s*Sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]);
  for (const s of sitemaps) {
    if (hasDoubledDomain(s)) err(`robots.txt: Sitemap ima dupliranu domenu ("${s}")`);
    try { new URL(s); } catch { err(`robots.txt: Sitemap nije valjan URL ("${s}")`); }
  }
}

// -------------------- sitemap.xml --------------------
function validateSitemap() {
  const xml = readOrNull("public/sitemap.xml");
  if (!xml) {
    err("public/sitemap.xml: datoteka ne postoji");
    return;
  }
  if (!/<urlset[\s>]/i.test(xml)) {
    err("sitemap.xml: nedostaje <urlset> root element");
    return;
  }
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
  if (locs.length === 0) {
    err("sitemap.xml: nema <url><loc> unosa");
    return;
  }

  const seen = new Set();
  const bases = new Set();
  for (const loc of locs) {
    try {
      const u = new URL(loc);
      bases.add(u.origin);
      if (hasDoubledDomain(loc)) err(`sitemap.xml: <loc> ima dupliranu domenu ("${loc}")`);
    } catch {
      err(`sitemap.xml: <loc> nije valjan URL ("${loc}")`);
    }
    if (seen.has(loc)) warn(`sitemap.xml: duplirani <loc> ("${loc}")`);
    seen.add(loc);
  }
  if (bases.size > 1) warn(`sitemap.xml: više različitih domena (${[...bases].join(", ")})`);

  // Cross-check with routes in src/App.tsx
  const app = readOrNull("src/App.tsx");
  if (app) {
    const routePaths = [...app.matchAll(/<Route\s+path\s*=\s*["']([^"']+)["']/g)]
      .map((m) => m[1])
      .filter(
        (p) =>
          p !== "*" &&
          !p.includes(":") &&
          !p.startsWith("/.lovable") &&
          p !== "/reset-password" &&
          p !== "/not-found",
      );
    const sitemapPaths = new Set(
      locs.map((l) => {
        try { return new URL(l).pathname.replace(/\/$/, "") || "/"; } catch { return l; }
      }),
    );
    for (const p of routePaths) {
      const norm = p.replace(/\/$/, "") || "/";
      if (!sitemapPaths.has(norm)) warn(`sitemap.xml: ruta "${p}" nije u sitemapu`);
    }
  }
}

validateIndexHtml();
validateRobots();
validateSitemap();

console.log("── SEO validacija ──");
if (warnings.length) {
  console.log(`\nUpozorenja (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠️  ${w}`);
}
if (errors.length) {
  console.log(`\nGreške (${errors.length}):`);
  for (const e of errors) console.log(`  ❌ ${e}`);
}
if (!errors.length && !warnings.length) {
  console.log("✅ Sve SEO provjere prošle bez upozorenja.");
}

if (errors.length && !WARN_ONLY) {
  console.error(
    "\n❌ SEO validacija nije prošla. Ispravi greške ili pokreni s SKIP_SEO_VALIDATION=1 za privremeno preskakanje.",
  );
  process.exit(1);
}
process.exit(0);
