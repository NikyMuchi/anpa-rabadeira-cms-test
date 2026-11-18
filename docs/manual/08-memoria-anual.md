# Módulo 8: Memoria Anual de Actividades (Memoria de Actividades)

La transparencia en la gestión de los recursos económicos y en las actividades organizadas es una seña de identidad de la ANPA Rabadeira.

En este tutorial aprenderás a gestionar la página `/memoria/` utilizando el **Editor de Documento Simple**, subir la memoria oficial de cada curso y generar automáticamente los botones de lectura directa y descarga en PDF para las familias.

---

## 1. ¿Qué es la página de Memoria y qué información contiene?

Controla la página pública `/memoria/`. Al término de cada curso académico, la directiva saliente presenta ante la Asamblea General de Familias la memoria anual, que recoge:
* El balance económico detallado (ingresos por cuotas de socios, gastos de actividades, subvenciones del Ayuntamiento de Oleiros y saldo final).
* El resumen de todas las actividades extraescolares, talleres, concursos y celebraciones llevadas a cabo.
* Las inversiones realizadas en material para el colegio (libros para la biblioteca, bancos para el patio, megafonía o material deportivo).
* Los agradecimientos a las familias colaboradoras, al equipo docente y al personal del centro.

En esta página web, cualquier madre, padre o tutor del colegio puede consultar la memoria del curso actual o de cursos anteriores con total comodidad.

---

## 2. Cómo acceder a Memoria en Decap CMS

1. Entra en `/admin/` e inicia sesión con tu usuario de GitHub.
2. En la barra lateral izquierda, localiza **📄 Páxinas de Información**.
3. Haz clic en **📊 Memoria de Actividades**.

---

## 3. ¿Qué casillas y campos verás en pantalla?

El editor de Memoria es un **Editor de Documento Simple**:

| Campo en pantalla (Gallego) | Nombre en Español | Tipo | ¿Obligatorio? | ¿Para qué sirve? |
| :--- | :--- | :---: | :---: | :--- |
| **Título da páxina** | Título principal | Texto | **Sí** | Encabezado H1 (*Memoria Anual*). |
| **Imaxe destacada (opcional)** | Imagen de cabecera | Imagen | No | Fotografía superior si se desea. |
| **Texto alternativo da imaxe (Alt)** | Descripción accesible | Texto | No | Descripción de accesibilidad. |
| **Contido da páxina** | Texto explicativo | Markdown | **Sí** | Párrafo de presentación y correo de contacto para dudas sobre las cuentas de la asociación. |
| **Documentos / PDF (opcional)** | Lista de Memorias | Lista | **Sí** | Bloque donde se sube el archivo PDF oficial de cada curso escolar. |

> 📸 **[CAPTURA PENDIENTE DE INCORPORAR: CAP-25-MEMORIA-EDITOR]**
> * **Pantalla:** Editor de `memoria.md` en Decap CMS.
> * **Elementos visibles:** Título, cuadro `Contido da páxina` con el texto de presentación, y el bloque `Documentos / PDF (opcional)` mostrando la tarjeta de la memoria del curso con su título y archivo PDF.

---

## 4. El sistema automático de tarjetas de descarga

Cuando añades un documento a la lista **Documentos / PDF (opcional)**, el sistema de la web no se limita a poner un simple enlace azul de texto. La web construye automáticamente una tarjeta interactiva protegida con dos botones:

```
+------------------------------------------------------------------------+
| [📄 PDF]  Memoria de Actividades (Curso 2026-2027)                     |
|           Resumo de actividades, balance e xestión da ANPA             |
|                                                                        |
|                 [ 👁️ Abrir PDF ]     [ ⬇️ Descargar ]                   |
+------------------------------------------------------------------------+
```

* **Botón "Abrir PDF":** Abre el documento directamente en una pestaña nueva del navegador para que la persona pueda leerlo al instante en su teléfono o tablet sin ocupar memoria en su dispositivo.
* **Botón "Descargar":** Guarda una copia física del archivo PDF en la carpeta de descargas del usuario.

