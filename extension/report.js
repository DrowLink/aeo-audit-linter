/**
 * @fileoverview Standalone Report Viewer controller for AEO Linter Chrome Extension.
 */

let currentReport = null;

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('report-view-container');
  const btnSaveJson = document.getElementById('btn-save-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const importFileInput = document.getElementById('import-file-input');
  const btnPrint = document.getElementById('btn-print');

  // Load from chrome.storage
  try {
    const storageData = await chrome.storage.local.get('latestAeoReport');
    if (storageData?.latestAeoReport) {
      currentReport = storageData.latestAeoReport;
      renderReport(currentReport);
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <h2>No report loaded</h2>
          <p style="color: var(--text-muted); margin: 12px 0 20px;">Click the AEO Linter icon in Chrome to generate a report, or import a saved JSON file.</p>
          <button id="btn-empty-import" style="padding: 10px 20px; font-weight: 700;">📂 Import JSON Report</button>
        </div>
      `;
      document.getElementById('btn-empty-import')?.addEventListener('click', () => importFileInput.click());
    }
  } catch {
    container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Error loading report.</div>`;
  }

  // Import JSON handler
  btnImportJson?.addEventListener('click', () => importFileInput.click());
  importFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const report = JSON.parse(evt.target.result);
          currentReport = report;
          renderReport(currentReport);
        } catch (err) {
          alert(`Error reading JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
    importFileInput.value = '';
  });

  // Save JSON handler
  btnSaveJson?.addEventListener('click', () => {
    if (!currentReport) return;
    const jsonStr = JSON.stringify(currentReport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const host = currentReport.url ? new URL(currentReport.url).hostname.replace(/[^a-z0-9]/gi, '_') : 'aeo-report';
    a.href = url;
    a.download = `aeo-report-${host}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Print handler
  btnPrint?.addEventListener('click', () => window.print());

  function renderReport(report) {
    const formatScore = (score) => {
      if (score === null || score === undefined) return 'N/A';
      return score <= 1 ? Math.round(score * 100) : Math.round(score);
    };

    const getScoreColor = (score) => {
      if (score === null || score === undefined) return '#8b949e';
      const s = score <= 1 ? score * 100 : score;
      if (s >= 90) return '#0cce6b';
      if (s >= 50) return '#ffa400';
      return '#ff4e42';
    };

    const getScoreBadgeClass = (score) => {
      if (score === null || score === undefined) return 'score-na';
      const s = score <= 1 ? score * 100 : score;
      if (s >= 90) return 'score-pass';
      if (s >= 50) return 'score-average';
      return 'score-fail';
    };

    const renderGauge = (score, title) => {
      const s = formatScore(score);
      const color = getScoreColor(score);
      const numScore = typeof s === 'number' ? s : 0;
      const strokeDashoffset = 283 - (283 * numScore) / 100;

      return `
        <div class="gauge-card">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle class="gauge-bg" cx="50" cy="50" r="45" />
            <circle class="gauge-fill" cx="50" cy="50" r="45"
              style="stroke: ${color}; stroke-dasharray: 283; stroke-dashoffset: ${strokeDashoffset};" />
          </svg>
          <div class="gauge-score" style="color: ${color};">${s}</div>
          <div class="gauge-label">${title}</div>
        </div>
      `;
    };

    const renderAuditCard = (audit) => {
      const scoreVal = formatScore(audit.score);
      const badgeClass = getScoreBadgeClass(audit.score);

      return `
        <details class="audit-card">
          <summary class="audit-summary">
            <span class="status-dot ${badgeClass}"></span>
            <span class="audit-name">${audit.title}</span>
            ${audit.displayValue ? `<span class="audit-display-val">${audit.displayValue}</span>` : ''}
            <span class="audit-score-pill ${badgeClass}">${scoreVal}</span>
          </summary>
          <div class="audit-body">
            <p class="audit-desc">${audit.description || ''}</p>
            ${audit.explanation ? `<p style="margin-top: 8px; color: #cbd5e1;"><strong>Diagnostic:</strong> ${audit.explanation}</p>` : ''}
          </div>
        </details>
      `;
    };

    const renderCategory = (cat) => {
      const catScore = formatScore(cat.score);
      const badgeClass = getScoreBadgeClass(cat.score);

      return `
        <section class="category-section">
          <div class="cat-head">
            <div>
              <h2 class="cat-title">${cat.title}</h2>
              <p class="cat-desc">${cat.description || ''}</p>
            </div>
            <div class="cat-score-pill ${badgeClass}">
              ${catScore} / 100
            </div>
          </div>
          <div class="audits-list">
            ${(cat.auditRefs || []).map((ref) => renderAuditCard(ref.result || ref)).join('')}
          </div>
        </section>
      `;
    };

    const categories = report.categories || {};
    const dateStr = report.fetchTime ? new Date(report.fetchTime).toLocaleString('en-US') : 'N/A';

    container.innerHTML = `
      <div class="report-header">
        <h1 class="report-url">${report.url || 'Audit Report'}</h1>
        <div class="report-meta">Audited on ${dateStr} &bull; AEO Engine v${report.aeoVersion || '0.1.3'}</div>
      </div>

      <div class="gauges-grid">
        ${renderGauge(report.overallScore, 'Overall AEO Score')}
        ${Object.values(categories)
          .map((cat) => renderGauge(cat.score, cat.title))
          .join('')}
      </div>

      ${Object.values(categories)
        .map((cat) => renderCategory(cat))
        .join('')}
    `;
  }
});
