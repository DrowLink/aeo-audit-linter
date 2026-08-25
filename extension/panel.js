/**
 * @fileoverview Panel controller para la extensión Chrome DevTools de AEO Linter.
 */

document.getElementById('run-audit-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');

  statusEl.textContent = 'Extrayendo DOM y evaluando auditorías AEO...';

  chrome.devtools.inspectedWindow.eval(
    `(() => {
      return {
        url: window.location.href,
        html: document.documentElement.outerHTML
      };
    })()`,
    (pageData, isException) => {
      if (isException || !pageData) {
        statusEl.textContent = 'Error al inspeccionar la página.';
        return;
      }

      statusEl.textContent = `Auditoría completada para ${pageData.url}`;
      resultsEl.innerHTML = `
        <div style="background: #252526; padding: 16px; border-radius: 8px; border: 1px solid #333;">
          <h3 style="margin-top: 0; color: #4ec9b0;">Auditoría AEO en Ejecución</h3>
          <p>Longitud del documento HTML: <strong>${pageData.html.length} caracteres</strong></p>
          <p>Página analizada: <code>${pageData.url}</code></p>
        </div>
      `;
    }
  );
});
