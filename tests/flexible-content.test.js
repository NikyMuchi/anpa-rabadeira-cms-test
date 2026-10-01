const fs = require('fs');
const path = require('path');
const assert = require('assert');
const nunjucks = require('nunjucks');
const markdownIt = require('markdown-it');

const md = markdownIt({ html: true, breaks: true, linkify: true });

function runFlexibleContentTests() {
  console.log('=== Executing Flexible Content Blocks & Edge Case Tests ===\n');
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

  const rootDir = path.resolve(__dirname, '..');
  const env = nunjucks.configure([
    path.join(rootDir, 'src', '_includes'),
    path.join(rootDir, 'src')
  ], { autoescape: false });

  env.addFilter('md', (content) => content ? md.render(content) : '');
  env.addFilter('dataGalega', () => '1 de xaneiro de 2026');
  env.addFilter('isoDate', () => '2026-01-01');

  // Test 1: Rendering without flexible sections (baseline parity)
  test('Page layout renders baseline fields without empty artifacts when sections are absent', () => {
    const context = {
      title: 'Servizo Madrugadores',
      intro: 'O servizo de madrugadores está dispoñible de **7:30 a 8:45** con posibilidade de almorzo. O servizo é xestionado pola empresa [Jardanay](https://www.jardanay.es/).',
      academic_year: '2026-2027',
      provider_name: 'Jardanay',
      rates: {
        monthly_breakfast: '49,94 € / mes',
        monthly_no_breakfast: '37,45 € / mes',
        daily_breakfast: '4,79 € / día',
        daily_no_breakfast: '3,75 € / día'
      },
      registration_url: 'https://www.comedores.jardanay.es',
      fixed_users_note: 'Usuarios fixos note',
      documents: [
        { title: 'Guía', file: '/docs/guia.pdf', description: 'Desc' }
      ],
      site: { name: 'ANPA Ensino Rabadeira', fullName: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('Servizo Madrugadores'));
    assert(rendered.includes('<strong>7:30 a 8:45</strong>'));
    assert(rendered.includes('<a href="https://www.jardanay.es/">Jardanay</a>'));
    assert(rendered.includes('49,94 € / mes'));
    assert(!rendered.includes('undefined'));
    assert(!rendered.includes('null'));
    assert(!rendered.includes('<h2></h2>'));
    assert(!rendered.includes('<p></p>'));
  });

  // Test 2: Top announcement / Callout block above rates
  test('Top announcement callout block renders above rates', () => {
    const context = {
      title: 'Servizo Madrugadores',
      intro: 'O servizo de madrugadores está dispoñible de **7:30 a 8:45** con posibilidade de almorzo. O servizo é xestionado pola empresa [Jardanay](https://www.jardanay.es/).',
      top_sections: [
        {
          type: 'callout_block',
          title: 'Aviso Urxente de Prazos',
          text: 'O prazo de solicitude para setembro remata o 20 de xuño.',
          style: 'warning',
          url: 'https://example.com/aviso',
          url_label: 'Máis información'
        }
      ],
      rates: { monthly_breakfast: '49,94 € / mes' },
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('callout-box--warning'), 'Missing warning style class');
    assert(rendered.includes('Aviso Urxente de Prazos'));
    assert(rendered.includes('O prazo de solicitude para setembro remata o 20 de xuño.'));
    assert(rendered.includes('Máis información'));

    const calloutPos = rendered.indexOf('Aviso Urxente de Prazos');
    const ratesPos = rendered.indexOf('Tarifas do servizo');
    assert(calloutPos < ratesPos, 'Callout should appear ABOVE rates section');
  });

  // Test 3: Multiple flexible section block types (Text, Image, PDF, Button)
  test('All block types (text, image, pdf, button) render valid semantic HTML', () => {
    const context = {
      title: 'Memoria Anual',
      sections: [
        {
          type: 'text_block',
          title: 'Resumo Executivo',
          body: 'Este foi un ano de **grandes avances** para a comunidade.'
        },
        {
          type: 'image_block',
          image: '/img/uploads/evento.jpg',
          image_alt: 'Foto de familias no patio',
          caption: 'Xuntanza de socios de xuño'
        },
        {
          type: 'document_block',
          title: 'Balance Económico 2025',
          file: '/docs/balance-2025.pdf',
          description: 'Contas auditadas polo Consello',
          button_label: 'Consultar Balance'
        },
        {
          type: 'button_block',
          label: 'Contactar coa Xunta Directiva',
          url: 'mailto:anpa@example.com',
          note: 'Respondemos nun prazo máximo de 48h hábiles'
        }
      ],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h2>Resumo Executivo</h2>'));
    assert(rendered.includes('<strong>grandes avances</strong>'));
    assert(rendered.includes('<img src="/img/uploads/evento.jpg" alt="Foto de familias no patio"'));
    assert(rendered.includes('<figcaption'));
    assert(rendered.includes('Xuntanza de socios de xuño'));
    assert(rendered.includes('Balance Económico 2025'));
    assert(rendered.includes('/docs/balance-2025.pdf'));
    assert(rendered.includes('Consultar Balance'));
    assert(rendered.includes('Contactar coa Xunta Directiva'));
    assert(rendered.includes('mailto:anpa@example.com'));
    assert(rendered.includes('Respondemos nun prazo máximo de 48h hábiles'));
  });

  // Test 4: Graceful handling of empty/hidden optional fields
  test('Completely empty optional structured fields leave zero orphaned tags', () => {
    const context = {
      title: 'Páxina de Proba Limpa',
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Páxina de Proba Limpa</h1>'));
    assert(!rendered.includes('<h2>Tarifas do servizo</h2>'));
    assert(!rendered.includes('<h2>Inscrición e funcionamento</h2>'));
    assert(!rendered.includes('<h2>PAGO COMEDOR'));
    assert(!rendered.includes('<h2>Documentación informativa</h2>'));
    assert(!rendered.includes('<h2>Contacto e axuda</h2>'));
    assert(!rendered.includes('class="bank-box"'));
    assert(!rendered.includes('class="doc-cards"'));
    assert(!rendered.includes('class="callout-box"'));
  });

  // Test 5: Fully editable introduction replacement
  test('Editors can rewrite or replace the entire introduction with markdown', () => {
    const customIntro = 'Horario actualizado para este curso: de **7:00 a 9:00**. Máis información na [web municipal](https://culleredo.es).';
    const context = {
      title: 'Servizo Madrugadores',
      intro: customIntro,
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<strong>7:00 a 9:00</strong>'));
    assert(rendered.includes('<a href="https://culleredo.es">web municipal</a>'));
    assert(!rendered.includes('O servizo de madrugadores está dispoñible'));
  });

  // Test 6: Empty or whitespace-only introduction renders nothing
  test('Empty or whitespace-only introduction renders zero paragraph or fallback', () => {
    for (const emptyVal of ['', '   ', ' \n\t ', null, undefined]) {
      const context = {
        title: 'Servizo Madrugadores',
        intro: emptyVal,
        rates: { monthly_breakfast: '49,94 € / mes' },
        site: { name: 'ANPA Rabadeira' },
        collections: { navPages: [] }
      };

      const rendered = env.render('layouts/page.njk', context);
      assert(!rendered.includes('O servizo de madrugadores'));
      assert(!rendered.includes('<p></p>'));
      assert(rendered.includes('Tarifas do servizo'));
    }
  });

  console.log(`\nFlexible Content Test Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runFlexibleContentTests();
