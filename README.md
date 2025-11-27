# 🍒 CHERRY AI - Plataforma Profesional

**Cherry AI** es un asistente inteligente con una interfaz moderna, optimizada y lista para producción.

## 🚀 Despliegue en GitHub Pages

Este proyecto está configurado para ser desplegado fácilmente como un sitio estático en GitHub Pages.

**Pasos para el Propietario (Una vez que el PR sea mergeado a `main`):**
1.  Ve a **Settings** en tu repositorio de GitHub.
2.  Navega a la sección **Pages**.
3.  En la sección **Source**, selecciona:
    *   **Branch:** `main`
    *   **Folder:** `/ (root)`
4.  Haz clic en **Save**.
5.  Espera unos minutos. La URL de publicación final será: `https://cherryv1.github.io/cherry-frontend/`
6.  Una vez publicado, activa **Enforce HTTPS** para asegurar la conexión.

## ⚙️ Configuración de Backend (CRÍTICO)

**ADVERTENCIA:** Las claves maestras (MASTER_KEY) **NO** deben ser almacenadas en el repositorio.

La aplicación está configurada para buscar la URL del backend y la clave maestra en el objeto global `window.CHERRY_CONFIG`.

**Configuración en Producción (Recomendado):**
Idealmente, el backend debería ser configurado para no requerir una clave maestra para el frontend estático, o usar un proxy seguro.

**Configuración Temporal para Pruebas (Consola del Navegador):**
Para probar la conexión con tu backend (`https://cherryv1.onrender.com/api/ai`) y tu clave maestra, puedes definir la configuración en la consola del navegador antes de usar la aplicación:

```javascript
window.CHERRY_CONFIG = {
  BACKEND_URL: "https://tu-backend.com/api/ai", // Reemplaza con tu URL real
  MASTER_KEY: "tu_clave_maestra_aqui" // Reemplaza con tu clave real
};
```

## 💻 Estructura del Proyecto

| Archivo | Descripción |
| :--- | :--- |
| `index.html` | Estructura principal de la aplicación. |
| `style.css` | Estilos profesionales, modo oscuro/claro, animaciones. |
| `script.js` | Lógica de la aplicación, manejo de chat, comandos, voz y conexión al backend. **(Clave maestra eliminada)** |
| `favicon.ico` | Icono de la página. |

## ✨ Funcionalidades Destacadas

- **Interfaz Profesional:** Diseño moderno con modo oscuro, partículas animadas y burbujas estilo iMessage.
- **Seguridad:** Eliminación de secretos del repositorio y configuración de runtime.
- **Comandos Rápidos:** Soporte para `/buscar`, `/resumir`, `/email`, `/tarea`, `/codigo`, etc.
- **Voz:** Entrada (micrófono) y Salida (TTS) de voz.
- **Personalidades:** Múltiples modos de Cherry (Normal, Programadora, Coqueta, etc.).
- **Responsive:** Optimizado para móviles y tabletas.
