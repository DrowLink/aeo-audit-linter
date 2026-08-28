/**
 * @fileoverview Popup controller for AEO Linter Chrome Extension.
 * Coordinates page extraction and opens the full Report Viewer tab.
 */

import { BrowserAeoEngine } from './engine.js';

let activeTab = null;

document.addEventListener('DOMContentLoaded', async () => {
  const targetUrlText = document.getElementById('target-url-text');
  const btnGenerate = document.getElementById('btn-generate-report');

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];

    if (activeTab?.url) {
      targetUrlText.textContent = activeTab.url;
      if (!activeTab.url.startsWith('http://') && !activeTab.url.startsWith('https://')) {
        btnGenerate.disabled = true;
        targetUrlText.textContent = 'Cannot audit internal chrome:// pages';
      }
    }
  } catch (err) {
    targetUrlText.textContent = 'Error identifying active tab';
  }

  btnGenerate.addEventListener('click', async () => {
    if (!activeTab || !activeTab.id) return;

    btnGenerate.disabled = true;
    btnGenerate.innerHTML = '<span>⏳</span> Auditing page...';

    try {
      // Extract outerHTML from active tab
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => ({
          url: window.location.href,
          html: document.documentElement.outerHTML,
        }),
      });

      const pageData = injectionResults?.[0]?.result;
      if (!pageData?.html) {
        throw new Error('Failed to extract HTML from active page');
      }

      // Run independent in-browser audit engine
      const report = await BrowserAeoEngine.runAudit(pageData.url, pageData.html);

      // Save report in storage for the report viewer tab
      await chrome.storage.local.set({ latestAeoReport: report });

      // Open standalone report viewer in a new tab (Lighthouse style)
      await chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });

      window.close();
    } catch (err) {
      const errorBanner = document.getElementById('error-banner');
      if (errorBanner) {
        errorBanner.textContent = `Audit error: ${err.message}`;
        errorBanner.style.display = 'block';
      }
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Run AEO Audit</span>
      `;
    }
  });
});
