/**
 * @fileoverview Audit verifying the presence and quality of /llms.txt and /llms-full.txt files
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiLlmsTxtAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-llms-txt',
    title: 'Website provides a standard /llms.txt file for LLM knowledge consumption',
    failureTitle: 'Missing /llms.txt file for direct LLM and AI agent ingestion',
    description:
      'The /llms.txt standard (proposed by Answer.ai) provides clean, curated Markdown summaries and documentation links specifically formatted for LLM context windows and Answer Engines.',
    requiredArtifacts: ['LlmsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const llms = artifacts.LlmsTxt;

    if (!llms.exists || !llms.rawContent) {
      return this.generateAuditResult({
        score: 0,
        displayValue: 'No /llms.txt file found',
        explanation:
          'Create an /llms.txt file at your site root with an H1 title, summary blockquote, and markdown links to help AI systems read and cite your content efficiently.',
      });
    }

    // Evaluate quality of the llms.txt file
    let score = 0.8;
    if (llms.totalDeclaredLinks > 0) {
      score += 0.1;
    }
    if (llms.hasFullVersion) {
      score += 0.1;
    }
    score = Math.min(1, score);

    const summaryItems = [
      { property: 'File Status', value: llms.exists ? 'Found (/llms.txt)' : 'Missing' },
      { property: 'Title', value: llms.title || 'Not specified' },
      { property: 'Summary', value: llms.summary || 'Not specified' },
      { property: 'Declared Links', value: `${llms.totalDeclaredLinks} links across ${llms.sections.length} section(s)` },
      { property: 'Full Version (/llms-full.txt)', value: llms.hasFullVersion ? 'Available' : 'Not detected' },
      { property: 'File Size', value: `${llms.charCount} characters` },
    ];

    const display = llms.hasFullVersion
      ? `/llms.txt & /llms-full.txt active (${llms.totalDeclaredLinks} links)`
      : `/llms.txt active (${llms.totalDeclaredLinks} links declared)`;

    return this.generateAuditResult({
      score,
      displayValue: display,
      details: this.makeTableDetails(
        [
          { key: 'property', label: 'Attribute', valueType: 'text' },
          { key: 'value', label: 'Detail', valueType: 'text' },
        ],
        summaryItems
      ),
    });
  }
}
