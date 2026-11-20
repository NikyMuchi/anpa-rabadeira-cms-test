const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");

// Markdown-it instance configured for the manual
const md = markdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// 5 Main Categories grouping the 14 modules
const CATEGORIES = [
  {
    id: "primeros-pasos",
    title: "Primeros Pasos y Flujo de Trabajo",
    icon: "🚀",
    description: "Fundamentos del gestor Decap CMS, acceso seguro con GitHub y cómo funciona el ciclo de borradores y publicación.",
    moduleNumbers: [1, 2],
  },
  {
    id: "noticias-y-portada",
    title: "Noticias, Portada y Buscador",
    icon: "📰",
    description: "Publicación de avisos para familias, personalización de la página de inicio y funcionamiento del buscador.",
    moduleNumbers: [3, 10, 13],
  },
  {
    id: "servicios-escolares",
    title: "Servicios Escolares e Inscripciones",
    icon: "🎒",
    description: "Gestión de las 18 actividades extraescolares, servicio de madrugadores, comedor (guía ATRIGA) y alta de socios.",
    moduleNumbers: [4, 5, 6, 7],
  },
  {
    id: "institucion",
    title: "Institución, Memoria y Consejo Escolar",
    icon: "🏛️",
    description: "Información institucional del Consejo Escolar, rendición de cuentas anual y datos de contacto de la asociación.",
    moduleNumbers: [8, 9, 11],
  },
  {
    id: "multimedia-y-soporte",
    title: "Multimedia, Soporte y Relevo",
    icon: "🛠️",
    description: "Subida segura de fotos y PDFs, resolución de problemas habituales y protocolo de relevo para la nueva junta directiva.",
    moduleNumbers: [12, 14],
  },
];

// Curated tasks and common administrative search keywords per module
const MODULE_TASKS = {
  1: ["acceso", "login", "iniciar sesion", "github oauth", "usuario", "contraseña", "permisos", "4 pilares", "conceptos basicos", "que es decap cms", "panel de administracion"],
  2: ["guardar borrador", "flujo editorial", "editorial workflow", "en revision", "listo", "publicar ahora", "desplegar", "regla de los 1 a 2 minutos", "netlify build", "corregir errata", "tiempo real preview"],
  3: ["publicar una noticia", "crear noticia", "redactar aviso", "categorias", "novas", "comedor aviso", "subir foto noticia", "portada aviso", "eliminar noticia", "borrar entrada", "fecha de publicacion"],
  4: ["cambiar un precio", "actividades extraescolares", "cuota socio", "cerrar plazas", "plazas agotadas", "lista de espera", "horarios actividades", "identificador slug", "regla de oro", "convivencia", "18 actividades", "email empresa"],
  5: ["servicio de madrugadores", "madrugadores", "tarifas madrugadores", "jardanay", "vales digitales", "triptico pdf", "horario 7:30", "aviso dia 26", "precios madrugadores"],
  6: ["pago de comedor", "comedor escolar", "guia atriga", "11 pasos atriga", "modelo autoliquidacion", "justificante bancario", "email comedor", "tarifas comedor", "sustituir captura"],
  7: ["alta de socios", "formulario inscripcion", "google forms", "regla de oro iban", "cuenta bancaria anpa", "numero de cuenta", "cuota anual 20 euros", "seguridad iban"],
  8: ["memoria anual", "memoria de actividades", "balance de cuentas", "rendicion cuentas", "subir memoria pdf", "descargar pdf", "abrir pdf", "curso escolar"],
  9: ["consejo escolar", "consello escolar", "editor documento simple", "blog familias", "actas pdf", "representantes familias", "enlace externo blog", "documento simple"],
  10: ["portada principal", "pagina de inicio", "bloque hero", "cambiar mensaje bienvenida", "foto de comunidad", "lema anpa", "4 tarjetas colores", "panel de contacto", "accesos directos"],
  11: ["datos generales", "site json", "cambiar email oficial", "correo anpa", "nombre legal anpa", "descripcion seo google", "telefono anpa", "pie de pagina"],
  12: ["subir una imagen", "subir un pdf", "biblioteca de medios", "media library", "tamano foto 500 kb", "tamano pdf 5 mb", "formato horizontal", "nombres sin tildes", "eliminar archivos antiguos"],
  13: ["buscador general", "buscar en la web", "busqueda automatica", "sinonimos gallego espanol", "consejos redaccion", "indexacion automatica"],
  14: ["preguntas frecuentes", "faq", "solucion de problemas", "errata urgente", "el cms no abre", "pantalla en blanco", "protocolo de relevo", "traspaso directiva", "nueva junta directiva", "cambio de permisos"],
};

