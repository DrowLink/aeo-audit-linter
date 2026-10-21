import { describe, expect, it } from 'vitest';
import { BrowserAeoEngine } from '../../../extension/engine.js';

function makeBriefPageArtifacts() {
  return {
    MetaTags: { title: '', description: '', canonicalUrl: '', robotsMeta: '', openGraph: {}, viewport: '' },
    HttpHeaders: { xRobotsTag: '' },
    Images: { totalImages: 0, missingAltCount: 0 },
    Links: { totalLinks: 0, nonCrawlableCount: 0, missingTextCount: 0, internalLinksCount: 0, externalLinksCount: 0, links: [] },
    URL: { protocol: 'https:', finalUrl: 'https://example.com' },
    RobotsTxt: { exists: false, aiBotsStatus: {}, sitemaps: [] },
    LlmsTxt: { exists: false },
    JSONLD: {
      items: [],
      schemasCountByType: {},
      hasFAQPage: false,
      hasHowTo: false,
      hasQAPage: false,
      hasArticle: false,
      hasOrganization: false,
      hasProduct: false,
      sameAsUrls: [],
    },
    HeadingsHierarchy: { hasSingleH1: true, isHierarchySequential: true, h1Count: 1, h2Count: 0, h3Count: 0 },
    ContentChunks: {
      totalWordCount: 80,
      hasSemanticMain: true,
      hasSemanticArticle: false,
      hasSemanticSections: false,
      semanticTagsUsed: ['main'],
      chunks: [],
      averageChunkTokenCount: 0,
      totalTablesCount: 0,
      totalListsCount: 0,
      totalListItemsCount: 0,
    },
    DirectAnswers: {
      pairs: [],
      conciseAnswersCount: 0,
      definitionPatternsFound: 0,
      facts: {
        percentagesCount: 0,
        numericalMetricsCount: 0,
        externalSourcesCount: 0,
        totalFactSignals: 0,
      },
    },
  };
}

describe('extension fact citation parity', () => {
  it('does not require citations on pages under 150 words', () => {
    const results = BrowserAeoEngine.runAudits(makeBriefPageArtifacts());

    expect(results['fact-citation-density'].score).toBe(1);
    expect(results['fact-citation-density'].displayValue).toContain('Brief page');
  });
});
