import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { DirectAnswersGatherer } from '../gather/gatherers/direct-answers-gatherer.js';
import { FactCitationDensityAudit } from '../audits/direct-answer-density/fact-citation-density.js';
import type { Artifacts } from '../types/index.js';

describe('Fact and Citation Density Audit (GEO)', () => {
  it('DirectAnswersGatherer detects percentages, metrics, citations and external links', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <main>
          <h1>State of Generative Engine Optimization</h1>
          <h2>What does recent research indicate?</h2>
          <p>According to a study by Princeton researchers, optimizing for GEO increases citation rates by 40% across major LLMs with over 500k queries tested in 2025.</p>
          <p>For more details, see the official paper on <a href="https://arxiv.org/abs/2311.09735">arXiv</a> and <a href="https://github.com/georesearch">GitHub</a>.</p>
        </main>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com/geo-study',
      html,
    });

    const gatherer = new DirectAnswersGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com/geo-study',
      driver: mockDriver,
    });

    expect(artifact.facts.percentagesCount).toBeGreaterThanOrEqual(1);
    expect(artifact.facts.citationPhrasesCount).toBeGreaterThanOrEqual(1);
    expect(artifact.facts.externalSourcesCount).toBe(2);
    expect(artifact.facts.externalSourcesUrls).toContain('https://arxiv.org');
    expect(artifact.facts.totalFactSignals).toBeGreaterThanOrEqual(4);
  });

  it('FactCitationDensityAudit scores 1.0 with comprehensive facts and external links', async () => {
    const mockArtifacts = {
      DirectAnswers: {
        pairs: [],
        facts: {
          percentagesCount: 2,
          numericalMetricsCount: 2,
          citationPhrasesCount: 1,
          externalSourcesCount: 1,
          externalSourcesUrls: ['https://arxiv.org'],
          totalFactSignals: 6,
        },
      },
      ContentChunks: {
        totalWordCount: 350,
      },
    } as unknown as Artifacts;

    const result = await FactCitationDensityAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('6 fact signal(s) found');
    expect(result.details?.type).toBe('table');
  });

  it('FactCitationDensityAudit penalizes dense articles (>400 words) with zero facts or sources', async () => {
    const mockArtifacts = {
      DirectAnswers: {
        pairs: [],
        facts: {
          percentagesCount: 0,
          numericalMetricsCount: 0,
          citationPhrasesCount: 0,
          externalSourcesCount: 0,
          externalSourcesUrls: [],
          totalFactSignals: 0,
        },
      },
      ContentChunks: {
        totalWordCount: 700,
      },
    } as unknown as Artifacts;

    const result = await FactCitationDensityAudit.audit(mockArtifacts);
    expect(result.score).toBe(0.3);
    expect(result.explanation).toContain('verifiable percentages');
  });

  it('FactCitationDensityAudit allows short pages (<150 words)', async () => {
    const mockArtifacts = {
      DirectAnswers: {
        pairs: [],
        facts: {
          percentagesCount: 0,
          numericalMetricsCount: 0,
          citationPhrasesCount: 0,
          externalSourcesCount: 0,
          externalSourcesUrls: [],
          totalFactSignals: 0,
        },
      },
      ContentChunks: {
        totalWordCount: 80,
      },
    } as unknown as Artifacts;

    const result = await FactCitationDensityAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('Brief page');
  });
});
