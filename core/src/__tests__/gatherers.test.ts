import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { RobotsTxtGatherer } from '../gather/gatherers/robots-txt-gatherer.js';
import { JSONLDGatherer } from '../gather/gatherers/jsonld-gatherer.js';
import { HeadingsHierarchyGatherer } from '../gather/gatherers/headings-hierarchy-gatherer.js';
import { ContentChunksGatherer } from '../gather/gatherers/content-chunks-gatherer.js';
import { DirectAnswersGatherer } from '../gather/gatherers/direct-answers-gatherer.js';

describe('Gatherers Pipeline', () => {
  it('RobotsTxtGatherer parses AI bot directives correctly', async () => {
    const mockRobotsContent = `
User-agent: GPTBot
Disallow: /private/
Allow: /

User-agent: PerplexityBot
Disallow: /

User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com/test',
      html: '<html><body>Hello</body></html>',
    });

    mockDriver.fetch = async () =>
      new Response(mockRobotsContent, {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });

    const gatherer = new RobotsTxtGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com/test',
      driver: mockDriver,
    });

    expect(artifact.exists).toBe(true);
    expect(artifact.sitemaps).toContain('https://example.com/sitemap.xml');
    expect(artifact.aiBotsStatus.gptBot).toBe('allowed');
    expect(artifact.aiBotsStatus.perplexityBot).toBe('disallowed');
  });

  it('JSONLDGatherer extracts schema types and sameAs links', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [{
            "@type": "Question",
            "name": "What is AEO?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AEO is Answer Engine Optimization."
            }
          }]
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "AEO Corp",
          "sameAs": [
            "https://www.wikidata.org/wiki/Q12345",
            "https://twitter.com/aeocorp"
          ]
        }
        </script>
      </head>
      <body></body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com',
      html,
    });

    const gatherer = new JSONLDGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com',
      driver: mockDriver,
    });

    expect(artifact.items.length).toBe(2);
    expect(artifact.hasFAQPage).toBe(true);
    expect(artifact.hasOrganization).toBe(true);
    expect(artifact.hasSameAs).toBe(true);
    expect(artifact.sameAsUrls).toContain('https://www.wikidata.org/wiki/Q12345');
  });

  it('HeadingsHierarchyGatherer detects hierarchies and skipped levels', async () => {
    const html = `
      <html>
      <body>
        <h1>Main Heading</h1>
        <h3>Abrupt H3 jump without H2</h3>
        <h2>Now an H2</h2>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com',
      html,
    });

    const gatherer = new HeadingsHierarchyGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com',
      driver: mockDriver,
    });

    expect(artifact.h1Count).toBe(1);
    expect(artifact.hasSingleH1).toBe(true);
    expect(artifact.isHierarchySequential).toBe(false);
    expect(artifact.skippedLevels.length).toBe(1);
    expect(artifact.skippedLevels[0]?.from).toBe(1);
    expect(artifact.skippedLevels[0]?.to).toBe(3);
  });

  it('DirectAnswersGatherer detects questions and concise direct answers', async () => {
    const html = `
      <html>
      <body>
        <h2>What is Answer Engine Optimization?</h2>
        <p>Answer Engine Optimization is a framework of web architecture, semantic chunking, and structured data practices designed to maximize visibility in generative AI engines and RAG retrieval pipelines.</p>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com',
      html,
    });

    const gatherer = new DirectAnswersGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com',
      driver: mockDriver,
    });

    expect(artifact.pairs.length).toBe(1);
    expect(artifact.pairs[0]?.hasDirectDefinition).toBe(true);
    expect(artifact.pairs[0]?.isConcise).toBe(true);
  });
});
