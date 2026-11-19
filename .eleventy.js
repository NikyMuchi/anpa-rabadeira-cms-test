const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio/slim");
const markdownIt = require("markdown-it");

// In-memory cache of rendered HTML by URL to keep watch/incremental rebuilds complete
const renderedHtmlCache = new Map();

function parseFrontmatter(raw) {
  if (!raw || !raw.startsWith("---")) return {};
  const endIdx = raw.indexOf("\n---", 3);
  if (endIdx === -1) return {};
  const fmBlock = raw.slice(3, endIdx);
  const data = {};

  const lines = fmBlock.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let val = match[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === "true") data[key] = true;
    else if (val === "false") data[key] = false;
    else data[key] = val;
  }
  return data;
}

function isSourceEligible(fileName, fm) {
  if (!fm) return false;
  if (fm.draft === true) return false;
  if (fm.searchExclude === true) return false;
  if (fm.searchable === false) return false;
  if (fm.permalink === false || fm.permalink === "false") return false;
  // Exclude temporary test fixtures or explicit sandbox delete-test files
  if (/^(test-fixture|test-post-)|proba-.*eliminar/i.test(fileName)) return false;
  return true;
}

function extractReadableText($, $root) {
  const $clone = $root.clone();
  $clone.find("script, style, svg, noscript").remove();
  $clone.find("p, li, h1, h2, h3, h4, td, th, div, summary, figcaption, br, .activity-card__detail-item, .bank-box__label, .bank-box__value").each((_, el) => {
    $(el).append(" ");
  });
  return $clone.text().replace(/\s+/g, " ").trim();
}

function cleanPdfFilename(href) {
  if (!href) return "";
  try {
    const base = path.posix.basename(href.split("?")[0], ".pdf");
    return decodeURIComponent(base).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  } catch (_) {
    return path.posix.basename(href, ".pdf").replace(/[-_]+/g, " ").trim();
  }
}