// High-priority direct task shortcuts for search
const QUICK_TASK_SHORTCUTS = [
  {
    title: "Publicar una noticia o aviso",
    keywords: ["publicar una noticia", "crear noticia", "redactar noticia", "nuevo aviso", "publicar aviso"],
    url: "/admin/manual/03-noticias-y-avisos/#4-paso-a-paso-para-redactar-y-publicar-una-noticia",
    module: "Módulo 3: Noticias y Avisos",
    category: "Noticias, Portada y Buscador",
    summary: "Pasos numerados para rellenar título, fecha, categoría, foto horizontal y publicar en la web.",
  },
  {
    title: "Cambiar un precio o cuota de extraescolares",
    keywords: ["cambiar un precio", "cambiar precio", "modificar cuota", "precio extraescolar", "precio mensual"],
    url: "/admin/manual/04-actividades-extraescolares/#4-las-18-actividades-oficiales-guia-casilla-por-casilla",
    module: "Módulo 4: Actividades Extraescolares",
    category: "Servicios Escolares e Inscripciones",
    summary: "Cómo localizar la actividad y modificar su cuota para socios y no socios en el formulario.",
  },
  {
    title: "Cerrar plazas agotadas (Actividad Completa)",
    keywords: ["cerrar plazas", "plazas agotadas", "actividad completa", "marcar completa", "sin plazas"],
    url: "/admin/manual/04-actividades-extraescolares/#5-tutorial-practico-1-que-hacer-cuando-una-actividad-se-llena",
    module: "Módulo 4: Actividades Extraescolares",
    category: "Servicios Escolares e Inscripciones",
    summary: "Cómo activar el interruptor de plazas agotadas para mostrar la etiqueta roja y deshabilitar el botón.",
  },
  {
    title: "Subir un documento en formato PDF",
    keywords: ["subir un pdf", "subir pdf", "adjuntar pdf", "nuevo documento pdf", "anadir pdf"],
    url: "/admin/manual/12-gestion-multimedia-imagenes-y-pdfs/#3-buenas-practicas-para-documentos-pdf",
    module: "Módulo 12: Gestión Multimedia",
    category: "Multimedia, Soporte y Relevo",
    summary: "Reglas de tamaño (<5 MB), nombres limpios sin tildes y pasos para vincular el PDF en cualquier sección.",
  },
  {
    title: "Cambiar o subir una fotografía / cartel",
    keywords: ["cambiar una imagen", "cambiar foto", "subir imagen", "subir foto", "foto horizontal", "cartel"],
    url: "/admin/manual/12-gestion-multimedia-imagenes-y-pdfs/#2-buenas-practicas-para-fotografias-y-carteles",
    module: "Módulo 12: Gestión Multimedia",
    category: "Multimedia, Soporte y Relevo",
    summary: "Cómo optimizar imágenes horizontales (<500 KB) y redactar el texto alternativo descriptivo.",
  },
  {
    title: "Guardar un borrador sin publicar en la web",
    keywords: ["guardar un borrador", "guardar borrador", "dejar a medias", "no publicar todavia", "borrador privado"],
    url: "/admin/manual/02-flujo-editorial-guardar-y-publicar/#1-los-tres-estados-de-un-contenido",
    module: "Módulo 2: Flujo Editorial",
    category: "Primeros Pasos y Flujo de Trabajo",
    summary: "Diferencia fundamental entre Guardar (borrador privado) y Publicar ahora (web visible).",
  },
  {
    title: "Actualizar la página del Consejo Escolar",
    keywords: ["consejo escolar", "consello escolar", "actas consejo", "blog familias enlace", "editor simple"],
    url: "/admin/manual/09-consejo-escolar/#4-estructura-detallada-del-editor-y-sus-campos",
    module: "Módulo 9: Consejo Escolar",
    category: "Institución, Memoria y Consejo Escolar",
    summary: "Cómo editar el texto institucional, actualizar el enlace al blog de familias y adjuntar actas en PDF.",
  },
  {
    title: "Renovar el enlace de Google Forms e IBAN",
    keywords: ["renovar iban", "cambiar google forms", "alta socios", "cuenta bancaria", "protocolo iban"],
    url: "/admin/manual/07-alta-de-socios-e-inscripcion/#3-alerta-critica-la-regla-de-oro-del-iban-bancario",
    module: "Módulo 7: Alta de Socios",
    category: "Servicios Escolares e Inscripciones",
    summary: "Protocolo de cuádruple comprobación para el IBAN bancario y actualización del formulario anual.",
  },
  {
    title: "Guía ATRIGA de 11 pasos para pago de comedor",
    keywords: ["guia atriga", "pago comedor", "atriga 11 pasos", "justificante comedor", "xunta atriga"],
    url: "/admin/manual/06-pago-comedor/#4-los-11-pasos-oficiales-de-la-guia-de-atriga",
    module: "Módulo 6: Pago de Comedor",
    category: "Servicios Escolares e Inscripciones",
    summary: "Tutorial ilustrado de 11 pasos para la plataforma tributaria ATRIGA y envío de justificantes.",
  },
  {
    title: "Protocolo de relevo para la nueva junta directiva",
    keywords: ["relevo directiva", "traspaso directiva", "nueva directiva", "cambio junta", "traspaso responsabilidades"],
    url: "/admin/manual/14-resolucion-de-problemas-y-traspaso/#parte-2-protocolo-de-relevo-para-la-nueva-directiva",
    module: "Módulo 14: Soporte y Relevo",
    category: "Multimedia, Soporte y Relevo",
    summary: "Protocolo en 4 pasos para conceder acceso a los nuevos miembros y revocar a los salientes sin pérdidas.",
  },
];

