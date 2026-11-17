/**
 * Comprehensive Automated Test Suite for Buscador Xeral (Site-Wide Search)
 * Covers index generation, frontmatter coverage, Spanish-Galician synonyms,
 * ranking, exclusions, add/edit/delete & incremental rebuild safety, PDF metadata,
 * and Playwright browser verification across 375px, 768px, 1024px, and 1280px.
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const zlib = require("zlib");
const assert = require("assert");
const { chromium } = require("playwright");

const { buildSearchIndex } = require("../.eleventy.js");
const {
  SYNONYM_MAP,
  normalizeText,
  tokenizeQuery,
  searchIndexItems,
  extractExcerpt,
  buildHighlightedSegments,
} = require("../src/js/search.js");

function createStaticServer(rootDir) {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
  };

  return http.createServer((req, res) => {
    const reqUrl = (req.url || "/").split("?")[0];
    let relPath = decodeURIComponent(reqUrl);
    if (relPath.endsWith("/")) relPath += "index.html";
    const fullPath = path.join(rootDir, relPath.replace(/^\//, ""));

    if (!fullPath.startsWith(rootDir) || !fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(fs.readFileSync(fullPath));
  });
}

async function runSearchTests() {
  console.log("=== Executing Buscador Xeral (Site Search) Validation Suite ===\n");
  let passed = 0;
  let failed = 0;

  async function test(description, fn) {
    try {
      await fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    ${err.stack || err.message}`);
      failed++;
    }
  }

  const rootDir = path.resolve(__dirname, "..");
  const siteDir = path.join(rootDir, "_site");
  const indexPath = path.join(siteDir, "search-index.json");

  // Rebuild index from current _site & src to ensure fresh state
  buildSearchIndex({
    inputDir: path.join(rootDir, "src"),
    outputDir: siteDir,
    results: [],
  });

  assert(fs.existsSync(indexPath), "Expected _site/search-index.json to exist");
  const rawIndexJson = fs.readFileSync(indexPath, "utf8");
  const gzippedSize = zlib.gzipSync(Buffer.from(rawIndexJson, "utf8")).length;
  const brotliSize = zlib.brotliCompressSync(Buffer.from(rawIndexJson, "utf8")).length;
  const indexData = JSON.parse(rawIndexJson);
  const items = indexData.items;

  console.log(
    `  [Measured Index Metrics] Items: ${items.length} | Raw: ${Buffer.byteLength(rawIndexJson, "utf8")} bytes | Gzip: ${gzippedSize} bytes | Brotli: ${brotliSize} bytes\n`
  );

  // 1. Index structure & exclusions
  await test("Index excludes /admin/, /emails/*, /novas/ archive duplicate listing, and unlinked legacy PDFs", () => {
    const urls = items.map((i) => i.url);
    assert(!urls.some((u) => u.startsWith("/admin")), "/admin/ must be excluded");
    assert(!urls.some((u) => u.startsWith("/emails")), "/emails/ must be excluded");
    assert(!urls.includes("/novas/"), "/novas/ listing must be excluded to prevent duplicate post results");
    assert(!urls.some((u) => u.startsWith("/novas/page/")), "/novas/page/* must be excluded");

    const allText = JSON.stringify(items);
    assert(!allText.includes("desayunos_jardanay_3trim23_general"), "Unlinked legacy 2023 PDF must not be indexed");
    assert(!allText.includes("test-document-sandbox.pdf"), "Unlinked sandbox test PDF must not be indexed");
    assert(!allText.includes("ENTORNO DE PROBAS"), "Sandbox alert banner outside #main must not be indexed");
    assert(!allText.includes("Acceso administración"), "Footer admin link outside #main must not be indexed");
  });

  // 2. Frontmatter content coverage (Comedor & Inscrición)
  await test("Comedor and Inscrición structured frontmatter fields are indexed in full", () => {
    const comedorRes = searchIndexItems(items, "atriga");
    assert(comedorRes.length > 0, "Expected results for 'atriga'");
    assert.strictEqual(comedorRes[0].item.url, "/comedor/", "Expected /comedor/ ranked #1 for 'atriga'");

    const tpvRes = searchIndexItems(items, "tpv");
    assert(tpvRes.some((r) => r.item.url === "/comedor/"), "Expected /comedor/ to match step text 'tpv'");

    const abalarRes = searchIndexItems(items, "abalar");
    assert(abalarRes.some((r) => r.item.url === "/comedor/"), "Expected /comedor/ to match closing_info 'abalar'");

    const ibanRes = searchIndexItems(items, "ES76 0049");
    assert(ibanRes.length > 0 && ibanRes[0].item.url === "/inscripcion/", "Expected /inscripcion/ for IBAN search");

    const feeRes = searchIndexItems(items, "25€");
    assert(feeRes.some((r) => r.item.url === "/inscripcion/"), "Expected /inscripcion/ for 25€ membership fee");
  });

  // 3. Accented/unaccented queries & explicit Spanish-Galician synonyms
  await test("Case-insensitive, accent-insensitive, and explicit Spanish-Galician synonyms work predictably", () => {
    const rInglesLower = searchIndexItems(items, "ingles");
    const rInglesAccent = searchIndexItems(items, "Inglés");
    const rInglesUpper = searchIndexItems(items, "INGLÉS");
    assert.strictEqual(rInglesLower[0].item.url, "/extraescolares/#act-ingles");
    assert.strictEqual(rInglesAccent[0].item.url, "/extraescolares/#act-ingles");
    assert.strictEqual(rInglesUpper[0].item.url, "/extraescolares/#act-ingles");

    // Spanish "inscripción" (with 'p' and accent) -> matches Formulario Inscrición (/inscripcion/) #1
    const rInscripcionEs = searchIndexItems(items, "inscripción");
    const rInscricionGl = searchIndexItems(items, "inscrición");
    assert(rInscripcionEs.length > 0, "Expected results for Spanish 'inscripción'");
    assert.strictEqual(rInscripcionEs[0].item.url, "/inscripcion/", "Expected /inscripcion/ #1 for 'inscripción'");
    assert.strictEqual(rInscricionGl[0].item.url, "/inscripcion/", "Expected /inscripcion/ #1 for 'inscrición'");

    // Spanish "desayuno" -> matches Servizo Madrugadores (/madrugadores/)
    const rDesayuno = searchIndexItems(items, "desayuno");
    assert(rDesayuno.length > 0 && rDesayuno[0].item.url === "/madrugadores/", "Expected /madrugadores/ #1 for 'desayuno'");

    // Spanish "gimnasia" -> matches Ximnasia rítmica (#act-ximnasia-ritmica)
    const rGimnasia = searchIndexItems(items, "gimnasia");
    assert(rGimnasia.length > 0 && rGimnasia[0].item.url === "/extraescolares/#act-ximnasia-ritmica");

    // Spanish "yoga" -> matches Ioga (#act-ioga)
    const rYoga = searchIndexItems(items, "yoga");
    assert(rYoga.length > 0 && rYoga[0].item.url === "/extraescolares/#act-ioga");

    // Spanish "consejo escolar" -> matches Consello Escolar (/consello-escolar/)
    const rConsejo = searchIndexItems(items, "consejo escolar");
    assert(rConsejo.length > 0 && rConsejo[0].item.url === "/consello-escolar/");

    // Spanish "baja" -> matches Condicións xerais (#condicions-xerais) or Madrugadores
    const rBaja = searchIndexItems(items, "solicitude de baja");
    assert(rBaja.length > 0 && rBaja[0].item.url === "/extraescolares/#condicions-xerais");

    // Verify no blanket -pci- -> -ci- mutation on arbitrary words
    assert.strictEqual(normalizeText(" recepción "), " recepcion ");
    assert(!Object.prototype.hasOwnProperty.call(SYNONYM_MAP, "recepcion"));
  });

  // 4. Ranking, direct activity links, and duplicate suppression
  await test("Exact activity/title matches rank #1 and generic 'extraescolares' avoids dumping all 18 activities", () => {
    const judoRes = searchIndexItems(items, "judo");
    assert.strictEqual(judoRes[0].item.url, "/extraescolares/#act-judo");
    assert.strictEqual(judoRes[0].item.typeLabel, "Extraescolares");

    const parkourRes = searchIndexItems(items, "parkour");
    assert.strictEqual(parkourRes[0].item.url, "/extraescolares/#act-parkour");

    const extraRes = searchIndexItems(items, "extraescolares");
    assert.strictEqual(extraRes[0].item.url, "/extraescolares/", "Main Extraescolares page should rank #1");
    assert(extraRes.length < 8, `Expected concise results for 'extraescolares', got ${extraRes.length}`);

    const multiWordAct = searchIndexItems(items, "extraescolares judo");
    assert.strictEqual(multiWordAct[0].item.url, "/extraescolares/#act-judo");
  });

  // 5. Published news canonical URL uniqueness
  await test("Published news articles appear once under their canonical /posts/<slug>/ URL", () => {
    const teaRes = searchIndexItems(items, "familias TEA");
    assert.strictEqual(teaRes.length, 1, `Expected exactly 1 result for 'familias TEA', got ${teaRes.length}`);
    assert.strictEqual(teaRes[0].item.url, "/posts/2026-02-05-charla-familias-tea/");
    assert.strictEqual(teaRes[0].item.typeLabel, "Novas");

    const entroidoRes = searchIndexItems(items, "entroido");
    assert.strictEqual(entroidoRes.length, 1);
    assert.strictEqual(entroidoRes[0].item.url, "/posts/2026-02-03-festa-entroido/");
  });

  // 6. PDF metadata searchability
  await test("Publicly linked PDF documents are searchable by title, description, link text, and filename", () => {
    const tripticoRes = searchIndexItems(items, "triptico_madrugadores_2026-2027");
    assert(tripticoRes.some((r) => r.item.type === "document" && r.item.url === "/madrugadores/"));

    const fichaInglesRes = searchIndexItems(items, "ficha inscricion ingles pdf");
    assert(fichaInglesRes.some((r) => r.item.url === "/extraescolares/#act-ingles"));

    const notaPrensaRes = searchIndexItems(items, "nota de prensa");
    assert(notaPrensaRes.some((r) => r.item.url === "/posts/2026-02-13-manifestacion-federacion-anpas/"));

    const memoriaPdfRes = searchIndexItems(items, "memoria 2023 2024 pdf");
    assert(memoriaPdfRes.some((r) => r.item.type === "document" && r.item.url === "/memoria/"));
  });

  // 7. Original accents preserved & safe highlighting segments
  await test("Excerpts preserve original Galician accents and buildHighlightedSegments avoids HTML injection", () => {
    const inscripcionItem = items.find((i) => i.url === "/inscripcion/");
    const excerpt = extractExcerpt(inscripcionItem.text, ["inscricion"], 160);
    assert(excerpt.includes("inscrición"), "Excerpt must preserve original accented word 'inscrición'");

    const segments = buildHighlightedSegments("Formulario de inscrición <script>alert(1)</script>", ["inscricion"]);
    const highlighted = segments.filter((s) => s.highlight);
    assert.strictEqual(highlighted.length, 1);
    assert.strictEqual(highlighted[0].text, "inscrición");
    assert(segments.some((s) => !s.highlight && s.text.includes("<script>alert(1)</script>")));
  });

  // 8. Add, edit, delete, draft exclusion, eleventyExcludeFromCollections eligibility, and incremental rebuild safety
  await test("Index updates accurately on content add/edit/delete, respects draft/searchExclude, and stays complete on partial incremental results", () => {
    const tempDir = path.join(__dirname, "temp_search_lifecycle");
    const tempInput = path.join(tempDir, "src");
    const tempOutput = path.join(tempDir, "_site");

    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      fs.mkdirSync(path.join(tempInput, "pages"), { recursive: true });
      fs.mkdirSync(path.join(tempInput, "posts"), { recursive: true });
      fs.mkdirSync(tempOutput, { recursive: true });

      // Copy minimal eligible source structure
      fs.copyFileSync(path.join(rootDir, "src", "index.njk"), path.join(tempInput, "index.njk"));
      fs.copyFileSync(path.join(rootDir, "src", "pages", "comedor.md"), path.join(tempInput, "pages", "comedor.md"));
      fs.mkdirSync(path.join(tempOutput, "comedor"), { recursive: true });
      fs.copyFileSync(path.join(siteDir, "index.html"), path.join(tempOutput, "index.html"));
      fs.copyFileSync(path.join(siteDir, "comedor", "index.html"), path.join(tempOutput, "comedor", "index.html"));

      // 8a. Add a new public post + a draft post + a page with eleventyExcludeFromCollections: true
      const newPostMd = path.join(tempInput, "posts", "2026-04-10-nova-actividade-xadrez.md");
      fs.writeFileSync(
        newPostMd,
        '---\ntitle: "Nova actividade de Xadrez"\ndate: 2026-04-10\ncategory: "Actividades"\n---\nAbrimos inscrición para xadrez.',
        "utf8"
      );
      const newPostHtmlDir = path.join(tempOutput, "posts", "2026-04-10-nova-actividade-xadrez");
      fs.mkdirSync(newPostHtmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(newPostHtmlDir, "index.html"),
        '<main id="main"><article class="post-single"><h1>Nova actividade de Xadrez</h1><div class="post-content"><p>Abrimos inscrición para xadrez.</p></div></article></main>',
        "utf8"
      );

      // Draft post (must be excluded)
      const draftPostMd = path.join(tempInput, "posts", "2026-04-11-borrador-secreto.md");
      fs.writeFileSync(
        draftPostMd,
        '---\ntitle: "Borrador Secreto"\ndraft: true\n---\nTexto oculto.',
        "utf8"
      );
      const draftHtmlDir = path.join(tempOutput, "posts", "2026-04-11-borrador-secreto");
      fs.mkdirSync(draftHtmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(draftHtmlDir, "index.html"),
        '<main id="main"><h1>Borrador Secreto</h1><p>Texto oculto.</p></main>',
        "utf8"
      );

      // Public page with eleventyExcludeFromCollections: true (must STILL be included!)
      const unlistedPageMd = path.join(tempInput, "pages", "aviso-legal.md");
      fs.writeFileSync(
        unlistedPageMd,
        '---\ntitle: "Aviso Legal da ANPA"\npermalink: /aviso-legal/\neleventyExcludeFromCollections: true\n---\nTexto legal público.',
        "utf8"
      );
      fs.mkdirSync(path.join(tempOutput, "aviso-legal"), { recursive: true });
      fs.writeFileSync(
        path.join(tempOutput, "aviso-legal", "index.html"),
        '<main id="main"><h1>Aviso Legal da ANPA</h1><div class="post-content"><p>Texto legal público.</p></div></main>',
        "utf8"
      );

      let built = buildSearchIndex({ inputDir: tempInput, outputDir: tempOutput, results: [] });
      assert(built.items.some((i) => i.url === "/posts/2026-04-10-nova-actividade-xadrez/"), "Added post must appear in index");
      assert(!built.items.some((i) => i.url.includes("borrador-secreto")), "Draft post must be excluded");
      assert(
        built.items.some((i) => i.url === "/aviso-legal/"),
        "Public page with eleventyExcludeFromCollections: true must remain searchable"
      );

      // 8b. Simulate incremental rebuild where Eleventy `results` only contains the edited post
      const editedHtml =
        '<main id="main"><article class="post-single"><h1>Nova actividade de Xadrez Avanzado</h1><div class="post-content"><p> Torneo escolar de xadrez en maio.</p></div></article></main>';
      fs.writeFileSync(path.join(newPostHtmlDir, "index.html"), editedHtml, "utf8");
      built = buildSearchIndex({
        inputDir: tempInput,
        outputDir: tempOutput,
        results: [{ url: "/posts/2026-04-10-nova-actividade-xadrez/", content: editedHtml }],
      });
      const editedItem = built.items.find((i) => i.url === "/posts/2026-04-10-nova-actividade-xadrez/");
      assert(editedItem && editedItem.title === "Nova actividade de Xadrez Avanzado", "Edited title must update");
      assert(editedItem.text.includes("Torneo escolar"), "Edited body must update");
      assert(built.items.some((i) => i.url === "/comedor/"), "Unchanged pages must remain in index during incremental rebuild");

      // 8c. Delete the post source file (while leaving stale HTML in _site/posts/...)
      fs.unlinkSync(newPostMd);
      built = buildSearchIndex({ inputDir: tempInput, outputDir: tempOutput, results: [] });
      assert(
        !built.items.some((i) => i.url === "/posts/2026-04-10-nova-actividade-xadrez/"),
        "Deleted source post must be removed from index even if stale _site HTML exists"
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
      // Restore main index cache
      buildSearchIndex({ inputDir: path.join(rootDir, "src"), outputDir: siteDir, results: [] });
    }
  });

  // 9. Playwright E2E Browser Tests (Responsive widths, Keyboard focus, Mobile nav coordination, Accordion opening, Error retry)
  const server = createStaticServer(siteDir);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch (_) {
    browser = await chromium.launch({ headless: true });
  }

  try {
    await test("Header, brand text, search button, and panel have zero overlap, clipping, or overflow across 320px–1280px", async () => {
      const page = await browser.newPage();
      const widths = [320, 360, 375, 412, 480, 600, 768, 1024, 1280];

      for (const w of widths) {
        await page.setViewportSize({ width: w, height: 800 });
        await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

        const metrics = await page.evaluate(() => {
          const brandName = document.querySelector(".site-brand__name");
          const searchBtn = document.querySelector(".search-toggle");
          const searchLabel = document.querySelector(".search-toggle__label");
          const navBtn = document.querySelector(".nav-toggle");

          const brandRect = brandName.getBoundingClientRect();
          const searchRect = searchBtn.getBoundingClientRect();
          const labelRect = searchLabel.getBoundingClientRect();
          const navRect = navBtn.getBoundingClientRect();

          return {
            docOverflow: document.documentElement.scrollWidth > window.innerWidth,
            brandClipped: brandName.scrollWidth > brandName.clientWidth + 1,
            brandRight: brandRect.right,
            searchLeft: searchRect.left,
            searchRight: searchRect.right,
            searchWidth: searchRect.width,
            searchHeight: searchRect.height,
            searchAriaLabel: searchBtn.getAttribute("aria-label"),
            labelWidth: labelRect.width,
            navLeft: navRect.left,
            navVisible: getComputedStyle(navBtn).display !== "none",
          };
        });

        assert(!metrics.docOverflow, `Horizontal overflow detected on / at viewport width ${w}px`);
        assert(!metrics.brandClipped, `Brand text 'ANPA Rabadeira' is clipped/overflowing its box at ${w}px`);
        assert(
          metrics.brandRight + 8 <= metrics.searchLeft,
          `Brand text right (${metrics.brandRight}px) is too close to or overlaps search button left (${metrics.searchLeft}px) at ${w}px`
        );

        if (w <= 600) {
          assert(
            metrics.searchWidth >= 44 && metrics.searchHeight >= 44,
            `Expected >= 44x44px touch target at ${w}px, got ${metrics.searchWidth}x${metrics.searchHeight}`
          );
          assert(
            metrics.labelWidth <= 1,
            `Expected icon-only search button on narrow screen (${w}px), but label width was ${metrics.labelWidth}px`
          );
          assert.strictEqual(metrics.searchAriaLabel, "Abrir o buscador");
        } else {
          assert(
            metrics.labelWidth > 20,
            `Expected visible 'Buscar' text label on wider screen (${w}px), got width ${metrics.labelWidth}px`
          );
        }

        if (metrics.navVisible) {
          assert(
            metrics.searchRight + 4 <= metrics.navLeft,
            `Expected clear spacing between search button (${metrics.searchRight}px) and hamburger (${metrics.navLeft}px) at ${w}px`
          );
        }

        // Open search panel and check overflow again
        await page.click(".search-toggle");
        await page.waitForSelector("#site-search-panel:not([hidden])");
        const panelOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        assert(!panelOverflow, `Horizontal overflow detected with open search panel at ${w}px`);

        // Close search panel
        await page.keyboard.press("Escape");
      }
      await page.close();
    });

    await test("Keyboard focus, Escape close, mobile menu coordination, and accordion deep-linking work in browser", async () => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

      // Open mobile nav first
      await page.click(".nav-toggle");
      assert.strictEqual(await page.getAttribute(".nav-toggle", "aria-expanded"), "true");

      // Clicking search toggle must close mobile nav automatically, remove nav-open body lock, and focus search input
      await page.click(".search-toggle");
      assert.strictEqual(await page.getAttribute(".nav-toggle", "aria-expanded"), "false");
      assert.strictEqual(await page.getAttribute(".search-toggle", "aria-expanded"), "true");
      assert.strictEqual(await page.evaluate(() => document.body.classList.contains("nav-open")), false);
      const focusedId = await page.evaluate(() => document.activeElement && document.activeElement.id);
      assert.strictEqual(focusedId, "site-search-input", "Search input must receive focus when opened");

      // Opening mobile nav while search is open must close search panel
      await page.click(".nav-toggle");
      assert.strictEqual(await page.getAttribute(".search-toggle", "aria-expanded"), "false");
      assert.strictEqual(await page.getAttribute(".nav-toggle", "aria-expanded"), "true");

      // Reopen search, type query, verify highlighted results, and press Escape to return focus to .search-toggle
      await page.click(".search-toggle");
      await page.fill("#site-search-input", "seguro de accidentes");
      await page.waitForSelector(".search-result-card");

      const firstHref = await page.getAttribute(".search-result-card", "href");
      assert.strictEqual(firstHref, "/extraescolares/#condicions-xerais");

      await page.keyboard.press("Escape");
      const isHidden = await page.evaluate(() => document.getElementById("site-search-panel").hidden);
      assert.strictEqual(isHidden, true, "Escape must hide #site-search-panel");
      assert.strictEqual(await page.evaluate(() => document.body.classList.contains("nav-open")), false);
      const activeClass = await page.evaluate(() => document.activeElement && document.activeElement.className);
      assert(activeClass.includes("search-toggle"), "Escape must return focus to .search-toggle");

      // Reopen search and click the deep-link result to /extraescolares/#condicions-xerais
      await page.click(".search-toggle");
      await page.click(".search-result-card");
      await page.waitForURL("**/extraescolares/#condicions-xerais");
      await page.waitForTimeout(150);

      const isAccordionOpen = await page.evaluate(() => {
        const acc = document.getElementById("condicions-xerais");
        return Boolean(acc && acc.open);
      });
      assert.strictEqual(isAccordionOpen, true, "Navigating to #condicions-xerais must auto-open the conditions <details> accordion");

      await page.close();
    });

    await test("Search-index fetch failure displays Galician recovery state and Retry button recovers cleanly", async () => {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });

      // Point index URL to a non-existent path before opening search
      await page.evaluate(() => {
        window.__ANPA_SEARCH_INDEX_URL = "/non-existent-index.json";
      });

      await page.click(".search-toggle");
      await page.waitForSelector(".search-state-box--error");
      const errorText = await page.textContent(".search-state-box--error");
      assert(errorText.includes("Non foi posible cargar o buscador"), "Expected Galician error message");

      // Restore valid index URL, type a query, and click Retry ("Tentar de novo")
      await page.fill("#site-search-input", "comedor");
      await page.evaluate(() => {
        window.__ANPA_SEARCH_INDEX_URL = "/search-index.json";
      });
      await page.click(".search-retry-btn");
      await page.waitForSelector(".search-result-card");

      const topTitle = await page.textContent(".search-result-card__title");
      assert.strictEqual(topTitle.trim(), "Pago Comedor", "Retry button must reload index and render query results");

      await page.close();
    });
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\nSearch Test Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSearchTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
