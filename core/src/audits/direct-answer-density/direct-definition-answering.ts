/**
 * @fileoverview Audit evaluating presence of direct definitions answering key questions
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class DirectDefinitionAnsweringAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'direct-definition-answering',
    title: 'Key questions are answered directly with clear definitions in the opening paragraph',
    failureTitle: 'Missing direct answers or clear definitions following key questions',
    description:
      'Answer Engines (Perplexity, SearchGPT, Google AI Overviews) prioritize passages that deliver a direct answer in the opening lines (e.g. "X is a...", "The process involves..."), rather than introductory filler.',
    requiredArtifacts: ['DirectAnswers'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const directAnswers = artifacts.DirectAnswers;
    const pairs = directAnswers.pairs;

    if (pairs.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No questions detected in headings to evaluate direct answers',
        explanation: 'Structuring headings as questions (e.g. "What is X?") improves snippet extraction in Answer Engines.',
      });
    }

    const definitionPairs = pairs.filter((p) => p.hasDirectDefinition);
    const score = Math.max(0.3, definitionPairs.length / pairs.length);

    const tableItems = pairs.map((p) => ({
      question: p.question,
      words: p.answerWordCount,
      hasDef: p.hasDirectDefinition ? 'Yes (Clear definition)' : 'No (Indirect / descriptive)',
      preview: p.answerText.length > 80 ? p.answerText.slice(0, 80) + '...' : p.answerText,
    }));

    return this.generateAuditResult({
      score: definitionPairs.length > 0 ? (score >= 0.5 ? 1 : 0.7) : 0.4,
      displayValue: `${definitionPairs.length} of ${pairs.length} questions provide immediate direct definitions`,
      details: this.makeTableDetails(
        [
          { key: 'question', label: 'Detected Question', valueType: 'text' },
          { key: 'hasDef', label: 'Answer Pattern', valueType: 'status' },
          { key: 'words', label: 'Words', valueType: 'numeric' },
          { key: 'preview', label: 'Answer Extract', valueType: 'text' },
        ],
        tableItems
      ),
    });
  }
}
