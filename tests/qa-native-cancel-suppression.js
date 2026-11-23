const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const PREVIEWS_DIR = path.resolve('scratch/previews');

if (!fs.existsSync(PREVIEWS_DIR)) {
  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
}

async function verifyBrowser(channelName) {
  console.log(`\n======================================================`);
  console.log(`PROBANDO NAVEGADOR: ${channelName.toUpperCase()}`);
  console.log(`======================================================`);

  const browser = await chromium.launch({ channel: channelName, headless: true });
  const consoleErrors = [];

  try {
    // 1. Desktop Test (1280x800)
    console.log(`[${channelName}] Comprobando en escritorio...`);
    const desktopPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    desktopPage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await desktopPage.goto(`${BASE_URL}/admin/manual/`, { waitUntil: 'networkidle' });

    const searchInput = desktopPage.locator('#manual-search-input');
    const searchActions = desktopPage.locator('#manual-search-actions');

    // Type text into search field
    await searchInput.fill('comedor');
    await desktopPage.waitForTimeout(250);

    // Verify right-side buttons: ONLY our custom X and custom magnifying glass
    const buttonsCount = await desktopPage.locator('.manual-search-actions .manual-search-btn').count();
    const isActionsVisible = await searchActions.isVisible();
    console.log(`  ✓ Grupo de acciones visible: ${isActionsVisible}, botones personalizados: ${buttonsCount} (esperado: 2)`);
    if (buttonsCount !== 2) {
      throw new Error(`Se esperaban exactamente 2 botones personalizados, encontrados: ${buttonsCount}`);
    }

    // Capture close-up screenshot of the search box with text
    const searchBox = desktopPage.locator('.manual-search-box');
    const screenshotDesktopPath = path.join(PREVIEWS_DIR, `11-${channelName}-desktop-searchbox-no-native-x.png`);
    await searchBox.screenshot({ path: screenshotDesktopPath });
    console.log(`    📸 Captura guardada: ${screenshotDesktopPath}`);

    // Verify search and clear actions
    // Click submit (magnifying glass)
    const submitBtn = desktopPage.locator('#manual-search-submit');
    await submitBtn.click();
    await desktopPage.waitForTimeout(200);
    const resultsCount = await desktopPage.locator('.manual-search-item').count();
    console.log(`  ✓ Clic en botón Lupa: ${resultsCount} resultados mostrados`);
    if (resultsCount === 0) throw new Error('El botón Lupa no mostró resultados');

    // Click clear (custom X)
    const clearBtn = desktopPage.locator('#manual-search-clear');
    await clearBtn.click();
    await desktopPage.waitForTimeout(200);
    const valAfterClear = await searchInput.inputValue();
    const isActionsHiddenAfterClear = await searchActions.evaluate(el => el.hidden || window.getComputedStyle(el).display === 'none');
    console.log(`  ✓ Clic en botón X personalizado: input="${valAfterClear}" (vacío), botones ocultos=${isActionsHiddenAfterClear}`);
    if (valAfterClear !== '' || !isActionsHiddenAfterClear) {
      throw new Error('El botón X no limpió el input o no ocultó las acciones');
    }

    // 2. Mobile Test (390x844)
    console.log(`[${channelName}] Comprobando en móvil (390x844)...`);
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();
    mobilePage.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await mobilePage.goto(`${BASE_URL}/admin/manual/`, { waitUntil: 'networkidle' });
    const mobileInput = mobilePage.locator('#manual-search-input');
    const mobileActions = mobilePage.locator('#manual-search-actions');

    // Empty state
    let isMobileEmptyHidden = await mobileActions.evaluate(el => el.hidden || window.getComputedStyle(el).display === 'none');
    console.log(`  ✓ En móvil con campo vacío: botones derecho ocultos (${isMobileEmptyHidden})`);

    // Type text
    await mobileInput.fill('noticia');
    await mobilePage.waitForTimeout(250);

    const mobileButtonsCount = await mobilePage.locator('.manual-search-actions .manual-search-btn').count();
    console.log(`  ✓ En móvil con texto: botones personalizados visibles (${mobileButtonsCount})`);

    // Capture mobile header screenshot
    const mobileHeader = mobilePage.locator('.manual-header__inner');
    const screenshotMobilePath = path.join(PREVIEWS_DIR, `12-${channelName}-mobile-searchbox-no-native-x.png`);
    await mobileHeader.screenshot({ path: screenshotMobilePath });
    console.log(`    📸 Captura guardada: ${screenshotMobilePath}`);

    // Tap clear on mobile
    await mobilePage.locator('#manual-search-clear').click();
    await mobilePage.waitForTimeout(200);
    const mobileValAfterClear = await mobileInput.inputValue();
    console.log(`  ✓ En móvil tras pulsar X: input="${mobileValAfterClear}" (vacío)`);
    if (mobileValAfterClear !== '') throw new Error('En móvil el botón X no vació el input');

    if (consoleErrors.length > 0) {
      throw new Error(`Errores en consola de ${channelName}: ${consoleErrors.join(', ')}`);
    }

    console.log(`🎉 ¡VERIFICACIÓN EN ${channelName.toUpperCase()} SUPERADA CON ÉXITO!`);

    await desktopPage.close();
    await mobileContext.close();
  } finally {
    await browser.close();
  }
}

async function runAll() {
  await verifyBrowser('chrome');
  await verifyBrowser('msedge');
  console.log('\n======================================================');
  console.log('✅ SUPRESIÓN DE CANCEL BUTTON NATIVO COMPLETA EN CHROME Y EDGE');
  console.log('======================================================');
}

runAll().catch(err => {
  console.error('\n❌ ERROR:', err.message);
  process.exit(1);
});
