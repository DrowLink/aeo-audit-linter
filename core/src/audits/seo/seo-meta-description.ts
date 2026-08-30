/**
 * @fileoverview Audit validating meta description tag existence and optimal length (70-155 characters).
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class SeoMetaDescriptionAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'seo-meta-description',
    title: 'Document has a meta description of optimal length',
    failureTitle: 'Document is missing a meta description or length is suboptimal',
    description:
      'Meta descriptions provide concise summaries in search engine results (SERP) and help AI search engines parse summary snippets. Optimal length is 70-155 characters.',
    requiredArtifacts: ['MetaTags'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const description = artifacts.MetaTags.description;

    if (!description || description.trim().length === 0) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'Missing meta description',
        explanation: 'No <meta name="description"> tag was found in the document.',
      });
    }

    const length = description.trim().length;

    if (length >= 70 && length <= 155) {
      return this.generateAuditResult({
        score: 1,
        displayValue: `Optimal description length (${length} characters)`,
        details: this.makeTableDetails(
          [
            { key: 'description', label: 'Meta Description', valueType: 'text' },
            { key: 'length', label: 'Character Count', valueType: 'numeric' },
            { key: 'status', label: 'Status', valueType: 'text' },
          ],
          [{ description, length, status: 'Optimal (70-155 chars)' }]
        ),
      });
    }

    if (length < 70) {
      return this.generateAuditResult({
        score: 0.6,
        displayValue: `Description too short (${length} chars, recommended 70-155)`,
        explanation: 'A short description may not provide enough context for search engines to generate a compelling snippet.',
        details: this.makeTableDetails(
          [
            { key: 'description', label: 'Meta Description', valueType: 'text' },
            { key: 'length', label: 'Character Count', valueType: 'numeric' },
            { key: 'status', label: 'Status', valueType: 'text' },
          ],
          [{ description, length, status: 'Too short (< 70 chars)' }]
        ),
      });
    }

    // length > 155
    return this.generateAuditResult({
      score: 0.75,
      displayValue: `Description longer than recommended (${length} chars, recommended 70-155)`,
      explanation: 'Descriptions over 155 characters may be truncated in search snippets on desktop and mobile.',
      details: this.makeTableDetails(
        [
          { key: 'description', label: 'Meta Description', valueType: 'text' },
          { key: 'length', label: 'Character Count', valueType: 'numeric' },
          { key: 'status', label: 'Status', valueType: 'text' },
        ],
        [{ description, length, status: 'Too long (> 155 chars)' }]
      ),
    });
  }
}