function enhanceHtml(rawHtml, moduleSlug) {
  let html = rawHtml;

  // 1. Rewrite image paths to canonical /admin/manual/img/CAP-*.png
  html = html.replace(/src="img\/(CAP-[A-Za-z0-9-_]+\.png)"/g, 'src="/admin/manual/img/$1"');
  html = html.replace(/href="img\/(CAP-[A-Za-z0-9-_]+\.png)"/g, 'href="/admin/manual/img/$1"');

  // 2. Rewrite inter-module links: (01-slug.md#anchor) -> (/admin/manual/01-slug/#anchor)
  html = html.replace(/href="([0-9]{2}-[a-z0-9-]+)\.md(#[^"]*)?"/g, 'href="/admin/manual/$1/$2"');
  html = html.replace(/href="INDICE\.md(#[^"]*)?"/g, 'href="/admin/manual/$1"');

  // 3. Wrap images and their subsequent em captions in <figure> with zoom trigger
  // Pattern: <p><img src="(...)" alt="(...)">(?:<br>\s*|\s*)<em>(Figura \d+:.*?)<\/em><\/p>
  const figureRegex = /<p>\s*<img\s+src="([^"]+)"\s+alt="([^"]*)"[^>]*>\s*(?:<br\s*\/?>)?\s*<em>(Figura\s+\d+:[\s\S]*?)<\/em>\s*<\/p>/gi;
  html = html.replace(figureRegex, (match, src, alt, caption) => {
    return `
<figure class="manual-figure">
  <div class="manual-figure__media">
    <button type="button" class="manual-zoom-btn" data-img-src="${src}" data-img-alt="${alt.replace(/"/g, '&quot;')}" aria-label="Ampliar imagen a pantalla completa: ${alt.replace(/"/g, '&quot;')}">
      <img src="${src}" alt="${alt}" class="manual-figure__img" loading="lazy">
      <span class="manual-zoom-hint" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
        Toca para ampliar
      </span>
    </button>
  </div>
  <figcaption class="manual-figure__caption">${caption}</figcaption>
</figure>`;
  });

  // 4. Enhance standard blockquotes into semantic alert callouts
  // Recognizes > ℹ️ (Info), > ⏱️ (Timer/Paciencia), > 🚨 (Alerta crítica), > 💡 (Consejo/Tip)
  html = html.replace(/<blockquote>\s*<p>\s*(ℹ️|⏱️|🚨|💡|⚠️)\s*([\s\S]*?)<\/p>\s*<\/blockquote>/gi, (match, emoji, content) => {
    let type = "info";
    let title = "Información importante";
    if (emoji === "⏱️") {
      type = "timer";
      title = "Regla de la paciencia (1-2 minutos)";
    } else if (emoji === "🚨" || emoji === "⚠️") {
      type = "alert";
      title = "Aviso crítico de seguridad";
    } else if (emoji === "💡") {
      type = "tip";
      title = "Consejo práctico";
    }

    return `
<aside class="manual-callout manual-callout--${type}" role="note" aria-label="${title}">
  <div class="manual-callout__icon" aria-hidden="true">${emoji}</div>
  <div class="manual-callout__content">
    <strong class="manual-callout__title">${title}</strong>
    <p>${content}</p>
  </div>
</aside>`;
  });

  // 5. Add stable anchor IDs to all <h2> and <h3> headings
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/gi, (match, level, inner) => {
    const plainText = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const anchorId = slugify(plainText);
    return `
<h${level} id="${anchorId}" class="manual-heading manual-heading--h${level}">
  <a href="#${anchorId}" class="manual-anchor-link" aria-label="Enlace a la sección: ${plainText.replace(/"/g, '&quot;')}">
    <span class="manual-anchor-icon" aria-hidden="true">#</span>
  </a>
  <span class="manual-heading__text">${inner}</span>
</h${level}>`;
  });

  // 6. Wrap <table> in a responsive scroll container
  html = html.replace(/<table>([\s\S]*?)<\/table>/gi, '<div class="manual-table-wrap"><table class="manual-table">$1</table></div>');

  return html;
}

