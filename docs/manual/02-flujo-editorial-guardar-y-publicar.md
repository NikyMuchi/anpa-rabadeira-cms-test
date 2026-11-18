# Módulo 2: Flujo Editorial, Guardar y Publicar

Uno de los mayores temores de cualquier persona que empieza a gestionar una página web es: *"¿Y si toco algo sin querer y rompo la web delante de todo el mundo?"*.

En la web de la ANPA Rabadeira eso no puede ocurrir gracias al **Flujo Editorial** (*Editorial Workflow*). En este módulo aprenderás con total tranquilidad cómo se guarda un trabajo a medias, cómo se revisa y cómo se hace visible para las familias.

---

## 1. Los tres estados de un contenido

Cuando estás editando una noticia o una página, tu trabajo pasa por tres fases bien diferenciadas:

```
[ 1. BORRADOR ]  ------->  [ 2. EN REVISIÓN ]  ------->  [ 3. LISTO ]  =======>  [ PUBLICAR ]
(Solo tú lo ves)           (Para repasar)               (Visto bueno)             (¡En internet!)
```

1. **Borrador (Draft):** Es tu zona de trabajo privada. Puedes escribir, borrar párrafos, cambiar fotos y pulsar **Guardar**. Las familias **no pueden ver nada de esto** en la web pública.
2. **En revisión (In review):** Es una etiqueta organizativa para avisar a tus compañeras o compañeros de la directiva de que has terminado de redactar el texto y está listo para una segunda lectura.
   > ℹ️ **Aclaración importante:** El sistema técnico **no bloquea ni exige obligatoriamente** la firma de una segunda persona para publicar. Puedes publicar directamente si tú misma tienes la responsabilidad de ese contenido; mover la tarjeta a "En revisión" es simplemente una ayuda visual interna para que el equipo de la ANPA se organice mejor.
3. **Listo (Ready to publish):** Significa que el texto ya está revisado y no tiene erratas. Desde este estado (o directamente desde el editor), se pulsa el botón definitivo de publicación.

---

## 2. Los botones que verás en la parte superior del editor

Cuando abres cualquier noticia o página para editar, en la barra superior verás siempre estos botones:

> 📸 **[CAPTURA PENDIENTE DE INCORPORAR: CAP-03-BOTONES-SUPERIORES]**
> *(En la Fase 2 se incorporará aquí la captura real de la cabecera)*
> * **Pantalla:** Cabecera superior del editor de Decap CMS dentro de una noticia en edición.
> * **Elementos visibles:** Botón azul **Guardar** (*Save*), selector desplegable de **Estado** (*Status* con opciones Borrador, En revisión, Listo), botón verde desplegable **Publicar** (*Publish* -> *Publicar ahora*), y el botón de alternar vista previa.

* **Botón azul: Guardar:** Guarda todo lo que hayas escrito hasta ese momento. Siempre que pulses este botón, tu trabajo queda a salvo en GitHub en una rama de borrador privada.
* **Selector de Estado:** Te permite cambiar manualmente la etiqueta entre *Borrador*, *En revisión* y *Listo*.
* **Botón verde: Publicar:** Al hacer clic, se despliega la opción **Publicar ahora**. Este es el único botón que traslada tu contenido a la web pública.
* **Botón de vista previa:** Te permite alternar entre ver la pantalla partida (formulario a la izquierda y diseño a la derecha) o ver el formulario a pantalla completa.

---

## 3. La Vista Previa en tiempo real (Live Preview)

A la derecha de tu formulario de edición verás una réplica exacta de cómo se verá la página en el sitio web de la ANPA.

* **Es interactiva e inmediata:** Cada letra que escribes en el título o en el cuerpo del texto aparece instantáneamente en el panel derecho.
* **Mismo diseño y colores:** La vista previa utiliza los colores corporativos oficiales (tonos crema y azul petróleo) y la misma tipografía que verán las familias.
* **No guarda nada:** Mirar la vista previa no altera la web; es solo un espejo para comprobar que no te has dejado nada a medias.

