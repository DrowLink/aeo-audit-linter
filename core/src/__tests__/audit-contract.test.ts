import { describe, it, expect } from 'vitest';
import { Audit } from '../audits/audit.js';
import { defaultConfig } from '../config/default-config.js';
import type { Artifacts, AuditMeta, AuditResult } from '../types/index.js';

class MockRobotsAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-robots-txt',
    title: 'Robots.txt permite acceso a bots de IA',
    failureTitle: 'Robots.txt bloquea rastreadores de IA',
    description: 'Verifica directivas para GPTBot, PerplexityBot, etc.',
    requiredArtifacts: ['RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const isAllowed = artifacts.RobotsTxt.aiBotsStatus.gptBot === 'allowed';
    return this.generateAuditResult({
      score: this.binaryScore(isAllowed),
      displayValue: isAllowed ? 'GPTBot permitido' : 'GPTBot bloqueado',
      details: this.makeTableDetails(
        [
          { key: 'bot', label: 'Bot de IA' },
          { key: 'status', label: 'Estado' },
        ],
        [{ bot: 'GPTBot', status: artifacts.RobotsTxt.aiBotsStatus.gptBot }]
      ),
    });
  }
}

describe('AEO Linter Core Contracts (Lighthouse Architecture)', () => {
  it('debe definir las 4 categorías clave de AEO con ponderaciones', () => {
    const categories = Object.keys(defaultConfig.categories);
    expect(categories).toContain('ai-accessibility');
    expect(categories).toContain('structured-data');
    expect(categories).toContain('content-chunking');
    expect(categories).toContain('direct-answer-density');

    // Verificar que la suma de pesos de categorías principales sea 100%
    const totalWeight = Object.values(defaultConfig.categories).reduce(
      (sum, cat) => sum + (cat.weight || 0),
      0
    );
    expect(totalWeight).toBe(100);
  });

  it('debe ejecutar una auditoría mock derivada de Audit y generar un AuditResult válido', async () => {
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
        title: 'Ejemplo AEO',
        description: 'Meta descripción optimizada',
        canonicalUrl: 'https://example.com',
        viewport: 'width=device-width',
        charset: 'utf-8',
        openGraph: {},
        twitterCard: {},
        robotsMeta: null,
      },
      HeadingsHierarchy: {
        headings: [{ level: 1, text: 'Título H1', index: 0 }],
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
      },
      DirectAnswers: {
        pairs: [],
        directAnswerRatio: 0,
        conciseAnswersCount: 0,
        definitionPatternsFound: 0,
      },
    };

    const result = await MockRobotsAudit.audit(mockArtifacts);
    expect(result.id).toBe('ai-robots-txt');
    expect(result.score).toBe(1);
    expect(result.scoreDisplayMode).toBe('binary');
    expect(result.displayValue).toBe('GPTBot permitido');
    expect(result.details?.type).toBe('table');
  });
});