---

## 5. Tutorial Paso a Paso: Cómo publicar la memoria de un nuevo curso

**Ejemplo realista:** Se ha celebrado la Asamblea General de junio y la directiva tiene el PDF maquetado con la memoria del curso 2026-2027.

1. Abre **📊 Memoria de Actividades**.
2. En la casilla **Contido da páxina**, comprueba que el texto de presentación y el correo de contacto (`anpaensinorabadeira@gmail.com`) son correctos.
3. Desplázate hasta la lista **Documentos / PDF (opcional)**:
   * **Opción A (Sustituir la memoria actual):** Haz clic sobre la tarjeta existente para abrirla.
   * **Opción B (Mantener un archivo histórico de varios cursos):** Pulsa en el botón **Añadir Documentos / PDF (opcional)** para crear una segunda tarjeta.
4. Rellena los tres campos de la tarjeta:
   * **Título do documento:** Escribe el nombre completo (ej: *Memoria de Actividades (Curso 2026-2027)*).
   * **Ficheiro PDF:** Haz clic en **Elegir un archivo** -> **Subir archivo** (*Upload*), busca el documento PDF en tu ordenador y pulsa en **Insertar**.
   * **Descrición breve:** Escribe un breve resumen (ej: *Resumo de actividades, balance económico e xestión da ANPA*).
5. Comprueba en la vista previa derecha que la tarjeta se renderiza con sus botones de lectura y descarga.
6. Pulsa en el botón azul superior **Guardar** (borrador seguro).
7. Pulsa en el botón verde **Publicar** -> **Publicar ahora**.

---

## 6. Qué se puede cambiar con total tranquilidad y qué no tocar
* ✅ **Se puede cambiar con tranquilidad:** El texto del mensaje de presentación, el correo de contacto para dudas, el título de la memoria y subir nuevos PDFs o sustituir los existentes.
* 🚫 **NO subas documentos sin formato PDF:** No subas archivos de Word (`.docx`), Excel (`.xlsx`) ni presentaciones de PowerPoint (`.pptx`). Muchas familias navegan desde teléfonos móviles que no tienen instalado Office; el formato PDF es el único estándar universal que se abre en cualquier pantalla sin descolocar el diseño.
* 🚫 **Cuidado con el tamaño:** Si la memoria incluye muchas fotos de fiestas escolares, optimiza el PDF para web (< 5 MB) antes de subirlo.

---

## 7. Cómo comprobar el resultado en la web pública
1. Espera entre **1 y 2 minutos** tras haber publicado.
2. Abre tu navegador y entra en:
   ```
   https://anpa-rabadeira-cms-test.netlify.app/memoria/
   ```
3. Comprueba que la tarjeta muestra el curso correcto.
4. Haz clic en **Abrir PDF** y asegúrate de que el documento se abre en una pestaña nueva con todas sus páginas legibles.
5. Haz clic en **Descargar** para comprobar que el archivo se descarga con un nombre reconocible.

---

## 8. Errores habituales y soluciones
* **"He subido la memoria pero al pulsar en Abrir PDF me sale un error de archivo no encontrado":**
  * *Causa:* Subiste un archivo con espacios o tildes en el nombre original (ej: `Memoria curso 2026-2027 final año!.pdf`).
  * *Solución:* Renombra el archivo en tu equipo con guiones normales (ej: `memoria-2026-2027.pdf`), vuelve a pulsar en **Elegir un archivo** y publícalo de nuevo.
* **"Quiero poner las memorias de los últimos tres años para que no se pierdan":**
  * *Solución:* En el bloque **Documentos / PDF (opcional)** puedes pulsar tantas veces como quieras en **Añadir Documentos / PDF (opcional)**. Cada documento que añadas creará una tarjeta independiente en la página, permitiendo a las familias consultar el histórico de la ANPA.
