const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const PREVIEWS_DIR = path.resolve('scratch/previews');

if (!fs.existsSync(PREVIEWS_DIR)) {
  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
}

async function testDualActionSearchBox() {
  console.log('--- TEST DE INTERACCIÓN FINAL DEL BUSCADOR (DUAL ACTION BUTTONS) ---');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  const consoleErrors = [];
  const logConsoleError = (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  };

  try {
    // -------------------------------------------------------------
    // 1. DESKTOP TEST (1280x800)
    // -------------------------------------------------------------
    console.log('\n[1/3] Comprobando en escritorio (1280x800)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const desktopPage = await desktopContext.newPage();
    desktopPage.on('console', logConsoleError);

    await desktopPage.goto(`${BASE_URL}/admin/manual/`, { waitUntil: 'networkidle' });

    const searchInput = desktopPage.locator('#manual-search-input');
    const searchActions = desktopPage.locator('#manual-search-actions');
    const clearBtn = desktopPage.locator('#manual-search-clear');
    const submitBtn = desktopPage.locator('#manual-search-submit');
    const leftIcon = desktopPage.locator('.manual-search-icon');
    const kbdBadge = desktopPage.locator('.manual-search-kbd');

    // Requirement 1 & 7: When empty, no buttons on the right, no '/' badge, left icon present
    let isActionsHidden = await searchActions.evaluate(el => el.hidden || window.getComputedStyle(el).display === 'none');
    let hasKbdInDOM = await kbdBadge.count();
    let isLeftIconVisible = await leftIcon.isVisible();

    console.log(`  ✓ Con input vacío: grupo de botones derecho oculto (${isActionsHidden})`);
    console.log(`  ✓ Distintivo '/' visual eliminado del DOM (${hasKbdInDOM === 0})`);
    console.log(`  ✓ Icono izquierdo de lupa presente y visible (${isLeftIconVisible})`);

    if (!isActionsHidden) throw new Error('Los botones de acción no deben ser visibles cuando el input está vacío');
    if (hasKbdInDOM > 0) throw new Error('El distintivo / debe haber sido eliminado del HTML');
    if (!isLeftIconVisible) throw new Error('El icono izquierdo de lupa debe permanecer visible');

    // Capture desktop empty state (Before)
    const searchBoxDesktop = desktopPage.locator('.manual-search-box');
    const screenshotDesktopEmpty = path.join(PREVIEWS_DIR, '07-desktop-searchbox-empty.png');
    await searchBoxDesktop.screenshot({ path: screenshotDesktopEmpty });
    console.log(`    📸 Captura guardada (Escritorio Vacío): ${screenshotDesktopEmpty}`);

    // Requirement 7: Keyboard shortcut '/' still works to focus input
    await desktopPage.keyboard.press('/');
    let isInputFocused = await desktopPage.evaluate(() => document.activeElement === document.getElementById('manual-search-input'));
    console.log(`  ✓ Atajo de teclado '/' sigue enfocando el campo de búsqueda: ${isInputFocused}`);
    if (!isInputFocused) throw new Error("El atajo de teclado '/' no enfocó el buscador");

    // Requirement 2: Once user types text, display two clearly separated icons: X and magnifying glass
    await searchInput.fill('noticia');
    await desktopPage.waitForTimeout(250);

    let isActionsVisible = await searchActions.evaluate(el => !el.hidden && window.getComputedStyle(el).display !== 'none');
    let isClearVisible = await clearBtn.isVisible();
    let isSubmitVisible = await submitBtn.isVisible();

    console.log(`  ✓ Con texto escrito: grupo de acciones visible (${isActionsVisible}), botón X visible (${isClearVisible}), botón Lupa visible (${isSubmitVisible})`);
    if (!isActionsVisible || !isClearVisible || !isSubmitVisible) {
      throw new Error('Ambos botones (X y Lupa) deben ser visibles cuando hay texto');
    }

    // Requirement 3: Both icons aligned and visually consistent
    const metrics = await desktopPage.evaluate(() => {
      const clear = document.getElementById('manual-search-clear').getBoundingClientRect();
      const submit = document.getElementById('manual-search-submit').getBoundingClientRect();
      return {
        clearWidth: Math.round(clear.width),
        clearHeight: Math.round(clear.height),
        submitWidth: Math.round(submit.width),
        submitHeight: Math.round(submit.height),
        gap: Math.round(submit.left - clear.right),
        clearY: Math.round(clear.top),
        submitY: Math.round(submit.top)
      };
    });
    console.log(`  ✓ Alineación y consistencia: X=${metrics.clearWidth}x${metrics.clearHeight}px, Lupa=${metrics.submitWidth}x${metrics.submitHeight}px, gap=${metrics.gap}px, alineación vertical (Δy=${Math.abs(metrics.clearY - metrics.submitY)}px)`);
    if (Math.abs(metrics.clearY - metrics.submitY) > 2) {
      throw new Error('Los dos botones no están correctamente alineados en el eje vertical');
    }

    // Capture desktop typed state with dual action buttons (After)
    const screenshotDesktopTyped = path.join(PREVIEWS_DIR, '08-desktop-searchbox-typed-dual-actions.png');
    await searchBoxDesktop.screenshot({ path: screenshotDesktopTyped });
    console.log(`    📸 Captura guardada (Escritorio con 2 botones): ${screenshotDesktopTyped}`);

    // Requirement 5: Clicking the magnifying glass displays/focuses the search results
    await submitBtn.click();
    await desktopPage.waitForTimeout(200);
    const isDropdownOpen = await desktopPage.locator('#manual-search-dropdown').getAttribute('data-open');
    const resultsCount = await desktopPage.locator('.manual-search-item').count();
    console.log(`  ✓ Al hacer clic en la Lupa: resultados mostrados=${isDropdownOpen === 'true'}, cantidad=${resultsCount}`);
    if (isDropdownOpen !== 'true' || resultsCount === 0) {
      throw new Error('Al hacer clic en la Lupa no se mostraron los resultados de búsqueda');
    }

    // Requirement 4: Clicking X clears text, closes search results, keeps input focused
    await clearBtn.click();
    await desktopPage.waitForTimeout(200);

    const valAfterClear = await searchInput.inputValue();
    const isFocusedAfterClear = await desktopPage.evaluate(() => document.activeElement === document.getElementById('manual-search-input'));
    const isDropdownClosedAfterClear = await desktopPage.locator('#manual-search-dropdown').evaluate(el => !el.hasAttribute('data-open'));
    isActionsHidden = await searchActions.evaluate(el => el.hidden || window.getComputedStyle(el).display === 'none');

    console.log(`  ✓ Al pulsar X: texto="${valAfterClear}" (vacío), foco mantenido=${isFocusedAfterClear}, dropdown cerrado=${isDropdownClosedAfterClear}, botones ocultos=${isActionsHidden}`);
    if (valAfterClear !== '' || !isFocusedAfterClear || !isDropdownClosedAfterClear || !isActionsHidden) {
      throw new Error('El botón X no limpió el texto, no cerró el desplegable o no ocultó los botones');
    }

    // -------------------------------------------------------------
    // 2. MOBILE TEST (390x844 iPhone)
    // -------------------------------------------------------------
    console.log('\n[2/3] Comprobando en móvil (390x844)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', logConsoleError);

    await mobilePage.goto(`${BASE_URL}/admin/manual/`, { waitUntil: 'networkidle' });

    const mobileInput = mobilePage.locator('#manual-search-input');
    const mobileActions = mobilePage.locator('#manual-search-actions');
    const mobileClear = mobilePage.locator('#manual-search-clear');
    const mobileSubmit = mobilePage.locator('#manual-search-submit');

    // Mobile empty state
    let isMobileActionsHidden = await mobileActions.evaluate(el => el.hidden || window.getComputedStyle(el).display === 'none');
    console.log(`  ✓ Móvil vacío: botones ocultos (${isMobileActionsHidden})`);

    const mobileHeaderInner = mobilePage.locator('.manual-header__inner');
    const screenshotMobileEmpty = path.join(PREVIEWS_DIR, '09-mobile-searchbox-empty.png');
    await mobileHeaderInner.screenshot({ path: screenshotMobileEmpty });
    console.log(`    📸 Captura guardada (Móvil Vacío): ${screenshotMobileEmpty}`);

    // Type on mobile
    await mobileInput.fill('precio');
    await mobilePage.waitForTimeout(250);

    let isMobileActionsVisible = await mobileActions.evaluate(el => !el.hidden && window.getComputedStyle(el).display !== 'none');
    console.log(`  ✓ Móvil con texto: botones visibles (${isMobileActionsVisible})`);

    const screenshotMobileTyped = path.join(PREVIEWS_DIR, '10-mobile-searchbox-typed-dual-actions.png');
    await mobileHeaderInner.screenshot({ path: screenshotMobileTyped });
    console.log(`    📸 Captura guardada (Móvil con 2 botones): ${screenshotMobileTyped}`);

    // Tap X on mobile
    await mobileClear.click();
    await mobilePage.waitForTimeout(200);

    const mobileValAfterClear = await mobileInput.inputValue();
    isMobileActionsHidden = await mobileActions.evaluate(el => el.hidden || window.getComputedStyle(el).display === 'none');
    console.log(`  ✓ Móvil tras pulsar X: texto="${mobileValAfterClear}" (vacío), botones ocultos=${isMobileActionsHidden}`);
    if (mobileValAfterClear !== '' || !isMobileActionsHidden) {
      throw new Error('En móvil el botón X no limpió el texto o no ocultó los botones');
    }

    // -------------------------------------------------------------
    // 3. ENTER KEY & SEARCH FUNCTIONALITY CONFIRMATION
    // -------------------------------------------------------------
    console.log('\n[3/3] Confirmando tecla Enter y búsqueda en vivo...');
    const finalInput = desktopPage.locator('#manual-search-input');
    await finalInput.fill('consejo escolar');
    await desktopPage.waitForTimeout(200);
    await finalInput.press('Enter');
    await desktopPage.waitForLoadState('networkidle');

    console.log(`  ✓ Pulsar Enter navegó al tutorial: ${desktopPage.url()}`);
    if (!desktopPage.url().includes('09-consejo-escolar')) {
      throw new Error(`Enter no navegó al resultado esperado. URL: ${desktopPage.url()}`);
    }

    // Check zero console errors
    if (consoleErrors.length > 0) {
      console.error('❌ Errores en la consola:', consoleErrors);
      throw new Error(`Se detectaron ${consoleErrors.length} errores de consola`);
    } else {
      console.log('  ✓ Cero errores de consola en todas las comprobaciones');
    }

    console.log('\n🎉 ¡AJUSTE FINAL DEL BUSCADOR VERIFICADO AL 100% CON ÉXITO!');

    await desktopContext.close();
    await mobileContext.close();
  } finally {
    await browser.close();
  }
}

testDualActionSearchBox().catch(err => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