function discoverEligibleSources(inputDir) {
  const sources = [];

  // 1. Homepage (src/index.njk)
  const indexFile = path.join(inputDir, "index.njk");
  if (fs.existsSync(indexFile)) {
    const fm = parseFrontmatter(fs.readFileSync(indexFile, "utf8"));
    if (isSourceEligible("index.njk", fm)) {
      sources.push({
        kind: "home",
        inputPath: indexFile,
        url: "/",
        outputRelPath: "index.html",
        fm,
      });
    }
  }

  // 2. Public Information Pages (src/pages/*.{md,njk})
  const pagesDir = path.join(inputDir, "pages");
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".md") || f.endsWith(".njk")).sort();
    for (const file of pageFiles) {
      // Exclude news archive listing (/novas/ and pagination) to prevent duplicate post listings
      if (file === "novas.njk" || file === "novas.md") continue;
      const fullPath = path.join(pagesDir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const fm = parseFrontmatter(raw);
      if (!isSourceEligible(file, fm)) continue;

      const slug = file.replace(/\.(md|njk)$/, "");
      let url = `/${slug}/`;
      if (typeof fm.permalink === "string" && fm.permalink.trim() && !fm.permalink.includes("{%")) {
        url = fm.permalink.trim();
        if (!url.startsWith("/")) url = "/" + url;
        if (!url.endsWith("/") && !url.endsWith(".html")) url += "/";
      }
      const cleanRel = url === "/" ? "index.html" : url.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
      sources.push({
        kind: slug === "extraescolares" ? "extraescolares" : "page",
        inputPath: fullPath,
        url,
        outputRelPath: cleanRel,
        fm,
      });
    }
  }

  // 3. Published News Posts (src/posts/*.md)
  const postsDir = path.join(inputDir, "posts");
  if (fs.existsSync(postsDir)) {
    const postFiles = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md")).sort().reverse();
    for (const file of postFiles) {
      const fullPath = path.join(postsDir, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const fm = parseFrontmatter(raw);
      if (!isSourceEligible(file, fm)) continue;

      const slug = file.replace(/\.md$/, "");
      let url = `/posts/${slug}/`;
      if (typeof fm.permalink === "string" && fm.permalink.trim() && !fm.permalink.includes("{%")) {
        url = fm.permalink.trim();
        if (!url.startsWith("/")) url = "/" + url;
        if (!url.endsWith("/") && !url.endsWith(".html")) url += "/";
      }
      const cleanRel = url.replace(/^\//, "").replace(/\/$/, "") + "/index.html";
      sources.push({
        kind: "post",
        inputPath: fullPath,
        url,
        outputRelPath: cleanRel,
        fm,
      });
    }
  }

  return sources;
}

function buildSearchIndex({ inputDir = "src", outputDir = "_site", results = [] } = {}) {
  const resultsByUrl = new Map();
  if (Array.isArray(results)) {
    for (const r of results) {
      if (r && r.url && typeof r.content === "string") {
        resultsByUrl.set(r.url, r.content);
        renderedHtmlCache.set(r.url, r.content);
      }
    }
  }

  const eligibleSources = discoverEligibleSources(inputDir);
  const activeUrls = new Set(eligibleSources.map((s) => s.url));
  for (const cachedUrl of Array.from(renderedHtmlCache.keys())) {
    if (!activeUrls.has(cachedUrl)) {
      renderedHtmlCache.delete(cachedUrl);
    }
  }

  const items = [];
  const seenDocIds = new Set();

  function addPdfDocumentEntry({ href, title, description, contextTitle, pageUrl }) {
    if (!href || !href.toLowerCase().includes(".pdf")) return;
    const docId = `doc:${href}@${pageUrl}`;
    if (seenDocIds.has(docId)) return;
    seenDocIds.add(docId);

    const filenameWords = cleanPdfFilename(href);
    const baseName = path.posix.basename(href.split("?")[0]);
    const cleanTitle = title || filenameWords || baseName;
    const displayTitle =
      contextTitle && !cleanTitle.toLowerCase().includes(contextTitle.toLowerCase().slice(0, 8))
        ? `${cleanTitle} — ${contextTitle}`
        : cleanTitle;

    const textParts = [];
    if (description) textParts.push(description);
    if (contextTitle) textParts.push(`Publicado en: ${contextTitle}.`);
    textParts.push(`Ficheiro PDF: ${baseName}`);

    items.push({
      id: docId,
      url: pageUrl,
      pdfUrl: href,
      title: displayTitle,
      type: "document",
      typeLabel: "Documento PDF",
      context: contextTitle || "Documentación",
      headings: [cleanTitle, filenameWords].filter(Boolean),
      text: textParts.join(" "),
    });
  }

  for (const src of eligibleSources) {
    let html = resultsByUrl.get(src.url);
    if (!html) {
      const diskPath = path.join(outputDir, src.outputRelPath);
      if (fs.existsSync(diskPath)) {
        html = fs.readFileSync(diskPath, "utf8");
        renderedHtmlCache.set(src.url, html);
      } else if (renderedHtmlCache.has(src.url)) {
        html = renderedHtmlCache.get(src.url);
      }
    }
    if (!html) continue;

    const $ = cheerio.load(html);
    const $main = $("#main");
    if (!$main.length) continue;

    if (src.kind === "home") {
      const $homeClone = $main.clone();
      // Remove duplicate news cards and navigation shortcut cards from homepage entry
      $homeClone.find(".home-news, .home-shortcuts").remove();
      const h1 = $homeClone.find("h1").first().text().trim() || "ANPA Ensino Rabadeira";
      $homeClone.find("h1").first().remove();
      const headings = $homeClone
        .find("h2, h3")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);
      const bodyText = extractReadableText($, $homeClone);

      items.push({
        id: "page:/",
        url: "/",
        title: h1,
        type: "page",
        typeLabel: "Información",
        context: "Portada",
        headings: ["Inicio", "Portada", ...headings],
        text: bodyText,
      });
      continue;
    }

    if (src.kind === "extraescolares") {
      const pageTitle = $main.find("h1").first().text().trim() || src.fm.title || "Actividades Extraescolares";

      // Map pricing table rows by activity name for richer activity metadata
      const pricingByActName = new Map();
      $main.find(".pricing-table tbody tr").each((_, tr) => {
        const tds = $(tr).find("td");
        if (tds.length >= 3) {
          const name = $(tds[0]).text().trim().toLowerCase();
          const hours = $(tds[1]).text().trim();
          const price = $(tds[2]).text().trim();
          if (name) pricingByActName.set(name, { hours, price });
        }
      });

      // 1. Individual Activity Entries
      $main.find("article.activity-card").each((_, card) => {
        const $card = $(card);
        const cardId = $card.attr("id") || "";
        const actName = $card.find(".activity-card__title").text().trim();
        if (!actName) return;

        const targetUrl = cardId ? `/extraescolares/#${cardId}` : "/extraescolares/";
        const badgeText = $card.find(".status-badge").text().trim();
        const details = $card
          .find(".activity-card__detail-item")
          .map((__, d) => $(d).text().replace(/\s+/g, " ").trim())
          .get();
        const noteText = $card.find(".activity-card__note").text().replace(/\s+/g, " ").trim();
        const pricingInfo = pricingByActName.get(actName.toLowerCase());

        const pdfKeywords = [];
        $card.find('a[href*=".pdf"]').each((__, a) => {
          const pdfHref = $(a).attr("href");
          const linkLabel = $(a).text().replace(/\s+/g, " ").trim();
          const cleanFn = cleanPdfFilename(pdfHref);
          if (linkLabel) pdfKeywords.push(linkLabel);
          if (cleanFn) pdfKeywords.push(cleanFn);
          addPdfDocumentEntry({
            href: pdfHref,
            title: linkLabel || `Ficha ${actName}`,
            description: noteText || details.join(" · "),
            contextTitle: `${actName} (Extraescolares)`,
            pageUrl: targetUrl,
          });
        });

        const textParts = [...details];
        if (pricingInfo && pricingInfo.hours) {
          textParts.push(`Horario: ${pricingInfo.hours} semanais`);
        }
        if (pricingInfo && pricingInfo.price && !textParts.join(" ").includes(pricingInfo.price)) {
          textParts.push(`Tarifa: ${pricingInfo.price}`);
        }
        if (badgeText) textParts.push(`Estado: ${badgeText}`);
        if (noteText) textParts.push(noteText);

        items.push({
          id: `activity:${cardId || actName}`,
          url: targetUrl,
          title: actName,
          type: "activity",
          typeLabel: "Extraescolares",
          context: pageTitle,
          headings: [actName, ...pdfKeywords].filter(Boolean),
          text: textParts.join(" · "),
        });
      });

      // 2. Accordion Sections (General Conditions & Coexistence Framework)
      const accordionIds = ["condicions-xerais", "marco-convivencia"];
      $main.find("details.conditions-accordion").each((idx, acc) => {
        const $acc = $(acc);
        const accId = $acc.attr("id") || accordionIds[idx] || `acordeon-${idx + 1}`;
        const summaryTitle = $acc.find("summary").first().text().replace(/\s+/g, " ").trim();
        const $content = $acc.find(".conditions-accordion__content");
        const subHeadings = $content
          .find("h3, h4, li > strong:first-child")
          .map((__, el) => $(el).text().replace(/:\s*$/, "").trim())
          .get()
          .filter(Boolean);
        const accText = extractReadableText($, $content);

        items.push({
          id: `section:/extraescolares/#${accId}`,
          url: `/extraescolares/#${accId}`,
          title: summaryTitle || "Condicións Extraescolares",
          type: "section",
          typeLabel: "Extraescolares",
          context: pageTitle,
          headings: [summaryTitle, ...subHeadings].filter(Boolean),
          text: accText,
        });
      });

      // 3. Extraescolares Overview Entry
      const $overview = $main.clone();
      $overview.find("h1, .activity-cards, details.conditions-accordion, .pricing-table tbody").remove();
      const overviewHeadings = $overview
        .find("h2, h3")
        .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
        .get()
        .filter(Boolean);
      const overviewText = extractReadableText($, $overview);

      items.push({
        id: "page:/extraescolares/",
        url: "/extraescolares/",
        title: pageTitle,
        type: "page",
        typeLabel: "Extraescolares",
        context: "Extraescolares",
        headings: overviewHeadings,
        text: overviewText,
      });
      continue;
    }

    // Standard Public Pages (/inscripcion/, /madrugadores/, /comedor/, /memoria/, /consello-escolar/) and Posts (/posts/*)
    const isPost = src.kind === "post";
    const h1 = $main.find("h1").first().text().replace(/\s+/g, " ").trim() || src.fm.title || "";
    const category = isPost ? $main.find(".post-single__category").first().text().trim() || src.fm.category || "Novas" : "";
    const dateText = isPost
      ? $main.find(".post-single__date").first().text().replace("📅", "").replace(/\s+/g, " ").trim()
      : "";
    const isoDate = isPost ? $main.find(".post-single__date").attr("datetime") || String(src.fm.date || "") : "";

    // Extract PDF documents (.doc-card and standalone PDF links)
    const docKeywords = [];
    $main.find(".doc-card").each((_, card) => {
      const $card = $(card);
      const docTitle = $card.find(".doc-card__title").text().replace(/\s+/g, " ").trim();
      const docMeta = $card
        .find(".doc-card__meta")
        .text()
        .replace(/^\s*PDF\s*/i, "")
        .replace(/\s+/g, " ")
        .trim();
      const pdfHref = $card.find('a[href*=".pdf"]').first().attr("href");
      const cleanFn = cleanPdfFilename(pdfHref);
      if (docTitle) docKeywords.push(docTitle);
      if (cleanFn) docKeywords.push(cleanFn);
      addPdfDocumentEntry({
        href: pdfHref,
        title: docTitle,
        description: docMeta,
        contextTitle: h1,
        pageUrl: src.url,
      });
    });

    $main.find('a[href*=".pdf"]').each((_, a) => {
      const $a = $(a);
      if ($a.closest(".doc-card").length > 0) return;
      const pdfHref = $a.attr("href");
      const linkText = $a.text().replace(/\s+/g, " ").trim();
      const cleanFn = cleanPdfFilename(pdfHref);
      if (linkText) docKeywords.push(linkText);
      if (cleanFn) docKeywords.push(cleanFn);
      addPdfDocumentEntry({
        href: pdfHref,
        title: linkText,
        description: "",
        contextTitle: h1,
        pageUrl: src.url,
      });
    });

    const $bodyClone = $main.find(".post-content").length ? $main.find(".post-content").first().clone() : $main.clone();
    $bodyClone.find("h1, .post-single__back").remove();

    const headings = $bodyClone
      .find("h2, h3, .doc-card__title, .bank-box__label")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean);

    // Include meaningful image alt texts (e.g., Comedor tutorial step alts)
    const imgAlts = $bodyClone
      .find("img[alt]")
      .map((_, img) => $(img).attr("alt").trim())
      .get()
      .filter((alt) => alt && alt !== h1);

    // Replace doc-card action button labels ("Abrir PDF", "Descargar") before extracting prose excerpt
    $bodyClone.find(".doc-card__actions").remove();

    let bodyText = extractReadableText($, $bodyClone);
    if (imgAlts.length > 0) {
      const missingAlts = imgAlts.filter((alt) => !bodyText.includes(alt));
      if (missingAlts.length > 0) {
        bodyText = `${bodyText} (${missingAlts.join(" · ")})`.trim();
      }
    }

    items.push({
      id: `${isPost ? "post" : "page"}:${src.url}`,
      url: src.url,
      title: h1,
      type: isPost ? "post" : "page",
      typeLabel: isPost ? "Novas" : "Información",
      context: isPost ? [category, dateText].filter(Boolean).join(" · ") : src.fm.navLabel || h1,
      date: isoDate || undefined,
      headings: [...headings, ...docKeywords].filter(Boolean),
      text: bodyText,
    });
  }

  const indexPayload = {
    version: 1,
    items,
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const indexPath = path.join(outputDir, "search-index.json");
  fs.writeFileSync(indexPath, JSON.stringify(indexPayload), "utf8");
  return indexPayload;
}

