# Informe de Progreso de Tenis

Una página web para que los entrenadores de una academia de tenis armen el **informe trimestral** de cada alumno y se lo muestren a la familia.

**Abrir la app:** https://bolozurita.github.io/informe-tenis/

---

## ¿Qué hace?

La app tiene dos pestañas:

| Pestaña | Para quién | Qué se hace |
|---|---|---|
| **Informe para padres** | La familia | Ver el informe listo: resumen, fortalezas, gráfico del perfil, tests físicos, torneos, objetivos y plan del próximo trimestre. |
| **Ingreso del entrenador** | El entrenador | Completar el informe con números del 1 al 5 y textos cortos. Se guarda solo. |

Además puedes:

- Cambiar de **alumno** y de **trimestre** con los selectores de arriba.
- **Copiar un resumen para WhatsApp** con un botón.
- **Imprimir o guardar en PDF** el informe.
- **Agregar alumnos nuevos**.
- **Descargar y restaurar un respaldo** de todos los datos.
- Cambiar entre tema **claro, oscuro o automático** (botón ◐).

La primera vez trae tres alumnos **de ejemplo** para que veas cómo se ve. Se reemplazan apenas empiezas a cargar los tuyos, y puedes volver a ellos desde "Academia y respaldo".

---

## ¿Dónde se guardan los datos?

Hay dos modos:

1. **Solo en el navegador** (así viene). Los datos quedan en la computadora o el celular donde los escribiste. Si cambias de equipo o borras el historial, se pierden. Usa el respaldo.
2. **En la nube con Firebase** (opcional). Entras con tu cuenta de Google y los datos quedan guardados en internet. Los ves iguales desde cualquier equipo.

Cada cuenta de Google tiene sus propios datos. Nadie más puede leerlos.

---

## Cómo conectar Firebase (paso a paso)

Toma unos 10 minutos. Es gratis para una academia (plan Spark).

### 1. Crea el proyecto

1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. Haz clic en **Crear un proyecto** (o "Agregar proyecto"). Ponle un nombre, por ejemplo `informe-tenis`.
3. Google Analytics no hace falta. Puedes desactivarlo.

### 2. Registra la app web y copia la configuración

1. En la página del proyecto, haz clic en el ícono **`</>`** (Web).
2. Ponle un apodo, por ejemplo `informe-web`. **No** marques "Firebase Hosting".
3. Firebase te muestra un bloque de código con `const firebaseConfig = { ... }`. **Copia solo lo que está entre las llaves.**

### 3. Pega la configuración en el proyecto

Abre el archivo [`firebase-config.js`](firebase-config.js) y cambia la última línea:

```js
// Antes
export const firebaseConfig = null;

// Después (con TUS datos)
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "informe-tenis.firebaseapp.com",
  projectId: "informe-tenis",
  storageBucket: "informe-tenis.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Puedes editarlo directo en GitHub: abre el archivo, toca el lápiz ✏️, pega y haz clic en **Commit changes**.

> Estos datos **no son secretos**. Firebase está pensado para que vayan en la página. Lo que protege tus datos son las reglas del paso 5.

### 4. Activa el inicio de sesión con Google

1. En el menú de la izquierda: **Compilación > Authentication > Comenzar**.
2. Pestaña **Método de acceso** > **Google** > **Habilitar** > elige tu correo de soporte > **Guardar**.
3. Pestaña **Configuración > Dominios autorizados** > **Agregar dominio** y escribe:
   ```
   bolozurita.github.io
   ```

### 5. Crea la base de datos y pon las reglas

1. Menú de la izquierda: **Compilación > Firestore Database > Crear base de datos**.
2. Elige una ubicación cercana (por ejemplo `southamerica-east1` o `us-central1`) y **modo de producción**.
3. Ve a la pestaña **Reglas**, borra lo que hay, pega el contenido del archivo [`firestore.rules`](firestore.rules) y haz clic en **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /academias/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 6. Pruébalo

1. Abre https://bolozurita.github.io/informe-tenis/ (espera 1 minuto después del commit y recarga).
2. Arriba aparece **Entrar con Google**. Entra.
3. El punto de color te dice el estado:
   - 🟢 **Guardado en la nube**: todo bien.
   - 🟡 **Guardando…**: subiendo cambios.
   - 🔴 **Error**: lee el mensaje (ver la tabla de abajo).

La primera vez que entras, lo que tenías en ese navegador se sube a la nube.

---

## Problemas comunes

| Mensaje | Qué hacer |
|---|---|
| Dominio no autorizado en Firebase | Falta el paso 4.3: agrega `bolozurita.github.io` en Dominios autorizados. |
| Sin permiso: revisa las reglas de Firestore | Revisa que publicaste las reglas del paso 5.3. |
| No se pudo cargar Firebase | Revisa que `firebase-config.js` esté bien copiado (comas, comillas y llaves). |
| No aparece el botón "Entrar con Google" | `firebase-config.js` sigue en `null`, o GitHub aún no actualizó la página. Espera y recarga. |

---

## Archivos del proyecto

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La app completa: diseño, pantallas y lógica. |
| `firebase-config.js` | Tus datos de Firebase. **Es el único que tienes que editar.** |
| `firebase.js` | Conecta la app con Firebase: inicio de sesión y guardado en la nube. |
| `firestore.rules` | Reglas de seguridad para pegar en Firebase. |

## Bueno saber

- **Al hacer clic en "Salir"**, se borran los datos de ese navegador. Quedan seguros en la nube y vuelven al entrar otra vez. Útil en equipos compartidos.
- **Un entrenador = una cuenta.** Si dos entrenadores entran con cuentas distintas, cada uno ve solo sus alumnos.
- **Los padres no necesitan cuenta.** Mándales el resumen por WhatsApp o el PDF.
- Todo se guarda en un documento por cuenta (límite de Firestore: 1 MB, alcanza para cientos de informes).
- Sigue descargando un respaldo de vez en cuando.
