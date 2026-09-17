/**
 * @fileoverview Controller for AEO & SEO Linter Chrome Extension Popup.
 * Calculates and visualizes the AEO/SEO score directly within the popup,
 * and enables viewing the comprehensive detailed report in a new tab.
 */

import { BrowserAeoEngine } from './engine.js';

let activeTab = null;
let currentReport = null;

// Category Metadata
const CATEGORY_ICONS = {
  'seo-fundamentals': '🔍',
  'ai-accessibility': '🤖',
  'structured-data': '🏷️',
  'content-chunking': '📑',
  'direct-answer-density': '🎯',
};

const CATEGORY_SHORT_NAMES = {
  'seo-fundamentals': 'Core SEO',
  'ai-accessibility': 'AI Crawling',
  'structured-data': 'Structured Data',
  'content-chunking': 'Content Chunking',
  'direct-answer-density': 'Direct Answers',
};

document.addEventListener('DOMContentLoaded', async () => {
  const targetUrlText = document.getElementById('target-url-text');
  const targetStatusText = document.getElementById('target-status-text');
  const errorBanner = document.getElementById('error-banner');

  const initialView = document.getElementById('initial-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');

  const btnRunAudit = document.getElementById('btn-run-audit');
  const btnRecalculate = document.getElementById('btn-recalculate');
  const btnViewDetailedTab = document.getElementById('btn-view-detailed-tab');

  function showError(msg) {
    if (errorBanner) {
      errorBanner.textContent = msg;
      errorBanner.style.display = 'block';
    }
  }

  function clearError() {
    if (errorBanner) {
      errorBanner.style.display = 'none';
      errorBanner.textContent = '';
    }
  }

  function setView(viewName) {
    initialView.style.display = viewName === 'initial' ? 'block' : 'none';
    loadingView.style.display = viewName === 'loading' ? 'block' : 'none';
    resultsView.style.display = viewName === 'results' ? 'block' : 'none';
  }

  // 1. Identify Active Tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];

    if (activeTab?.url) {
      targetUrlText.textContent = activeTab.url;
      const isAuditable = activeTab.url.startsWith('http://') || activeTab.url.startsWith('https://');

      if (!isAuditable) {
        btnRunAudit.disabled = true;
        targetStatusText.textContent = 'NO DISPONIBLE';
        targetStatusText.style.color = 'var(--fail)';
        targetUrlText.textContent = 'No auditable (página interna del navegador)';
        setView('initial');
        return;
      }

      // Check if there is already a cached report for this URL
      const storage = await chrome.storage.local.get(['latestAeoReport']);
      if (storage?.latestAeoReport && storage.latestAeoReport.url === activeTab.url) {
        currentReport = storage.latestAeoReport;
        renderScoreResults(currentReport);
        setView('results');
      } else {
        setView('initial');
      }
    }
  } catch (err) {
    targetUrlText.textContent = 'Error al identificar pestaña activa';
    showError(err.message);
    setView('initial');
  }

  // 2. Audit Execution Handler
  async function executeAudit() {
    if (!activeTab?.id) return;

    clearError();
    setView('loading');
    const loadingStepText = document.getElementById('loading-step-text');
    targetStatusText.textContent = 'AUDITANDO';
    targetStatusText.style.color = 'var(--accent-cyan)';

    try {
      if (loadingStepText) loadingStepText.textContent = 'Extrayendo DOM y metadatos...';

      // Extract outerHTML from the active tab
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => ({
          url: window.location.href,
          html: document.documentElement.outerHTML,
        }),
      });

      const pageData = injectionResults?.[0]?.result;
      if (!pageData?.html) {
        throw new Error('No se pudo extraer el HTML de la página activa');
      }

      if (loadingStepText) loadingStepText.textContent = 'Evaluando robots, llms.txt y schemas...';

      // Run independent in-browser audit engine
      const report = await BrowserAeoEngine.runAudit(pageData.url, pageData.html);
      currentReport = report;

      // Save report in storage
      await chrome.storage.local.set({ latestAeoReport: report });

      // Render directly into the popup
      renderScoreResults(report);
      targetStatusText.textContent = 'LISTO';
      targetStatusText.style.color = '#34d399';
      setView('results');
    } catch (err) {
      showError(`Error al auditar: ${err.message}`);
      targetStatusText.textContent = 'ERROR';
      targetStatusText.style.color = 'var(--fail)';
      setView('initial');
    }
  }

  btnRunAudit?.addEventListener('click', executeAudit);
  btnRecalculate?.addEventListener('click', executeAudit);

  // 3. View Detailed Report in New Tab Handler
  btnViewDetailedTab?.addEventListener('click', async () => {
    if (!currentReport) return;
    // Ensure latest report is persisted
    await chrome.storage.local.set({ latestAeoReport: currentReport });
    // Open full detailed report viewer in a new tab
    await chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
  });

  // 4. Render Score and Categories
  function renderScoreResults(report) {
    const score = report.overallScore ?? 0;
    const overallScoreVal = document.getElementById('overall-score-val');
    const overallGaugeCircle = document.getElementById('overall-gauge-circle');
    const overallVerdictBadge = document.getElementById('overall-verdict-badge');

    // Score Color & Gauge
    let color = '#f43f5e';
    let verdictText = 'CRÍTICO';
    let verdictClass = 'verdict-fail';

    if (score >= 90) {
      color = '#10b981';
      verdictText = 'GEO READY';
      verdictClass = 'verdict-pass';
    } else if (score >= 75) {
      color = '#10b981';
      verdictText = 'EXCELENTE';
      verdictClass = 'verdict-pass';
    } else if (score >= 50) {
      color = '#f59e0b';
      verdictText = 'ACEPTABLE';
      verdictClass = 'verdict-average';
    }

    if (overallScoreVal) {
      overallScoreVal.textContent = score;
      overallScoreVal.style.color = color;
    }

    if (overallGaugeCircle) {
      const radius = 42;
      const circumference = 2 * Math.PI * radius; // ~263.89
      overallGaugeCircle.style.stroke = color;
      overallGaugeCircle.style.strokeDasharray = `${circumference}`;
      const offset = circumference - (circumference * score) / 100;
      overallGaugeCircle.style.strokeDashoffset = `${offset}`;
    }

    if (overallVerdictBadge) {
      overallVerdictBadge.textContent = verdictText;
      overallVerdictBadge.className = `verdict-badge ${verdictClass}`;
    }

    // Tally Passed / Warnings / Failed Audits
    let passedCount = 0;
    let warnCount = 0;
    let failCount = 0;

    const audits = Object.values(report.audits || {});
    audits.forEach((audit) => {
      const s = audit.score ?? 0;
      if (s >= 0.8) passedCount++;
      else if (s >= 0.5) warnCount++;
      else failCount++;
    });

    const tallyPassed = document.getElementById('tally-passed');
    const tallyWarnings = document.getElementById('tally-warnings');
    const tallyFailed = document.getElementById('tally-failed');

    if (tallyPassed) tallyPassed.textContent = `${passedCount} pasadas`;
    if (tallyWarnings) tallyWarnings.textContent = `${warnCount} avisos`;
    if (tallyFailed) tallyFailed.textContent = `${failCount} fallos`;

    // Quick Signals
    const artifacts = report.artifacts || {};
    const sigIndex = document.getElementById('sig-index');
    const sigBots = document.getElementById('sig-bots');
    const sigLlmstxt = document.getElementById('sig-llmstxt');
    const sigHeadings = document.getElementById('sig-headings');

    const isIndexable = report.audits?.['seo-indexability']?.score === 1;
    if (sigIndex) {
      sigIndex.textContent = isIndexable ? 'INDEXABLE' : 'NOINDEX';
      sigIndex.style.color = isIndexable ? '#10b981' : '#f43f5e';
    }

    if (sigBots) {
      const botEntries = Object.entries(artifacts.RobotsTxt?.aiBotsStatus || {});
      const allowed = botEntries.filter(([_, st]) => st === 'allowed' || st === 'not_specified').length;
      sigBots.textContent = botEntries.length > 0 ? `${allowed}/${botEntries.length}` : 'N/A';
      sigBots.style.color = allowed >= 4 ? '#10b981' : '#f59e0b';
    }

    if (sigLlmstxt) {
      const hasLlms = artifacts.LlmsTxt?.exists;
      sigLlmstxt.textContent = hasLlms ? 'DETECTADO' : 'NO TIENE';
      sigLlmstxt.style.color = hasLlms ? '#10b981' : '#94a3b8';
    }

    if (sigHeadings) {
      const h1 = artifacts.HeadingsHierarchy?.h1Count || 0;
      const h2 = artifacts.HeadingsHierarchy?.h2Count || 0;
      sigHeadings.textContent = `${h1} H1 · ${h2} H2`;
      sigHeadings.style.color = h1 === 1 ? '#10b981' : '#f59e0b';
    }

    // Categories Breakdown
    const categoriesContainer = document.getElementById('categories-container');
    if (categoriesContainer && report.categories) {
      const catHtml = Object.entries(report.categories)
        .map(([catId, cat]) => {
          const catScore = Math.round((cat.score <= 1 ? cat.score * 100 : cat.score) || 0);
          const icon = CATEGORY_ICONS[catId] || '📊';
          const name = CATEGORY_SHORT_NAMES[catId] || cat.title;

          let catColor = '#f43f5e';
          let badgeBg = 'rgba(244, 63, 94, 0.15)';
          if (catScore >= 90) {
            catColor = '#10b981';
            badgeBg = 'rgba(16, 185, 129, 0.15)';
          } else if (catScore >= 50) {
            catColor = '#f59e0b';
            badgeBg = 'rgba(245, 158, 11, 0.15)';
          }

          return `
            <div class="cat-row">
              <div class="cat-meta">
                <div class="cat-name-wrap">
                  <span>${icon}</span>
                  <span>${name}</span>
                </div>
                <span class="cat-score-badge" style="color: ${catColor}; background: ${badgeBg};">
                  ${catScore}%
                </span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${catScore}%; background: ${catColor};"></div>
              </div>
            </div>
          `;
        })
        .join('');

      categoriesContainer.innerHTML = catHtml;
    }
  }
});
