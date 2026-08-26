import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { ContentChunksGatherer } from '../gather/gatherers/content-chunks-gatherer.js';
import { TableListScannabilityAudit } from '../audits/content-chunking/table-list-scannability.js';
import type { Artifacts } from '../types/index.js';

describe('Table and List Scannability Audit', () => {
  it('ContentChunksGatherer extracts table and list counts accurately', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <main>
          <h1>Comparison Matrix</h1>
          <p>Here is an in-depth comparison of feature sets across modern AEO architectures.</p>
          <table>
            <thead>
              <tr><th>Feature</th><th>Traditional SEO</th><th>AEO</th></tr>
            </thead>
            <tbody>
              <tr><td>Target Engine</td><td>Google Search</td><td>SearchGPT / Perplexity</td></tr>
            </tbody>
          </table>
          <h2>Implementation Steps</h2>
          <ol>
            <li>Enable LLM crawling via robots.txt</li>
            <li>Structure JSON-LD schemas</li>
            <li>Optimize direct answers</li>
          </ol>
          <ul>
            <li>Item A</li>
            <li>Item B</li>
          </ul>
        </main>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com/matrix',
      html,
    });

    const gatherer = new ContentChunksGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com/matrix',
      driver: mockDriver,
    });

    expect(artifact.totalTablesCount).toBe(1);
    expect(artifact.structuredTablesCount).toBe(1);
    expect(artifact.totalListsCount).toBe(2);
    expect(artifact.totalListItemsCount).toBe(5);
  });

  it('TableListScannabilityAudit scores 1.0 when both tables and lists are present', async () => {
    const mockArtifacts = {
      ContentChunks: {
        chunks: [{ id: 'c-1', text: 'Some text', wordCount: 200, estimatedTokens: 260, hasList: true, hasTable: true }],
        totalWordCount: 200,
        totalTablesCount: 1,
        structuredTablesCount: 1,
        totalListsCount: 1,
        totalListItemsCount: 4,
      },
    } as unknown as Artifacts;

    const result = await TableListScannabilityAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('1 table(s), 1 list(s)');
    expect(result.details?.type).toBe('table');
  });

  it('TableListScannabilityAudit scores 0.3 on dense long articles with 0 tables and 0 lists', async () => {
    const mockArtifacts = {
      ContentChunks: {
        chunks: [{ id: 'c-1', text: 'Long narrative', wordCount: 800, estimatedTokens: 1040, hasList: false, hasTable: false }],
        totalWordCount: 800,
        totalTablesCount: 0,
        structuredTablesCount: 0,
        totalListsCount: 0,
        totalListItemsCount: 0,
      },
    } as unknown as Artifacts;

    const result = await TableListScannabilityAudit.audit(mockArtifacts);
    expect(result.score).toBe(0.3);
    expect(result.explanation).toContain('Breaking continuous paragraphs into bulleted lists');
  });

  it('TableListScannabilityAudit is lenient on short pages (<150 words)', async () => {
    const mockArtifacts = {
      ContentChunks: {
        chunks: [{ id: 'c-1', text: 'Short blurb', wordCount: 80, estimatedTokens: 100, hasList: false, hasTable: false }],
        totalWordCount: 80,
        totalTablesCount: 0,
        structuredTablesCount: 0,
        totalListsCount: 0,
        totalListItemsCount: 0,
      },
    } as unknown as Artifacts;

    const result = await TableListScannabilityAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('Brief page');
  });
});
