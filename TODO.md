# 📌 Pending Tasks - AEO Linter (TODO)

---

## 🚀 1. Publicación en NPM
- [x] **Paquetes publicados en NPM (v0.3.0)**:
  - CLI: [`aeo-linter`](https://www.npmjs.com/package/aeo-linter) (v0.3.0)
  - Core: [`@drowlink/aeo-linter-core`](https://www.npmjs.com/package/@drowlink/aeo-linter-core) (v0.3.0)
- [x] **Configurado GitHub Actions (`publish.yml`)** para futuros releases automáticos.

---

## 🧩 2. Subir la Extensión a la Chrome Web Store
- [x] **Diseñar iconos modernos y divertidos**:
  - Generados iconos oficiales de alta resolución: `16x16`, `48x48` y `128x128` en `extension/icons/`.
  - Configurados en [`manifest.json`](file:///c:/Users/paulo/OneDrive/Documents/repos/aeo-audit-linter/extension/manifest.json) (v0.3.1 con SAGE Luxury UI).
- [x] **Empaquetar la extensión (v0.3.1)**:
  - Archivo comprimido actualizado en la raíz: `aeo-linter-extension.zip` (`npm run zip:extension`).
- [x] **Crear Política de Privacidad**:
  - Creado [`PRIVACY.md`](file:///c:/Users/paulo/OneDrive/Documents/repos/aeo-audit-linter/PRIVACY.md) en la raíz del repositorio.
  - URL pública para la tienda: `https://github.com/DrowLink/aeo-audit-linter/blob/main/PRIVACY.md`
- [x] **Envío inicial a Chrome Web Store**:
  - Extensión enviada y actualmente en estado **In Review** en el [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
- [ ] **Actualizar versión en Chrome Web Store a v0.3.1**:
  - Una vez aprobada la versión inicial (o desde el dashboard), subir el nuevo `aeo-linter-extension.zip` (v0.3.1 con diseño SAGE luxury).

---

## 📢 3. Crear Post en LinkedIn sobre AEO Linter
- [ ] **Redactar y publicar post**:
  - **Idea central**: *"¿Tu web está lista para que la Inteligencia Artificial (ChatGPT, Perplexity, Claude, Gemini) la cite y recomiende como fuente?"*
  - **Enfoque**: Explicar qué es **AEO (Answer Engine Optimization)** y cómo usar `npx aeo-linter https://tusitio.com` para auditar cualquier web en 5 segundos sin instalar nada.
  - **Borrador de copy**:
    > ¿Sabías que los motores de búsqueda de IA como SearchGPT, Perplexity y Google AI Overviews no leen tu web igual que Google tradicional?
    >
    > Acabo de publicar en open source **AEO Linter**: una herramienta basada en la arquitectura de Google Lighthouse que audita tu web y te dice si la IA puede rastrear, entender y recomendar tu contenido.
    >
    > Puedes auditar tu web ahora mismo desde tu terminal con un solo comando:
    > `npx aeo-linter https://tudominio.com --html`
    >
    > 📦 NPM: https://www.npmjs.com/package/aeo-linter
    > ⭐️ GitHub: https://github.com/DrowLink/aeo-audit-linter
    >
    > #AEO #GEO #SEO #AI #OpenSource #Lighthouse #WebDev

---

## ⚡ Comandos Rápidos de Referencia:

```bash
# 1. Compilar todo el proyecto localmente
npm run build

# 2. Correr las pruebas unitarias
npm test

# 3. Publicar directamente desde la terminal (si no usas GitHub Actions)
npm run publish:core
npm run publish:cli

# 4. Empaquetar la extensión de Chrome para Web Store
npm run zip:extension
```

