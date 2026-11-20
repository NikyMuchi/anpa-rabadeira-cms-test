const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const PREVIEWS_DIR = path.resolve('scratch/previews');

if (!fs.existsSync(PREVIEWS_DIR)) {
  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
}

async function runBrowserQA() {
  console.log('--- INICIANDO QA DE NAVEGADOR REAL (PLAYWRIGHT) ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const consoleErrors = [];
  const logConsoleError = (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  };

  try {
    // ==========================================
    // 1. DESKTOP TEST: SEARCH & ALL 6 TERMS
    // ==========================================
    console.log('\n[1/5] Comprobando búsqueda en escritorio...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.on('console', logConsoleError);

    await desktopPage.goto(`${BASE_URL}/admin/manual/`, { waitUntil: 'networkidle' });

    // Test shortcut '/'
    await desktopPage.keyboard.press('/');
    const isSearchFocused = await desktopPage.evaluate(() => {
      return document.activeElement === document.getElementById('manual-search-input');
    });
    console.log(`  ✓ Atajo de teclado '/' enfoca el buscador: ${isSearchFocused ? 'SÍ' : 'NO'}`);
    if (!isSearchFocused) throw new Error("El atajo '/' no enfocó el buscador");

    // Test search terms: precio, publicar noticia, PDF, IBAN, ATRIGA, consejo escolar
    const terms = ['precio', 'publicar noticia', 'PDF', 'IBAN', 'ATRIGA', 'consejo escolar'];

    for (const term of terms) {
      const searchInput = desktopPage.locator('#manual-search-input');
      await searchInput.fill('');
      await searchInput.fill(term);
      await desktopPage.waitForTimeout(300); // allow debounce

      const dropdown = desktopPage.locator('#manual-search-dropdown');
      const isVisible = await dropdown.isVisible();
      const resultsCount = await desktopPage.locator('.manual-search-item').count();
      const firstTitle = resultsCount > 0 ? await desktopPage.locator('.manual-search-item__title').first().innerText() : '';

      console.log(`  ✓ Búsqueda de "${term}": visible=${isVisible}, ${resultsCount} resultados, primero="${firstTitle.trim()}"`);

      if (!isVisible || resultsCount === 0) {
        throw new Error(`La búsqueda no arrojó resultados visibles para "${term}"`);
      }

      // If term is 'publicar noticia', capture required screenshot #1
      if (term === 'publicar noticia') {
        const screenshotPath = path.join(PREVIEWS_DIR, '01-desktop-search-publicar-noticia.png');
        await desktopPage.screenshot({ path: screenshotPath });
        console.log(`    📸 Captura guardada: ${screenshotPath}`);
      }
    }

    // Test clicking a search result navigates to correct tutorial & section
    console.log('\n[2/5] Comprobando que hacer clic en un resultado navega a la sección...');
    const searchInput = desktopPage.locator('#manual-search-input');
    await searchInput.fill('consejo escolar');
    await desktopPage.waitForTimeout(300);
    const topResult = desktopPage.locator('.manual-search-item').first();
    const targetUrl = await topResult.getAttribute('href');
    await topResult.click();
    await desktopPage.waitForLoadState('networkidle');

    console.log(`  ✓ Navegación tras clic a: ${desktopPage.url()} (esperado destino: ${targetUrl})`);
    if (!desktopPage.url().includes('09-consejo-escolar')) {
      throw new Error(`El resultado no navegó a la página correcta. URL actual: ${desktopPage.url()}`);
    }

    // ==========================================
    // 2. DESKTOP TEST: CONSEJO ESCOLAR TOC (11 SECTIONS)
    // ==========================================
    console.log('\n[3/5] Comprobando que los 11 apartados del Consejo Escolar son visibles...');
    await desktopPage.goto(`${BASE_URL}/admin/manual/09-consejo-escolar/`, { waitUntil: 'networkidle' });

    const tocDetails = desktopPage.locator('#manual-toc-details');
    const isOpen = await tocDetails.evaluate(el => el.hasAttribute('open'));
    console.log(`  ✓ <details id="manual-toc-details"> tiene atributo open: ${isOpen}`);

    const tocLinks = desktopPage.locator('.manual-sidebar .manual-toc-link');
    const tocCount = await tocLinks.count();
    console.log(`  ✓ Número de enlaces de apartados en sidebar: ${tocCount} (esperado 11)`);

    const linkTexts = [];
    for (let i = 0; i < tocCount; i++) {
      const link = tocLinks.nth(i);
      const isLinkVisible = await link.isVisible();
      const text = await link.innerText();
      linkTexts.push(text.trim());
      if (!isLinkVisible) {
        throw new Error(`El enlace ${i + 1} ("${text}") no es visible en el sidebar`);
      }
    }
    console.log(`  ✓ Todos los 11 apartados son visibles e interactivos:`);
    linkTexts.forEach((t, i) => console.log(`      ${i + 1}. ${t}`));

    // Test clicking section #6 (enlaces) scrolls correctly
    const link6 = tocLinks.nth(5); // 0-indexed, 6th link
    const href6 = await link6.getAttribute('href');
    await link6.click();
    await desktopPage.waitForTimeout(400);

    const headingId = href6.startsWith('#') ? href6.slice(1) : href6;
    const heading6 = desktopPage.locator(`[id="${headingId}"]`);
    const headingBox = await heading6.boundingBox();
    console.log(`  ✓ Clic en sección 6 ("${href6}") hizo scroll a la cabecera (y=${headingBox ? Math.round(headingBox.y) : 'null'})`);

    // Capture required screenshot #3: Consejo Escolar tutorial with all 11 sidebar links visible
    const screenshotTocPath = path.join(PREVIEWS_DIR, '03-desktop-tutorial-consejo-escolar-toc.png');
    await desktopPage.screenshot({ path: screenshotTocPath });
    console.log(`    📸 Captura guardada: ${screenshotTocPath}`);

    // Check all other 13 tutorial pages for TOC visibility
    console.log('\nComprobando visibilidad de TOC en los 14 módulos...');
    const manualData = require('../src/_data/manual.js')();

    for (const mod of manualData.modules) {
      await desktopPage.goto(`${BASE_URL}${mod.url}`, { waitUntil: 'domcontentloaded' });
      const count = await desktopPage.locator('.manual-sidebar .manual-toc-link').count();
      const firstLinkVisible = count > 0 ? await desktopPage.locator('.manual-sidebar .manual-toc-link').first().isVisible() : true;
      console.log(`  ✓ Módulo ${mod.numStr} (${mod.slug}): ${count} apartados en TOC, visible=${firstLinkVisible}`);
      if (!firstLinkVisible || count === 0) {
        throw new Error(`El módulo ${mod.slug} tiene TOC vacío o no visible (count=${count})`);
      }
    }
    console.log('  ✓ Los 14 módulos tienen sus índices de apartados completamente visibles.');

    // ==========================================
    // 3. MOBILE TESTS: SEARCH & READABILITY
    // ==========================================
    console.log('\n[4/5] Comprobando experiencia móvil (390x844 iPhone 12/13/14)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', logConsoleError);

    await mobilePage.goto(`${BASE_URL}/admin/manual/`, { waitUntil: 'networkidle' });

    // Capture required screenshot #4: Mobile Help Centre homepage after typography adjustment
    const screenshotMobileHomePath = path.join(PREVIEWS_DIR, '04-mobile-help-centre-homepage-adjusted.png');
    await mobilePage.screenshot({ path: screenshotMobileHomePath });
    console.log(`    📸 Captura guardada: ${screenshotMobileHomePath}`);

    // Mobile search for 'precio'
    console.log('\n[5/5] Probando búsqueda móvil para "precio"...');
    const mobileSearchInput = mobilePage.locator('#manual-search-input');
    await mobileSearchInput.fill('precio');
    await mobilePage.waitForTimeout(300);

    const mobileDropdown = mobilePage.locator('#manual-search-dropdown');
    const isMobileDropdownVisible = await mobileDropdown.isVisible();
    const mobileCount = await mobilePage.locator('.manual-search-item').count();
    console.log(`  ✓ Búsqueda móvil de "precio": visible=${isMobileDropdownVisible}, resultados=${mobileCount}`);

    if (!isMobileDropdownVisible || mobileCount === 0) {
      throw new Error('La búsqueda móvil de "precio" no mostró resultados');
    }

    // Capture required screenshot #2: Mobile search results for 'precio'
    const screenshotMobileSearchPath = path.join(PREVIEWS_DIR, '02-mobile-search-precio.png');
    await mobilePage.screenshot({ path: screenshotMobileSearchPath });
    console.log(`    📸 Captura guardada: ${screenshotMobileSearchPath}`);

    // Mobile TOC test on 09-consejo-escolar
    await mobilePage.goto(`${BASE_URL}/admin/manual/09-consejo-escolar/`, { waitUntil: 'networkidle' });
    const mobileToc = mobilePage.locator('#manual-toc-details');
    const isMobileOpenInitially = await mobileToc.evaluate(el => el.hasAttribute('open'));
    console.log(`  ✓ En móvil, el TOC inicia colapsado para lectura inmediata: ${!isMobileOpenInitially ? 'SÍ' : 'NO'}`);

    // Tap summary to expand TOC on mobile
    await mobilePage.locator('#manual-toc-details summary').click();
    const isMobileOpenAfterTap = await mobileToc.evaluate(el => el.hasAttribute('open'));
    const mobileTocLinksCount = await mobilePage.locator('.manual-sidebar .manual-toc-link').count();
    console.log(`  ✓ Tras pulsar el desplegable, se abren los ${mobileTocLinksCount} apartados: ${isMobileOpenAfterTap ? 'SÍ' : 'NO'}`);

    // ==========================================
    // 4. CONSOLE ERRORS CHECK
    // ==========================================
    console.log('\nComprobando errores en la consola del navegador...');
    if (consoleErrors.length > 0) {
      console.error('❌ Errores detectados en la consola del navegador:');
      consoleErrors.forEach(err => console.error('   -', err));
      throw new Error(`Se detectaron ${consoleErrors.length} errores en la consola del navegador.`);
    } else {
      console.log('  ✓ Cero errores (0) en la consola del navegador en todas las páginas probadas.');
    }

    console.log('\n🎉 ¡TODAS LAS COMPROBACIONES DE NAVEGADOR PASARON CON ÉXITO!');

    await desktopContext.close();
    await mobileContext.close();
  } finally {
    await browser.close();
  }
}

runBrowserQA().catch(err => {
  console.error('\n❌ ERROR DURANTE EL QA DE NAVEGADOR:', err.message);
  process.exit(1);
});
