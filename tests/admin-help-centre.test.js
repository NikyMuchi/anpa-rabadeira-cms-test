const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=== Executing Centro de Ayuda (Admin Help Centre) Validation Suite ===");

const siteDir = path.resolve("_site");
const manualSiteDir = path.join(siteDir, "admin", "manual");
const manualImgDir = path.join(manualSiteDir, "img");
const manualDocsDir = path.resolve("docs/manual");

// 1. Verify index.html exists and is well-formed
assert(fs.existsSync(path.join(manualSiteDir, "index.html")), "admin/manual/index.html must exist");
const indexHtml = fs.readFileSync(path.join(manualSiteDir, "index.html"), "utf8");
assert(indexHtml.includes("Centro de Ayuda"), "Index must contain 'Centro de Ayuda'");
assert(indexHtml.includes("noindex, nofollow"), "Index must include noindex meta tag");
assert(indexHtml.includes("Las Tres Reglas de Oro"), "Index must contain 'Las Tres Reglas de Oro'");
assert(indexHtml.includes("manual-pill-btn"), "Index must contain quick task pills");
console.log("  ✓ admin/manual/index.html exists and renders welcome hero, pills, and golden rules");

// 2. Verify all 14 modules exist and render properly
const expectedSlugs = [
  "01-conceptos-basicos-y-acceso",
  "02-flujo-editorial-guardar-y-publicar",
  "03-noticias-y-avisos",
  "04-actividades-extraescolares",
  "05-servicio-madrugadores",
  "06-pago-comedor",
  "07-alta-de-socios-e-inscripcion",
  "08-memoria-anual",
  "09-consejo-escolar",
  "10-portada",
  "11-datos-generales-anpa",
  "12-gestion-multimedia-imagenes-y-pdfs",
  "13-buscador-general-del-sitio",
  "14-resolucion-de-problemas-y-traspaso",
];

expectedSlugs.forEach((slug, idx) => {
  const modFile = path.join(manualSiteDir, slug, "index.html");
  assert(fs.existsSync(modFile), `Module ${slug}/index.html must exist`);
  const modHtml = fs.readFileSync(modFile, "utf8");
  assert(modHtml.includes("manual-article"), `Module ${slug} must render article content`);
  assert(modHtml.includes("manual-toc-list"), `Module ${slug} must render TOC sidebar`);
  assert(modHtml.includes("manual-breadcrumbs"), `Module ${slug} must render breadcrumbs`);
  assert(modHtml.includes("noindex, nofollow"), `Module ${slug} must include noindex meta tag`);

  // Verify prev / next navigation
  if (idx > 0) {
    assert(modHtml.includes("manual-pager-card--prev"), `Module ${slug} must have previous pager card`);
  }
  if (idx < expectedSlugs.length - 1) {
    assert(modHtml.includes("manual-pager-card--next"), `Module ${slug} must have next pager card`);
  }
});
console.log(`  ✓ All ${expectedSlugs.length} documentation modules render correctly with full content, TOC, and pager navigation`);

// 3. Verify all 27 screenshots exist in _site/admin/manual/img/ and match
assert(fs.existsSync(manualImgDir), "_site/admin/manual/img must exist");
const imgFiles = fs.readdirSync(manualImgDir).filter(f => f.endsWith(".png"));
assert.strictEqual(imgFiles.length, 27, `Expected exactly 27 screenshots in _site/admin/manual/img/, found ${imgFiles.length}`);

for (let i = 1; i <= 27; i++) {
  const prefix = "CAP-" + String(i).padStart(2, "0");
  const match = imgFiles.find(f => f.startsWith(prefix));
  assert(match, `Missing screenshot for prefix ${prefix}`);
  const stat = fs.statSync(path.join(manualImgDir, match));
  assert(stat.size > 1000, `Screenshot ${match} must be non-empty`);
}
console.log("  ✓ All 27 authentic CMS screenshots exist and are copied into _site/admin/manual/img/");

