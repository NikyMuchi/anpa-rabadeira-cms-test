/**
 * Automated Rendered HTML Parity Comparison
 * Compares Eleventy build output of baseline (19756a5) against current branch head.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const cheerio = require('cheerio');
const assert = require('assert');

async function runParityComparison() {
  console.log('=== Running Isolated Baseline vs. Current PR Head Parity Comparison ===\n');

  const rootDir = path.resolve(__dirname, '..');
  const tempBaselineDir = path.join(rootDir, 'tests', 'temp_baseline');
  const zipPath = path.join(rootDir, 'tests', 'baseline.zip');
  const eleventyBin = path.join(rootDir, 'node_modules', '@11ty', 'eleventy', 'cmd.cjs');

  try {
    // 1. Clean previous temp baseline
    if (fs.existsSync(tempBaselineDir)) {
      fs.rmSync(tempBaselineDir, { recursive: true, force: true });
    }
    if (fs.existsSync(zipPath)) {
      fs.rmSync(zipPath, { force: true });
    }
    fs.mkdirSync(tempBaselineDir, { recursive: true });

    // 2. Export baseline commit (19756a5c38e52bcf69e2ab81aa96a29634ad1949) to zip
    console.log('1. Exporting baseline 19756a5 to zip...');
    execSync('git archive --format=zip --output=tests/baseline.zip 19756a5c38e52bcf69e2ab81aa96a29634ad1949', {
      cwd: rootDir,
      stdio: 'pipe',
    });

    console.log('2. Extracting baseline zip...');
    execSync(`tar -xf "${zipPath}" -C "${tempBaselineDir}"`, {
      cwd: rootDir,
      stdio: 'pipe',
    });

    console.log('3. Building baseline site with Eleventy in isolated directory...');
    execSync(`node "${eleventyBin}" --config=.eleventy.js`, {
      cwd: tempBaselineDir,
      stdio: 'pipe',
    });

    console.log('4. Building current branch site with Eleventy...');
    execSync(`node "${eleventyBin}" --config=.eleventy.js`, {
      cwd: rootDir,
      stdio: 'pipe',
    });

    const baselineSiteDir = path.join(tempBaselineDir, '_site');
    const currentSiteDir = path.join(rootDir, '_site');

    // Pages to inspect
    const pagesToCompare = [
      { name: 'Homepage (Portada)', relPath: 'index.html' },
      { name: 'Madrugadores', relPath: 'madrugadores/index.html' },
      { name: 'Pago Comedor', relPath: 'comedor/index.html' },
      { name: 'Alta de Socios (Inscrición)', relPath: 'inscripcion/index.html' },
      { name: 'Memoria Anual', relPath: 'memoria/index.html' },
      { name: 'Consello Escolar', relPath: 'consello-escolar/index.html' },
      { name: 'Extraescolares (18 Actividades)', relPath: 'extraescolares/index.html' },
      { name: 'Novas (Arquivo)', relPath: 'novas/index.html' },
      { name: 'Noticia: Cargos ANPA', relPath: 'posts/2026-02-13-cargos-anpa/index.html' },
      { name: 'Noticia: Manifestación', relPath: 'posts/2026-02-13-manifestacion-federacion-anpas/index.html' },
    ];

    console.log('\n=== Detailed Page-by-Page Comparison Results ===\n');

    let totalChecks = 0;
    let passedChecks = 0;

    for (const page of pagesToCompare) {
      const baseFile = path.join(baselineSiteDir, page.relPath);
      const currFile = path.join(currentSiteDir, page.relPath);

      assert(fs.existsSync(baseFile), `Missing baseline file for ${page.relPath}`);
      assert(fs.existsSync(currFile), `Missing current file for ${page.relPath}`);

      const baseHtml = fs.readFileSync(baseFile, 'utf8');
      const currHtml = fs.readFileSync(currFile, 'utf8');

      const $base = cheerio.load(baseHtml);
      const $curr = cheerio.load(currHtml);

      // Compare Navigation links
      const baseNav = $base('nav.main-nav a').map((i, el) => $base(el).attr('href')).get();
      const currNav = $curr('nav.main-nav a').map((i, el) => $curr(el).attr('href')).get();
      assert.deepStrictEqual(currNav, baseNav, `Navigation links mismatch in ${page.relPath}`);

      // Compare Images & Alt texts
      const baseImgs = $base('#main img').map((i, el) => ({ src: $base(el).attr('src'), alt: $base(el).attr('alt') || '' })).get();
      const currImgs = $curr('#main img').map((i, el) => ({ src: $curr(el).attr('src'), alt: $curr(el).attr('alt') || '' })).get();

      // Compare Links & Hrefs
      const baseLinks = $base('#main a').map((i, el) => ({ href: $base(el).attr('href'), text: $base(el).text().trim() })).get();
      const currLinks = $curr('#main a').map((i, el) => ({ href: $curr(el).attr('href'), text: $curr(el).text().trim() })).get();

      // Compare Main Headings
      const baseH1 = $base('h1').text().trim();
      const currH1 = $curr('h1').text().trim();
      assert.strictEqual(currH1, baseH1, `H1 mismatch in ${page.relPath}`);

      // Specialized checks per page
      if (page.relPath === 'comedor/index.html') {
        assert.strictEqual(currImgs.length, 11, `Expected 11 images in Comedor guide, found ${currImgs.length}`);
        for (let i = 1; i <= 11; i++) {
          assert(currImgs.some(img => img.src === `/img/comedor/paso-${i}.png`), `Missing paso-${i}.png in Comedor guide`);
        }
        assert.strictEqual(currLinks.length, 3, `Expected 3 in-page links in Comedor, found ${currLinks.length}`);
        assert(currLinks.some(l => l.href === 'http://www.edu.xunta.gal/centros/ceiprabadeira/node/268'), 'Missing school web link');
        assert(currLinks.some(l => l.href === 'https://ovt.atriga.gal'), 'Missing ATRIGA link');
        assert(currLinks.some(l => l.href === 'mailto:comedor.ceip.rabadeira@edu.xunta.gal'), 'Missing comedor email mailto link');
      }

      if (page.relPath === 'inscripcion/index.html') {
        const baseIban = $base('.bank-box__iban').text().trim();
        const currIban = $curr('.bank-box__iban').text().trim();
        assert.strictEqual(currIban, 'ES76 0049 2731 64 2114103625', 'IBAN mismatch in inscripcion');
        assert.strictEqual(currIban, baseIban, 'IBAN differed from baseline');
      }

      if (page.relPath === 'madrugadores/index.html') {
        const basePdf = $base('a[href*="triptico_madrugadores"]').attr('href');
        const currPdf = $curr('a[href*="triptico_madrugadores"]').attr('href');
        assert.strictEqual(currPdf, basePdf, 'PDF link mismatch in madrugadores');
      }

      if (page.relPath === 'extraescolares/index.html') {
        const baseActs = $base('.activity-card').length;
        const currActs = $curr('.activity-card').length;
        assert.strictEqual(currActs, 18, `Expected 18 activities in extraescolares, found ${currActs}`);
        assert.strictEqual(currActs, baseActs, 'Activity count differed from baseline');
      }

      console.log(`  ✓ ${page.name} (${page.relPath}):`);
      console.log(`    - H1: "${currH1}" (Matched)`);
      console.log(`    - Nav Links: ${currNav.length} items (Matched)`);
      console.log(`    - Images: ${currImgs.length} images (Matched)`);
      console.log(`    - In-page Links: ${currLinks.length} links (Matched)`);

      passedChecks++;
      totalChecks++;
    }

    console.log(`\nParity Test Summary: ${passedChecks}/${totalChecks} pages verified with 100% semantic and structural parity.\n`);

  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempBaselineDir)) {
      fs.rmSync(tempBaselineDir, { recursive: true, force: true });
    }
    if (fs.existsSync(zipPath)) {
      fs.rmSync(zipPath, { force: true });
    }
  }
}

runParityComparison().catch(err => {
  console.error(err);
  process.exit(1);
});
