import { describe, it, expect } from 'vitest';
import { Audit } from '../audits/audit.js';
import { defaultConfig } from '../config/default-config.js';
import type { Artifacts, AuditMeta, AuditResult } from '../types/index.js';

class MockRobotsAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-robots-txt',
    title: 'robots.txt allows crawling by AI bots',
    failureTitle: 'robots.txt blocks AI search crawlers',
    description: 'Verifies directives for GPTBot, PerplexityBot, etc.',
    requiredArtifacts: ['RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const isAllowed = artifacts.RobotsTxt.aiBotsStatus.gptBot === 'allowed';
    return this.generateAuditResult({
      score: this.binaryScore(isAllowed),
      displayValue: isAllowed ? 'GPTBot allowed' : 'GPTBot blocked',
      details: this.makeTableDetails(
        [
          { key: 'bot', label: 'AI Bot' },
          { key: 'status', label: 'Status' },
        ],
        [{ bot: 'GPTBot', status: artifacts.RobotsTxt.aiBotsStatus.gptBot }]
      ),
    });
  }
}

describe('AEO Linter Core Contracts (Lighthouse Architecture)', () => {
  it('defines the 4 key AEO categories with weights summing to 100', () => {
    const categories = Object.keys(defaultConfig.categories);
    expect(categories).toContain('ai-accessibility');
    expect(categories).toContain('structured-data');
    expect(categories).toContain('content-chunking');
    expect(categories).toContain('direct-answer-density');

    const totalWeight = Object.values(defaultConfig.categories).reduce(
      (sum, cat) => sum + (cat.weight || 0),
      0
    );
    expect(totalWeight).toBe(100);
  });

  it('executes a mock audit derived from Audit and produces a valid AuditResult', async () => {
    const mockArtifacts: Artifacts = {
      URL: {
        requestedUrl: 'https://example.com',
        finalUrl: 'https://example.com',
        domain: 'example.com',
        pathname: '/',
        protocol: 'https:',
      },
      RobotsTxt: {
        rawContent: 'User-agent: GPTBot\nAllow: /',
        statusCode: 200,
        exists: true,
        sitemaps: ['https://example.com/sitemap.xml'],
        rulesByAgent: {
          gptbot: { userAgent: 'GPTBot', allow: ['/'], disallow: [] },
        },
        aiBotsStatus: {
          gptBot: 'allowed',
        },
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
      },
      MetaTags: {
        title: 'AEO Example',
        description: 'Optimized meta description',
        canonicalUrl: 'https://example.com',
        viewport: 'width=device-width',
        charset: 'utf-8',
        openGraph: {},
        twitterCard: {},
        robotsMeta: null,
      },
      HeadingsHierarchy: {
        headings: [{ level: 1, text: 'H1 Title', index: 0 }],
        h1Count: 1,
        h2Count: 0,
        h3Count: 0,
        hasSingleH1: true,
        isHierarchySequential: true,
        skippedLevels: [],
      },
      ContentChunks: {
        chunks: [],
        totalWordCount: 0,
        totalEstimatedTokens: 0,
        averageChunkTokenCount: 0,
        semanticTagsUsed: ['main'],
        hasSemanticMain: true,
        hasSemanticArticle: false,
        hasSemanticSections: false,
        totalTablesCount: 0,
        totalListsCount: 0,
        totalListItemsCount: 0,
        structuredTablesCount: 0,
      },
      DirectAnswers: {
        pairs: [],
        directAnswerRatio: 0,
        conciseAnswersCount: 0,
        definitionPatternsFound: 0,
        facts: {
          percentagesCount: 0,
          numericalMetricsCount: 0,
          citationPhrasesCount: 0,
          externalSourcesCount: 0,
          externalSourcesUrls: [],
          totalFactSignals: 0,
        },
      },
      LlmsTxt: {
        exists: true,
        statusCode: 200,
        rawContent: '# Test',
        charCount: 6,
        hasFullVersion: false,
        fullStatusCode: 404,
        sections: [],
        totalDeclaredLinks: 0,
      },
    };

    const result = await MockRobotsAudit.audit(mockArtifacts);
    expect(result.id).toBe('ai-robots-txt');
    expect(result.score).toBe(1);
    expect(result.scoreDisplayMode).toBe('binary');
    expect(result.displayValue).toBe('GPTBot allowed');
    expect(result.details?.type).toBe('table');
  });
});
