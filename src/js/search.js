/**
 * ANPA Ensino Rabadeira — Buscador Xeral (Client-Side Search)
 * Zero-dependency, privacy-friendly search over /search-index.json.
 */
(function () {
  "use strict";

  // Explicit Spanish <-> Galician synonym map for relevant family and school terms.
  // Avoids arbitrary regex stem/substring substitutions.
  const SYNONYM_MAP = {
    inscripcion: ["inscricion", "alta", "matricula"],
    inscripciones: ["inscricions", "inscricion", "alta"],
    inscricion: ["inscripcion", "alta"],
    inscricions: ["inscripciones", "inscricion"],
    inscribirse: ["inscricion", "alta"],
    cuota: ["cota", "prezo", "tarifa"],
    cuotas: ["cotas", "prezos", "tarifas"],
    cota: ["cuota", "prezo", "tarifa"],
    cotas: ["cuotas", "prezos", "tarifas"],
    precio: ["prezo", "cota", "tarifa"],
    precios: ["prezos", "cotas", "tarifas"],
    prezo: ["precio", "cota", "tarifa"],
    plazo: ["prazo", "prazos"],
    plazos: ["prazos", "prazo"],
    prazo: ["plazo", "prazos"],
    baja: ["baixa", "baixas"],
    bajas: ["baixas", "baixa"],
    baixa: ["baja", "baixas"],
    recogida: ["recollida"],
    recollida: ["recogida"],
    desayuno: ["almorzo", "madrugadores"],
    desayunos: ["almorzo", "madrugadores"],
    almorzo: ["desayuno", "madrugadores"],
    consejo: ["consello"],
    consello: ["consejo"],
    colegio: ["colexio", "centro", "ceip"],
    escuela: ["escola", "centro", "ceip"],
    noticia: ["novas", "nova"],
    noticias: ["novas", "nova"],
    novas: ["noticias", "avisos"],
    aviso: ["novas", "avisos"],
    avisos: ["novas", "aviso"],
    taller: ["obradoiro", "obradoiros"],
    talleres: ["obradoiros", "obradoiro"],
    obradoiro: ["taller", "obradoiros"],
    obradoiros: ["talleres", "obradoiro"],
    carnaval: ["entroido"],
    entroido: ["carnaval"],
    elecciones: ["eleccions"],
    eleccions: ["elecciones"],
    gimnasia: ["ximnasia"],
    ximnasia: ["gimnasia"],
    yoga: ["ioga"],
    ioga: ["yoga"],
    tecnologia: ["tecnoloxias", "tecnoloxia"],
    tecnologias: ["tecnoloxias"],
    nino: ["neno", "alumnado"],
    ninos: ["nenos", "alumnado"],
    telefono: ["tel", "contacto"],
    correo: ["email", "contacto"],
    email: ["correo", "contacto"],
  };

  const STOPWORDS = new Set([
    "de", "do", "da", "dos", "das", "del", "en", "no", "na", "nos", "nas",
    "el", "la", "los", "las", "un", "unha", "una", "o", "a", "os", "as",
    "e", "y", "para", "por", "con", "ao", "al", "sobre", "que", "se",
  ]);

  const DOC_INTENT_TERMS = new Set([
    "pdf", "documento", "documentos", "triptico", "ficha", "nota", "prensa",
    "ficheiro", "arquivo", "descargar", "descarga", "2023", "2024",
  ]);

  function normalizeText(str) {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function buildNormIndexMap(origStr) {
    const str = String(origStr || "");
    const normChars = [];
    const normToOrig = [];

    for (let i = 0; i < str.length; i++) {
      const folded = str[i]
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      for (let j = 0; j < folded.length; j++) {
        normChars.push(folded[j]);
        normToOrig.push(i);
      }
    }
    normToOrig.push(str.length);
    return {
      norm: normChars.join(""),
      normToOrig,
    };
  }

  function tokenizeQuery(rawQuery) {
    const norm = normalizeText(rawQuery).trim();
    if (!norm) return [];
    const rawTokens = norm
      .split(/[^a-z0-9@._€]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 || /^\d+$/.test(t));

    if (rawTokens.length <= 1) return rawTokens;
    const filtered = rawTokens.filter((t) => !STOPWORDS.has(t));
    return filtered.length > 0 ? filtered : rawTokens;
  }

  function getTokenVariants(token) {
    const variants = [token];
    if (Object.prototype.hasOwnProperty.call(SYNONYM_MAP, token)) {
      for (const syn of SYNONYM_MAP[token]) {
        if (!variants.includes(syn)) variants.push(syn);
      }
    }
    return variants;
  }

  function hasWordMatch(haystack, needle) {
    if (!haystack || !needle) return false;
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
    return re.test(haystack);
  }

  function searchIndexItems(items, rawQuery) {
    if (!Array.isArray(items)) return [];
    const trimmed = String(rawQuery || "").trim();
    if (trimmed.length < 2) return [];

    const tokens = tokenizeQuery(trimmed);
    if (tokens.length === 0) return [];

    const normFullQuery = normalizeText(trimmed).replace(/\s+/g, " ").trim();
    const fullQueryVariants = [
      normFullQuery,
      ...(SYNONYM_MAP[normFullQuery] || []),
    ];

    const scored = [];

    for (const item of items) {
      const normTitle = normalizeText(item.title || "");
      const normHeadings = normalizeText((item.headings || []).join(" "));
      const normContext = normalizeText(item.context || "");
      const normText = normalizeText(item.text || "");

      let score = 0;
      let allTokensMatched = true;
      let matchedOwnContentCount = 0;
      let matchedHeadingOrTitleCount = 0;
      const matchedTermsSet = new Set();

      for (const token of tokens) {
        const variants = getTokenVariants(token);
        let tokenBestScore = 0;
        let tokenMatchedOwn = false;
        let tokenMatchedTitleOrHeading = false;

        for (const v of variants) {
          let vScore = 0;
          let vOwn = false;
          let vTitleOrHeading = false;

          if (normTitle.includes(v)) {
            vOwn = true;
            vTitleOrHeading = true;
            matchedTermsSet.add(v);
            if (normTitle === v) {
              vScore = Math.max(vScore, 240);
            } else if (hasWordMatch(normTitle, v)) {
              vScore = Math.max(vScore, 95);
            } else {
              vScore = Math.max(vScore, 55);
            }
          }

          if (normHeadings.includes(v)) {
            vOwn = true;
            vTitleOrHeading = true;
            matchedTermsSet.add(v);
            if (hasWordMatch(normHeadings, v)) {
              vScore = Math.max(vScore, 45);
            } else {
              vScore = Math.max(vScore, 28);
            }
          }

          if (normText.includes(v)) {
            vOwn = true;
            matchedTermsSet.add(v);
            if (hasWordMatch(normText, v)) {
              vScore = Math.max(vScore, 18);
            } else {
              vScore = Math.max(vScore, 10);
            }
          }

          if (normContext.includes(v)) {
            matchedTermsSet.add(v);
            vScore = Math.max(vScore, 14);
          }

          if (vScore > tokenBestScore) {
            tokenBestScore = vScore;
          }
          if (vOwn) tokenMatchedOwn = true;
          if (vTitleOrHeading) tokenMatchedTitleOrHeading = true;
        }

        if (tokenBestScore === 0) {
          allTokensMatched = false;
          break;
        }

        score += tokenBestScore;
        if (tokenMatchedOwn) matchedOwnContentCount++;
        if (tokenMatchedTitleOrHeading) matchedHeadingOrTitleCount++;
      }

      if (!allTokensMatched) continue;

      // Sub-items (individual activities & PDF document cards) must match at least one token
      // in their own title/headings/text, not solely in their parent context name.
      if ((item.type === "activity" || item.type === "document") && matchedOwnContentCount === 0) {
        continue;
      }

      // Bonus for exact or phrase matches in title
      for (const fq of fullQueryVariants) {
        if (normTitle === fq) {
          score += 180;
          break;
        } else if (normTitle.startsWith(fq + " ") || normTitle.includes(fq)) {
          score += 80;
          break;
        }
      }

      if (tokens.length > 1 && normText.includes(normFullQuery)) {
        score += 25;
      }

      // Type priority tie-breaker
      if (item.type === "page") score += 6;
      else if (item.type === "activity") score += 5;
      else if (item.type === "post") score += 4;
      else if (item.type === "section") score += 2;
      else if (item.type === "document") score += 1;

      scored.push({
        item,
        score,
        matchedTerms: Array.from(matchedTermsSet),
        matchedHeadingOrTitleCount,
      });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.item.date && b.item.date && a.item.date !== b.item.date) {
        return b.item.date.localeCompare(a.item.date);
      }
      return (a.item.title || "").localeCompare(b.item.title || "", "gl");
    });

    // Deduplicate redundant document entries if their parent page/activity/post is already matched,
    // unless the query has document intent or matches the PDF's specific title/filename beyond the parent title.
    const nonDocByUrl = new Map();
    for (const entry of scored) {
      if (entry.item.type !== "document") {
        nonDocByUrl.set(entry.item.url, entry);
      }
    }

    const hasDocIntent = tokens.some((t) => DOC_INTENT_TERMS.has(t));
    const filtered = scored.filter((entry) => {
      if (entry.item.type !== "document") return true;
      const parentEntry = nonDocByUrl.get(entry.item.url);
      if (!parentEntry) return true;
      if (hasDocIntent) return true;

      // Keep the document card if the query matched a term in the PDF's own headings/filename
      // that does not appear in the parent entry's title
      const parentNormTitle = normalizeText(parentEntry.item.title || "");
      const docNormHeadings = normalizeText((entry.item.headings || []).join(" "));
      for (const term of entry.matchedTerms) {
        if (docNormHeadings.includes(term) && !parentNormTitle.includes(term)) {
          return true;
        }
      }
      return false;
    });

    return filtered;
  }

  function extractExcerpt(origText, matchedTerms, maxLen) {
    const limit = maxLen || 165;
    const text = String(origText || "").trim();
    if (!text) return "";
    if (text.length <= limit) return text;

    const { norm, normToOrig } = buildNormIndexMap(text);
    let bestNormIdx = -1;

    if (Array.isArray(matchedTerms)) {
      for (const term of matchedTerms) {
        if (!term) continue;
        const idx = norm.indexOf(term);
        if (idx !== -1 && (bestNormIdx === -1 || idx < bestNormIdx)) {
          bestNormIdx = idx;
        }
      }
    }

    if (bestNormIdx === -1) {
      let cut = text.slice(0, limit);
      const lastSpace = cut.lastIndexOf(" ");
      if (lastSpace > limit * 0.6) cut = cut.slice(0, lastSpace);
      return cut.trim() + "…";
    }

    const origMatchIdx = normToOrig[bestNormIdx] || 0;
    const halfWindow = Math.floor(limit / 2);
    let start = Math.max(0, origMatchIdx - halfWindow);
    let end = Math.min(text.length, start + limit);
    if (end - start < limit) {
      start = Math.max(0, end - limit);
    }

    if (start > 0) {
      const nextSpace = text.indexOf(" ", start);
      if (nextSpace !== -1 && nextSpace - start < 24) {
        start = nextSpace + 1;
      }
    }
    if (end < text.length) {
      const prevSpace = text.lastIndexOf(" ", end);
      if (prevSpace !== -1 && end - prevSpace < 24) {
        end = prevSpace;
      }
    }

    const prefix = start > 0 ? "…" : "";
    const suffix = end < text.length ? "…" : "";
    return prefix + text.slice(start, end).trim() + suffix;
  }

  function buildHighlightedSegments(origStr, matchedTerms) {
    const str = String(origStr || "");
    if (!str) return [];
    const terms = (matchedTerms || []).filter((t) => t && t.length >= 2);
    if (terms.length === 0) {
      return [{ text: str, highlight: false }];
    }

    const { norm, normToOrig } = buildNormIndexMap(str);
    const intervals = [];

    for (const term of terms) {
      let searchPos = 0;
      while (searchPos < norm.length) {
        const idx = norm.indexOf(term, searchPos);
        if (idx === -1) break;
        const origStart = normToOrig[idx];
        const origEnd = normToOrig[idx + term.length];
        if (origEnd > origStart) {
          intervals.push([origStart, origEnd]);
        }
        searchPos = idx + term.length;
      }
    }

    if (intervals.length === 0) {
      return [{ text: str, highlight: false }];
    }

    intervals.sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1]));
    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = intervals[i];
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }

    const segments = [];
    let cursor = 0;
    for (const [start, end] of merged) {
      if (start > cursor) {
        segments.push({ text: str.slice(cursor, start), highlight: false });
      }
      segments.push({ text: str.slice(start, end), highlight: true });
      cursor = end;
    }
    if (cursor < str.length) {
      segments.push({ text: str.slice(cursor), highlight: false });
    }
    return segments;
  }

  function appendHighlightedText(container, text, matchedTerms) {
    const segments = buildHighlightedSegments(text, matchedTerms);
    for (const seg of segments) {
      if (seg.highlight) {
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.appendChild(document.createTextNode(seg.text));
        container.appendChild(mark);
      } else {
        container.appendChild(document.createTextNode(seg.text));
      }
    }
  }

  function resolveHashTarget(hash) {
    if (!hash || hash.length <= 1) return null;
    const rawId = decodeURIComponent(hash.slice(1));
    let el = document.getElementById(rawId);
    if (!el && (rawId === "condicions-xerais" || rawId === "marco-convivencia")) {
      const accordions = document.querySelectorAll("details.conditions-accordion");
      el = rawId === "condicions-xerais" ? accordions[0] : accordions[1];
    }
    return el || null;
  }

  function openTargetAccordionAndScroll(hash) {
    const target = resolveHashTarget(hash);
    if (!target) return false;

    if (target.tagName && target.tagName.toLowerCase() === "details") {
      target.open = true;
    } else if (typeof target.closest === "function") {
      const parentDetails = target.closest("details");
      if (parentDetails) parentDetails.open = true;
    }

    const header = document.querySelector(".site-header");
    const headerHeight = header ? header.offsetHeight : 72;
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - headerHeight - 16;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return true;
  }

  function initSiteSearch() {
    const toggleBtn = document.querySelector(".search-toggle");
    const panel = document.getElementById("site-search-panel");
    const form = panel ? panel.querySelector(".search-form") : null;
    const input = document.getElementById("site-search-input");
    const clearBtn = panel ? panel.querySelector(".search-clear-btn") : null;
    const closeBtn = panel ? panel.querySelector(".search-close-btn") : null;
    const statusEl = document.getElementById("site-search-status");
    const resultsEl = document.getElementById("site-search-results");

    if (window.location.hash) {
      setTimeout(() => {
        openTargetAccordionAndScroll(window.location.hash);
      }, 60);
    }
    window.addEventListener("hashchange", () => {
      if (window.location.hash) {
        openTargetAccordionAndScroll(window.location.hash);
      }
    });

    if (!toggleBtn || !panel || !input || !statusEl || !resultsEl) return;

    let indexItems = null;
    let loadState = "idle"; // "idle" | "loading" | "ready" | "error"
    let fetchPromise = null;

    function loadSearchIndex() {
      if (loadState === "ready" && Array.isArray(indexItems)) {
        return Promise.resolve(indexItems);
      }
      if (loadState === "loading" && fetchPromise) {
        return fetchPromise;
      }

      loadState = "loading";
      renderCurrentState();

      const indexUrl = window.__ANPA_SEARCH_INDEX_URL || "/search-index.json";
      fetchPromise = fetch(indexUrl, {
        headers: { Accept: "application/json" },
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (!data || !Array.isArray(data.items)) {
            throw new Error("Formato de índice inválido");
          }
          indexItems = data.items;
          loadState = "ready";
          renderCurrentState();
          return indexItems;
        })
        .catch(() => {
          loadState = "error";
          fetchPromise = null;
          renderCurrentState();
          return null;
        });

      return fetchPromise;
    }

    function setPanelOpen(isOpen, options) {
      const opts = options || {};
      const restoreFocus = opts.restoreFocus !== false;

      if (isOpen) {
        if (typeof window.closeMobileNav === "function") {
          window.closeMobileNav();
        }
        panel.hidden = false;
        panel.classList.add("is-open");
        toggleBtn.setAttribute("aria-expanded", "true");
        toggleBtn.setAttribute("aria-label", "Pechar o buscador");
        loadSearchIndex();
        input.focus();
      } else {
        panel.classList.remove("is-open");
        panel.hidden = true;
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-label", "Abrir o buscador");
        const nav = document.querySelector(".main-nav");
        if (!nav || !nav.classList.contains("is-open")) {
          document.body.classList.remove("nav-open");
        }
        if (restoreFocus) {
          toggleBtn.focus();
        }
      }
    }

    window.closeSiteSearch = function (options) {
      if (!panel.hidden) {
        setPanelOpen(false, options);
      }
    };

    function renderInitialState() {
      statusEl.textContent = "";
      resultsEl.replaceChildren();
      const p = document.createElement("p");
      p.className = "search-hint";
      p.textContent =
        "Escribe polo menos 2 letras para buscar en toda a web (ex.: inglés, comedor, madrugadores, inscrición, TEA…).";
      resultsEl.appendChild(p);
    }

    function renderLoadingState() {
      statusEl.textContent = "Cargando o buscador…";
      resultsEl.replaceChildren();
      const p = document.createElement("p");
      p.className = "search-loading";
      p.textContent = "Cargando o buscador…";
      resultsEl.appendChild(p);
    }

    function renderErrorState() {
      statusEl.textContent =
        "Non foi posible cargar o buscador neste momento.";
      resultsEl.replaceChildren();

      const box = document.createElement("div");
      box.className = "search-state-box search-state-box--error";

      const msg = document.createElement("p");
      msg.className = "search-state-box__title";
      msg.textContent =
        "Non foi posible cargar o buscador neste momento. Comproba a túa conexión e téntao de novo.";

      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.className = "search-retry-btn";
      retryBtn.textContent = "Tentar de novo";
      retryBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        loadState = "idle";
        loadSearchIndex();
        input.focus();
      });

      box.appendChild(msg);
      box.appendChild(retryBtn);
      resultsEl.appendChild(box);
    }

    function renderNoResultsState(queryText) {
      const msgText = `Non se atoparon resultados para «${queryText}».`;
      statusEl.textContent = msgText;
      resultsEl.replaceChildren();

      const box = document.createElement("div");
      box.className = "search-state-box";

      const title = document.createElement("p");
      title.className = "search-state-box__title";
      title.textContent = msgText;

      const help = document.createElement("p");
      help.className = "search-state-box__help";
      help.textContent =
        "Proba con outras palabras clave (por exemplo: extraescolares, comedor, madrugadores, alta de socio) ou consulta o menú principal.";

      box.appendChild(title);
      box.appendChild(help);
      resultsEl.appendChild(box);
    }

    function renderResultsList(matches, queryText) {
      const count = matches.length;
      const countMsg =
        count === 1
          ? `1 resultado atopado para «${queryText}»`
          : `${count} resultados atopados para «${queryText}»`;
      statusEl.textContent = countMsg;

      resultsEl.replaceChildren();
      const list = document.createElement("ul");
      list.className = "search-results__list";

      for (const match of matches.slice(0, 15)) {
        const { item, matchedTerms } = match;
        const li = document.createElement("li");
        li.className = "search-results__item";

        const link = document.createElement("a");
        link.className = "search-result-card";
        link.href = item.url;

        const metaRow = document.createElement("div");
        metaRow.className = "search-result-card__meta";

        const badge = document.createElement("span");
        badge.className = `search-badge search-badge--${item.type || "page"}`;
        badge.textContent = item.typeLabel || "Información";
        metaRow.appendChild(badge);

        if (item.context && item.context !== item.title) {
          const ctx = document.createElement("span");
          ctx.className = "search-result-card__context";
          ctx.textContent = item.context;
          metaRow.appendChild(ctx);
        }

        const titleEl = document.createElement("h3");
        titleEl.className = "search-result-card__title";
        appendHighlightedText(titleEl, item.title || "", matchedTerms);

        const excerptText = extractExcerpt(item.text || "", matchedTerms, 165);
        const excerptEl = document.createElement("p");
        excerptEl.className = "search-result-card__excerpt";
        appendHighlightedText(excerptEl, excerptText, matchedTerms);

        link.appendChild(metaRow);
        link.appendChild(titleEl);
        if (excerptText) {
          link.appendChild(excerptEl);
        }

        link.addEventListener("click", (e) => {
          const targetUrl = new URL(link.href, window.location.origin);
          const samePath =
            targetUrl.pathname.replace(/\/$/, "") ===
            window.location.pathname.replace(/\/$/, "");
          setPanelOpen(false, { restoreFocus: false });

          if (samePath && targetUrl.hash) {
            e.preventDefault();
            if (window.location.hash !== targetUrl.hash) {
              history.pushState(null, "", targetUrl.hash);
            }
            openTargetAccordionAndScroll(targetUrl.hash);
          }
        });

        li.appendChild(link);
        list.appendChild(li);
      }

      resultsEl.appendChild(list);
    }

    function renderCurrentState() {
      const rawQuery = input.value || "";
      const trimmed = rawQuery.trim();

      if (clearBtn) {
        clearBtn.hidden = rawQuery.length === 0;
      }

      if (loadState === "error") {
        renderErrorState();
        return;
      }

      if (trimmed.length < 2) {
        if (loadState === "loading") {
          renderLoadingState();
        } else {
          renderInitialState();
        }
        return;
      }

      if (loadState === "loading" || !Array.isArray(indexItems)) {
        renderLoadingState();
        return;
      }

      const matches = searchIndexItems(indexItems, trimmed);
      if (matches.length === 0) {
        renderNoResultsState(trimmed);
      } else {
        renderResultsList(matches, trimmed);
      }
    }

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !panel.hidden;
      setPanelOpen(!isOpen);
    });

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        renderCurrentState();
      });
    }

    input.addEventListener("input", () => {
      if (loadState === "idle") {
        loadSearchIndex();
      }
      renderCurrentState();
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        input.value = "";
        renderCurrentState();
        input.focus();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setPanelOpen(false, { restoreFocus: true });
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) {
        e.preventDefault();
        setPanelOpen(false, { restoreFocus: true });
      }
    });

    document.addEventListener("click", (e) => {
      if (!panel.hidden) {
        const header = document.querySelector(".site-header");
        const clickedInsideHeader =
          header &&
          (typeof e.composedPath === "function"
            ? e.composedPath().includes(header)
            : header.contains(e.target));
        if (header && !clickedInsideHeader) {
          setPanelOpen(false, { restoreFocus: false });
        }
      }
    });
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initSiteSearch);
    } else {
      initSiteSearch();
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      SYNONYM_MAP,
      normalizeText,
      tokenizeQuery,
      getTokenVariants,
      searchIndexItems,
      extractExcerpt,
      buildHighlightedSegments,
    };
  }
})();
