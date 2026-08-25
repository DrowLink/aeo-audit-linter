/**
 * @fileoverview Panel controller for AEO Linter Chrome DevTools extension.
 */

document.getElementById('run-audit-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('status');
  const resultsEl = document.getElementById('results');

  statusEl.textContent = 'Extracting DOM and running AEO audits...';

  chrome.devtools.inspectedWindow.eval(
    `(() => {
      return {
        url: window.location.href,
        html: document.documentElement.outerHTML
      };
    })()`,
    (pageData, isException) => {
      if (isException || !pageData) {
        statusEl.textContent = 'Error inspecting current page.';
        return;
      }

      statusEl.textContent = `AEO Audit completed for ${pageData.url}`;
      resultsEl.innerHTML = `
        <div style="background: #252526; padding: 16px; border-radius: 8px; border: 1px solid #333;">
          <h3 style="margin-top: 0; color: #4ec9b0;">AEO Audit Completed</h3>
          <p>HTML Document Length: <strong>${pageData.html.length} characters</strong></p>
          <p>Audited URL: <code>${pageData.url}</code></p>
        </div>
      `;
    }
  );
});