module.exports = function () {
  const manualDir = path.resolve("docs/manual");
  if (!fs.existsSync(manualDir)) {
    return { modules: [], categories: [], quickTasks: [], searchIndex: [] };
  }

  const allFiles = fs.readdirSync(manualDir).filter((f) => f.endsWith(".md")).sort();
  const moduleFiles = allFiles.filter((f) => /^[0-9]{2}-.*\.md$/.test(f));

  // Parse 14 modules
  const modules = moduleFiles.map((fileName, index) => {
    const fullPath = path.join(manualDir, fileName);
    const rawContent = fs.readFileSync(fullPath, "utf8");
    const numMatch = fileName.match(/^([0-9]{2})/);
    const modNumber = numMatch ? parseInt(numMatch[1], 10) : index + 1;
    const numStr = String(modNumber).padStart(2, "0");
    const slug = fileName.replace(/\.md$/, "");

    // Extract H1 title
    const lines = rawContent.split(/\r?\n/);
    const h1Line = lines.find((l) => l.startsWith("# ")) || "# Manual";
    const fullTitle = h1Line.replace(/^#\s*/, "").trim();
    // Clean title without "Módulo X: "
    const cleanTitle = fullTitle.replace(/^M[oó]dulo\s+\d+:\s*/i, "").trim();

    // Extract first non-heading, non-empty paragraph as summary
    let summary = "";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith("#") && !line.startsWith("---") && !line.startsWith(">") && !line.startsWith("```")) {
        summary = line.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
        break;
      }
    }
    if (!summary || summary.length > 220) {
      summary = summary ? summary.slice(0, 215) + "…" : "Guía práctica y paso a paso para administrar esta sección en Decap CMS.";
    }

    // Match category
    const cat = CATEGORIES.find((c) => c.moduleNumbers.includes(modNumber)) || CATEGORIES[0];

    // Extract section headings (## )
    const sections = [];
    lines.forEach((l) => {
      if (l.startsWith("## ")) {
        const text = l.replace(/^##\s*/, "").trim();
        sections.push({
          title: text,
          slug: slugify(text),
        });
      }
    });

    // Render HTML with rich enhancements
    const renderedHtml = enhanceHtml(md.render(rawContent), slug);

    return {
      number: modNumber,
      numStr,
      fileName,
      slug,
      url: `/admin/manual/${slug}/`,
      fullTitle,
      title: cleanTitle,
      summary,
      category: cat.title,
      categorySlug: cat.id,
      categoryIcon: cat.icon,
      sections,
      tasks: MODULE_TASKS[modNumber] || [],
      html: renderedHtml,
      rawContent,
    };
  });

  // Link previous, next, and related modules
  modules.forEach((mod, idx) => {
    mod.prev = idx > 0 ? { title: modules[idx - 1].fullTitle, shortTitle: modules[idx - 1].title, url: modules[idx - 1].url, numStr: modules[idx - 1].numStr } : null;
    mod.next = idx < modules.length - 1 ? { title: modules[idx + 1].fullTitle, shortTitle: modules[idx + 1].title, url: modules[idx + 1].url, numStr: modules[idx + 1].numStr } : null;

    // Find related modules (same category or logically related)
    const sameCat = modules.filter((m) => m.categorySlug === mod.categorySlug && m.number !== mod.number);
    mod.related = sameCat.slice(0, 3).map((m) => ({
      title: m.fullTitle,
      shortTitle: m.title,
      url: m.url,
      numStr: m.numStr,
      summary: m.summary,
    }));
  });

  // Attach populated modules to categories
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    modules: modules.filter((m) => cat.moduleNumbers.includes(m.number)),
  }));

  // Parse INDICE.md
  let indexDoc = { title: "Manual de Administración del CMS", html: "" };
  const indexPath = path.join(manualDir, "INDICE.md");
  if (fs.existsSync(indexPath)) {
    const rawIndex = fs.readFileSync(indexPath, "utf8");
    indexDoc = {
      title: "Manual de Administración del CMS — ANPA Ensino Rabadeira",
      html: enhanceHtml(md.render(rawIndex), "indice"),
    };
  }

  // Build lightweight Search Index for local client-side search
  const searchIndex = [];

  // A. Quick direct task shortcuts (highest priority)
  QUICK_TASK_SHORTCUTS.forEach((task, idx) => {
    searchIndex.push({
      id: `task-${idx + 1}`,
      type: "task",
      title: task.title,
      module: task.module,
      category: task.category,
      url: task.url,
      summary: task.summary,
      keywords: task.keywords.join(" "),
      text: `${task.title} ${task.summary} ${task.keywords.join(" ")}`,
    });
  });

  // B. Module main overviews
  modules.forEach((mod) => {
    searchIndex.push({
      id: `mod-${mod.number}`,
      type: "module",
      title: mod.fullTitle,
      module: mod.fullTitle,
      category: mod.category,
      url: mod.url,
      summary: mod.summary,
      keywords: (mod.tasks || []).join(" "),
      text: `${mod.fullTitle} ${mod.summary} ${(mod.tasks || []).join(" ")}`,
    });

    // C. Module sections (## headings)
    mod.sections.forEach((sec, sIdx) => {
      searchIndex.push({
        id: `mod-${mod.number}-sec-${sIdx + 1}`,
        type: "section",
        title: sec.title,
        module: mod.fullTitle,
        category: mod.category,
        url: `${mod.url}#${sec.slug}`,
        summary: `Sección dentro del ${mod.fullTitle}.`,
        keywords: `${mod.title} ${sec.title}`,
        text: `${sec.title} ${mod.fullTitle} ${mod.category}`,
      });
    });
  });

  return {
    modules,
    categories,
    indexDoc,
    quickTasks: QUICK_TASK_SHORTCUTS,
    searchIndex,
  };
};
