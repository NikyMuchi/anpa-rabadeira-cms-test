# Módulo 14: Resolución de Problemas y Protocolo de Relevo

En este módulo final encontrarás respuestas claras a las dudas técnicas más comunes y la guía paso a paso para traspasar la gestión de la web cuando entre una nueva junta directiva en la ANPA.

---

## PARTE 1: PREGUNTAS FRECUENTES Y SOLUCIÓN DE PROBLEMAS

### 1. "He pulsado en Publicar ahora pero en la web sigue saliendo lo antiguo"
* **¿Qué ocurre?** Recuerda la *Regla de la Paciencia*: la web se construye en los servidores de Netlify y tarda entre **1 y 2 minutos** en propagar la nueva versión.
* **Solución:**
  1. Espera 90 segundos de reloj.
  2. Abre la web y pulsa en tu teclado:
     - En Windows / Linux: `Ctrl + F5` (o mantén pulsada la tecla `Ctrl` mientras haces clic en el botón de recargar del navegador).
     - En Mac: `Cmd + Shift + R`.
     *(Esto limpia la memoria caché local de tu navegador y descarga la última versión real).*

---

### 2. "Me aparece un mensaje de error rojo de autorización al intentar iniciar sesión"
* **¿Qué ocurre?** Has iniciado sesión con una cuenta de GitHub que **no ha sido añadida como colaboradora con permiso de escritura** en el repositorio del proyecto.
* **Solución:**
  1. Comprueba qué usuario de GitHub tienes abierto en ese momento.
  2. Pide a la persona de la directiva que administre el repositorio en GitHub que entre en:
     `github.com/NikyMuchi/anpa-rabadeira-cms-test/settings/access`
  3. Debe pulsar en **Add people** (Añadir personas), escribir tu nombre de usuario de GitHub y enviarte la invitación como colaborador con permisos de **Write** (Escritura).
  4. Recibirás un correo de GitHub: pulsa en el botón verde **Accept invitation**.
  5. Vuelve a entrar en `/admin/` y ahora accederás a la primera.

---

### 3. "¡Emergencia! He publicado un dato erróneo (un precio o un número de cuenta)"
* **¿Qué hacer?** No te bloquees; el sistema permite corregirlo en menos de tres minutos:
  1. Entra de inmediato en `/admin/`.
  2. Ve a la sección correspondiente (ej: `Inscrición` o `Extraescolares`).
  3. Corrige el número o dato equivocado por el correcto.
  4. Pulsa en **Guardar**.
  5. Pulsa en **Publicar** -> **Publicar ahora**.
  6. En 90 segundos, la corrección estará activa en internet.

---

### 4. "Mi texto en una noticia se ve todo pegado en un solo bloque sin párrafos"
* **¿Qué ocurre?** En el editor de texto Markdown, para separar dos párrafos es necesario pulsar la tecla **Enter dos veces** (dejando una línea en blanco en medio). Si solo pulsas Enter una vez, el sistema considera que es la misma frase continuada.

---

### 5. "Hago clic en 'Login with GitHub' y no pasa nada"
* **¿Qué ocurre?** Tu navegador tiene activado el bloqueador de ventanas emergentes (*popups*).
* **Solución:** Mira en el extremo derecho de la barra de direcciones de tu navegador: verás un pequeño icono con una cruz roja que dice *"Ventana emergente bloqueada"*. Haz clic sobre él, selecciona *"Permitir siempre ventanas emergentes de este sitio"* y vuelve a pulsar en el botón de inicio de sesión.

---

## PARTE 2: PROTOCOLO DE RELEVO PARA LA NUEVA DIRECTIVA

Uno de los mayores retos de las ANPAs es garantizar la continuidad cuando los hijos e hijas de los miembros de la directiva pasan al instituto y entra un nuevo equipo de madres y padres.

Sigue este sencillo protocolo de cuatro pasos para un traspaso impecable y sin pérdidas de información:

### Paso 1: Creación de usuarios de GitHub
Pide a las nuevas personas que se vayan a encargar de la web que se creen una cuenta gratuita en [github.com](https://github.com/). Solo necesitan su correo electrónico.

### Paso 2: Invitar a las nuevas personas administradoras
La persona saliente que administra el repositorio debe:
1. Entrar en [github.com/NikyMuchi/anpa-rabadeira-cms-test](https://github.com/NikyMuchi/anpa-rabadeira-cms-test) con su usuario.
2. Ir a **Settings** -> **Collaborators**.
3. Hacer clic en **Add people** e invitar a los nuevos miembros con rol de **Write** o **Admin**.
4. Una vez que las nuevas personas hayan aceptado la invitación y comprobado que pueden entrar en `/admin/`, la persona saliente puede retirar su propio usuario de la lista de colaboradores.

### Paso 3: Traspaso de la cuenta de correo de la ANPA
1. Entregar la contraseña del correo oficial (`anpaensinorabadeira@gmail.com`).
2. Actualizar en la configuración de seguridad de Google el **número de teléfono móvil de recuperación** y el **correo alternativo**, cambiándolo por el de un miembro de la nueva directiva para que no se bloquee la verificación en dos pasos (2FA).

### Paso 4: Sesión práctica de 20 minutos con este manual
Realizad una pequeña sesión conjunta de 20 minutos (presencial o por videollamada) repasando este manual:
* Mostradles cómo entrar en `/admin/`.
* Cread una noticia de prueba juntos y borradla.
* Explicadles la importancia de no tocar los identificadores de Extraescolares y la verificación del IBAN.
* Entregadles el enlace a este manual:
  ```
  https://anpa-rabadeira-cms-test.netlify.app/admin/manual/
  ```

¡Y la web de la ANPA seguirá funcionando a pleno rendimiento para los próximos cursos escolares! 💙
