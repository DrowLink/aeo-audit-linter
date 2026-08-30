/**
 * @fileoverview Unit tests for Core SEO Audits
 */

import { describe, it, expect } from 'vitest';
import { SeoTitleAudit } from '../audits/seo/seo-title.js';
import { SeoMetaDescriptionAudit } from '../audits/seo/seo-meta-description.js';
import { SeoCanonicalAudit } from '../audits/seo/seo-canonical.js';
import { SeoIndexabilityAudit } from '../audits/seo/seo-indexability.js';
import { SeoImageAltAudit } from '../audits/seo/seo-image-alt.js';
import { SeoCrawlableLinksAudit } from '../audits/seo/seo-crawlable-links.js';
import { SeoOpenGraphAudit } from '../audits/seo/seo-open-graph.js';
import { SeoViewportMobileAudit } from '../audits/seo/seo-viewport-mobile.js';
import { SeoHttpsAudit } from '../audits/seo/seo-https.js';
import type { Artifacts } from '../types/index.js';

function createMockArtifacts(overrides: Partial<Artifacts> = {}): Artifacts {
  return {
    URL: {
      requestedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      domain: 'example.com',
      pathname: '/',
      protocol: 'https:',
    },
    RobotsTxt: {
      rawContent: null,
      statusCode: 200,
      exists: false,
      sitemaps: [],
      rulesByAgent: {},
      aiBotsStatus: {},
    },
    HttpHeaders: {
      statusCode: 200,
      headers: {},
      xRobotsTag: null,
      contentType: 'text/html',
      cacheControl: null,
      contentEncoding: null,
    },
    JSONLD: {
      items: [],
      schemasCountByType: {},
      hasFAQPage: false,
      hasHowTo: false,
      hasArticle: false,
      hasQAPage: false,
      hasOrganization: false,
      hasProduct: false,
      hasSameAs: false,
      sameAsUrls: [],
      authorEeat: {
        hasAuthorSchema: false,
        authorSameAsUrls: [],
        hasJobTitle: false,
        hasPublisherSchema: false,
        hasDatePublished: false,
        hasDateModified: false,
        hasDomAuthorByline: false,
        hasDomPublishedDate: false,
      },
    },
    MetaTags: {
      title: 'Optimal Page Title For Search Engines Testing (48 chars)',
      description: 'This is an optimal meta description containing between 70 and 155 characters for search engines and generative AI answers snippet previews.',
      canonicalUrl: 'https://example.com/',
      viewport: 'width=device-width, initial-scale=1',
      charset: 'utf-8',
      openGraph: {
        'og:title': 'Optimal Page Title',
        'og:description': 'Optimal description',
        'og:image': 'https://example.com/image.jpg',
      },
      twitterCard: {
        'twitter:card': 'summary_large_image',
      },
      robotsMeta: null,
    },
    HeadingsHierarchy: {
      headings: [],
      h1Count: 1,
      h2Count: 3,
      h3Count: 5,
      h4Count: 0,
      h5Count: 0,
      h6Count: 0,
      hasSingleH1: true,
      isHierarchySequential: true,
      skippedLevels: [],
    },
    Images: {
      images: [
        { src: 'https://example.com/logo.png', alt: 'Company Logo', hasAlt: true, isDecorative: false },
        { src: 'https://example.com/banner.png', alt: 'Banner graph', hasAlt: true, isDecorative: false },
      ],
      totalImages: 2,
      missingAltCount: 0,
      passedAltCount: 2,
    },
    Links: {
      links: [
        { href: '/about', text: 'About Us', isInternal: true, isExternal: false, hasText: true, isCrawlable: true },
        { href: 'https://github.com/drowlink', text: 'GitHub Profile', isInternal: false, isExternal: true, hasText: true, isCrawlable: true },
      ],
      totalLinks: 2,
      internalLinksCount: 1,
      externalLinksCount: 1,
      missingTextCount: 0,
      nonCrawlableCount: 0,
    },
    Keywords: {
      topKeywords: [{ word: 'optimization', count: 10, densityPercent: 3.5 }],
      totalWords: 285,
    },
    ContentChunks: {
      chunks: [],
      totalWordCount: 500,
      totalEstimatedTokens: 665,
      averageChunkTokenCount: 200,
      semanticTagsUsed: ['main', 'article'],
      hasSemanticMain: true,
      hasSemanticArticle: true,
      hasSemanticSections: true,
      totalTablesCount: 1,
      totalListsCount: 2,
      totalListItemsCount: 6,
      structuredTablesCount: 1,
    },
    DirectAnswers: {
      pairs: [],
      directAnswerRatio: 1,
      conciseAnswersCount: 2,
      definitionPatternsFound: 2,
      facts: {
        percentagesCount: 2,
        numericalMetricsCount: 2,
        citationPhrasesCount: 1,
        externalSourcesCount: 1,
        externalSourcesUrls: ['https://example.com/source'],
        totalFactSignals: 6,
      },
    },
    LlmsTxt: {
      exists: true,
      statusCode: 200,
      rawContent: '# LLMS.txt\n- [Docs](https://example.com/docs)',
      charCount: 45,
      hasFullVersion: true,
      fullStatusCode: 200,
      sections: [],
      totalDeclaredLinks: 1,
    },
    ...overrides,
  };
}

