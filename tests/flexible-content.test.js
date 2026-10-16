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

  // Test 13: Comedor simplified editor renders all 11 tutorial steps and handles empty states
  test('Comedor simplified editor renders all 11 tutorial steps, screenshots, and handles empty state safely', () => {
    const steps = [
      { description: 'No apartado de CIDADÁNS, premes iniciar taxa', image: '/img/comedor/paso-1.png', image_alt: 'Paso 1 - Portal ATRIGA' },
      { description: 'Candado aberto é para o acceso libre ao servizo. Pechado se tedes certificado dixital', image: '/img/comedor/paso-2.png', image_alt: 'Paso 2 - Candados' },
      { description: 'Sen certificado dixital podes facer o pago a través da TPV', image: '/img/comedor/paso-3.png', image_alt: 'Paso 3 - Opcións de pago TPV' },
      { description: 'Tedes que poner estes códigos para o pagamento do comedor:', image: '/img/comedor/paso-4.png', image_alt: 'Paso 4 - Códigos do comedor' },
      { description: 'Completar os datos requeridos:', image: '/img/comedor/paso-5.png', image_alt: 'Paso 5 - Datos persoais' },
      { description: 'Premer pagamento telemático:', image: '/img/comedor/paso-6.png', image_alt: 'Paso 6 - Pagamento telemático' },
      { description: 'Na seguinte pantalla premer continuar co tipo de pagamento «telemático» e modo de pagamento «tarxeta»', image: '/img/comedor/paso-7.png', image_alt: 'Paso 7 - Tipo de pagamento' },
      { description: 'Sairá esta outra pantalla, e premer ingresar:', image: '/img/comedor/paso-8.png', image_alt: 'Paso 8 - Premer ingresar' },
      { description: 'Nos sairá esta outra mensaje para continuar co pagamento', image: '/img/comedor/paso-9.png', image_alt: 'Paso 9 - Confirmación' },
      { description: 'E aquí xa podes intruducir os datos da túa tarxeta bancaria e proceder ao pagamento:', image: '/img/comedor/paso-10.png', image_alt: 'Paso 10 - Datos da tarxeta' },
      { image: '/img/comedor/paso-11.png', image_alt: 'Paso 11 - Proceder ao pagamento' }
    ];

    const context = {
      title: 'Pago Comedor',
      intro: 'Para todas aquelas familias que dirixéronse ao ANPA coas dúbidas sobre os trámites para facer o pagamento, os adxuntamos as diferentes vias nas que poderes facelo sen ter que ir ao centro. Tamén tendes [instruccións detalladas na web do centro](http://www.edu.xunta.gal/centros/ceiprabadeira/node/268).',
      atriga_portal_url: 'https://ovt.atriga.gal',
      steps: steps,
      receipt_instructions: 'Unha vez feito o pago, envíase o xustificante en pdf ou jpg o email [comedor.ceip.rabadeira@edu.xunta.gal](mailto:comedor.ceip.rabadeira@edu.xunta.gal), indicando o nome e curso do alumno no asunto ou corpo do mensaxe para facilitar o trámite administrativo.',
      other_methods_note: 'Outras formas de facer o pagamento é presencialmente na oficina bancaria ou a través da plataforma Abalar.',
      closing_note: 'Esperamos que esta guía sea de axuda para todos vós.',
      documents: [
        { title: 'Guía de Pago ATRIGA (PDF)', file: '/docs/guia-atriga.pdf', description: 'Descarga en PDF' }
      ],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Pago Comedor</h1>'));
    assert(rendered.includes('<h2>PAGO COMEDOR A TRAVÉS DE ATRIGA (AXENCIA TRIBUTARIA DE GALICIA)</h2>'));
    assert(rendered.includes('https://ovt.atriga.gal'));
    assert(rendered.includes('<a href="http://www.edu.xunta.gal/centros/ceiprabadeira/node/268">instruccións detalladas na web do centro</a>'));
    for (let i = 1; i <= 11; i++) {
      assert(rendered.includes(`/img/comedor/paso-${i}.png`), `Missing paso-${i}.png`);
    }
    assert(rendered.includes('<a href="mailto:comedor.ceip.rabadeira@edu.xunta.gal">comedor.ceip.rabadeira@edu.xunta.gal</a>'));
    assert(rendered.indexOf('/img/comedor/paso-11.png') < rendered.indexOf('mailto:comedor.ceip.rabadeira@edu.xunta.gal'), 'Screenshot 11 must appear before receipt instructions');
    assert(rendered.includes('Outras formas de facer o pagamento'));
    assert(rendered.includes('Guía de Pago ATRIGA (PDF)'));

    // Empty state test
    const emptyContext = {
      title: 'Pago Comedor',
      steps: [],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };
    const emptyRendered = env.render('layouts/page.njk', emptyContext);
    assert(!emptyRendered.includes('<h2>PAGO COMEDOR'));
    assert(!emptyRendered.includes('Portal tributario ATRIGA'));
    assert(!emptyRendered.includes('Esperamos que esta guía'));
  });

  // Test 14: Inscrición simplified editor renders bank-box with exact IBAN and handles empty state
  test('Inscrición simplified editor renders bank-box with exact IBAN, fee, and handles empty state safely', () => {
    const context = {
      title: 'Formulario Inscrición',
      image: '/img/uploads/logo-post.jpg',
      image_alt: '',
      intro: 'No enlace inferior xa podedes facer a alta como socios...',
      membership_fee: '25€/familia',
      bank_iban: 'ES76 0049 2731 64 2114103625',
      transfer_concept_note: 'indicar o nome da familia (apelidos do neno/a) no concepto da transferencia.',
      registration_form_url: 'https://forms.gle/nrS3vcx7YGAskn5c8',
      registration_button_label: 'Acceder ao formulario de inscrición (Google Forms)',
      closing_text: 'Grazas!',
      documents: [
        { title: 'Ficha de Inscrición 2025-2026', file: '/docs/ficha-de-inscripcion-rabadeira-curso-2025-2026.pdf', description: 'Formulario imprimible' }
      ],
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };

    const rendered = env.render('layouts/page.njk', context);
    assert(rendered.includes('<h1>Formulario Inscrición</h1>'));
    assert(rendered.includes('<img src="/img/uploads/logo-post.jpg" alt="">'));
    assert(rendered.includes('25€/familia'));
    assert(rendered.includes('class="bank-box"'));
    assert(rendered.includes('ES76 0049 2731 64 2114103625'));
    assert(rendered.includes('Importante:</strong> indicar o nome da familia'));
    assert(rendered.includes('https://forms.gle/nrS3vcx7YGAskn5c8'));
    assert(rendered.includes('Acceder ao formulario de inscrición (Google Forms)'));
    assert(rendered.includes('Grazas!'));
    assert(rendered.includes('Ficha de Inscrición 2025-2026'));

    // Empty state test: when bank_iban is absent, zero bank-box rendered
    const emptyContext = {
      title: 'Formulario Inscrición',
      site: { name: 'ANPA Rabadeira' },
      collections: { navPages: [] }
    };
    const emptyRendered = env.render('layouts/page.njk', emptyContext);
    assert(!emptyRendered.includes('class="bank-box"'));
    assert(!emptyRendered.includes('Número de conta (IBAN)'));
    assert(!emptyRendered.includes('Grazas!'));
  });

  console.log(`\nFlexible Content Test Summary: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runFlexibleContentTests();
