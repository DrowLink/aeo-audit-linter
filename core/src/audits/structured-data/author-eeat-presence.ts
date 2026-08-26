/**
 * @fileoverview Audit verifying author credentials, publisher identity, and E-E-A-T signals for Answer Engines.
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AuthorEeatPresenceAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'author-eeat-presence',
    title: 'Content features verified author credentials and E-E-A-T structured schema',
    failureTitle: 'Missing author credentials, publisher identity, or E-E-A-T metadata',
    description:
      'Answer Engines and AI search systems rely on E-E-A-T signals (Author schema, sameAs profile links, publisher info, visible bylines) to prioritize trusted, expert content over automated spam.',
    requiredArtifacts: ['JSONLD', 'ContentChunks'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const { authorEeat } = artifacts.JSONLD;
    const { totalWordCount } = artifacts.ContentChunks;

    if (totalWordCount < 150) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Brief page (Author E-E-A-T optional)',
        explanation: 'Page has brief content under 150 words where individual author bylines and schemas are optional.',
      });
    }

    const {
      hasAuthorSchema,
      authorName,
      authorType,
      authorSameAsUrls,
      hasPublisherSchema,
      publisherName,
      hasDatePublished,
      datePublished,
      hasDateModified,
      dateModified,
      hasDomAuthorByline,
      domAuthorText,
      hasDomPublishedDate,
    } = authorEeat;

    let score = 0.5;
    let statusSummary = '';

    if (hasAuthorSchema && authorSameAsUrls.length > 0 && (hasPublisherSchema || hasDomAuthorByline)) {
      score = 1.0;
      statusSummary = `Author verified: ${authorName || 'Expert'} with sameAs profile links`;
    } else if (hasAuthorSchema && (hasPublisherSchema || hasDomAuthorByline)) {
      score = 0.85;
      statusSummary = `Author schema detected: ${authorName || 'Identified'}`;
    } else if (hasAuthorSchema || hasDomAuthorByline) {
      score = 0.65;
      statusSummary = authorName || domAuthorText ? `Author byline found: ${authorName || domAuthorText}` : 'Basic author signal found';
    } else if (hasPublisherSchema || artifacts.JSONLD.hasOrganization) {
      score = 0.5;
      statusSummary = 'Publisher/Organization identified (no specific author)';
    } else {
      score = totalWordCount > 400 ? 0.2 : 0.4;
      statusSummary = 'No author or publisher credentials detected';
    }

    const summaryTable = [
      {
        attribute: 'Author Name (Schema / DOM)',
        value: authorName || domAuthorText || 'Not specified',
        status: hasAuthorSchema || hasDomAuthorByline ? 'Present' : 'Missing',
      },
      {
        attribute: 'Author Schema Type',
        value: authorType || (hasAuthorSchema ? 'Person' : 'None'),
        status: hasAuthorSchema ? 'Structured JSON-LD' : 'Missing',
      },
      {
        attribute: 'Author Social / SameAs Links',
        value: authorSameAsUrls.length > 0 ? authorSameAsUrls.slice(0, 3).join(', ') : 'None',
        status: authorSameAsUrls.length > 0 ? 'Disambiguated' : 'Recommended',
      },
      {
        attribute: 'Publisher / Organization',
        value: publisherName || (artifacts.JSONLD.hasOrganization ? 'Organization schema found' : 'Not declared'),
        status: hasPublisherSchema || artifacts.JSONLD.hasOrganization ? 'Present' : 'Missing',
      },
      {
        attribute: 'Date Published / Modified',
        value: datePublished || dateModified || (hasDomPublishedDate ? 'Visible in DOM' : 'Not specified'),
        status: hasDatePublished || hasDateModified || hasDomPublishedDate ? 'Freshness tracked' : 'Missing',
      },
    ];

    return this.generateAuditResult({
      score,
      displayValue: statusSummary,
      explanation: score < 0.85
        ? 'Adding an Article/Person schema with author name, jobTitle, sameAs links (LinkedIn/Twitter), and publisher info verifies content authority for AI Answer Engines.'
        : undefined,
      details: this.makeTableDetails(
        [
          { key: 'attribute', label: 'E-E-A-T Signal', valueType: 'text' },
          { key: 'value', label: 'Value / Identifier', valueType: 'text' },
          { key: 'status', label: 'Evaluation', valueType: 'text' },
        ],
        summaryTable
      ),
    });
  }
}
