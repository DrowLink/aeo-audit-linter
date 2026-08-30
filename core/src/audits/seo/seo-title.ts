/**
 * @fileoverview Audit validating HTML document title tag existence and optimal length (30-60 characters).
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoTitleAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-title',
    title: 'Document has a descriptive <title> element of optimal length',
    failureTitle: 'Document is missing a <title> element or length is suboptimal',
    description:
      'The title tag is crucial for search engine result pages (SERPs) and AI answer engines to understand the primary topic of the page. Optimal length is between 30 and 60 characters.',
    requiredArtifacts: ['MetaTags'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const title = artifacts.MetaTags.title;

    if (!title || title.trim().length === 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'Missing <title> element',
        explanation: 'The document does not contain a valid <title> tag in the <head>.',
      });
    }

    const length = title.trim().length;

    if (length >= 30 && length <= 60) {
      return this.generateAuditResult({
        score: 1,
        displayValue: `Optimal title length (${length} characters)`,
        details: this.makeTableDetails(
          [
            { key: 'title', label: 'Title Text', valueType: 'text' },
            { key: 'length', label: 'Character Count', valueType: 'numeric' },
            { key: 'status', label: 'Status', valueType: 'text' },
          ],
          [{ title, length, status: 'Optimal (30-60 chars)' }]
        ),
      });
    }

    if (length < 30) {
      return this.generateAuditResult({
        score: 0.7,
        displayValue: `Title too short (${length} chars, recommended 30-60)`,
        explanation: 'A short title may fail to provide enough topical context for search engines and LLMs.',
        details: this.makeTableDetails(
          [
            { key: 'title', label: 'Title Text', valueType: 'text' },
            { key: 'length', label: 'Character Count', valueType: 'numeric' },
            { key: 'status', label: 'Status', valueType: 'text' },
          ],
          [{ title, length, status: 'Too short (< 30 chars)' }]
        ),
      });
    }

    // length > 60
    return this.generateAuditResult({
      score: 0.8,
      displayValue: `Title longer than recommended (${length} chars, recommended 30-60)`,
      explanation: 'Titles longer than 60 characters risk getting truncated in Google SERP snippets.',
      details: this.makeTableDetails(
        [
          { key: 'title', label: 'Title Text', valueType: 'text' },
          { key: 'length', label: 'Character Count', valueType: 'numeric' },
          { key: 'status', label: 'Status', valueType: 'text' },
        ],
        [{ title, length, status: 'Too long (> 60 chars)' }]
      ),
    });
  }
}
