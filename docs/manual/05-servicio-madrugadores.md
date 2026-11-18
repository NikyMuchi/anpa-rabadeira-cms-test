# Módulo 5: Servicio de Madrugadores (Servizo de Madrugadores)

El servicio de madrugadores permite la conciliación familiar y laboral de las familias del CEIP Rabadeira desde primera hora de la mañana.

En este tutorial aprenderás a gestionar y actualizar la página `/madrugadores/` en la web de la ANPA utilizando el **Editor de Documento Simple**.

---

## 1. ¿Qué es la página de Madrugadores y qué información contiene?

Controla la página de información del servicio de madrugadores (`/madrugadores/`). En ella se explica a las familias toda la operativa práctica del servicio para el curso activo:

1. **Horario del servicio:** Disponible de **7:30 a 8:45 h** de la mañana en las instalaciones del colegio.
2. **Empresa concesionaria:** Gestionado actualmente por la empresa de restauración y colectividades **Jardanay** ([www.jardanay.es](https://www.jardanay.es/)).
3. **Cuadro de tarifas del curso:** Precios oficiales diferenciados para:
   - Usuarios mensuales fijos con desayuno.
   - Usuarios mensuales fijos sin desayuno.
   - Días sueltos esporádicos con desayuno.
   - Días sueltos esporádicos sin desayuno.
4. **Instrucciones para usuarios fijos:** Creación de cuenta en la plataforma de Jardanay y **regla estricta del día 26** para gestionar bajas o modificaciones del mes siguiente.
5. **Instrucciones para usuarios esporádicos:** Compra anticipada del bono/vale digital en la web de vales de Jardanay.
6. **Descarga del tríptico informativo oficial en PDF:** Documento con toda la normativa detallada y ficha de inscripción de la empresa.
7. **Canales de atención directa:** Teléfono de las oficinas de Jardanay, correo de la empresa y correo de la ANPA para resolución de dudas.

---

## 2. Cómo acceder a Madrugadores en Decap CMS

1. Entra en el panel de control: `https://anpa-rabadeira-cms-test.netlify.app/admin/`.
2. Inicia sesión con tu cuenta de GitHub.
3. En la barra lateral izquierda, localiza **📄 Páxinas de Información**.
4. Haz clic en **🌅 Servizo de Madrugadores**.

---

## 3. ¿Qué casillas y campos verás en pantalla?

El editor de Madrugadores es un **Editor de Documento Simple**:

| Campo en pantalla (Gallego) | Nombre en Español | Tipo | ¿Obligatorio? | ¿Para qué sirve? |
| :--- | :--- | :---: | :---: | :--- |
| **Título da páxina** | Título principal | Texto | **Sí** | Encabezado H1 de la página (*Servizo Madrugadores*). |
| **Imaxe destacada (opcional)** | Imagen de cabecera | Imagen | No | Fotografía superior representativa del servicio. |
| **Texto alternativo da imaxe (Alt)** | Descripción accesible | Texto | No | Breve texto descriptivo para lectores de pantalla. |
| **Contido da páxina** | Cuerpo principal | Markdown | **Sí** | Todo el texto explicativo: horarios, tarifas, normas de Jardanay y teléfonos de contacto. |
| **Documentos / PDF (opcional)** | Tríptico descargable | Lista | No | Folleto oficial de Jardanay en PDF con botones de lectura y descarga. |

> 📸 **[CAPTURA PENDIENTE DE INCORPORAR: CAP-23-MADRUGADORES-FORM]**
> * **Pantalla:** Editor de `madrugadores.md` en Decap CMS.
> * **Elementos visibles:** Campos `Título da páxina`, `Contido da páxina` con los bloques de texto enriquecido, y el bloque `Documentos / PDF (opcional)` desplegado con el tríptico del curso.

---

## 4. Tutorial Paso a Paso: Actualización de tarifas y nuevo curso escolar

Sigue estos pasos a principio de curso cuando Jardanay comunique las nuevas tarifas o el nuevo folleto:

1. Abre **🌅 Servizo de Madrugadores**.
2. En la casilla **Contido da páxina**, desplázate hasta el encabezado `## Tarifas do servizo (Curso 2026-2027)`:
   * Si ha cambiado el curso escolar, actualiza el año en el encabezado (ej: `## Tarifas do servizo (Curso 2027-2028)`).
   * Modifica las cantidades mensuales y de días sueltos en las líneas correspondientes:
     ```markdown
     **Contratación mensual fixa:**
     - Con almorzo: **49,94 € / mes**
     - Sen almorzo: **37,45 € / mes**

     **Días soltos (esporádicos):**
     - Con almorzo: **4,79 € / día**
     - Sen almorzo: **3,75 € / día**
     ```
3. Baja hasta el bloque **Documentos / PDF (opcional)**:
   * Haz clic sobre la tarjeta del tríptico actual para abrirla.
   * En **Título do documento**, actualiza el año: *Tríptico Informativo Madrugadores 2027-2028*.
   * En **Ficheiro PDF**, pulsa en **Elegir un archivo** -> **Subir archivo** y selecciona el nuevo PDF enviado por Jardanay.
   * En **Descrición breve**, escribe un resumen rápido (ej: *Guía oficial de Jardanay: prazos, operativa e tarifas*).
4. Comprueba en la **Vista Previa** de la derecha que los precios se leen con claridad y que la tarjeta de descarga del PDF luce correctamente.
5. Pulsa en el botón azul superior **Guardar** (borrador seguro).
6. Pulsa en el botón verde **Publicar** -> **Publicar ahora**.

---

## 5. Qué se puede cambiar con total tranquilidad y qué no tocar
* ✅ **Se puede cambiar con tranquilidad:** Las cifras de las tarifas, el curso escolar, los enlaces web a la plataforma de vales o de comedores de Jardanay, los teléfonos de atención y el folleto en PDF.
* 🚫 **NO BORRES la advertencia del día 26:** Es fundamental que las familias recuerden siempre que las bajas o modificaciones mensuales deben tramitarse antes del día 26 del mes en curso para no cobrarles el mes siguiente.
* 🚫 **NO BORRES los datos de contacto:** El teléfono y correo de Jardanay evitan que las familias colapsen el correo de la ANPA por dudas de menús o dietas especiales.

---

## 6. Cómo comprobar el resultado en la web pública
1. Espera entre **1 y 2 minutos** tras pulsar "Publicar ahora".
2. Visita en tu navegador:
   ```
   https://anpa-rabadeira-cms-test.netlify.app/madrugadores/
   ```
3. Verifica que las nuevas tarifas coinciden con el documento de Jardanay.
4. Haz clic en el botón **Abrir PDF** de la tarjeta de documentación y comprueba que se abre el nuevo folleto sin errores.

---

## 7. Errores habituales y soluciones
* **"He cambiado el precio en el texto pero no se ve en negrita":**
  * *Solución:* Asegúrate de rodear el precio con dos asteriscos antes y dos después sin espacios: `**49,94 € / mes**`.
* **"Al pulsar en la web de vales no me lleva a Jardanay":**
  * *Solución:* Comprueba que la dirección web en el enlace incluye las tres uves dobles completas: `[www.vales.jardanay.es](https://www.vales.jardanay.es)`.
