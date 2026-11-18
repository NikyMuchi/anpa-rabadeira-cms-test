# Módulo 10: Portada Principal de la Web (Páxina de Inicio)

La portada es la primera impresión que recibe cualquier familia cuando entra en la web de la ANPA Rabadeira (`/`). Un diseño cálido, textos claros y accesos directos actualizados son esenciales para que encuentren rápidamente lo que buscan.

En este tutorial aprenderás a gestionar y personalizar los 5 bloques de la página principal a través de la colección **🏠 Páxina de Inicio (Portada)**.

---

## 1. ¿Qué es la Portada y qué controla?

Controla la página de inicio (`/`) a través del fichero estructurado `src/_data/home.json`.

La portada está pensada para ser el centro de distribución del colegio: no sobrecarga a las familias con textos interminables, sino que las guía de forma visual hacia los servicios y noticias esenciales mediante 5 bloques diferenciados:

```
+-----------------------------------------------------------------------+
| 1. BLOQUE PRINCIPAL (HERO)                                            |
|    Titular de bienvenida, mensaje introductorio, foto comunitaria     |
|    y dos botones de acción rápida.                                    |
+-----------------------------------------------------------------------+
| 2. MENSAJE DE LA COMUNIDAD (INTRO)                                    |
|    Cita destacada sobre el valor de la colaboración familia-escuela.  |
+-----------------------------------------------------------------------+
| 3. ACCESOS DIRECTOS (4 TARJETAS DE COLORES)                           |
|    Cuadrícula fija de 4 tarjetas: Extraescolares, Madrugadores,        |
|    Comedor y Consejo Escolar.                                         |
+-----------------------------------------------------------------------+
| 4. BLOQUE DE ÚLTIMAS NOTICIAS (NOVAS)                                 |
|    Muestra automáticamente los 3 artículos más recientes publicados.  |
+-----------------------------------------------------------------------+
| 5. PANEL DE CONTACTO Y AYUDA                                          |
|    Caja inferior con el nombre del centro y botón de envío de correo. |
+-----------------------------------------------------------------------+
```

---

## 2. Cómo acceder al editor de Portada en Decap CMS

1. Entra en `/admin/` con tu usuario de GitHub.
2. En la barra lateral izquierda, haz clic en **🏠 Páxina de Inicio (Portada)**.
3. Haz clic en la ficha **Contido da Portada**.

---

## 3. Guía detallada bloque por bloque

Al abrir el editor, verás los 5 bloques organizados con campos limpios y bien señalizados:

### Bloque 1: Bloque Principal (`hero`)
Es la cabecera que preside la web:
* **Título principal:** El encabezado grande H1 (ej: *Benvidas e benvidos á ANPA Ensino Rabadeira*).
* **Texto de benvida (Lead):** Párrafo cálido que presenta a la asociación:
  *Texto oficial:* `Somos a asociación de nais e pais do CEIP Rabadeira. Traballamos xuntos para apoiar as familias, colaborar co centro e dinamizar a comunidade escolar.`
* **Imaxe destacada de comunidade:** La fotografía horizontal que acompaña al mensaje de bienvenida (por defecto: `/img/hero-anpa-comunidade.webp`).
* **Texto alternativo da imaxe (Alt):** Descripción para accesibilidad (ej: *Comunidade educativa CEIP Rabadeira*).
* **Botón principal:**
  - `Texto botón principal`: *Ver extraescolares*.
  - `Ligazón botón principal`: Ruta interna `/extraescolares/`.
* **Botón secundario:**
  - `Texto botón secundario`: *Contacta coa ANPA*.
  - `Ligazón botón secundario`: Enlace de correo directo `mailto:anpaensinorabadeira@gmail.com`.

### Bloque 2: Mensaje de la Comunidad (`intro`)
* **Texto destacado:** Una frase breve y con fuerza institucional que define el espíritu de la asociación:
  *Texto oficial:* `Un espazo de encontro e colaboración entre as familias e a escola para construír xuntos a mellor contorna educativa.`

### Bloque 3: Accesos Directos (`shortcuts`)
* **Título da sección:** Encabezado H2 de la cuadrícula (*Información para as familias*).
* **Listado de tarxetas (4 tarjetas fijas):**
  La web utiliza 4 tarjetas enlazadas a los colores corporativos de nuestro sistema de diseño:
  1. **Tarjeta 1 (Verde azulado / Teal):** Extraescolares (`/extraescolares/`).
  2. **Tarjeta 2 (Amarillo cálido / Yellow):** Madrugadores (`/madrugadores/`).
  3. **Tarjeta 3 (Azul / Blue):** Pagamento do comedor (`/comedor/`).
  4. **Tarjeta 4 (Coral / Coral):** Consello Escolar (`/consello-escolar/`).
  En cada tarjeta puedes personalizar:
  - `Título`: El nombre del servicio.
  - `Descrición curta`: Breve frase explicativa (1 o 2 líneas máximo).
  - `URL de destino`: La ruta interna protegida.
  - `Texto da ligazón`: Texto del enlace inferior (ej: *Ver actividades →* o *Máis información →*).

