# Manual de Administración del CMS — ANPA Ensino Rabadeira

Bienvenida y bienvenido al **Manual Oficial de Administración del Sitio Web de la ANPA Ensino Rabadeira** (CEIP Rabadeira, Oleiros).

Este documento está diseñado para que cualquier persona miembro de la directiva de la ANPA pueda gestionar, actualizar y publicar contenidos en la página web con total autonomía, **sin necesidad de tener conocimientos de informática ni experiencia previa con gestores de contenido**.

---

## Estructura del Manual (14 Módulos Dedicados)

El manual está dividido en 14 guías prácticas independientes. Cada sección de la web cuenta con su propio tutorial completo y detallado:

| Módulo | Sección que Explica | Tareas que Resuelve |
| :--- | :--- | :--- |
| **[01. Conceptos Básicos y Acceso](01-conceptos-basicos-y-acceso.md)** | Panel General (`/admin/`) | ¿Qué es un CMS? Los 4 pilares tecnológicos. Requisitos previos y cómo iniciar sesión con GitHub OAuth. |
| **[02. Flujo Editorial, Guardar y Publicar](02-flujo-editorial-guardar-y-publicar.md)** | Ciclo de Publicación | Borrador, Revisión y Publicación. La regla de los 1-2 minutos de Netlify. Vista previa en tiempo real. |
| **[03. Noticias y Avisos (Novas)](03-noticias-y-avisos.md)** | `Artigos / Novas` | Redactar noticias, asignar categorías oficiales, subir fotos horizontales, maquetar texto y eliminar entradas. |
| **[04. Actividades Extraescolares](04-actividades-extraescolares.md)** | `Actividades Extraescolares` | Cartel de horarios, las 18 actividades, apertura/cierre de plazas, cuotas, la regla de oro del `id` y convivencia. |
| **[05. Servicio de Madrugadores](05-servicio-madrugadores.md)** | `Servizo de Madrugadores` | Horarios (7:30 a 8:45), tarifas fijas y de vales digitales de Jardanay, aviso del día 26 y tríptico oficial en PDF. |
| **[06. Pago de Comedor Escolar](06-pago-comedor.md)** | `Pago do Comedor` | La guía paso a paso de ATRIGA (11 pasos con capturas), justificantes por email y formas de pago alternativas. |
| **[07. Alta de Socios e Inscripción](07-alta-de-socios-e-inscripcion.md)** | `Alta de Socios / Inscrición` | Renovación anual, enlace a Google Forms y **protocolo de máxima seguridad para el número de cuenta (IBAN)**. |
| **[08. Memoria Anual de Actividades](08-memoria-anual.md)** | `Memoria de Actividades` | Balance y rendición de cuentas. Subida de la memoria en PDF y botones automáticos "Abrir PDF" y "Descargar". |
| **[09. Consejo Escolar (Consello Escolar)](09-consejo-escolar.md)** | `Consello Escolar` | Explicación institucional, editor de documento simple, enlace al blog externo de familias, imágenes y PDFs. |
| **[10. Portada Principal](10-portada.md)** | `Páxina de Inicio (Portada)` | Personalizar el bloque Hero, foto de comunidad, lema institucional, las 4 tarjetas de colores y panel de contacto. |
| **[11. Datos Generales de la Asociación](11-datos-generales-anpa.md)** | `Datos Xerais da ANPA` | Nombre legal, descripción para Google y correo central que actualiza todos los botones de la web a la vez. |
| **[12. Gestión de Imágenes y PDFs](12-gestion-de-multimedia-imagenes-y-pdfs.md)** | Biblioteca de Medios | Buenas prácticas para fotos (<500 KB, formato horizontal) y documentos PDF (<5 MB, nombres limpios sin tildes). |
| **[13. Buscador General del Sitio](13-buscador-general-del-sitio.md)** | Buscador de la Web | Cómo funciona la búsqueda automática en la web pública y cómo escribir para que las familias encuentren todo. |
| **[14. Resolución de Problemas y Relevo](14-resolucion-de-problemas-y-traspaso.md)** | Soporte y Traspaso | Preguntas frecuentes, corrección de erratas urgentes y protocolo de relevo para la nueva junta directiva en 4 pasos. |

---

## Las Tres Reglas de Oro de la Administración

Antes de empezar, recuerda siempre estos tres principios fundamentales:

1. **Guardar no es publicar:** Puedes pulsar el botón azul **Guardar** con absoluta tranquilidad. Los cambios se guardan como un borrador privado y **no se mostrarán en internet** hasta que tú decidas pulsar **Publicar**.
2. **Cuidado con los identificadores técnicos y el IBAN:**
   * En Extraescolares, nunca modifiques la casilla `Identificador (slug)` de las 18 actividades.
   * En Inscripción, revisa tres veces el número de cuenta bancaria (`bank_iban`) antes de publicar.
3. **Paciencia con el reloj (1-2 minutos):** Tras pulsar **Publicar ahora**, el sistema tarda habitualmente entre **1 y 2 minutos** en reconstruir la página y mostrar las novedades a las familias. No te asustes si refrescas de inmediato y todavía ves la versión anterior; limpia la caché con `Ctrl + F5`.

¡Comencemos con el **[Módulo 1: Conceptos Básicos y Acceso](01-conceptos-basicos-y-acceso.md)**!
