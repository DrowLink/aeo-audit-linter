/**
 * @fileoverview Generador de reportes HTML interactivos con diseño visual inspirado en Google Lighthouse.
 */

import type { AeoReportResult, CategoryResult, AuditResult } from '../types/index.js';

export class HtmlReporter {
  /**
   * Genera un documento HTML standalone autocontenido con diseño moderno, gauges de puntuación y tablas interactivas.
   */
  public static generate(report: AeoReportResult): string {
    const getScoreColor = (score: number | null): string => {
      if (score === null) return '#9e9e9e';
      if (score >= 0.9 || score >= 90) return '#0cce6b'; // Verde Lighthouse
      if (score >= 0.5 || score >= 50) return '#ffa400'; // Naranja Lighthouse
      return '#ff4e42'; // Rojo Lighthouse
    };

    const getScoreCategoryClass = (score: number | null): string => {
      if (score === null) return 'score-na';
      const s = score <= 1 ? score * 100 : score;
      if (s >= 90) return 'score-pass';
      if (s >= 50) return 'score-average';
      return 'score-fail';
    };

    const renderGauge = (score: number, title: string) => {
      const color = getScoreColor(score);
      const strokeDashoffset = 283 - (283 * score) / 100;
      return `
        <div class="gauge-container">
          <svg class="gauge" viewBox="0 0 100 100">
            <circle class="gauge-bg" cx="50" cy="50" r="45" />
            <circle class="gauge-fill" cx="50" cy="50" r="45"
              style="stroke: ${color}; stroke-dasharray: 283; stroke-dashoffset: ${strokeDashoffset};" />
          </svg>
          <div class="gauge-score" style="color: ${color};">${score}</div>
          <div class="gauge-title">${title}</div>
        </div>
      `;
    };

    const renderAuditItem = (audit: AuditResult) => {
      const scoreVal = audit.score !== null ? Math.round(audit.score * 100) : null;
      const badgeClass = getScoreCategoryClass(audit.score);
      const isPass = audit.score !== null && audit.score >= 0.8;

      let detailsHtml = '';
      if (audit.details) {
        if (audit.details.type === 'table') {
          const headings = audit.details.headings;
          const rows = audit.details.items;
          detailsHtml = `
            <div class="table-container">
              <table class="audit-table">
                <thead>
                  <tr>${headings.map((h) => `<th>${h.label}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (row) =>
                        `<tr>${headings
                          .map((h) => `<td>${row[h.key] !== undefined ? String(row[h.key]) : '-'}</td>`)
                          .join('')}</tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `;
        } else if (audit.details.type === 'list') {
          detailsHtml = `
            <ul class="audit-list">
              ${audit.details.items
                .map((item) => `<li>${typeof item === 'string' ? item : item.text}</li>`)
                .join('')}
            </ul>
          `;
        }
      }

      return `
        <details class="audit-card ${isPass ? 'pass' : 'fail'}">
          <summary class="audit-summary">
            <span class="status-indicator ${badgeClass}"></span>
            <div class="audit-info">
              <span class="audit-title">${audit.title}</span>
              ${audit.displayValue ? `<span class="audit-display-val">${audit.displayValue}</span>` : ''}
            </div>
            <span class="audit-score-badge ${badgeClass}">${scoreVal !== null ? `${scoreVal}` : 'N/A'}</span>
          </summary>
          <div class="audit-body">
            <p class="audit-desc">${audit.description}</p>
            ${audit.explanation ? `<p class="audit-explanation"><strong>Diagnóstico:</strong> ${audit.explanation}</p>` : ''}
            ${detailsHtml}
          </div>
        </details>
      `;
    };

    const renderCategory = (cat: CategoryResult) => {
      const catScore = cat.score !== null ? Math.round(cat.score * 100) : 0;
      return `
        <section class="category-section" id="cat-${cat.id}">
          <div class="category-header">
            <div class="cat-title-wrap">
              <h2>${cat.title}</h2>
              <p class="cat-desc">${cat.description}</p>
            </div>
            <div class="cat-score-badge ${getScoreCategoryClass(cat.score)}">
              ${catScore} / 100
            </div>
          </div>
          <div class="audits-list">
            ${cat.auditRefs.map((ref) => renderAuditItem(ref.result)).join('')}
          </div>
        </section>
      `;
    };

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEO Linter Report - ${report.url}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #131b2e;
      --surface-border: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --pass: #0cce6b;
      --average: #ffa400;
      --fail: #ff4e42;
      --accent: #3b82f6;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 80px;
    }
    .header {
      background: linear-gradient(180deg, #162038 0%, var(--bg) 100%);
      border-bottom: 1px solid var(--surface-border);
      padding: 40px 24px;
      text-align: center;
    }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
    .brand { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); font-weight: 700; margin-bottom: 8px; }
    h1 { font-size: 2rem; font-weight: 800; margin-bottom: 8px; word-break: break-all; }
    .meta { font-size: 0.9rem; color: var(--text-muted); }
    
