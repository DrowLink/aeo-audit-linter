import { describe, it, expect } from 'vitest';
import { Runner } from '../runner/runner.js';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { HtmlReporter } from '../report/html-reporter.js';
import { TerminalReporter } from '../report/terminal-reporter.js';

describe('Runner and Aggregator Full Pipeline', () => {
  it('ejecuta el ciclo de vida completo de 3 fases y genera reportes', async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <title>AEO Testing Page</title>
        <meta name="description" content="Página de prueba para linter AEO">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [{
            "@type": "Question",
            "name": "¿Qué es GEO?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "GEO es Generative Engine Optimization."
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
            <h1>Guía Completa de AEO</h1>
            <h2>¿Qué es la densidad de respuestas directas?</h2>
            <p>La densidad de respuestas directas es la proporción de consultas de usuario que reciben una definición clara y sintetizada en menos de 60 palabras al inicio de la sección temática.</p>
            
            <h2>Estructuración Semántica para RAG</h2>
            <p>Dividir el texto en bloques de 200 a 400 tokens optimiza la precisión de búsqueda semántica vectorial en modelos como OpenAI y Cohere.</p>
          </article>
        </main>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://aeo-example.com/test',
      html: mockHtml,
    });

    mockDriver.fetch = async () =>
      new Response('User-agent: GPTBot\nAllow: /\nSitemap: https://aeo-example.com/sitemap.xml', {
        status: 200,
      });

    const report = await Runner.run('https://aeo-example.com/test', {
      driver: mockDriver,
    });

    expect(report.url).toBe('https://aeo-example.com/test');
    expect(report.overallScore).toBeGreaterThan(70);
    expect(report.categories['ai-accessibility']?.score).toBe(1);
    expect(report.categories['structured-data']?.score).toBeGreaterThanOrEqual(0.8);
    expect(report.categories['content-chunking']?.score).toBeGreaterThanOrEqual(0.8);
    expect(report.categories['direct-answer-density']?.score).toBe(1);

    // Verificar generación de reportes
    const terminalOutput = TerminalReporter.generate(report);
    expect(terminalOutput).toContain('Score General AEO');
    expect(terminalOutput).toContain('AI Accessibility & Crawling');

    const htmlOutput = HtmlReporter.generate(report);
    expect(htmlOutput).toContain('<!DOCTYPE html>');
    expect(htmlOutput).toContain('https://aeo-example.com/test');
    expect(htmlOutput).toContain('gauge-container');
  });
});
