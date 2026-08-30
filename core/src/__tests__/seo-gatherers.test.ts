/**
 * @fileoverview Unit tests for Images, Links, and Keywords Gatherers
 */

import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { ImagesGatherer } from '../gather/gatherers/images-gatherer.js';
import { LinksGatherer } from '../gather/gatherers/links-gatherer.js';
import { KeywordsGatherer } from '../gather/gatherers/keywords-gatherer.js';

const mockHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>SEO and AEO Test Page</title>
</head>
<body>
  <header>
    <img src="/logo.png" alt="Company Logo" width="200" height="50">
    <img src="/decorative.svg" role="presentation">
    <img src="/missing.png">
  </header>
  <main>
    <h1>Comprehensive Search Engine Optimization and Answer Engine Linter</h1>
    <p>
      Search engine optimization and artificial intelligence optimization are essential for modern web applications.
      Optimization strategies include technical SEO, content chunking, and verifiable facts.
    </p>
    <a href="/internal-link">Internal Page</a>
    <a href="https://google.com/search" rel="noopener">External Search</a>
    <a href="javascript:void(0)">Non crawlable</a>
    <a href="/empty-text"></a>
  </main>
</body>
</html>
`;

describe('Images, Links and Keywords Gatherers', () => {
  it('extracts images with alt statuses correctly', async () => {
    const driver = new CheerioDriver({ url: 'https://example.com', html: mockHtml });
    const gatherer = new ImagesGatherer();
    const artifact = await gatherer.getArtifact({ url: 'https://example.com', driver });

    expect(artifact.totalImages).toBe(3);
    expect(artifact.missingAltCount).toBe(1);
    expect(artifact.passedAltCount).toBe(2);
  });

  it('extracts links and differentiates internal, external and crawlable', async () => {
    const driver = new CheerioDriver({ url: 'https://example.com', html: mockHtml });
    const gatherer = new LinksGatherer();
    const artifact = await gatherer.getArtifact({ url: 'https://example.com', driver });

    expect(artifact.totalLinks).toBe(4);
    expect(artifact.internalLinksCount).toBe(2);
    expect(artifact.externalLinksCount).toBe(1);
    expect(artifact.nonCrawlableCount).toBe(1);
    expect(artifact.missingTextCount).toBe(1);
  });

  it('extracts top keywords, frequencies and densities filtering stop words', async () => {
    const driver = new CheerioDriver({ url: 'https://example.com', html: mockHtml });
    const gatherer = new KeywordsGatherer();
    const artifact = await gatherer.getArtifact({ url: 'https://example.com', driver });

    expect(artifact.topKeywords.length).toBeGreaterThan(0);
    const topWord = artifact.topKeywords[0];
    expect(topWord.count).toBeGreaterThanOrEqual(2);
    expect(topWord.densityPercent).toBeGreaterThan(0);
  });
});