describe('Core SEO Audits Suite', () => {
  it('evaluates seo-title with optimal length (30-60 characters)', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoTitleAudit.audit(artifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('Optimal title length');
  });

  it('penalizes missing or short title', async () => {
    const artifactsShort = createMockArtifacts({
      MetaTags: { ...createMockArtifacts().MetaTags, title: 'Short' },
    });
    const resultShort = await SeoTitleAudit.audit(artifactsShort);
    expect(resultShort.score).toBeLessThan(1);

    const artifactsMissing = createMockArtifacts({
      MetaTags: { ...createMockArtifacts().MetaTags, title: null },
    });
    const resultMissing = await SeoTitleAudit.audit(artifactsMissing);
    expect(resultMissing.score).toBe(0);
  });

  it('evaluates seo-meta-description with optimal length (70-155 characters)', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoMetaDescriptionAudit.audit(artifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('Optimal description length');
  });

  it('evaluates seo-canonical tag validity', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoCanonicalAudit.audit(artifacts);
    expect(result.score).toBe(1);

    const artifactsNoCanonical = createMockArtifacts({
      MetaTags: { ...createMockArtifacts().MetaTags, canonicalUrl: null },
    });
    const resultNone = await SeoCanonicalAudit.audit(artifactsNoCanonical);
    expect(resultNone.score).toBe(0);
  });

  it('evaluates seo-indexability correctly when allowed and when blocked', async () => {
    const artifactsAllowed = createMockArtifacts();
    const resultAllowed = await SeoIndexabilityAudit.audit(artifactsAllowed);
    expect(resultAllowed.score).toBe(1);
    expect(resultAllowed.displayValue).toBe('Page is fully indexable');

    const artifactsBlocked = createMockArtifacts({
      MetaTags: { ...createMockArtifacts().MetaTags, robotsMeta: 'noindex, nofollow' },
    });
    const resultBlocked = await SeoIndexabilityAudit.audit(artifactsBlocked);
    expect(resultBlocked.score).toBe(0);
    expect(resultBlocked.displayValue).toContain('Not indexable');
  });

  it('evaluates seo-image-alt attributes', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoImageAltAudit.audit(artifacts);
    expect(result.score).toBe(1);

    const artifactsMissingAlt = createMockArtifacts({
      Images: {
        images: [
          { src: 'https://example.com/1.jpg', alt: null, hasAlt: false, isDecorative: false },
          { src: 'https://example.com/2.jpg', alt: 'Test', hasAlt: true, isDecorative: false },
        ],
        totalImages: 2,
        missingAltCount: 1,
        passedAltCount: 1,
      },
    });
    const resultMissing = await SeoImageAltAudit.audit(artifactsMissingAlt);
    expect(resultMissing.score).toBe(0.5);
  });

  it('evaluates seo-crawlable-links', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoCrawlableLinksAudit.audit(artifacts);
    expect(result.score).toBe(1);
  });

  it('evaluates seo-open-graph and twitter tags', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoOpenGraphAudit.audit(artifacts);
    expect(result.score).toBe(1);
  });

  it('evaluates seo-viewport-mobile', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoViewportMobileAudit.audit(artifacts);
    expect(result.score).toBe(1);
  });

  it('evaluates seo-https', async () => {
    const artifacts = createMockArtifacts();
    const result = await SeoHttpsAudit.audit(artifacts);
    expect(result.score).toBe(1);

    const artifactsHttp = createMockArtifacts({
      URL: { ...createMockArtifacts().URL, protocol: 'http:', finalUrl: 'http://example.com' },
    });
    const resultHttp = await SeoHttpsAudit.audit(artifactsHttp);
    expect(resultHttp.score).toBe(0);
  });
});
