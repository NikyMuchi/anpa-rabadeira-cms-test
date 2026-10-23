/**
 * Decap CMS Live Preview Regression & Schema Safety Test Suite
 * Validates that preview templates:
 * 1. Safely render structured collections (Comedor, Inscrición) that do not define a body field.
 * 2. Never invoke widgetFor('body') for collections lacking a body field (preventing Decap TypeError).
 * 3. Correctly invoke widgetFor('body') for document collections (Madrugadores, Memoria, Consello Escolar).
 * 4. Gracefully handle optional or missing fields without throwing or generating orphaned artifacts.
 * 5. Handle diverse Decap props shapes (Immutable List, JS Array, collection map).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load preview-templates
const previewTemplates = require('../admin/preview-templates.js');
const { hasField, formatMarkdown, PagePreview, PostPreview } = previewTemplates;

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

  console.log('=== Executing Decap CMS Live Preview Schema Safety Tests ===\n');

  // Helper to create realistic Immutable-like Entry
  function createMockEntry(data) {
    return {
      getIn: (pathArr) => {
        if (pathArr.length === 1 && pathArr[0] === 'data') {
          return {
            toJS: () => JSON.parse(JSON.stringify(data))
          };
        }
        if (pathArr.length === 2 && pathArr[0] === 'data') {
          return data[pathArr[1]];
        }
        return undefined;
      }
    };
  }

  // Helper to create Immutable-like Fields List (matching Decap CMS internals)
  function createImmutableFields(fieldNames) {
    const list = fieldNames.map(name => ({
      get: (prop) => (prop === 'name' ? name : prop === 'widget' ? 'string' : undefined),
      name
    }));
    return {
      some: (predicate) => list.some(predicate),
      find: (predicate) => list.find(predicate),
      toJS: () => list.slice()
    };
  }

  // Helper to create realistic Decap preview props
  function createDecapProps({ data, fieldNames, onWidgetFor }) {
    const fields = createImmutableFields(fieldNames);
    const declaredFieldNames = new Set(fieldNames);

    return {
      entry: createMockEntry(data),
      fields,
      collection: {
        get: (prop) => (prop === 'fields' ? fields : undefined)
      },
      getAsset: (assetPath) => ({
        toString: () => String(assetPath)
      }),
      widgetFor: (name) => {
        if (onWidgetFor) onWidgetFor(name);
        // Decap throws TypeError: Cannot read properties of undefined (reading 'get') if name not in fields
        if (!declaredFieldNames.has(name)) {
          throw new TypeError(`Cannot read properties of undefined (reading 'get') - field "${name}" is not declared in collection fields`);
        }
        return {
          tag: 'div',
          props: { className: `mock-widget-${name}` },
          children: [`[Rendered widget for ${name}]`]
        };
      }
    };
  }

  // Helper to search rendered virtual DOM tree
  function findNodes(vnode, predicate) {
    const results = [];
    if (!vnode) return results;
    if (predicate(vnode)) results.push(vnode);
    if (vnode.children && Array.isArray(vnode.children)) {
      for (const child of vnode.children) {
        results.push(...findNodes(child, predicate));
      }
    }
    return results;
  }

  // Test 1: hasField unit tests across diverse Decap prop shapes
  test('hasField accurately detects field presence across Immutable and Array shapes', () => {
    // Immutable-like List
    const immFields = createImmutableFields(['title', 'intro', 'steps']);
    assert.strictEqual(hasField({ fields: immFields }, 'body'), false);
    assert.strictEqual(hasField({ fields: immFields }, 'steps'), true);

    // Plain JS Array
    const arrFields = [{ name: 'title' }, { name: 'body' }];
    assert.strictEqual(hasField({ fields: arrFields }, 'body'), true);
    assert.strictEqual(hasField({ fields: arrFields }, 'steps'), false);

    // Decap collection.get('fields')
    const colProps = {
      collection: {
        get: (prop) => (prop === 'fields' ? createImmutableFields(['title', 'body']) : undefined)
      }
    };
    assert.strictEqual(hasField(colProps, 'body'), true);
    assert.strictEqual(hasField(colProps, 'nonexistent'), false);

    // Null / undefined props safety
    assert.strictEqual(hasField(null, 'body'), false);
    assert.strictEqual(hasField({}, 'body'), false);
    assert.strictEqual(hasField({ fields: null }, 'body'), false);
  });

  // Test 2: Comedor Preview without body field (Prevents Decap crash)
  test('Comedor preview executes safely without body field and does not invoke widgetFor("body")', () => {
    const comedorFieldNames = [
      'title', 'image', 'image_alt', 'intro', 'atriga_info',
      'steps', 'closing_info', 'documents'
    ];

    const comedorData = {
      title: 'Pago Comedor',
      intro: 'Información sobre o pagamento do comedor.',
      atriga_info: '## PAGO COMEDOR A TRAVÉS DE ATRIGA (AXENCIA TRIBUTARIA DE GALICIA)\n\nUn deles é a través da Axencia Tributaria de Galicia: [Portal tributario ATRIGA](https://ovt.atriga.gal).',
      steps: [
        { description: 'Paso 1: inicio', image: '/img/comedor/paso-1.png', image_alt: 'Paso 1' },
        { description: 'Paso 2: candado', image: '/img/comedor/paso-2.png', image_alt: 'Paso 2' },
        { description: 'Paso 3: TPV', image: '/img/comedor/paso-3.png', image_alt: 'Paso 3' },
        { description: 'Paso 4: códigos', image: '/img/comedor/paso-4.png', image_alt: 'Paso 4' },
        { description: 'Paso 5: datos', image: '/img/comedor/paso-5.png', image_alt: 'Paso 5' },
        { description: 'Paso 6: telemático', image: '/img/comedor/paso-6.png', image_alt: 'Paso 6' },
        { description: 'Paso 7: tarxeta', image: '/img/comedor/paso-7.png', image_alt: 'Paso 7' },
        { description: 'Paso 8: ingresar', image: '/img/comedor/paso-8.png', image_alt: 'Paso 8' },
        { description: 'Paso 9: confirmar', image: '/img/comedor/paso-9.png', image_alt: 'Paso 9' },
        { description: 'Paso 10: tarxeta bancaria', image: '/img/comedor/paso-10.png', image_alt: 'Paso 10' },
        { image: '/img/comedor/paso-11.png', image_alt: 'Paso 11' }
      ],
      closing_info: 'Unha vez feito o pago, envíase o xustificante a [comedor.ceip.rabadeira@edu.xunta.gal](mailto:comedor.ceip.rabadeira@edu.xunta.gal)'
    };

    const widgetCalls = [];
    const props = createDecapProps({
      data: comedorData,
      fieldNames: comedorFieldNames,
      onWidgetFor: (name) => widgetCalls.push(name)
    });

    const component = new PagePreview(props);
    const vdom = component.render();

    assert(vdom, 'Comedor render() must return a virtual DOM element');
    assert.strictEqual(vdom.tag, 'div');
    assert.strictEqual(widgetCalls.includes('body'), false, 'widgetFor("body") must NEVER be called for Comedor');

    // Verify rendered 11 steps
    const stepImgs = findNodes(vdom, node => node.tag === 'img' && node.props && node.props.src && node.props.src.includes('paso-'));
    assert.strictEqual(stepImgs.length, 11, 'All 11 tutorial step images must be rendered in preview');
  });

  // Test 3: Inscrición Preview without body field (Prevents Decap crash)
  test('Inscrición preview executes safely without body field and does not invoke widgetFor("body")', () => {
    const inscripcionFieldNames = [
      'title', 'image', 'image_alt', 'intro', 'membership_fee',
      'bank_iban', 'transfer_concept_note', 'registration_form_url',
      'registration_button_label', 'closing_text', 'documents'
    ];

    const inscripcionData = {
      title: 'Formulario Inscrición',
      intro: 'No enlace inferior xa podedes facer a alta como socios para o curso 2026-2027.',
      membership_fee: '25€/familia',
      bank_iban: 'ES76 0049 2731 64 2114103625',
      transfer_concept_note: 'indicar o nome da familia (apelidos do neno/a)',
      registration_form_url: 'https://forms.gle/nrS3vcx7YGAskn5c8',
      registration_button_label: 'Acceder ao formulario de inscrición',
      closing_text: 'Grazas!'
    };

    const widgetCalls = [];
    const props = createDecapProps({
      data: inscripcionData,
      fieldNames: inscripcionFieldNames,
      onWidgetFor: (name) => widgetCalls.push(name)
    });

    const component = new PagePreview(props);
    const vdom = component.render();

    assert(vdom, 'Inscrición render() must return a virtual DOM element');
    assert.strictEqual(vdom.tag, 'div');
    assert.strictEqual(widgetCalls.includes('body'), false, 'widgetFor("body") must NEVER be called for Inscrición');

    // Verify rendered bank box and exact IBAN
    const ibanCodes = findNodes(vdom, node => node.tag === 'code' && node.props && node.props.className === 'bank-box__iban');
    assert.strictEqual(ibanCodes.length, 1, 'Bank box IBAN must be rendered in preview');
    assert.strictEqual(ibanCodes[0].children[0], 'ES76 0049 2731 64 2114103625');
  });

  // Test 4: Madrugadores, Memoria and Consello Escolar with existing body fields
  test('Document collections (Madrugadores, Memoria, Consello Escolar) invoke widgetFor("body")', () => {
    const docCollections = [
      {
        name: 'madrugadores',
        fields: ['title', 'image', 'image_alt', 'body', 'documents'],
        data: { title: 'Servizo de Madrugadores' }
      },
      {
        name: 'memoria',
        fields: ['title', 'image', 'image_alt', 'body', 'documents'],
        data: { title: 'Memoria de Actividades' }
      },
      {
        name: 'consello_escolar',
        fields: ['title', 'image', 'image_alt', 'body'],
        data: { title: 'Consello Escolar' }
      }
    ];

    for (const col of docCollections) {
      const widgetCalls = [];
      const props = createDecapProps({
        data: col.data,
        fieldNames: col.fields,
        onWidgetFor: (name) => widgetCalls.push(name)
      });

      const component = new PagePreview(props);
      const vdom = component.render();

      assert(vdom, `${col.name} render() must return a virtual DOM element`);
      assert(widgetCalls.includes('body'), `${col.name} MUST invoke widgetFor("body") because body is in schema`);

      // Verify the rendered widget placeholder is in the DOM
      const widgetNodes = findNodes(vdom, node => node.props && node.props.className === 'mock-widget-body');
      assert.strictEqual(widgetNodes.length, 1, `${col.name} must contain the rendered body widget`);
    }
  });

  // Test 5: Missing or Optional Content Fields Resilience
  test('PagePreview handles empty or missing optional fields without throwing or crashing', () => {
    // Comedor with completely empty optional fields
    const emptyComedorProps = createDecapProps({
      data: { title: 'Comedor Vacío' },
      fieldNames: ['title', 'steps', 'receipt_instructions', 'documents']
    });
    const comedorComp = new PagePreview(emptyComedorProps);
    assert.doesNotThrow(() => comedorComp.render(), 'Empty Comedor should not throw');

    // Inscrición with completely empty optional fields
    const emptyInscripcionProps = createDecapProps({
      data: { title: 'Inscrición Vacía' },
      fieldNames: ['title', 'bank_iban', 'membership_fee', 'documents']
    });
    const inscComp = new PagePreview(emptyInscripcionProps);
    assert.doesNotThrow(() => inscComp.render(), 'Empty Inscrición should not throw');

    // Completely empty entry data
    const nullEntryProps = {
      entry: null,
      fields: createImmutableFields(['title']),
      widgetFor: () => null,
      getAsset: () => null
    };
    const nullComp = new PagePreview(nullEntryProps);
    assert.strictEqual(nullComp.render(), null, 'Null entry must safely return null');
  });

  // Test 6: Verify config.yml schemas match test expectations
  test('admin/config.yml confirms Comedor & Inscrición have NO body field, while document pages DO', () => {
    const configPath = path.resolve(__dirname, '..', 'admin', 'config.yml');
    const content = fs.readFileSync(configPath, 'utf8');

    // Function to check if a collection section has a body field
    function collectionHasBody(collectionName) {
      const regex = new RegExp(`name:\\s*["']?${collectionName}["']?[\\s\\S]*?(?=\\n\\s*-\\s*name:|$)`);
      const match = content.match(regex);
      if (!match) throw new Error(`Collection ${collectionName} not found in config.yml`);
      return /name:\s*["']?body["']?/.test(match[0]);
    }

    assert.strictEqual(collectionHasBody('comedor'), false, 'comedor in config.yml must NOT have a body field');
    assert.strictEqual(collectionHasBody('inscripcion'), false, 'inscripcion in config.yml must NOT have a body field');
    assert.strictEqual(collectionHasBody('madrugadores'), true, 'madrugadores in config.yml MUST have a body field');
    assert.strictEqual(collectionHasBody('memoria'), true, 'memoria in config.yml MUST have a body field');
    assert.strictEqual(collectionHasBody('consello_escolar'), true, 'consello_escolar in config.yml MUST have a body field');
  });

  // Test 7: Exact Visual Sequence of Comedor Tutorial Content in Live Preview
  test('Comedor preview reproduces approved production content sequence (11 steps -> Paso 11 -> Receipt -> Other -> Closing)', () => {
    const comedorFieldNames = [
      'title', 'image', 'image_alt', 'intro', 'atriga_info',
      'steps', 'closing_info', 'documents'
    ];

    const comedorData = {
      title: 'Pago Comedor',
      intro: 'Para todas aquelas familias que dirixéronse ao ANPA coas dúbidas sobre os trámites para facer o pagamento, os adxuntamos as diferentes vias nas que poderes facelo sen ter que ir ao centro. Tamén tendes [instruccións detalladas na web do centro](http://www.edu.xunta.gal/centros/ceiprabadeira/node/268).',
      atriga_info: '## PAGO COMEDOR A TRAVÉS DE ATRIGA (AXENCIA TRIBUTARIA DE GALICIA)\n\nUn deles é a través da Axencia Tributaria de Galicia: [Portal tributario ATRIGA](https://ovt.atriga.gal).',
      steps: [
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
      ],
      closing_info: 'Unha vez feito o pago, envíase o xustificante en pdf ou jpg o email [comedor.ceip.rabadeira@edu.xunta.gal](mailto:comedor.ceip.rabadeira@edu.xunta.gal), indicando o nome e curso do alumno no asunto ou corpo do mensaxe para facilitar o trámite administrativo.\n\nOutras formas de facer o pagamento é presencialmente na oficina bancaria ou a través da plataforma Abalar.\n\nEsperamos que esta guía sea de axuda para todos vós.'
    };

    const props = createDecapProps({
      data: comedorData,
      fieldNames: comedorFieldNames
    });

    const component = new PagePreview(props);
    const vdom = component.render();

    // 1. Verify all 11 images exist and are in exact sequential order
    const images = findNodes(vdom, n => n.tag === 'img');
    assert.strictEqual(images.length, 11, 'Must render exactly 11 tutorial images');
    for (let i = 1; i <= 11; i++) {
      assert(images[i - 1].props.src.endsWith(`paso-${i}.png`), `Image at index ${i - 1} must be paso-${i}.png`);
    }

    // 2. Serialize tree to inspect linear ordering of nodes
    function serializeNode(node) {
      if (!node) return '';
      let str = '';
      if (node.tag === 'img') {
        str += `[IMG:${node.props.src}]`;
      }
      if (node.props && node.props.dangerouslySetInnerHTML && node.props.dangerouslySetInnerHTML.__html) {
        str += node.props.dangerouslySetInnerHTML.__html;
      }
      if (node.children) {
        if (Array.isArray(node.children)) {
          for (const c of node.children) {
            str += typeof c === 'string' ? c : serializeNode(c);
          }
        } else if (typeof node.children === 'string') {
          str += node.children;
        }
      }
      return str;
    }

    const fullText = serializeNode(vdom);

    // Positions of key elements in serialized output
    const posPaso10Desc = fullText.indexOf('E aquí xa podes intruducir os datos da túa tarxeta bancaria e proceder ao pagamento:');
    const posPaso10Img = fullText.indexOf('[IMG:/img/comedor/paso-10.png]');
    const posPaso11Img = fullText.indexOf('[IMG:/img/comedor/paso-11.png]');
    const posReceipt = fullText.indexOf('Unha vez feito o pago, envíase o xustificante');
    const posMailto = fullText.indexOf('href="mailto:comedor.ceip.rabadeira@edu.xunta.gal"');
    const posOtherMethods = fullText.indexOf('Outras formas de facer o pagamento é presencialmente na oficina bancaria');
    const posClosing = fullText.indexOf('Esperamos que esta guía sea de axuda para todos vós.');

    // Assert strict ordering:
    // paso-10 description -> paso-10 img -> paso-11 img -> receipt instructions -> other methods -> closing note
    assert(posPaso10Desc !== -1, 'Paso 10 description must exist');
    assert(posPaso10Img !== -1, 'Paso 10 image must exist');
    assert(posPaso11Img !== -1, 'Paso 11 image (Sabadell) must exist');
    assert(posReceipt !== -1, 'Receipt instructions must exist');
    assert(posMailto !== -1, 'Comedor email must render as a clickable mailto link');
    assert(posOtherMethods !== -1, 'Other payment methods note must exist');
    assert(posClosing !== -1, 'Closing note must exist');

    assert(posPaso10Desc < posPaso10Img, 'Paso 10 description must appear BEFORE paso-10 image');
    assert(posPaso10Img < posPaso11Img, 'Paso 10 image must appear BEFORE paso-11 image');
    assert(posPaso11Img < posReceipt, 'Paso 11 Sabadell screenshot must appear BEFORE receipt instructions paragraph');
    assert(posReceipt < posOtherMethods, 'Receipt instructions must appear BEFORE other payment methods note');
    assert(posOtherMethods < posClosing, 'Other payment methods must appear BEFORE closing message');

    // Assert each of the three paragraphs appears exactly once
    assert.strictEqual(fullText.split('Unha vez feito o pago').length - 1, 1, 'Receipt instructions must appear exactly once');
    assert.strictEqual(fullText.split('Outras formas de facer o pagamento').length - 1, 1, 'Other payment methods must appear exactly once');
    assert.strictEqual(fullText.split('Esperamos que esta guía sea de axuda').length - 1, 1, 'Closing note must appear exactly once');
  });

  // Test 8: Defensive resilience against legacy entries where Step 11 description had receipt text
  test('Comedor preview defensively guards against legacy data where step 11 description had receipt text', () => {
    const legacyComedorData = {
      title: 'Pago Comedor',
      steps: [
        { description: 'Paso 1', image: '/img/comedor/paso-1.png' },
        { description: 'Paso 10', image: '/img/comedor/paso-10.png' },
        { description: 'Unha vez feito o pago, envíase o xustificante en pdf ou jpg o email comedor.ceip.rabadeira@edu.xunta.gal...', image: '/img/comedor/paso-11.png' }
      ],
      other_methods_note: 'Outras formas de facer o pagamento.',
      closing_note: 'Esperamos que esta guía sea de axuda.'
    };

    const props = createDecapProps({
      data: legacyComedorData,
      fieldNames: ['title', 'steps', 'receipt_instructions', 'other_methods_note', 'closing_note']
    });

    const component = new PagePreview(props);
    const vdom = component.render();

    function serializeNode(node) {
      if (!node) return '';
      let str = '';
      if (node.tag === 'img') str += `[IMG:${node.props.src}]`;
      if (node.props && node.props.dangerouslySetInnerHTML && node.props.dangerouslySetInnerHTML.__html) str += node.props.dangerouslySetInnerHTML.__html;
      if (node.children) {
        if (Array.isArray(node.children)) {
          for (const c of node.children) str += typeof c === 'string' ? c : serializeNode(c);
        } else if (typeof node.children === 'string') {
          str += node.children;
        }
      }
      return str;
    }

    const fullText = serializeNode(vdom);
    const posPaso11Img = fullText.indexOf('[IMG:/img/comedor/paso-11.png]');
    const posReceipt = fullText.indexOf('Unha vez feito o pago');

    assert(posPaso11Img !== -1, 'Paso 11 image must exist');
    assert(posReceipt !== -1, 'Receipt instructions must exist');
    assert(posPaso11Img < posReceipt, 'Even with legacy data, Paso 11 screenshot must appear BEFORE receipt text');
    assert.strictEqual(fullText.split('Unha vez feito o pago').length - 1, 1, 'Receipt instructions must never be duplicated');
  });

  console.log(`\nPreview Templates Test Summary: ${passed} passed, ${failed} failed.\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
