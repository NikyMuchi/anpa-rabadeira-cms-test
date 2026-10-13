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
    const rawContent = `O servizo de madrugadores está dispoñible de **7:30 a 8:45** con posibilidade de almorzo. O servizo é xestionado pola empresa [Jardanay](https://www.jardanay.es/).

## Tarifas do servizo (Curso 2026-2027)

- Con almorzo: **49,94 € / mes**
- Sen almorzo: **37,45 € / mes**`;

    const context = {
      title: 'Servizo Madrugadores',
      content: md.render(rawContent),
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

  // Test 2: Top announcement / Callout block above content
  test('Top announcement callout block renders above content', () => {
    const context = {
      title: 'Servizo Madrugadores',
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
      content: md.render('## Tarifas do servizo\n\nTarifas aquí...'),
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('callout-box--warning'), 'Missing warning style class');
    assert(rendered.includes('Aviso Urxente de Prazos'));
    assert(rendered.includes('O prazo de solicitude para setembro remata o 20 de xuño.'));
    assert(rendered.includes('Máis información'));

    const calloutPos = rendered.indexOf('Aviso Urxente de Prazos');
    const contentPos = rendered.indexOf('Tarifas do servizo');
    assert(calloutPos < contentPos, 'Callout should appear ABOVE content section');
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
        content: md.render('## Tarifas do servizo\n\nTarifas aquí...'),
        site: { name: 'ANPA Rabadeira' },
        collections: { navPages: [] }
      };

      const rendered = env.render('layouts/page.njk', context);
      assert(!rendered.includes('O servizo de madrugadores'));
      assert(!rendered.includes('<p></p>'));
      assert(rendered.includes('Tarifas do servizo'));
    }
  });

  // Test 7: Simple Document Editor page (Madrugadores format)
  test('Simple Document Editor renders full narrative markdown body and documents list without separate price/hours fields', () => {
    const rawMarkdown = `O servizo de madrugadores está dispoñible de **7:30 a 8:45** con posibilidade de almorzo. O servizo é xestionado pola empresa Jardanay ([www.jardanay.es](https://www.jardanay.es/)).

## Tarifas do servizo (Curso 2026-2027)

Segundo a guía oficial do servizo para o curso 2026-2027:

**Contratación mensual fixa:**
- Con almorzo: **49,94 € / mes**
- Sen almorzo: **37,45 € / mes**

## Inscrición e funcionamento

A tramitación do servizo realízase a través da plataforma web de Jardanay: [www.comedores.jardanay.es](https://www.comedores.jardanay.es).

## Contacto e axuda

Para calquera dúbida ou cuestión, podes contactar con:
- **ANPA Ensino Rabadeira:** [anpaensinorabadeira@gmail.com](mailto:anpaensinorabadeira@gmail.com)`;

    const context = {
      title: 'Servizo Madrugadores',
      content: md.render(rawMarkdown),
      documents: [
        {
          title: 'Tríptico Informativo Madrugadores 2026-2027',
          file: '/docs/triptico_madrugadores_2026-2027.pdf',
          description: 'Guía oficial de Jardanay: prazos, operativa e tarifas'
        }
      ],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Servizo Madrugadores</h1>'));
    assert(rendered.includes('<strong>7:30 a 8:45</strong>'));
    assert(rendered.includes('<h2>Tarifas do servizo (Curso 2026-2027)</h2>'));
    assert(rendered.includes('49,94 € / mes'));
    assert(rendered.includes('<h2>Documentación informativa</h2>'));
    assert(rendered.includes('Tríptico Informativo Madrugadores 2026-2027'));
    assert(rendered.includes('/docs/triptico_madrugadores_2026-2027.pdf'));
    assert(rendered.includes('anpaensinorabadeira@gmail.com'));
    assert(!rendered.includes('undefined'));
    assert(!rendered.includes('null'));
  });

  // Test 8: Empty document editor body produces zero default sentences or fallback
  test('Empty document editor body produces zero default sentences or fallback', () => {
    const context = {
      title: 'Servizo Madrugadores',
      content: '',
      documents: [],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Servizo Madrugadores</h1>'));
    assert(!rendered.includes('O servizo de madrugadores'));
    assert(!rendered.includes('<h2>Tarifas do servizo</h2>'));
    assert(!rendered.includes('<h2>Documentación informativa</h2>'));
  });

  // Test 8b: Memoria simple document editor renders narrative body and documents list
  test('Memoria simple document editor renders narrative body and documents list', () => {
    const rawMarkdown = `Adxuntamos a memoria de actividades.

## Contacto e axuda

Para calquera dúbida ou cuestión, podes contactar con:
- **ANPA Ensino Rabadeira:** [anpaensinorabadeira@gmail.com](mailto:anpaensinorabadeira@gmail.com)`;

    const context = {
      title: 'Memoria Anual',
      content: md.render(rawMarkdown),
      documents: [
        {
          title: 'Memoria de Actividades (Curso 2023-2024)',
          file: '/docs/memoria-curso-2023_2024.pdf',
          description: 'Resumo de actividades, balance e xestión da ANPA'
        }
      ],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Memoria Anual</h1>'));
    assert(rendered.includes('Adxuntamos a memoria de actividades.'));
    assert(rendered.includes('<h2>Contacto e axuda</h2>'));
    assert(rendered.includes('anpaensinorabadeira@gmail.com'));
    assert(rendered.includes('<h2>Documentación informativa</h2>'));
    assert(rendered.includes('Memoria de Actividades (Curso 2023-2024)'));
    assert(rendered.includes('/docs/memoria-curso-2023_2024.pdf'));
  });

  // Test 8c: Consello Escolar simple document editor renders narrative body with blog link and contact
  test('Consello Escolar simple document editor renders narrative body with blog link and contact', () => {
    const rawMarkdown = `O **Consello Escolar** é o órgano de participación da comunidade educativa no goberno do centro. A ANPA conta cun posto de representación nel, ademais dos reservados aos representantes das familias, profesorado, equipo directivo e Concello.

No link inferior tendes a información das representantes das familias en dito Consello:

[Blog do Consello Escolar Rabadeira](https://conselloescolarrabadeira.home.blog/)

## Contacto e axuda

Para calquera dúbida ou cuestión, podes contactar con:
- **ANPA Ensino Rabadeira:** [anpaensinorabadeira@gmail.com](mailto:anpaensinorabadeira@gmail.com)`;

    const context = {
      title: 'Consello Escolar',
      content: md.render(rawMarkdown),
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Consello Escolar</h1>'));
    assert(rendered.includes('<strong>Consello Escolar</strong>'));
    assert(rendered.includes('https://conselloescolarrabadeira.home.blog/'));
    assert(rendered.includes('Blog do Consello Escolar Rabadeira'));
    assert(rendered.includes('<h2>Contacto e axuda</h2>'));
    assert(rendered.includes('anpaensinorabadeira@gmail.com'));
  });

  // Test 9: Featured image renders saved image_alt value accurately
  test('Featured image renders saved image_alt value on page layout', () => {
    const context = {
      title: 'Servizo Madrugadores',
      image: '/img/uploads/test-image.png',
      image_alt: 'Imaxe de cabeceira de proba sandbox para Madrugadores',
      content: '<p>Contido</p>',
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<img src="/img/uploads/test-image.png" alt="Imaxe de cabeceira de proba sandbox para Madrugadores">'));
    assert(!rendered.includes('alt="Servizo Madrugadores"'));
  });

  // Test 10: Intentionally empty image_alt renders alt="" without falling back to title
  test('Intentionally empty image_alt renders alt="" without falling back to title', () => {
    for (const emptyAlt of ['', null, undefined]) {
      const context = {
        title: 'Servizo Madrugadores',
        image: '/img/uploads/test-image.png',
        image_alt: emptyAlt,
        content: '<p>Contido</p>',
        site: { name: 'ANPA Rabadeira' },
        collections: { navPages: [] }
      };

      const rendered = env.render('layouts/page.njk', context);
      assert(rendered.includes('<img src="/img/uploads/test-image.png" alt="">'));
      assert(!rendered.includes('alt="Servizo Madrugadores"'));
    }
  });

  // Test 11: image_alt with quotes and ampersands escapes safely without breaking HTML attribute
  test('image_alt containing quotes and ampersands escapes safely as HTML entities', () => {
    const context = {
      title: 'Servizo Madrugadores',
      image: '/img/uploads/test-image.png',
      image_alt: 'Foto de "Madrugadores" & Familias',
      content: '<p>Contido</p>',
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<img src="/img/uploads/test-image.png" alt="Foto de &quot;Madrugadores&quot; &amp; Familias">'));
    // Ensure attribute is closed cleanly and not malformed
    assert(!rendered.includes('alt="Foto de "Madrugadores"'));
  });

  // Test 12: News post layout preserves existing title-based alt text
  test('News post layout preserves existing title-based alt text when image is present', () => {
    const context = {
      title: 'Xuntanza Xeral de Familias',
      date: '2026-02-15',
      category: 'Novas',
      image: '/img/uploads/xuntanza.jpg',
      content: '<p>Texto da nova</p>',
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/post.njk', context);
    assert(rendered.includes('<img src="/img/uploads/xuntanza.jpg" alt="Xuntanza Xeral de Familias" class="post-single__image">'));
  });

  console.log(`\nFlexible Content Test Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runFlexibleContentTests();
