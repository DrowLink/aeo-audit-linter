import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { LlmsTxtGatherer } from '../gather/gatherers/llms-txt-gatherer.js';
import { AiLlmsTxtAudit } from '../audits/ai-accessibility/ai-llms-txt.js';
import type { Artifacts } from '../types/index.js';

describe('LLMS.txt Standard Gatherer & Audit', () => {
  it('LlmsTxtGatherer parses title, summary, sections and links correctly', async () => {
    const mockLlmsContent = `# FastHTML
> The fastest way to build web apps in pure Python.

## Core Documentation
- [Quickstart](https://fastht.ml/docs/quickstart.html): Get started in 5 minutes
- [Components](https://fastht.ml/docs/components.html): Comprehensive components guide

## Optional
- [API Reference](https://fastht.ml/docs/api.html)
`;

    const mockDriver = new CheerioDriver({
      url: 'https://fastht.ml/docs',
      html: '<html><body>Docs</body></html>',
    });

    mockDriver.fetch = async (url: string) => {
      if (url.endsWith('/llms.txt')) {
        return new Response(mockLlmsContent, {
          status: 200,
          headers: { 'content-type': 'text/markdown' },
        });
      }
      if (url.endsWith('/llms-full.txt')) {
        return new Response('# Full documentation\nAll text in one file.', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
      }
      return new Response('Not found', { status: 404 });
    };

    const gatherer = new LlmsTxtGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://fastht.ml/docs',
      driver: mockDriver,
    });

    expect(artifact.exists).toBe(true);
    expect(artifact.title).toBe('FastHTML');
    expect(artifact.summary).toBe('The fastest way to build web apps in pure Python.');
    expect(artifact.hasFullVersion).toBe(true);
    expect(artifact.totalDeclaredLinks).toBe(3);
    expect(artifact.sections.length).toBe(2);
    expect(artifact.sections[0]?.title).toBe('Core Documentation');
    expect(artifact.sections[0]?.links[0]?.title).toBe('Quickstart');
    expect(artifact.sections[0]?.links[0]?.description).toBe('Get started in 5 minutes');
  });

  it('LlmsTxtGatherer rejects HTML 404 error page disguised as 200', async () => {
    const mockHtml404 = `<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>404 Not Found</h1></body></html>`;

    const mockDriver = new CheerioDriver({
      url: 'https://spa-example.com',
      html: '<html><body>App</body></html>',
    });

    mockDriver.fetch = async () =>
      new Response(mockHtml404, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });

    const gatherer = new LlmsTxtGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://spa-example.com',
      driver: mockDriver,
    });

    expect(artifact.exists).toBe(false);
    expect(artifact.rawContent).toBeNull();
  });

  it('AiLlmsTxtAudit scores 1.0 when valid llms.txt and full version are present', async () => {
    const mockArtifacts = {
      LlmsTxt: {
        exists: true,
        statusCode: 200,
        rawContent: '# My Project\n> Summary\n- [Link](https://example.com)',
        charCount: 50,
        hasFullVersion: true,
        fullStatusCode: 200,
        title: 'My Project',
        summary: 'Summary',
        sections: [{ title: 'Main', links: [{ title: 'Link', url: 'https://example.com' }] }],
        totalDeclaredLinks: 1,
      },
    } as unknown as Artifacts;

    const result = await AiLlmsTxtAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('active');
    expect(result.details?.type).toBe('table');
  });

  it('AiLlmsTxtAudit scores 0 with actionable advice when missing', async () => {
    const mockArtifacts = {
      LlmsTxt: {
        exists: false,
        statusCode: 404,
        rawContent: null,
        charCount: 0,
        hasFullVersion: false,
        fullStatusCode: 404,
        sections: [],
        totalDeclaredLinks: 0,
      },
    } as unknown as Artifacts;

    const result = await AiLlmsTxtAudit.audit(mockArtifacts);
    expect(result.score).toBe(0);
    expect(result.displayValue).toBe('No /llms.txt file found');
    expect(result.explanation).toContain('Create an /llms.txt file at your site root');
  });
});
