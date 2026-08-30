import { describe, it, expect } from 'vitest';
import { Runner } from '../runner/runner.js';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { HtmlReporter } from '../report/html-reporter.js';
import { TerminalReporter } from '../report/terminal-reporter.js';

describe('Runner and Aggregator Full Pipeline', () => {
  it('executes the full 3-phase lifecycle and generates reports', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>AEO Testing Page</title>
        <meta name="description" content="AEO test page for linter verification">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [{
            "@type": "Question",
            "name": "What is GEO?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "GEO is Generative Engine Optimization."
            }
          }]
        }
        </script>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Acme AEO",
          "sameAs": ["https://wikidata.org/wiki/Q999"]
        }
        </script>
      </head>
      <body>
        <main>
          <article>
            <h1>Complete Guide to AEO</h1>
            <h2>What is direct answer density?</h2>
            <p>Direct answer density is the proportion of user queries that receive a clear, synthesized definition in fewer than 60 words at the beginning of the topic section.</p>
            
            <h2>Semantic Structuring for RAG</h2>
            <p>Partitioning text into structured 200 to 400 token passages optimizes semantic vector search accuracy across models like OpenAI and Cohere.</p>
          </article>
        </main>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://aeo-example.com/test',
      html: mockHtml,
    });

    mockDriver.fetch = async (url: string) => {
      if (url.endsWith('/robots.txt')) {
        return new Response('User-agent: GPTBot\nAllow: /\nSitemap: https://aeo-example.com/sitemap.xml', {
          status: 200,
        });
      }
      if (url.endsWith('/llms.txt')) {
        return new Response('# Complete Guide\n> Comprehensive AI Guide\n- [Guide](https://aeo-example.com/guide): Docs', {
          status: 200,
        });
      }
      if (url.endsWith('/llms-full.txt')) {
        return new Response('# Full docs', { status: 200 });
      }
      return new Response('Not found', { status: 404 });
    };

    const report = await Runner.run('https://aeo-example.com/test', {
      driver: mockDriver,
    });

    expect(report.url).toBe('https://aeo-example.com/test');
    expect(report.overallScore).toBeGreaterThan(60);
    expect(report.categories['seo-fundamentals']?.score).toBeGreaterThan(0.5);
    expect(report.categories['ai-accessibility']?.score).toBe(1);
    expect(report.categories['structured-data']?.score).toBeGreaterThanOrEqual(0.8);
    expect(report.categories['content-chunking']?.score).toBeGreaterThanOrEqual(0.8);
    expect(report.categories['direct-answer-density']?.score).toBe(1);

    // Verify report generators
    const terminalOutput = TerminalReporter.generate(report);
    expect(terminalOutput).toContain('Overall AEO & SEO Score');
    expect(terminalOutput).toContain('AI Accessibility & Crawling');
    expect(terminalOutput).toContain('Core SEO & Indexability');

    const htmlOutput = HtmlReporter.generate(report);
    expect(htmlOutput).toContain('<!DOCTYPE html>');
    expect(htmlOutput).toContain('https://aeo-example.com/test');
    expect(htmlOutput).toContain('gauge-container');
  });
});
