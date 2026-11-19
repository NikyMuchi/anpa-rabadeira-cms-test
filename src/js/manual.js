/**
 * ANPA Ensino Rabadeira — Centro de Ayuda & Manual de Administración
 * Client-side local search, screenshot zoom modal, and accessible navigation.
 * Zero external dependencies.
 */

(function () {
  'use strict';

  // State
  let searchIndex = null;
  let searchResults = [];
  let selectedIndex = -1;
  let isFetchingIndex = false;

  // DOM Elements
  const searchInput = document.getElementById('manual-search-input');
  const searchDropdown = document.getElementById('manual-search-dropdown');
  const searchStatus = document.getElementById('manual-search-status');
  const searchActions = document.getElementById('manual-search-actions');
  const searchClear = document.getElementById('manual-search-clear');
  const searchSubmit = document.getElementById('manual-search-submit');
  const zoomModal = document.getElementById('manual-zoom-modal');
  const modalImg = document.getElementById('manual-modal-img');
  const modalCaption = document.getElementById('manual-modal-caption');
  const modalClose = document.getElementById('manual-modal-close');
  let lastFocusedElement = null;

  function updateSearchControls(hasText) {
    if (searchActions) {
      searchActions.hidden = !hasText;
    }
  }

  // Common Spanish stop words to allow natural language search
  const STOP_WORDS = new Set([
    'de', 'la', 'el', 'en', 'un', 'una', 'unos', 'unas', 'y', 'o',
    'para', 'por', 'con', 'como', 'que', 'los', 'las', 'del', 'al',
    'donde', 'su', 'sus'
  ]);

  // Normalize string for accent-insensitive and case-insensitive comparison
  function normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  // Load search index
  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    if (isFetchingIndex) return [];
    isFetchingIndex = true;
    try {
      const response = await fetch('/admin/manual/search-index.json');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      searchIndex = await response.json();
      return searchIndex;
    } catch (err) {
      console.warn('[Manual Search] Could not load search-index.json:', err);
      searchIndex = [];
      return searchIndex;
    } finally {
      isFetchingIndex = false;
    }
  }

  // Pre-load search index in background when idle
  if (typeof window !== 'undefined') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadSearchIndex(), { timeout: 2000 });
    } else {
      setTimeout(() => loadSearchIndex(), 500);
    }
  }

  // Perform search
  async function doSearch(query) {
    const rawQ = query.trim();
    const qNorm = normalizeText(rawQ);

    if (!qNorm || qNorm.length < 2) {
      closeSearch();
      return;
    }

    const index = await loadSearchIndex();
    if (!index || index.length === 0) return;

    const allTokens = qNorm.split(/\s+/).filter(Boolean);
    const sigTokens = allTokens.filter(t => !STOP_WORDS.has(t) && t.length > 1);
    const effectiveTokens = sigTokens.length > 0 ? sigTokens : allTokens;

    // Score and filter matches
    const matches = [];

    for (let i = 0; i < index.length; i++) {
      const item = index[i];
      const titleNorm = normalizeText(item.title);
      const keywordsNorm = normalizeText(item.keywords || '');
      const summaryNorm = normalizeText(item.summary || '');
      const textNorm = normalizeText(item.text || '');

      let score = 0;

      // Exact phrase match
      if (titleNorm.includes(qNorm)) score += 120;
      else if (keywordsNorm.includes(qNorm)) score += 90;
      else if (summaryNorm.includes(qNorm)) score += 50;
      else if (textNorm.includes(qNorm)) score += 25;

      // Token matches on effective tokens
      let matchedSigCount = 0;
      for (const token of effectiveTokens) {
        if (titleNorm.includes(token)) {
          score += 25;
          matchedSigCount++;
        } else if (keywordsNorm.includes(token)) {
          score += 18;
          matchedSigCount++;
        } else if (summaryNorm.includes(token)) {
          score += 10;
          matchedSigCount++;
        } else if (textNorm.includes(token)) {
          score += 4;
          matchedSigCount++;
        }
      }

      // Bonus for direct curated tasks
      if (item.type === 'task') score += 30;

      // Must match at least one significant token and have positive score
      if (matchedSigCount > 0 && score > 0) {
        if (matchedSigCount === effectiveTokens.length) {
          score += 60; // Huge bonus when all significant tokens are satisfied
        }
        matches.push({ item, score });
      }
    }

    // Sort by score desc
    matches.sort((a, b) => b.score - a.score);
    searchResults = matches.slice(0, 8).map(m => m.item);
    selectedIndex = -1;

    renderSearchResults(rawQ);
  }

  // Highlight matched terms safely
  function highlightText(text, query) {
    if (!text || !query) return text || '';
    const tokens = query.trim().split(/\s+/).filter(t => !STOP_WORDS.has(normalizeText(t)) && t.length > 1);
    if (tokens.length === 0) return text;

    const pattern = '(' + tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')';
    const regex = new RegExp(pattern, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Render search results dropdown
  function renderSearchResults(query) {
    if (!searchDropdown || !searchStatus) return;

    if (searchResults.length === 0) {
      searchStatus.textContent = `No se encontraron resultados para "${query}". Prueba con otros términos como "noticia", "comedor", "precio" o "pdf".`;
      searchDropdown.innerHTML = `<div class="manual-search-status">${escapeHtml(searchStatus.textContent)}</div>`;
      searchDropdown.setAttribute('data-open', 'true');
      return;
    }

    searchStatus.textContent = `${searchResults.length} resultados encontrados para "${query}". Usa las flechas arriba/abajo para navegar y Enter para abrir.`;

    let html = `<div class="manual-search-status">${searchResults.length} resultado${searchResults.length > 1 ? 's' : ''} para <strong>${escapeHtml(query)}</strong>:</div>`;

    searchResults.forEach((res, idx) => {
      let tagLabel = 'SECCIÓN';
      let tagClass = 'manual-search-item__tag--section';
      if (res.type === 'task') {
        tagLabel = '🎯 TAREA';
        tagClass = 'manual-search-item__tag--task';
      } else if (res.type === 'module') {
        tagLabel = '📖 MÓDULO';
        tagClass = 'manual-search-item__tag--module';
      }

      html += `
<a href="${res.url}" class="manual-search-item" data-index="${idx}" id="search-result-${idx}" role="option">
  <div class="manual-search-item__header">
    <span class="manual-search-item__tag ${tagClass}">${tagLabel}</span>
    <span class="manual-search-item__category">${escapeHtml(res.category || res.module || '')}</span>
  </div>
  <div class="manual-search-item__title">${highlightText(escapeHtml(res.title), query)}</div>
  <p class="manual-search-item__summary">${escapeHtml(res.summary || '')}</p>
</a>`;
    });

    searchDropdown.innerHTML = html;
    searchDropdown.setAttribute('data-open', 'true');
  }

  function closeSearch() {
    if (!searchDropdown) return;
    searchDropdown.removeAttribute('data-open');
    searchDropdown.innerHTML = '';
    searchResults = [];
    selectedIndex = -1;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Update selection in search dropdown
  function updateSelection() {
    if (!searchDropdown) return;
    const items = searchDropdown.querySelectorAll('.manual-search-item');
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.setAttribute('data-selected', 'true');
        item.setAttribute('aria-selected', 'true');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.removeAttribute('data-selected');
        item.removeAttribute('aria-selected');
      }
    });
  }

  // Search input events
  if (searchInput) {
    let debounceTimer = null;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const val = e.target.value;
      updateSearchControls(val.length > 0);
      debounceTimer = setTimeout(() => {
        doSearch(val);
      }, 120);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults.length > 0) {
          const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
          window.location.href = searchResults[targetIndex].url;
        } else if (searchInput.value.trim().length >= 2) {
          doSearch(searchInput.value).then(() => {
            if (searchResults.length > 0) {
              window.location.href = searchResults[0].url;
            }
          });
        }
        return;
      }

      if (!searchDropdown || searchDropdown.getAttribute('data-open') !== 'true') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % searchResults.length;
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + searchResults.length) % searchResults.length;
        updateSelection();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeSearch();
      }
    });

    searchInput.addEventListener('focus', () => {
      loadSearchIndex();
      if (searchInput.value.trim().length >= 2) {
        doSearch(searchInput.value);
      }
    });

    searchInput.addEventListener('pointerenter', () => {
      loadSearchIndex();
    }, { once: true });
  }

  if (searchClear) {
    searchClear.addEventListener('click', (e) => {
      e.preventDefault();
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      updateSearchControls(false);
      closeSearch();
    });
  }

  if (searchSubmit) {
    searchSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const val = searchInput ? searchInput.value.trim() : '';
      if (val.length >= 2) {
        doSearch(val);
        setTimeout(() => {
          if (searchDropdown && searchDropdown.getAttribute('data-open') === 'true' && searchResults.length > 0) {
            const firstResult = searchDropdown.querySelector('.manual-search-item');
            if (firstResult) firstResult.focus();
          }
        }, 60);
      }
    });
  }

  // Handle click on dropdown results
  if (searchDropdown) {
    searchDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.manual-search-item');
      if (item) {
        setTimeout(closeSearch, 100);
      }
    });
  }

  // Global click to close search dropdown when clicking outside search area
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.manual-search-wrap')) {
      closeSearch();
    }
  });

  // Close search on hashchange (e.g. navigation to same-page anchor)
  window.addEventListener('hashchange', closeSearch);

  // Global keyboard shortcuts: '/' to focus search, 'Escape' to dismiss
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    } else if (e.key === 'Escape') {
      if (zoomModal && zoomModal.getAttribute('data-open') === 'true') {
        closeZoomModal();
      } else if (searchDropdown && searchDropdown.getAttribute('data-open') === 'true') {
        closeSearch();
      }
    }
  });

  // Quick Task Pills click handler
  document.querySelectorAll('.manual-pill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const query = btn.getAttribute('data-query');
      if (query && searchInput) {
        e.preventDefault();
        searchInput.value = query;
        updateSearchControls(true);
        searchInput.focus();
        doSearch(query);
      }
    });
  });

  // ---------- Screenshot Zoom Modal (Lightbox) ----------
  function openZoomModal(src, alt) {
    if (!zoomModal || !modalImg) return;
    lastFocusedElement = document.activeElement;
    modalImg.src = src;
    modalImg.alt = alt || '';
    if (modalCaption) {
      modalCaption.textContent = alt || 'Captura de pantalla de Decap CMS';
    }
    zoomModal.setAttribute('data-open', 'true');
    zoomModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeZoomModal() {
    if (!zoomModal) return;
    zoomModal.removeAttribute('data-open');
    zoomModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalImg) modalImg.src = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    }
  }

  document.querySelectorAll('.manual-zoom-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-img-src');
      const alt = btn.getAttribute('data-img-alt');
      if (src) openZoomModal(src, alt);
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', closeZoomModal);
  }

  if (zoomModal) {
    zoomModal.addEventListener('click', (e) => {
      if (e.target === zoomModal) closeZoomModal();
    });
  }

  // ---------- Responsive Table of Contents (TOC) ----------
  const tocDetails = document.getElementById('manual-toc-details');
  if (tocDetails) {
    // Desktop: always keep open
    if (window.innerWidth > 960) {
      tocDetails.setAttribute('open', '');
    } else {
      // Mobile: collapse by default so tutorial content is immediately visible
      tocDetails.removeAttribute('open');
    }

    // Prevent closing on desktop via keyboard or click
    tocDetails.addEventListener('toggle', () => {
      if (window.innerWidth > 960 && !tocDetails.open) {
        tocDetails.open = true;
      }
    });
  }

  // ---------- Scroll Spy for Table of Contents ----------
  const tocLinks = document.querySelectorAll('.manual-toc-link');
  if (tocLinks.length > 0) {
    const headings = Array.from(document.querySelectorAll('.manual-heading[id]'));
    if (headings.length > 0) {
      const onScroll = () => {
        const scrollPos = window.scrollY + 120;
        let currentId = '';
        for (let i = 0; i < headings.length; i++) {
          if (headings[i].offsetTop <= scrollPos) {
            currentId = headings[i].id;
          } else {
            break;
          }
        }
        if (currentId) {
          tocLinks.forEach(link => {
            if (link.getAttribute('href') === '#' + currentId) {
              link.classList.add('is-active');
            } else {
              link.classList.remove('is-active');
            }
          });
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

})();