module.exports = function (eleventyConfig) {
  // Markdown config
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  });
  eleventyConfig.setLibrary("md", md);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/docs");
  eleventyConfig.addPassthroughCopy("emails");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy({ "docs/manual/img": "admin/manual/img" });

  // Add stable anchor IDs to Extraescolares conditions accordions in rendered HTML
  eleventyConfig.addTransform("extraescolaresAccordionIds", function (content) {
    const outPath = (this.page && this.page.outputPath) || this.outputPath || "";
    if (typeof content === "string" && /extraescolares[\\/]index\.html$/.test(outPath)) {
      let idx = 0;
      const ids = ["condicions-xerais", "marco-convivencia"];
      return content.replace(/<details\s+class="conditions-accordion">/g, (match) => {
        const id = ids[idx++];
        return id ? `<details class="conditions-accordion" id="${id}">` : match;
      });
    }
    return content;
  });

  // Automatically generate _site/search-index.json after every Eleventy build
  eleventyConfig.on("eleventy.after", ({ dir, results }) => {
    const inputDir = (dir && dir.input) || "src";
    const outputDir = (dir && dir.output) || "_site";
    buildSearchIndex({ inputDir, outputDir, results });
  });

  // Collections
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("pages", function (collectionApi) {
    return collectionApi.getFilteredByGlob(["src/pages/*.md", "src/pages/*.njk"]);
  });

  // navPages: pages visible in nav & quick-access, sorted by navOrder
  eleventyConfig.addCollection("navPages", function (collectionApi) {
    const seen = new Set();
    return collectionApi
      .getFilteredByGlob(["src/pages/*.md", "src/pages/*.njk"])
      .filter((p) => {
        if (p.data.showInNav === false) return false;
        if (p.data.pagination && p.data.pagination.pageNumber > 0) return false;
        const key = p.data.navLabel || p.data.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.data.navOrder || 99) - (b.data.navOrder || 99));
  });

  // Date filters (Galician)
  const mesesGalego = [
    "xaneiro", "febreiro", "marzo", "abril", "maio", "xuño",
    "xullo", "agosto", "setembro", "outubro", "novembro", "decembro",
  ];

  eleventyConfig.addFilter("dataGalega", (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getDate()} de ${mesesGalego[d.getMonth()]} de ${d.getFullYear()}`;
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString().split("T")[0];
  });

  eleventyConfig.addFilter("excerpt", (content) => {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "").replace(/\n/g, " ").trim();
    return text.length > 180 ? text.substring(0, 180) + "…" : text;
  });

  eleventyConfig.addFilter("limit", (arr, limit) => {
    return arr.slice(0, limit);
  });

  eleventyConfig.addFilter("categoryFilter", (posts, category) => {
    return posts.filter(
      (p) => p.data.category && p.data.category === category
    );
  });

  eleventyConfig.addFilter("md", (content) => {
    if (!content) return "";
    return md.render(content);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};

module.exports.buildSearchIndex = buildSearchIndex;

