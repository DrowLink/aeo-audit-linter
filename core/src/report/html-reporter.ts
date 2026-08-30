/**
 * @fileoverview Generates standalone interactive HTML reports for SEO, GEO & AEO analysis.
 * Inspired by Google Lighthouse architecture with rich visual diagnostic dashboards.
 */

import type { AeoReportResult, CategoryResult, AuditResult } from '../types/index.js';

export class HtmlReporter {
  /**
   * Generates a self-contained HTML document with score gauges, SERP preview, keywords, and audit breakdowns.
   */
  public static generate(report: AeoReportResult): string {
    const getScoreColor = (score: number | null): string => {
      if (score === null) return '#94a3b8';
      if (score >= 0.9 || score >= 90) return '#10b981'; // Emerald Green
      if (score >= 0.5 || score >= 50) return '#f59e0b'; // Amber
      return '#f43f5e'; // Rose Red
    };

    const getScoreCategoryClass = (score: number | null): string => {
      if (score === null) return 'score-na';
      const s = score <= 1 ? score * 100 : score;
      if (s >= 90) return 'score-pass';
      if (s >= 50) return 'score-average';
      return 'score-fail';
    };

    const renderGauge = (score: number, title: string, isMain = false) => {
      const color = getScoreColor(score);
      const strokeDashoffset = 283 - (283 * score) / 100;
      const sizeClass = isMain ? 'gauge-main' : '';
      return `
        <div class="gauge-container ${sizeClass}">
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
      const isAverage = audit.score !== null && audit.score >= 0.5 && audit.score < 0.8;

      const statusIcon = isPass ? '✔' : isAverage ? '▲' : '✖';
      const iconClass = isPass ? 'icon-pass' : isAverage ? 'icon-average' : 'icon-fail';

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
        <details class="audit-card ${isPass ? 'pass' : isAverage ? 'average' : 'fail'}">
          <summary class="audit-summary">
            <span class="status-icon ${iconClass}">${statusIcon}</span>
            <div class="audit-info">
              <span class="audit-title">${audit.title}</span>
              ${audit.displayValue ? `<span class="audit-display-val">${audit.displayValue}</span>` : ''}
            </div>
            <span class="audit-score-badge ${badgeClass}">${scoreVal !== null ? `${scoreVal}` : 'N/A'}</span>
          </summary>
          <div class="audit-body">
            <p class="audit-desc">${audit.description}</p>
            ${audit.explanation ? `<p class="audit-explanation"><strong>Diagnostic:</strong> ${audit.explanation}</p>` : ''}
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

    // Extract SERP preview metadata from audits if present
    const titleAudit = report.audits['seo-title'];
    const descAudit = report.audits['seo-meta-description'];
    const canonicalAudit = report.audits['seo-canonical'];
    const indexabilityAudit = report.audits['seo-indexability'];

    const pageTitle = (titleAudit?.details?.type === 'table' ? String(titleAudit.details.items[0]?.title || '') : '') || 'Page Title';
    const pageDesc = (descAudit?.details?.type === 'table' ? String(descAudit.details.items[0]?.description || '') : '') || 'Meta description snippet appears here in search engine results.';
    const isIndexable = indexabilityAudit?.score === 1;

    let parsedHostname = '';
    try {
      parsedHostname = new URL(report.url).hostname;
    } catch {
      parsedHostname = report.url;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEO & SEO Audit Report - ${report.url}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --surface: #121826;
      --surface-card: #182234;
      --surface-border: rgba(255, 255, 255, 0.08);
      --surface-border-glow: rgba(99, 102, 241, 0.3);
      --text: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --pass: #10b981;
      --average: #f59e0b;
      --fail: #f43f5e;
      --accent: #6366f1;
      --accent-cyan: #38bdf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 80px;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Stats Bar */
    .stats-bar {
      background: rgba(18, 24, 38, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--surface-border);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .stats-group { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .stat-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .stat-pill .label { color: var(--text-dim); text-transform: uppercase; font-weight: 600; font-size: 0.7rem; }
    .stat-pill .val { font-weight: 700; color: var(--text); }
    .badge-indexable {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--pass);
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-noindex {
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      color: var(--fail);
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Header */
    .header {
      background: linear-gradient(180deg, #131b2e 0%, var(--bg) 100%);
      border-bottom: 1px solid var(--surface-border);
      padding: 36px 24px;
      text-align: center;
    }
    .container { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
    .brand-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: var(--accent-cyan);
      font-weight: 700;
      margin-bottom: 8px;
    }
    h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; word-break: break-all; }
    .meta { font-size: 0.9rem; color: var(--text-muted); }
    
    /* SERP Preview Section */
    .serp-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 22px 24px;
      margin: 28px 0;
    }
    .serp-header { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 12px; }
    .serp-box {
      background: #ffffff;
      color: #202124;
      border-radius: 10px;
      padding: 16px;
      font-family: Arial, sans-serif;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .serp-url { font-size: 0.82rem; color: #202124; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
    .serp-title { font-size: 1.25rem; color: #1a0dab; font-weight: 400; text-decoration: none; display: block; margin-bottom: 4px; line-height: 1.3; }
    .serp-desc { font-size: 0.88rem; color: #4d5156; line-height: 1.4; }

    /* Gauges Grid */
    .gauges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin: 32px 0;
    }
    .gauge-container {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 22px 14px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .gauge-container:hover { transform: translateY(-3px); border-color: var(--surface-border-glow); }
    .gauge-container.gauge-main {
      border: 2px solid var(--accent);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(18, 24, 38, 0.8) 100%);
    }
    .gauge { width: 90px; height: 90px; transform: rotate(-90deg); }
    .gauge-bg { fill: none; stroke: rgba(255, 255, 255, 0.08); stroke-width: 8; }
    .gauge-fill { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dashoffset 0.8s ease; }
    .gauge-score { font-size: 1.6rem; font-weight: 800; margin-top: -62px; margin-bottom: 30px; }
    .gauge-title { font-size: 0.82rem; font-weight: 600; color: var(--text); }

    /* Category Section */
    .category-section {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 28px;
    }
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--surface-border);
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .category-header h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 4px; }
    .cat-desc { font-size: 0.88rem; color: var(--text-muted); max-width: 750px; }
    .cat-score-badge {
      font-size: 1rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 20px;
      font-family: 'JetBrains Mono', monospace;
    }
    .score-pass { background: rgba(16, 185, 129, 0.15); color: var(--pass); }
    .score-average { background: rgba(245, 158, 11, 0.15); color: var(--average); }
    .score-fail { background: rgba(244, 63, 94, 0.15); color: var(--fail); }
    .score-na { background: rgba(148, 163, 184, 0.15); color: var(--text-muted); }

    /* Audits */
    .audits-list { display: flex; flex-direction: column; gap: 10px; }
    .audit-card {
      border: 1px solid var(--surface-border);
      border-radius: 10px;
      background: var(--surface-card);
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .audit-card:hover { border-color: rgba(255, 255, 255, 0.16); }
    .audit-summary {
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      list-style: none;
      user-select: none;
    }
    .audit-summary::-webkit-details-marker { display: none; }
    .status-icon {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 800;
      flex-shrink: 0;
    }
    .status-icon.icon-pass { background: rgba(16, 185, 129, 0.2); color: var(--pass); }
    .status-icon.icon-average { background: rgba(245, 158, 11, 0.2); color: var(--average); }
    .status-icon.icon-fail { background: rgba(244, 63, 94, 0.2); color: var(--fail); }

    .audit-info { flex: 1; display: flex; justify-content: space-between; align-items: center; }
    .audit-title { font-weight: 600; font-size: 0.92rem; }
    .audit-display-val { font-size: 0.82rem; color: var(--text-muted); margin-left: 12px; font-family: 'JetBrains Mono', monospace; }
    .audit-score-badge { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; }

    .audit-body {
      padding: 16px 18px;
      border-top: 1px solid var(--surface-border);
      background: rgba(9, 13, 22, 0.6);
      font-size: 0.88rem;
    }
    .audit-desc { color: var(--text-muted); margin-bottom: 10px; }
    .audit-explanation { margin-bottom: 14px; color: #e2e8f0; }

    /* Tables */
    .table-container { overflow-x: auto; margin-top: 10px; }
    .audit-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .audit-table th { background: rgba(255, 255, 255, 0.04); color: var(--text-dim); text-align: left; padding: 8px 12px; border: 1px solid var(--surface-border); }
    .audit-table td { padding: 8px 12px; border: 1px solid var(--surface-border); font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; }
    .audit-list { margin-left: 20px; color: #cbd5e1; }
    .audit-list li { margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="stats-bar">
    <div class="stats-group">
      <span class="${isIndexable ? 'badge-indexable' : 'badge-noindex'}">${isIndexable ? '● Indexable' : '■ Noindex'}</span>
      <span class="stat-pill"><span class="label">Host</span><span class="val">${parsedHostname}</span></span>
    </div>
    <div class="stats-group">
      <span class="stat-pill"><span class="label">Audits</span><span class="val">${Object.keys(report.audits).length}</span></span>
      <span class="stat-pill"><span class="label">Categories</span><span class="val">${Object.keys(report.categories).length}</span></span>
    </div>
  </div>

  <header class="header">
    <div class="container">
      <div class="brand-title">AEO, GEO & SEO Audit Linter &bull; Lighthouse Architecture</div>
      <h1>${report.url}</h1>
      <p class="meta">Audited on ${new Date(report.fetchTime).toLocaleString('en-US')} &bull; Engine v${report.aeoVersion}</p>
    </div>
  </header>

  <main class="container">
    <div class="gauges-grid">
      ${renderGauge(report.overallScore, 'Overall Score', true)}
      ${Object.values(report.categories)
        .map((cat) => renderGauge(cat.score !== null ? Math.round(cat.score * 100) : 0, cat.title))
        .join('')}
    </div>

    <!-- SERP Preview Card -->
    <div class="serp-card">
      <div class="serp-header">Google SERP Snippet Preview</div>
      <div class="serp-box">
        <div class="serp-url">${report.url}</div>
        <a class="serp-title" href="${report.url}" target="_blank" rel="noopener noreferrer">${pageTitle}</a>
        <div class="serp-desc">${pageDesc}</div>
      </div>
    </div>

    ${Object.values(report.categories).map((cat) => renderCategory(cat)).join('')}
  </main>
</body>
</html>`;
  }
}