> 📸 **[CAPTURA PENDIENTE DE INCORPORAR: CAP-04-VISTA-PREVIA]**
> *(En la Fase 2 se incorporará aquí la captura real a pantalla dividida)*
> * **Pantalla:** Editor de pantalla dividida al redactar una noticia.
> * **Elementos visibles:** A la izquierda, el formulario con los campos `Título`, `Categoría` y `Contido`; a la derecha, la vista previa renderizada con el titular grande, la fecha en gallego, la insignia de categoría y el texto maquetado.

---

## 4. El Tablero de Flujo Editorial (Workflow)

Si en la barra superior del panel haces clic en la pestaña **Flujo editorial**, verás un tablero tipo corcho con tres columnas:

> 📸 **[CAPTURA PENDIENTE DE INCORPORAR: CAP-05-TABLERO-WORKFLOW]**
> *(En la Fase 2 se incorporará aquí la captura real del tablero de flujo editorial)*
> * **Pantalla:** Vista de la pestaña "Flujo editorial" (*Workflow*).
> * **Elementos visibles:** Tres columnas tituladas **Borradores** (*Drafts*), **En revisión** (*In review*) y **Listos** (*Ready*), con tarjetas que representan noticias o páginas en preparación mostrando su título, autor y última fecha de modificación.

Desde este tablero puedes:
* **Hacer clic en cualquier tarjeta** para abrirla y seguir editando donde lo dejaste.
* **Arrastrar tarjetas** de una columna a otra con el ratón para ordenar el trabajo del equipo.
* **Publicar directamente:** Las tarjetas que están en la columna *Listos* tienen un botón rápido para publicar de golpe.

---

## 5. ¿Qué ocurre exactamente tras pulsar "Publicar ahora"?

Cuando pulsas el botón verde **Publicar** y confirmas haciendo clic en **Publicar ahora**, el sistema pone en marcha un engranaje automático en tres fases:

1. **Segundo 0 a 5:** Decap CMS toma tu borrador y lo fusiona en la rama principal (`main`) de GitHub.
2. **Segundo 5 a 60:** El servidor de Netlify detecta automáticamente la novedad y ejecuta a nuestro constructor (Eleventy), que recompone todas las páginas afectadas y actualiza el índice del buscador general.
3. **Segundo 60 a 90:** Netlify distribuye la nueva versión por internet.

> ⏱️ **REGLA DE LA PACIENCIA (1 a 2 minutos):**
> Tu cambio tardará aproximadamente entre **1 y 2 minutos** en verse en la web real (`https://anpa-rabadeira-cms-test.netlify.app/`).
> **No te preocupes** si abres la web inmediatamente a los 10 segundos y todavía ves lo antiguo. Es completamente normal. Espera un minuto y medio, actualiza la página pulsando `F5` o `Ctrl + F5` (para limpiar la memoria caché de tu navegador) y verás tu cambio reflejado con total nitidez.

---

## 6. Aclaración sobre fechas futuras en noticias

Al crear una noticia verás una casilla de fecha (`Data de publicación`).
* **Ten en cuenta:** Poner una fecha de mañana o de la semana que viene **NO significa que la noticia se publique sola de forma automática ese día**.
* En nuestro sistema actual, una noticia se publica en el momento exacto en que una persona de la directiva pulsa **Publicar ahora**.
* La fecha que elijas en el calendario es simplemente la fecha informativa que las familias verán escrita en el encabezado del artículo (por ejemplo: `📅 25 de outubro de 2026`).

---

## 7. Cómo corregir un error después de haber publicado

Si acabas de publicar una noticia o cambiar un horario y descubres una errata (por ejemplo, una letra cambiada o un número equivocado), que no cunda el pánico. Es facilísimo de solucionar:

1. Vuelve a entrar en el panel de administración (`/admin/`).
2. Haz clic en la sección correspondiente en el menú izquierdo.
3. Abre el elemento que tiene la errata.
4. Corrige el texto en la casilla correspondiente.
5. Pulsa en **Guardar**.
6. Pulsa en **Publicar** -> **Publicar ahora**.
7. En aproximadamente dos minutos, la web estará corregida y nadie se habrá dado cuenta.
