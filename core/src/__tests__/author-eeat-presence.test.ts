import { describe, it, expect } from 'vitest';
import { CheerioDriver } from '../gather/driver/cheerio-driver.js';
import { JSONLDGatherer } from '../gather/gatherers/jsonld-gatherer.js';
import { AuthorEeatPresenceAudit } from '../audits/structured-data/author-eeat-presence.js';
import type { Artifacts } from '../types/index.js';

describe('Author E-E-A-T Presence Audit', () => {
  it('JSONLDGatherer extracts structured author, publisher, and DOM bylines', async () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "AEO Architectural Blueprint",
          "datePublished": "2026-01-15T08:00:00Z",
          "dateModified": "2026-02-20T10:00:00Z",
          "author": {
            "@type": "Person",
            "name": "Dr. Jane Doe",
            "jobTitle": "Principal AI Researcher",
            "sameAs": [
              "https://www.linkedin.com/in/janedoe",
              "https://twitter.com/janedoe"
            ]
          },
          "publisher": {
            "@type": "Organization",
            "name": "AI Research Labs"
          }
        }
        </script>
      </head>
      <body>
        <main>
          <h1>AEO Architectural Blueprint</h1>
          <p class="author-name">By Dr. Jane Doe</p>
          <time datetime="2026-01-15">January 15, 2026</time>
        </main>
      </body>
      </html>
    `;

    const mockDriver = new CheerioDriver({
      url: 'https://example.com/article',
      html,
    });

    const gatherer = new JSONLDGatherer();
    const artifact = await gatherer.getArtifact({
      url: 'https://example.com/article',
      driver: mockDriver,
    });

    expect(artifact.authorEeat.hasAuthorSchema).toBe(true);
    expect(artifact.authorEeat.authorName).toBe('Dr. Jane Doe');
    expect(artifact.authorEeat.authorType).toBe('Person');
    expect(artifact.authorEeat.hasJobTitle).toBe(true);
    expect(artifact.authorEeat.authorSameAsUrls).toContain('https://www.linkedin.com/in/janedoe');
    expect(artifact.authorEeat.hasPublisherSchema).toBe(true);
    expect(artifact.authorEeat.publisherName).toBe('AI Research Labs');
    expect(artifact.authorEeat.hasDatePublished).toBe(true);
    expect(artifact.authorEeat.hasDomAuthorByline).toBe(true);
    expect(artifact.authorEeat.domAuthorText).toContain('Dr. Jane Doe');
  });

  it('AuthorEeatPresenceAudit scores 1.0 for verified authors with sameAs profiles and publisher', async () => {
    const mockArtifacts = {
      JSONLD: {
        hasOrganization: true,
        authorEeat: {
          hasAuthorSchema: true,
          authorName: 'Dr. Jane Doe',
          authorType: 'Person',
          authorSameAsUrls: ['https://linkedin.com/in/janedoe'],
          hasPublisherSchema: true,
          publisherName: 'AI Labs',
          hasDatePublished: true,
          datePublished: '2026-01-01',
          hasDateModified: true,
          dateModified: '2026-02-01',
          hasDomAuthorByline: true,
          domAuthorText: 'By Dr. Jane Doe',
          hasDomPublishedDate: true,
        },
      },
      ContentChunks: {
        totalWordCount: 500,
      },
    } as unknown as Artifacts;

    const result = await AuthorEeatPresenceAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('Author verified: Dr. Jane Doe');
    expect(result.details?.type).toBe('table');
  });

  it('AuthorEeatPresenceAudit penalizes long articles (>400 words) with zero author/publisher credentials', async () => {
    const mockArtifacts = {
      JSONLD: {
        hasOrganization: false,
        authorEeat: {
          hasAuthorSchema: false,
          authorSameAsUrls: [],
          hasPublisherSchema: false,
          hasDatePublished: false,
          hasDateModified: false,
          hasDomAuthorByline: false,
          hasDomPublishedDate: false,
        },
      },
      ContentChunks: {
        totalWordCount: 650,
      },
    } as unknown as Artifacts;

    const result = await AuthorEeatPresenceAudit.audit(mockArtifacts);
    expect(result.score).toBe(0.2);
    expect(result.explanation).toContain('Article/Person schema with author name');
  });

  it('AuthorEeatPresenceAudit is lenient on short pages (<150 words)', async () => {
    const mockArtifacts = {
      JSONLD: {
        hasOrganization: false,
        authorEeat: {
          hasAuthorSchema: false,
          authorSameAsUrls: [],
          hasPublisherSchema: false,
          hasDatePublished: false,
          hasDateModified: false,
          hasDomAuthorByline: false,
          hasDomPublishedDate: false,
        },
      },
      ContentChunks: {
        totalWordCount: 90,
      },
    } as unknown as Artifacts;

    const result = await AuthorEeatPresenceAudit.audit(mockArtifacts);
    expect(result.score).toBe(1);
    expect(result.displayValue).toContain('Brief page');
  });
});
