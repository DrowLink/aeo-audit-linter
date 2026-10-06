/**
 * @fileoverview Controller for SAGE - AEO & SEO Linter Chrome Extension Popup.
 * Implements luxury aesthetics, fluid animations, theme toggling, and score calculation.
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
  const auditsQuotaText = document.getElementById('audits-quota-text');
  const errorBanner = document.getElementById('error-banner');

  const initialView = document.getElementById('initial-view');
  const loadingView = document.getElementById('loading-view');
  const resultsView = document.getElementById('results-view');

  const btnRunAudit = document.getElementById('btn-run-audit');
  const btnRecalculate = document.getElementById('btn-recalculate');
  const btnViewDetailedTab = document.getElementById('btn-view-detailed-tab');
  const btnOpenDevtools = document.getElementById('btn-open-devtools');
  const btnActivatePro = document.getElementById('btn-activate-pro');
  const btnCloseProModal = document.getElementById('btn-close-pro-modal');
  const proModal = document.getElementById('pro-modal');
  const themeToggle = document.getElementById('theme-toggle');

  // --- Theme Management ---
  async function initTheme() {
    const storage = await chrome.storage.local.get(['sageTheme']);
    const currentTheme = storage?.sageTheme || 'dark';
    applyTheme(currentTheme);
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  themeToggle?.addEventListener('click', async () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    await chrome.storage.local.set({ sageTheme: newTheme });
  });

  await initTheme();

  // --- Quota Management ---
  async function updateQuotaDisplay() {
    const storage = await chrome.storage.local.get(['sageAuditsRemaining']);
    let remaining = storage?.sageAuditsRemaining;
    if (typeof remaining !== 'number') {
      remaining = 10;
      await chrome.storage.local.set({ sageAuditsRemaining: 10 });
    }
    if (auditsQuotaText) {
      auditsQuotaText.textContent = `${remaining} free audits remaining`;
    }
    return remaining;
  }

  await updateQuotaDisplay();

  // --- Pro Modal ---
  btnActivatePro?.addEventListener('click', () => {
    if (proModal) proModal.style.display = 'flex';
  });

  btnCloseProModal?.addEventListener('click', () => {
    if (proModal) proModal.style.display = 'none';
  });

  proModal?.addEventListener('click', (e) => {
    if (e.target === proModal) proModal.style.display = 'none';
  });

  // --- View Control ---
  function setView(viewName) {
    if (initialView) initialView.style.display = viewName === 'initial' ? 'block' : 'none';
    if (loadingView) loadingView.style.display = viewName === 'loading' ? 'block' : 'none';
    if (resultsView) resultsView.style.display = viewName === 'results' ? 'block' : 'none';
  }

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

  // --- Identify Active Tab ---
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];

    if (activeTab?.url) {
      const cleanUrl = activeTab.url.replace(/^https?:\/\//i, '');
      targetUrlText.textContent = cleanUrl;
      targetUrlText.title = activeTab.url;

      const isAuditable = activeTab.url.startsWith('http://') || activeTab.url.startsWith('https://');

      if (!isAuditable) {
        if (btnRunAudit) btnRunAudit.disabled = true;
        if (targetStatusText) {
          targetStatusText.textContent = 'Not auditable';
          targetStatusText.style.color = 'var(--fail)';
        }
        targetUrlText.textContent = 'Internal browser tab (not auditable)';
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
    targetUrlText.textContent = 'Error identifying active tab';
    showError(err.message);
    setView('initial');
  }

  // --- Audit Execution Handler with Phased Animation ---
  async function executeAudit() {
    if (!activeTab?.id) return;

    clearError();
    setView('loading');

    const loadingStepText = document.getElementById('loading-step-text');
    const loadingSubtext = document.getElementById('loading-subtext');

    const steps = [
      { main: 'Scanning DOM & metadata...', sub: 'Extracting title, descriptions, canonical, and links' },
      { main: 'Verifying AI bots & schemas...', sub: 'Checking robots.txt, llms.txt and JSON-LD entities' },
      { main: 'Auditing semantic chunking...', sub: 'Evaluating HTML5 containers, tables, lists, and direct answers' },
      { main: 'Synthesizing AEO & GEO score...', sub: 'Applying weighted Google Lighthouse formula' },
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      if (loadingStepText) loadingStepText.textContent = steps[stepIndex].main;
      if (loadingSubtext) loadingSubtext.textContent = steps[stepIndex].sub;
    }, 450);

    try {
      // 1. Extract outerHTML from active tab
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => ({
          url: window.location.href,
          html: document.documentElement.outerHTML,
        }),
      });

      const pageData = injectionResults?.[0]?.result;
      if (!pageData?.html) {
        throw new Error('Could not access HTML from active page');
      }

      // 2. Run engine audit
      const report = await BrowserAeoEngine.runAudit(pageData.url, pageData.html);
      currentReport = report;

      // Decrement audit quota
      const remaining = await updateQuotaDisplay();
      if (remaining > 0) {
        await chrome.storage.local.set({ sageAuditsRemaining: remaining - 1 });
        await updateQuotaDisplay();
      }

      // 3. Save report in storage
      await chrome.storage.local.set({ latestAeoReport: report });

      clearInterval(stepInterval);

      // Brief cinematic delay for smooth UX
      setTimeout(() => {
        renderScoreResults(report);
        setView('results');
      }, 350);
    } catch (err) {
      clearInterval(stepInterval);
      showError(`Audit failed: ${err.message}`);
      setView('initial');
    }
  }

  btnRunAudit?.addEventListener('click', executeAudit);
  btnRecalculate?.addEventListener('click', executeAudit);

  // --- Detailed Report Openers ---
  function openDetailedReport() {
    if (!currentReport) return;
    chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
  }

  btnViewDetailedTab?.addEventListener('click', openDetailedReport);
  btnOpenDevtools?.addEventListener('click', openDetailedReport);

  // --- Render Score & Animated Reveal ---
  function renderScoreResults(report) {
    const targetScore = report.overallScore ?? 0;
    const overallScoreVal = document.getElementById('overall-score-val');
    const overallGaugeCircle = document.getElementById('overall-gauge-circle');
    const overallVerdictBadge = document.getElementById('overall-verdict-badge');

    // Color & Verdict mapping
    let color = '#f43f5e';
    let verdictText = 'REQUIERE ATENCIÓN';
    let verdictClass = 'verdict-fail';

    if (targetScore >= 85) {
      color = '#10b981';
      verdictText = 'GEO READY';
      verdictClass = 'verdict-pass';
    } else if (targetScore >= 70) {
      color = '#38bdf8';
      verdictText = 'EXCELENTE';
      verdictClass = 'verdict-pass';
    } else if (targetScore >= 50) {
      color = '#f59e0b';
      verdictText = 'ACEPTABLE';
      verdictClass = 'verdict-average';
    }

    // Animated number counter
    if (overallScoreVal) {
      overallScoreVal.style.color = color;
      animateNumber(overallScoreVal, 0, targetScore, 800);
    }

    // Animated circular gauge
    if (overallGaugeCircle) {
      const radius = 42;
      const circumference = 2 * Math.PI * radius; // ~263.89
      overallGaugeCircle.style.stroke = color;
      overallGaugeCircle.style.strokeDasharray = `${circumference}`;
      const offset = circumference - (circumference * targetScore) / 100;

      // Start empty and animate to fill
      overallGaugeCircle.style.strokeDashoffset = `${circumference}`;
      setTimeout(() => {
        overallGaugeCircle.style.strokeDashoffset = `${offset}`;
      }, 50);
    }

    if (overallVerdictBadge) {
      overallVerdictBadge.textContent = verdictText;
      overallVerdictBadge.className = `verdict-tag ${verdictClass}`;
    }

    // Audits Tally
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
      sigLlmstxt.textContent = hasLlms ? 'ACTIVO' : 'OPCIONAL';
      sigLlmstxt.style.color = hasLlms ? '#10b981' : '#94a3b8';
    }

    if (sigHeadings) {
      const h1 = artifacts.HeadingsHierarchy?.h1Count || 0;
      const h2 = artifacts.HeadingsHierarchy?.h2Count || 0;
      sigHeadings.textContent = `${h1} H1 · ${h2} H2`;
      sigHeadings.style.color = h1 === 1 ? '#10b981' : '#f59e0b';
    }

    // Categories Breakdown with Staggered Bar Animation
    const categoriesContainer = document.getElementById('categories-container');
    if (categoriesContainer && report.categories) {
      const catList = Object.entries(report.categories);
      const catHtml = catList
        .map(([catId, cat], index) => {
          const catScore = Math.round((cat.score <= 1 ? cat.score * 100 : cat.score) || 0);
          const icon = CATEGORY_ICONS[catId] || '📊';
          const name = CATEGORY_SHORT_NAMES[catId] || cat.title;

          let catColor = '#f43f5e';
          let badgeBg = 'rgba(244, 63, 94, 0.12)';
          if (catScore >= 85) {
            catColor = '#10b981';
            badgeBg = 'rgba(16, 185, 129, 0.12)';
          } else if (catScore >= 65) {
            catColor = '#38bdf8';
            badgeBg = 'rgba(56, 189, 248, 0.12)';
          } else if (catScore >= 50) {
            catColor = '#f59e0b';
            badgeBg = 'rgba(245, 158, 11, 0.12)';
          }

          return `
            <div class="cat-item">
              <div class="cat-head">
                <div class="cat-title-wrap">
                  <span>${icon}</span>
                  <span>${name}</span>
                </div>
                <span class="cat-score-num" style="color: ${catColor}; background: ${badgeBg};">
                  ${catScore}%
                </span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" id="cat-fill-${index}" data-target-width="${catScore}%" style="background: ${catColor}; transition-delay: ${index * 80}ms;"></div>
              </div>
            </div>
          `;
        })
        .join('');

      categoriesContainer.innerHTML = catHtml;

      // Animate progress bars
      setTimeout(() => {
        catList.forEach((_, idx) => {
          const el = document.getElementById(`cat-fill-${idx}`);
          if (el) el.style.width = el.getAttribute('data-target-width');
        });
      }, 60);
    }
  }

  // Helper for number roll-up animation
  function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      element.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = end;
      }
    }
    requestAnimationFrame(update);
  }
});
