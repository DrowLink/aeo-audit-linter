/**
 * @fileoverview Standalone Detailed Report Viewer controller for AEO & SEO Linter Chrome Extension.
 * Renders circular SVG gauges, Google SERP Snippet Preview, AI Crawlers Access Matrix,
 * Keywords Density Table, and all 25 Lighthouse-style diagnostic audits.
 */

let currentReport = null;

const CATEGORY_ICONS = {
  'seo-fundamentals': '🔍',
  'ai-accessibility': '🤖',
  'structured-data': '🏷️',
  'content-chunking': '📑',
  'direct-answer-density': '🎯',
};

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('report-view-container');
  const btnSaveJson = document.getElementById('btn-save-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const importFileInput = document.getElementById('import-file-input');
  const btnPrint = document.getElementById('btn-print');

  // 1. Load latest report from chrome.storage
  try {
    const storageData = await chrome.storage.local.get('latestAeoReport');
    if (storageData?.latestAeoReport) {
      currentReport = storageData.latestAeoReport;
      renderReport(currentReport);
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--surface); border-radius: var(--cozy-radius); border: 1px solid var(--surface-border);">
          <h2 style="margin-bottom: 10px;">No se encontró ningún reporte cargado</h2>
          <p style="color: var(--text-muted); margin-bottom: 24px;">Abre el popup de AEO Linter en una página web y calcula el score para visualizar su reporte detallado, o importa un archivo JSON existente.</p>
          <button id="btn-empty-import" style="padding: 10px 20px; font-weight: 700;">📂 Importar Reporte JSON</button>
        </div>
      `;
      document.getElementById('btn-empty-import')?.addEventListener('click', () => importFileInput.click());
    }
  } catch {
    container.innerHTML = `<div style="text-align: center; padding: 60px 0;">Error al cargar el reporte de auditoría.</div>`;
  }

  // 2. Import JSON Handler
  btnImportJson?.addEventListener('click', () => importFileInput.click());
  importFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const report = JSON.parse(evt.target.result);
          if (!report || (!report.overallScore && !report.categories)) {
            alert('Formato de reporte inválido. Debe contener puntuación o categorías.');
            return;
          }
          currentReport = report;
          renderReport(currentReport);
        } catch (err) {
          alert(`Error al leer archivo JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
    importFileInput.value = '';
  });

  // 3. Save JSON Handler
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

  // 4. Print / PDF Handler
  btnPrint?.addEventListener('click', () => window.print());

  // 5. Main Report Renderer
  function renderReport(report) {
    const artifacts = report.artifacts || {};
    const categories = report.categories || {};
    const dateStr = report.fetchTime ? new Date(report.fetchTime).toLocaleString() : 'N/A';

    const formatScore = (score) => {
      if (score === null || score === undefined) return 'N/A';
      return score <= 1 ? Math.round(score * 100) : Math.round(score);
    };

    const getScoreColor = (score) => {
      if (score === null || score === undefined) return '#94a3b8';
      const s = score <= 1 ? score * 100 : score;
      if (s >= 90) return '#10b981';
      if (s >= 50) return '#f59e0b';
      return '#f43f5e';
    };

    const getScoreBadgeClass = (score) => {
      if (score === null || score === undefined) return 'score-na';
      const s = score <= 1 ? score * 100 : score;
      if (s >= 90) return 'score-pass';
      if (s >= 50) return 'score-average';
      return 'score-fail';
    };

    const renderGauge = (score, title, isMain = false) => {
      const s = formatScore(score);
      const color = getScoreColor(score);
      const numScore = typeof s === 'number' ? s : 0;
      const strokeDashoffset = 283 - (283 * numScore) / 100;

      return `
        <div class="gauge-card ${isMain ? 'gauge-main' : ''}">
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

    // Metrics bar calculations
    const headings = artifacts.HeadingsHierarchy || {};
    const images = artifacts.Images || { totalImages: 0, missingAltCount: 0 };
    const links = artifacts.Links || { totalLinks: 0, internalLinksCount: 0, externalLinksCount: 0 };
    const isIndexable = report.audits?.['seo-indexability']?.score === 1;

    let originUrl = '';
    try {
      originUrl = new URL(report.url).origin;
    } catch {}

    // SERP preview calculations
    const pageTitle = artifacts.MetaTags?.title || report.url;
    const pageDesc = artifacts.MetaTags?.description || 'No se encontró meta descripción configurada para esta página.';

    // Keywords
    const topKeywords = artifacts.Keywords?.topKeywords || [];

    // AI Bots
    const aiBotsStatus = artifacts.RobotsTxt?.aiBotsStatus || {};
    const aiBotEntries = Object.entries(aiBotsStatus);

    // Schemas
    const schemasFound = (artifacts.JSONLD?.schemas || []).map((s) => s['@type'] || 'Schema');

    // Audit Card Renderer
    const renderAuditCard = (audit) => {
      const scoreVal = formatScore(audit.score);
      const badgeClass = getScoreBadgeClass(audit.score);

      let detailsHtml = '';
      if (audit.details && audit.details.items && audit.details.items.length > 0) {
        if (audit.details.type === 'table' && audit.details.headings) {
          const hdgs = audit.details.headings;
          detailsHtml = `
            <div class="table-container" style="margin-top: 12px;">
              <table class="dense-table">
                <thead>
                  <tr>${hdgs.map((h) => `<th>${h.label || h.key}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${audit.details.items
                    .slice(0, 10)
                    .map(
                      (row) =>
                        `<tr>${hdgs.map((h) => `<td>${row[h.key] !== undefined ? String(row[h.key]) : '-'}</td>`).join('')}</tr>`
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `;
        }
      }

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
            ${audit.explanation ? `<div class="diagnostic-box"><strong>Diagnóstico:</strong> ${audit.explanation}</div>` : ''}
            ${detailsHtml}
          </div>
        </details>
      `;
    };

    // Category Renderer
    const renderCategory = (cat) => {
      const catScore = formatScore(cat.score);
      const badgeClass = getScoreBadgeClass(cat.score);
      const icon = CATEGORY_ICONS[cat.id] || '📊';

      return `
        <section class="category-section" id="cat-${cat.id}">
          <div class="cat-head">
            <div>
              <h2 class="cat-title"><span>${icon}</span> ${cat.title}</h2>
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

    // Construct full DOM
    container.innerHTML = `
      <!-- Header Banner -->
      <div class="report-header">
        <h1 class="report-url">${report.url || 'Auditoría AEO & SEO'}</h1>
        <div class="report-meta">Auditado el ${dateStr} &bull; Engine v${report.aeoVersion || '0.3.0'} &bull; 25 Auditorías Evaluadas</div>
      </div>

      <!-- Quick Metrics Bar -->
      <div class="summary-metrics-bar">
        <div class="headings-grid">
          <div class="metric-badge"><span class="lbl">H1</span><span class="val">${headings.h1Count || 0}</span></div>
          <div class="metric-badge"><span class="lbl">H2</span><span class="val">${headings.h2Count || 0}</span></div>
          <div class="metric-badge"><span class="lbl">H3</span><span class="val">${headings.h3Count || 0}</span></div>
          <div class="metric-badge"><span class="lbl">H4</span><span class="val">${headings.h4Count || 0}</span></div>
          <div class="metric-badge"><span class="lbl">IMG</span><span class="val">${images.totalImages || 0}</span></div>
          <div class="metric-badge"><span class="lbl">ENLACES</span><span class="val">${links.totalLinks || 0}</span></div>
        </div>
        <div class="status-badges">
          ${originUrl ? `<a href="${originUrl}/robots.txt" target="_blank" style="color: var(--accent-cyan); font-size: 0.75rem; text-decoration: none;">robots.txt ↗</a>` : ''}
          ${originUrl ? `<a href="${originUrl}/llms.txt" target="_blank" style="color: var(--accent-cyan); font-size: 0.75rem; text-decoration: none;">llms.txt ↗</a>` : ''}
          <span class="${isIndexable ? 'badge-indexable' : 'badge-noindex'}">${isIndexable ? 'INDEXABLE' : 'NOINDEX'}</span>
        </div>
      </div>

      <!-- Gauges Grid -->
      <div class="gauges-grid">
        ${renderGauge(report.overallScore, 'Score General AEO', true)}
        ${Object.values(categories)
          .map((cat) => renderGauge(cat.score, cat.title))
          .join('')}
      </div>

      <!-- Visual Blocks: SERP Preview & Keywords -->
      <div class="two-col-grid">
        <!-- Google SERP Snippet Preview -->
        <div class="preview-card">
          <div class="preview-header">
            <span>🌐</span>
            <span>Google SERP Snippet Preview</span>
          </div>
          <div class="serp-box">
            <div class="serp-url">${report.url}</div>
            <a class="serp-title" href="${report.url}" target="_blank">${pageTitle}</a>
            <div class="serp-desc">${pageDesc}</div>
          </div>
        </div>

        <!-- Top Keywords & Density -->
        <div class="preview-card">
          <div class="preview-header">
            <span>🔑</span>
            <span>Palabras Clave & Densidad de Contenido</span>
          </div>
          <div class="table-container">
            <table class="dense-table">
              <thead>
                <tr>
                  <th>Término</th>
                  <th>Freq</th>
                  <th>Densidad</th>
                  <th>Gráfico</th>
                </tr>
              </thead>
              <tbody>
                ${
                  topKeywords.length > 0
                    ? topKeywords
                        .slice(0, 5)
                        .map(
                          (kw) => `
                        <tr>
                          <td style="font-weight: 700; font-family: 'JetBrains Mono', monospace;">${kw.word}</td>
                          <td style="color: var(--text-muted);">${kw.count}</td>
                          <td style="color: var(--accent-cyan); font-weight: 700;">${kw.density}%</td>
                          <td>
                            <div class="kw-bar-bg">
                              <div class="kw-bar-fill" style="width: ${Math.min(100, kw.density * 25)}%;"></div>
                            </div>
                          </td>
                        </tr>
                      `
                        )
                        .join('')
                    : '<tr><td colspan="4" style="color: var(--text-muted);">Sin palabras clave densas detectadas</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- AI Crawlers Matrix & Schemas Row -->
      <div class="two-col-grid">
        <!-- AI Bot Crawlers -->
        <div class="preview-card">
          <div class="preview-header">
            <span>🤖</span>
            <span>Acceso de Rastreadores de IA (robots.txt)</span>
          </div>
          <div class="table-container">
            <table class="dense-table">
              <thead>
                <tr>
                  <th>Bot / Agente</th>
                  <th>Compañía</th>
                  <th>Directiva</th>
                </tr>
              </thead>
              <tbody>
                ${
                  aiBotEntries.length > 0
                    ? aiBotEntries
                        .map(([bot, st]) => {
                          const isAllowed = st === 'allowed' || st === 'not_specified';
                          return `
                            <tr>
                              <td style="font-weight: 600;">${bot}</td>
                              <td style="color: var(--text-muted);">${getBotCompany(bot)}</td>
                              <td><span class="${isAllowed ? 'bot-allowed' : 'bot-blocked'}">${isAllowed ? '✔ Permitido' : '✖ Bloqueado'}</span></td>
                            </tr>
                          `;
                        })
                        .join('')
                    : '<tr><td colspan="3" style="color: var(--text-muted);">robots.txt no accesible o sin directivas específicas</td></tr>'
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Structured Data & LLMs.txt -->
        <div class="preview-card">
          <div class="preview-header">
            <span>🏷️</span>
            <span>Structured Data (JSON-LD) & LLM Ingestion</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.84rem;">
            <div style="background: rgba(255, 255, 255, 0.03); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--surface-border);">
              <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">Schemas JSON-LD Detectados:</div>
              <div style="color: var(--accent-cyan); font-family: 'JetBrains Mono', monospace;">
                ${schemasFound.length > 0 ? schemasFound.join(', ') : 'Ninguno detectado'}
              </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--surface-border);">
              <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">Archivo de Ingesta /llms.txt:</div>
              <div style="color: ${artifacts.LlmsTxt?.exists ? '#10b981' : '#94a3b8'}; font-weight: 600;">
                ${artifacts.LlmsTxt?.exists ? '✔ Presente en la raíz del dominio' : '✖ No detectado en /llms.txt'}
              </div>
            </div>
            <div style="background: rgba(255, 255, 255, 0.03); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--surface-border);">
              <div style="font-weight: 700; color: #fff; margin-bottom: 4px;">Señales E-E-A-T & Autoría:</div>
              <div style="color: ${report.audits?.['author-eeat-presence']?.score >= 0.7 ? '#10b981' : '#f59e0b'}; font-weight: 600;">
                ${report.audits?.['author-eeat-presence']?.displayValue || 'Evaluado'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories & Audits Accordions -->
      ${Object.values(categories)
        .map((cat) => renderCategory(cat))
        .join('')}
    `;
  }

  function getBotCompany(bot) {
    const map = {
      GPTBot: 'OpenAI (ChatGPT)',
      ClaudeBot: 'Anthropic (Claude)',
      PerplexityBot: 'Perplexity AI',
      'Google-Extended': 'Google (Gemini)',
      CCBot: 'Common Crawl',
      Bytespider: 'ByteDance (TikTok)',
    };
    return map[bot] || 'AI Crawler';
  }
});
