import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { RobotsTxtGatherer } from '../gather/gatherers/robots-txt-gatherer.js';
import { JSONLDGatherer } from '../gather/gatherers/jsonld-gatherer.js';
import { HeadingsHierarchyGatherer } from '../gather/gatherers/headings-hierarchy-gatherer.js';
import { ContentChunksGatherer } from '../gather/gatherers/content-chunks-gatherer.js';
import { DirectAnswersGatherer } from '../gather/gatherers/direct-answers-gatherer.js';

describe('Gatherers Pipeline', () => {
  it('RobotsTxtGatherer parsea directivas de AI bots correctamente', async () => {
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

    // Mock fetch for robots.txt
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

  it('JSONLDGatherer extrae tipos de esquemas y sameAs', async () => {
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
            "name": "¿Qué es AEO?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AEO es la optimización para motores de respuesta."
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

  it('HeadingsHierarchyGatherer detecta jerarquías y saltos de nivel', async () => {
    const html = `
      <html>
      <body>
        <h1>Título Principal</h1>
        <h3>Salto brusco H3 sin H2</h3>
        <h2>Ahora un H2</h2>
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

  it('DirectAnswersGatherer detecta preguntas y respuestas directas concisas', async () => {
    const html = `
      <html>
      <body>
        <h2>¿Qué es Answer Engine Optimization?</h2>
        <p>Answer Engine Optimization es un conjunto de técnicas de arquitectura web y datos estructurados orientadas a maximizar la visibilidad en motores de IA generativa y sistemas RAG.</p>
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