    /* Gauges Grid */
    .gauges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 20px;
      margin: 40px 0;
    }
    .gauge-container {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 24px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s ease;
    }
    .gauge-container:hover { transform: translateY(-4px); }
    .gauge { width: 100px; height: 100px; transform: rotate(-90deg); }
    .gauge-bg { fill: none; stroke: #1e293b; stroke-width: 8; }
    .gauge-fill { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.8s ease; }
    .gauge-score { font-size: 1.8rem; font-weight: 800; margin-top: -70px; margin-bottom: 35px; }
    .gauge-title { font-size: 0.85rem; font-weight: 600; color: var(--text); }

    /* Category Section */
    .category-section {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 28px;
      margin-bottom: 32px;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--surface-border);
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .category-header h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
    .cat-desc { font-size: 0.9rem; color: var(--text-muted); max-width: 700px; }
    .cat-score-badge {
      font-size: 1.1rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
    }
    .score-pass { background: rgba(12, 206, 107, 0.15); color: var(--pass); }
    .score-average { background: rgba(255, 164, 0, 0.15); color: var(--average); }
    .score-fail { background: rgba(255, 78, 66, 0.15); color: var(--fail); }
    .score-na { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }

    /* Audits */
    .audits-list { display: flex; flex-direction: column; gap: 12px; }
    .audit-card {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: #0e1626;
      overflow: hidden;
    }
    .audit-summary {
      padding: 14px 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 14px;
      list-style: none;
      user-select: none;
    }
    .audit-summary::-webkit-details-marker { display: none; }
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-indicator.score-pass { background: var(--pass); }
    .status-indicator.score-average { background: var(--average); }
    .status-indicator.score-fail { background: var(--fail); }
    .status-indicator.score-na { background: var(--text-muted); }

    .audit-info { flex: 1; display: flex; justify-content: space-between; align-items: center; }
    .audit-title { font-weight: 600; font-size: 0.95rem; }
    .audit-display-val { font-size: 0.85rem; color: var(--text-muted); margin-left: 12px; }
    .audit-score-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; }

    .audit-body {
      padding: 16px 20px;
      border-top: 1px solid var(--surface-border);
      background: #090e1a;
      font-size: 0.9rem;
    }
    .audit-desc { color: var(--text-muted); margin-bottom: 12px; }
    .audit-explanation { margin-bottom: 16px; color: #cbd5e1; }

    /* Tables */
    .table-container { overflow-x: auto; margin-top: 12px; }
    .audit-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .audit-table th { background: #131d31; color: var(--text-muted); text-align: left; padding: 8px 12px; border: 1px solid var(--surface-border); }
    .audit-table td { padding: 8px 12px; border: 1px solid var(--surface-border); font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; }
    .audit-list { margin-left: 20px; color: #cbd5e1; }
    .audit-list li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="brand">AEO Linter Engine &bull; Lighthouse Architecture</div>
      <h1>${report.url}</h1>
      <p class="meta">Analizado el ${new Date(report.fetchTime).toLocaleString()} | AEO v${report.aeoVersion}</p>
    </div>
  </header>

  <main class="container">
    <div class="gauges-grid">
      ${renderGauge(report.overallScore, 'Score General AEO')}
      ${Object.values(report.categories)
        .map((cat) => renderGauge(cat.score !== null ? Math.round(cat.score * 100) : 0, cat.title))
        .join('')}
    </div>

    ${Object.values(report.categories).map((cat) => renderCategory(cat)).join('')}
  </main>
</body>
</html>`;
  }
}