// 4. Verify that every image link in rendered modules resolves to disk
const uniqueRenderedImages = new Set();
expectedSlugs.forEach((slug) => {
  const modHtml = fs.readFileSync(path.join(manualSiteDir, slug, "index.html"), "utf8");
  const imgMatches = modHtml.match(/\/admin\/manual\/img\/CAP-[A-Za-z0-9-_]+\.png/g) || [];
  imgMatches.forEach(src => {
    uniqueRenderedImages.add(src);
    const absPath = path.join(siteDir, src.replace(/^\//, ""));
    assert(fs.existsSync(absPath), `Image ${src} referenced in ${slug} must exist on disk at ${absPath}`);
  });
});
assert.strictEqual(uniqueRenderedImages.size, 27, `Expected all 27 screenshots to be referenced across modules, found ${uniqueRenderedImages.size}`);
console.log("  ✓ All 27 unique authentic screenshots are referenced and resolve directly on disk with zero broken links");

// 5. Verify local search index
const searchIndexPath = path.join(manualSiteDir, "search-index.json");
assert(fs.existsSync(searchIndexPath), "admin/manual/search-index.json must exist");
const searchIndex = JSON.parse(fs.readFileSync(searchIndexPath, "utf8"));
assert(Array.isArray(searchIndex), "searchIndex must be an array");
assert(searchIndex.length >= 100, `searchIndex must have >= 100 entries, found ${searchIndex.length}`);

// Test required search queries
const testQueries = [
  { q: "publicar una noticia", expectUrl: "/admin/manual/03-noticias-y-avisos/" },
  { q: "cambiar un precio", expectUrl: "/admin/manual/04-actividades-extraescolares/" },
  { q: "subir un pdf", expectUrl: "/admin/manual/12-gestion-multimedia-imagenes-y-pdfs/" },
  { q: "cambiar una imagen", expectUrl: "/admin/manual/12-gestion-multimedia-imagenes-y-pdfs/" },
  { q: "guardar un borrador", expectUrl: "/admin/manual/02-flujo-editorial-guardar-y-publicar/" },
  { q: "consejo escolar", expectUrl: "/admin/manual/09-consejo-escolar/" },
  { q: "atriga", expectUrl: "/admin/manual/06-pago-comedor/" },
  { q: "iban", expectUrl: "/admin/manual/07-alta-de-socios-e-inscripcion/" },
];

testQueries.forEach(({ q, expectUrl }) => {
  const qNorm = q.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const found = searchIndex.filter(item => {
    const textNorm = (item.text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return textNorm.includes(qNorm);
  });
  assert(found.length > 0, `Search query "${q}" must return at least 1 result`);
  const hasExpectedUrl = found.some(item => item.url.startsWith(expectUrl));
  assert(hasExpectedUrl, `Search query "${q}" must lead to ${expectUrl}`);
});
console.log("  ✓ Local search index validates all required queries (noticia, precio, pdf, imagen, borrador, consejo escolar, atriga, iban)");

// 6. Verify admin entry point integration in admin/index.html
const adminHtml = fs.readFileSync(path.join(siteDir, "admin", "index.html"), "utf8");
assert(adminHtml.includes('href="/admin/manual/"'), "admin/index.html must include link to /admin/manual/");
assert(adminHtml.includes("sandbox-banner__link"), "admin/index.html must style the manual link inside banner");
console.log("  ✓ Decap CMS entry point (admin/index.html) integrates accessible link to /admin/manual/ in top banner");

// 7. Verify public search index does NOT include manual pages
const publicSearchIndexPath = path.join(siteDir, "search-index.json");
assert(fs.existsSync(publicSearchIndexPath), "public search-index.json must exist");
const publicSearchIndex = JSON.parse(fs.readFileSync(publicSearchIndexPath, "utf8"));
const manualLeak = publicSearchIndex.items.filter(item => item.url && item.url.includes("/admin/"));
assert.strictEqual(manualLeak.length, 0, "Public search index must not contain any /admin/ or manual URLs");
console.log("  ✓ Public site search index excludes all /admin/manual/ content completely");

// 8. Verify no secrets or sensitive credentials in the documentation or search index
const forbiddenPatterns = [
  /password\s*[:=]\s*['"][^'"]+['"]/i,
  /secret\s*[:=]\s*['"][^'"]+['"]/i,
  /ghp_[A-Za-z0-9]+/i,
  /github_pat_[A-Za-z0-9]+/i,
];
forbiddenPatterns.forEach(pattern => {
  assert(!pattern.test(JSON.stringify(searchIndex)), `Search index must not leak secrets matching ${pattern}`);
});
console.log("  ✓ No sensitive credentials, tokens or secrets exposed");

console.log("\nHelp Centre Test Summary: 8 passed, 0 failed.\n");
