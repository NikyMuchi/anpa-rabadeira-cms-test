/**
 * CMS Schema Fidelity & Content Preservation Test Suite
 * Validates backward compatibility, 18 Extraescolares activities, news posts,
 * all informational pages, homepage structured data, and route safety.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

function runTests() {
  let passed = 0;
  let failed = 0;

  function test(description, fn) {
    try {
      fn();
      console.log(`  ✓ ${description}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${description}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  console.log('=== Executing CMS Schema Fidelity & Content Integrity Tests ===\n');

  const rootDir = path.resolve(__dirname, '..');
  const extraescolaresPath = path.join(rootDir, 'src', '_data', 'extraescolares.json');
  const homeDataPath = path.join(rootDir, 'src', '_data', 'home.json');
  const siteDataPath = path.join(rootDir, 'src', '_data', 'site.json');
  const configYmlPath = path.join(rootDir, 'admin', 'config.yml');
  const postsDir = path.join(rootDir, 'src', 'posts');
  const pagesDir = path.join(rootDir, 'src', 'pages');

  // Test 1: Extraescolares JSON Structure & 18 Activities
  test('Extraescolares JSON exists and has valid top-level fields', () => {
    assert(fs.existsSync(extraescolaresPath), 'extraescolares.json does not exist');
    const data = JSON.parse(fs.readFileSync(extraescolaresPath, 'utf8'));

    assert.strictEqual(data.academic_year, '2026-2027', 'Academic year mismatch');
    assert.strictEqual(typeof data.schedule_image, 'string', 'Missing schedule_image');
    assert(Array.isArray(data.activities), 'activities is not an array');
    assert.strictEqual(data.activities.length, 18, `Expected exactly 18 activities, found ${data.activities.length}`);
    assert(Array.isArray(data.pricing_table), 'pricing_table is not an array');
    assert.strictEqual(data.pricing_table.length, 18, `Expected exactly 18 pricing items, found ${data.pricing_table.length}`);
    assert(Array.isArray(data.general_conditions), 'general_conditions is not an array');
    assert.strictEqual(data.general_conditions.length, 14, `Expected 14 conditions, found ${data.general_conditions.length}`);
    assert(typeof data.coexistence_articles === 'object', 'Missing coexistence_articles');
  });

  // Test 2: Activities Preservation & Types/Nulls
  test('All 18 Extraescolares activities preserve required types, nulls, and statuses', () => {
    const data = JSON.parse(fs.readFileSync(extraescolaresPath, 'utf8'));
    const expectedActivities = [
      'baile-moderno', 'multideporte', 'ioga', 'baloncesto', 'arte',
      'multiaventura', 'teatro-musical', 'musica-movemento', 'tecnoloxias-innovadoras',
      'judo', 'ximnasia-ritmica', 'ingles', 'taekwondo', 'parkour',
      'hockey', 'minichef', 'scape-room', 'mentes-curiosas'
    ];

    assert.strictEqual(data.activities.length, 18);
    const foundIds = data.activities.map(a => a.id);
    assert.deepStrictEqual(foundIds, expectedActivities, 'Activity IDs do not match expected list');

    const arte = data.activities.find(a => a.id === 'arte');
    assert.strictEqual(arte.status, 'full');
    assert.strictEqual(arte.provider, null, 'Arte provider should be null');
    assert.strictEqual(arte.registration_url, null, 'Arte registration_url should be null');

    const ingles = data.activities.find(a => a.id === 'ingles');
    assert.strictEqual(ingles.registration_type, 'pdf');
    assert.strictEqual(ingles.contact_email, 'portobellow11@yahoo.es');

    for (const act of data.activities) {
      assert(typeof act.id === 'string' && act.id.length > 0, `Invalid id in activity ${JSON.stringify(act)}`);
      assert(typeof act.name === 'string' && act.name.length > 0, `Invalid name in activity ${act.id}`);
      assert(typeof act.stage === 'string', `Invalid stage in activity ${act.id}`);
      assert(typeof act.price === 'string', `Invalid price in activity ${act.id}`);
      assert(['available', 'full', 'partial'].includes(act.status), `Invalid status ${act.status} in activity ${act.id}`);
    }
  });

  // Test 3: config.yml Schema Coverage Across All Collections
  test('admin/config.yml contains complete schema coverage for all 5 collections', () => {
    assert(fs.existsSync(configYmlPath), 'admin/config.yml does not exist');
    const configContent = fs.readFileSync(configYmlPath, 'utf8');

    assert(configContent.includes('backend:'), 'Missing backend config');
    assert(configContent.includes('publish_mode: editorial_workflow'), 'editorial_workflow publish_mode not configured');
    assert(configContent.includes('name: "posts"'), 'Missing posts collection');
    assert(configContent.includes('name: "extraescolares"'), 'Missing extraescolares collection');
    assert(configContent.includes('name: "pages"'), 'Missing pages collection');
    assert(configContent.includes('name: "home"'), 'Missing home collection');
    assert(configContent.includes('name: "site_settings"'), 'Missing site_settings collection');
    assert(configContent.includes('file: "src/pages/madrugadores.md"'), 'Missing madrugadores file mapping');
    assert(configContent.includes('file: "src/pages/comedor.md"'), 'Missing comedor file mapping');
    assert(configContent.includes('file: "src/pages/inscripcion.md"'), 'Missing inscripcion file mapping');
    assert(configContent.includes('file: "src/pages/memoria.md"'), 'Missing memoria file mapping');
    assert(configContent.includes('file: "src/pages/consello-escolar.md"'), 'Missing consello-escolar file mapping');
  });

  // Test 4: Static Route Collision Prevention
  test('Static page route definitions are collision-safe and do not conflict with templates', () => {
    const pageFiles = fs.readdirSync(pagesDir);
    assert(pageFiles.includes('extraescolares.njk'), 'extraescolares.njk should exist as Nunjucks template');
    assert(pageFiles.includes('novas.njk'), 'novas.njk should exist as Nunjucks template');
    assert(!pageFiles.includes('novas.md'), 'novas.md should NOT exist');
    assert(!pageFiles.includes('extraescolares.md'), 'extraescolares.md should NOT exist');
  });

  // Test 5: News Posts Frontmatter Integrity
  test('All Markdown news articles in src/posts have valid metadata and layouts', () => {
    const postFiles = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    assert(postFiles.length >= 10, `Expected at least 10 posts, found ${postFiles.length}`);

    for (const file of postFiles) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      assert(content.startsWith('---'), `Post ${file} missing frontmatter delimiter`);
      const secondDelimiter = content.indexOf('---', 3);
      assert(secondDelimiter > 0, `Post ${file} unclosed frontmatter`);
      const frontmatter = content.substring(3, secondDelimiter);
      assert(frontmatter.includes('title:'), `Post ${file} missing title`);
      assert(frontmatter.includes('date:'), `Post ${file} missing date`);
      assert(frontmatter.includes('category:'), `Post ${file} missing category`);
    }
  });

  // Test 6: Homepage & Global Site Structured Data
  test('Homepage and Site global data files exist with required fields', () => {
    assert(fs.existsSync(homeDataPath), 'home.json does not exist');
    const home = JSON.parse(fs.readFileSync(homeDataPath, 'utf8'));
    assert(home.hero && home.hero.title && home.hero.lead && home.hero.image, 'Incomplete hero object in home.json');
    assert(home.shortcuts && Array.isArray(home.shortcuts.items) && home.shortcuts.items.length === 4, 'Expected 4 shortcuts in home.json');

    assert(fs.existsSync(siteDataPath), 'site.json does not exist');
    const site = JSON.parse(fs.readFileSync(siteDataPath, 'utf8'));
    assert(site.name && site.email && site.url, 'Incomplete site.json');
  });

  // Test 7: Information Pages Frontmatter & Data Integrity
  test('All informational pages contain structured frontmatter without breaking layout', () => {
    const madrugadores = fs.readFileSync(path.join(pagesDir, 'madrugadores.md'), 'utf8');
    assert(madrugadores.includes('O servizo de madrugadores está dispoñible de **7:30 a 8:45**'), 'Missing hours narrative in madrugadores.md');
    assert(madrugadores.includes('49,94 € / mes'), 'Missing price narrative in madrugadores.md');
    assert(madrugadores.includes('/docs/triptico_madrugadores_2026-2027.pdf'), 'Missing PDF doc in madrugadores.md');

    const inscripcion = fs.readFileSync(path.join(pagesDir, 'inscripcion.md'), 'utf8');
    assert(inscripcion.includes('ES76 0049 2731 64 2114103625'), 'Missing IBAN in inscripcion.md');
    assert(inscripcion.includes('membership_fee: "25€/familia"'), 'Missing fee in inscripcion.md');

    const memoria = fs.readFileSync(path.join(pagesDir, 'memoria.md'), 'utf8');
    assert(memoria.includes('/docs/memoria-curso-2023_2024.pdf'), 'Missing PDF file in memoria.md');

    const consello = fs.readFileSync(path.join(pagesDir, 'consello-escolar.md'), 'utf8');
    assert(consello.includes('https://conselloescolarrabadeira.home.blog/'), 'Missing blog URL in consello-escolar.md');

    const comedor = fs.readFileSync(path.join(pagesDir, 'comedor.md'), 'utf8');
    assert(comedor.includes('/img/comedor/paso-1.png'), 'Missing step image in comedor.md');
    assert(comedor.includes('https://ovt.atriga.gal'), 'Missing ATRIGA portal in comedor.md');
  });

  // Test 8: Extraescolares Editor Simplification & Preservation Fidelity
  test('admin/config.yml Extraescolares editor features collapsed lists, clear hints, and exact status options', () => {
    const configContent = fs.readFileSync(configYmlPath, 'utf8');

    // Collapsed lists
    assert(configContent.includes('name: "activities"') && configContent.includes('collapsed: true'), 'activities list should have collapsed: true');
    assert(configContent.includes('name: "pricing_table"') && configContent.includes('collapsed: true'), 'pricing_table should have collapsed: true');
    assert(configContent.includes('name: "general_conditions"') && configContent.includes('collapsed: true'), 'general_conditions should have collapsed: true');

    // Status options fidelity: available, full, partial - no invented waiting list
    assert(configContent.includes('value: "available"'), 'Missing available status option');
    assert(configContent.includes('value: "full"'), 'Missing full status option');
    assert(configContent.includes('value: "partial"'), 'Missing partial status option');
    assert(!configContent.includes('waiting_list') && !configContent.includes('lista_agarda') && !configContent.includes('lista de agarda'), 'Must not invent a waiting-list feature');

    // Clarification hints
    assert(configContent.includes('non se actualiza automaticamente'), 'Missing timetable static image hint');
    assert(configContent.includes('mantense de forma independente e separada dos prezos') || configContent.includes('mantense por separado') || configContent.includes('mantense de xeito independente'), 'Missing price/pricing_table separation hint');
    assert(configContent.includes('Identificador técnico interno (ex: \'baile-moderno\')'), 'Missing id technical slug hint');
    assert(configContent.includes('status_label'), 'Missing status_label field');

    // Field coverage in activities
    const requiredActFields = ['id', 'name', 'stage', 'price', 'provider', 'status', 'status_label', 'status_note', 'registration_type', 'registration_url', 'contact_email', 'button_label'];
    for (const f of requiredActFields) {
      assert(configContent.includes(`name: "${f}"`), `Missing activity field ${f} in config.yml`);
    }
  });

  // Test 9: Extraescolares Exact JSON Data Preservation
  test('extraescolares.json maintains all 18 activities with exact keys, nulls, and absence distinctions', () => {
    const data = JSON.parse(fs.readFileSync(extraescolaresPath, 'utf8'));
    assert.strictEqual(data.activities.length, 18, 'Expected 18 activities');

    const fullActivities = ['arte', 'teatro-musical', 'musica-movemento', 'taekwondo', 'minichef'];
    for (const id of fullActivities) {
      const act = data.activities.find(a => a.id === id);
      assert(act, `Activity ${id} not found`);
      assert.strictEqual(act.status, 'full', `${id} must have status 'full'`);
      assert.strictEqual(act.status_label, 'Completa', `${id} must have status_label 'Completa'`);
      assert.strictEqual(act.registration_type, null, `${id} must have registration_type null`);
      assert.strictEqual(act.registration_url, null, `${id} must have registration_url null`);
      assert.strictEqual(act.button_label, null, `${id} must have button_label null`);
    }

    const partialAct = data.activities.find(a => a.id === 'multiaventura');
    assert.strictEqual(partialAct.status, 'partial');
    assert.strictEqual(partialAct.status_label, 'Parcialmente completa');
    assert.strictEqual(partialAct.registration_type, 'google_form');

    const ingles = data.activities.find(a => a.id === 'ingles');
    assert.strictEqual(ingles.registration_type, 'pdf');
    assert.strictEqual(ingles.contact_email, 'portobellow11@yahoo.es');

    // Ensure contact_email is only present on ingles, absent on all others
    for (const act of data.activities) {
      if (act.id !== 'ingles') {
        assert(!Object.prototype.hasOwnProperty.call(act, 'contact_email'), `Activity ${act.id} should not have contact_email property`);
      }
    }
  });

  // Test 10: Extraescolares contact_email and id hints verification
  test('admin/config.yml contains explicit Galician hints for contact_email and id uniqueness/renaming', () => {
    const configContent = fs.readFileSync(configYmlPath, 'utf8');

    // contact_email hint checks
    assert(configContent.includes('Enderezo de correo opcional'), 'Missing contact_email hint opening');
    assert(configContent.includes('Contactar por email'), 'Missing "Contactar por email" button reference in hint');
    assert(configContent.includes('non envía correos de maneira automática'), 'Missing automatic email disclaimer in hint');

    // id hint checks
    assert(configContent.includes('Cambiar o nome da actividade non require cambiar o seu ID'), 'Missing renaming ID explanation in hint');
    assert(configContent.includes('debe asignarlle un ID único'), 'Missing unique ID explanation in hint');
  });

  // Test 11: Extraescolares rendered template contact email, registration and status fidelity
  test('extraescolares.njk rendered HTML displays secondary email button when valid and preserves all registration rules', () => {
    const njkContent = fs.readFileSync(path.join(pagesDir, 'extraescolares.njk'), 'utf8');

    // Check template logic in njk
    assert(njkContent.includes('Contactar por email'), 'Missing "Contactar por email" button in template');
    assert(njkContent.includes('mailto:'), 'Missing mailto: link generation in template');
    assert(njkContent.includes('btn-action--secondary'), 'Missing btn-action--secondary class');
    assert(njkContent.includes('activity-card__actions'), 'Missing activity-card__actions container');

    // Email validation logic in template (non-empty, contains @, no whitespace)
    assert(njkContent.includes("@' in act.contact_email"), 'Missing @ validation for email');
    assert(njkContent.includes("not (' ' in act.contact_email.trim())"), 'Missing whitespace check for email');

    // Live rendered site checks via Cheerio
    const cheerio = require('cheerio');
    const siteHtmlPath = path.join(rootDir, '_site', 'extraescolares', 'index.html');
    if (fs.existsSync(siteHtmlPath)) {
      const html = fs.readFileSync(siteHtmlPath, 'utf8');
      const $ = cheerio.load(html);

      // 1. Ingles has both registration PDF and contact email
      const ingles = $('#act-ingles');
      const inglesLinks = ingles.find('.btn-action');
      assert.strictEqual(inglesLinks.length, 2, 'Ingles should have 2 action buttons');
      assert.strictEqual(inglesLinks.eq(0).text().trim(), 'Ficha de inscrición (PDF)');
      assert.strictEqual(inglesLinks.eq(0).attr('href'), '/docs/ficha-inscricion-ingles-2026-2027.pdf');
      assert.strictEqual(inglesLinks.eq(1).text().trim(), 'Contactar por email');
      assert.strictEqual(inglesLinks.eq(1).attr('href'), 'mailto:portobellow11%40yahoo.es');
      assert(inglesLinks.eq(1).hasClass('btn-action--secondary'), 'Email button should have btn-action--secondary');

      // 2. Arte is full with no email: 0 action buttons
      const arte = $('#act-arte');
      assert.strictEqual(arte.find('.btn-action').length, 0, 'Arte should have 0 action buttons');
      assert.strictEqual(arte.find('.status-badge--full').text().trim(), 'Completa');

      // 3. Baile moderno is available with registration but no email: 1 action button
      const baile = $('#act-baile-moderno');
      const baileLinks = baile.find('.btn-action');
      assert.strictEqual(baileLinks.length, 1, 'Baile moderno should have 1 action button');
      assert.strictEqual(baileLinks.eq(0).text().trim(), 'Inscrición');
      assert.strictEqual(baileLinks.eq(0).attr('href'), 'https://forms.gle/cwrwMYrVDUxiJ2Fy5');
    }

    // Nunjucks unit test across edge cases (full activity with email, invalid emails, absent email)
    const nunjucks = require('nunjucks');
    const env = new nunjucks.Environment();

    const snippet = `
    {% set has_reg = (act.status != 'full' and act.registration_url) %}
    {% set has_email = (act.contact_email and '@' in act.contact_email and not (' ' in act.contact_email.trim())) %}
    {% if has_reg or has_email %}
    <div class="activity-card__actions">
      {% if has_reg %}
      <a href="{{ act.registration_url }}" class="btn-action">{{ act.button_label or 'Inscrición' }}</a>
      {% endif %}
      {% if has_email %}
      <a href="mailto:{{ act.contact_email | trim | urlencode }}" class="btn-action btn-action--secondary">Contactar por email</a>
      {% endif %}
    </div>
    {% endif %}
    `;

    // Case A: Full activity with valid email -> Shows email button only, NO registration button, NO waiting list
    const resA = env.renderString(snippet, {
      act: { status: 'full', registration_url: 'https://form.example.com', contact_email: 'provider@example.com' }
    });
    assert(resA.includes('Contactar por email'), 'Full activity with email must show contact button');
    assert(!resA.includes('btn-action">Inscrición'), 'Full activity with email must NOT show registration button');
    assert(!resA.includes('waiting') && !resA.includes('agarda'), 'Must not include waiting-list wording');

    // Case B: Available activity with empty/whitespace email -> Shows registration only, no email button
    const resB = env.renderString(snippet, {
      act: { status: 'available', registration_url: 'https://form.example.com', contact_email: '   ' }
    });
    assert(resB.includes('btn-action">Inscrición'), 'Available activity must show registration');
    assert(!resB.includes('Contactar por email'), 'Whitespace email must NOT render contact button');

    // Case C: Invalid email without @ -> Shows registration only, no email button
    const resC = env.renderString(snippet, {
      act: { status: 'available', registration_url: 'https://form.example.com', contact_email: 'notanemail' }
    });
    assert(resC.includes('btn-action">Inscrición'), 'Available activity must show registration');
    assert(!resC.includes('Contactar por email'), 'Invalid email without @ must NOT render contact button');

    // Case D: Email containing whitespace (e.g. multiple words or broken input) -> Rejected
    const resD = env.renderString(snippet, {
      act: { status: 'available', registration_url: 'https://form.example.com', contact_email: 'foo @bar.com' }
    });
    assert(!resD.includes('Contactar por email'), 'Email containing whitespace must NOT render contact button');

    // Case E: Null/absent contact_email on full activity -> 0 buttons rendered
    const resE = env.renderString(snippet, {
      act: { status: 'full', registration_url: null, contact_email: null }
    });
    assert(!resE.includes('activity-card__actions'), 'Full activity with null email must render no actions container');
  });

  console.log(`\nTest Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