### Bloque 4: Bloque de Noticias (`news_section`)
* **Título do bloque:** Encabezado (*Últimas novas*).
  *(Las 3 tarjetas de noticias se seleccionan y muestran automáticamente desde la colección de Artigos/Novas sin que tengas que escribirlas a mano)*.
* **Texto de ver máis y enlace:** Botón *Ver todas as novas* con destino `/novas/`.

### Bloque 5: Panel de Contacto (`contact_panel`)
* **Título do panel:** *Contacto e axuda*.
* **Texto de axuda:** Mensaje de invitación al diálogo (ej: *Tes algunha dúbida ou proposta? A directiva da ANPA está á disposición de todas as familias do centro.*).
* **Texto do botón:** *Enviar correo* (vinculado automáticamente al correo central de la ANPA).
* **Nome do centro educativo:** Ficha con el nombre oficial del colegio (*CEIP Rabadeira · Oleiros*).

> 📸 **[CAPTURA PENDIENTE DE INCORPORAR: CAP-26-PORTADA-EDITOR]**
> * **Pantalla:** Editor de `home.json` en Decap CMS mostrando los campos del bloque `Hero` y el bloque `Accesos Directos` con las tarjetas de colores en la vista previa derecha.

---

## 4. Tutorial Paso a Paso: Cómo actualizar el mensaje de bienvenida y foto de inicio de curso

**Ejemplo realista:** Comienza un nuevo curso escolar y la directiva desea actualizar el mensaje de bienvenida y poner una foto reciente de la comunidad escolar.

1. Abre **🏠 Páxina de Inicio (Portada)** -> **Contido da Portada**.
2. En el **Bloque Principal (Hero)**:
   * Revisa el **Título principal** o retoca el **Texto de benvida (Lead)** si la directiva desea dar la bienvenida al nuevo curso.
   * Si tienes una nueva fotografía horizontal del colegio en buena calidad, haz clic en **Elegir una imagen** junto a `Imaxe destacada de comunidade`.
   * Pulsa en **Subir imagen** (*Upload*), selecciona la fotografía desde tu ordenador (recuerda que esté optimizada a < 500 KB) y pulsa en **Insertar**.
   * En **Texto alternativo da imaxe (Alt)**, escribe una breve descripción (ej: *Familias e alumnado no CEIP Rabadeira*).
3. Comprueba en la vista previa derecha que el titular encaja armoniosamente con la nueva foto.
4. Pulsa en el botón azul superior **Guardar** (borrador seguro).
5. Pulsa en el botón verde **Publicar** -> **Publicar ahora**.

---

## 5. Qué se puede cambiar con total tranquilidad y qué no tocar
* ✅ **Se puede cambiar con tranquilidad:** Los textos de bienvenida, el lema institucional, las descripciones cortas de las 4 tarjetas, los rótulos de los botones y la fotografía de cabecera.
* 🚫 **NO BORRES ni añadas tarjetas a los Accesos Directos:** La cuadrícula está programada para exactamente **4 tarjetas** asociadas a los 4 colores del diseño (`teal`, `yellow`, `blue`, `coral`). Si borras una tarjeta o añades una quinta, la cuadrícula se descompensará visualmente en pantallas grandes y móviles.
* 🚫 **NO MODIFIQUES las direcciones de destino (`URL de destino`):** Las rutas `/extraescolares/`, `/madrugadores/`, `/comedor/` y `/consello-escolar/` deben permanecer exactamente así para no romper los enlaces de las familias.

---

## 6. Cómo comprobar el resultado en la web pública
1. Espera entre **1 y 2 minutos** tras haber publicado.
2. Abre la portada de la web:
   ```
   https://anpa-rabadeira-cms-test.netlify.app/
   ```
3. Comprueba que el titular de cabecera luce el nuevo texto.
4. Haz clic en los botones principales (*Ver extraescolares* y *Contacta coa ANPA*) para verificar que llevan a sus destinos correctos.
5. Comprueba que las 4 tarjetas de acceso rápido conducen a sus páginas correspondientes.

---

## 7. Errores habituales y soluciones
* **"He subido una foto vertical para el Hero y se ve gigante":**
  * *Solución:* El bloque principal de la portada requiere obligatoriamente una imagen con **orientación horizontal (paisaje)**. Si subes una foto vertical de móvil, ocupará demasiada pantalla en vertical. Utiliza una foto horizontal o recórtala antes de subirla.
* **"He cambiado el texto de una tarjeta de acceso directo y se ve raro":**
  * *Solución:* Mantén las descripciones breves (máximo dos frases cortas). Si escribes un párrafo muy largo, esa tarjeta será mucho más alta que las otras tres y romperá la simetría del diseño.
