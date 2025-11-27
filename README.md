# Cherry — Frontend

Interfaz web para Cherry (assistant). Moderno, dark mode, partículas, voz, subida de imágenes, historial y comandos.

## Archivos
- `index.html`
- `style.css`
- `script.js`

## Configuración
1. Edita `script.js` y reemplaza `BACKEND_URL` por `https://cherryv1.onrender.com/api/ai`
2. Reemplaza `MASTER_KEY` por tu MASTER_KEY (ej: cherry_master_0972725)
3. Sube los archivos a este repo y haz deploy en Netlify / Vercel / Render (Static Site)

## Deploy rápido
- Netlify: conectar repo → build command: *None* → publish directory: `/`  
- Vercel: importar repo → framework static → deploy

## Notas
- El backend debe aceptar POST JSON `{ message, image? }` y devolver `{ reply }`.
- Para producción conviene mover historial a servidor o DB.
