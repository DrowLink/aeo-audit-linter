/**
 * @fileoverview Audit evaluating direct answer conciseness (ideal 30 to 60 words)
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class ConciseAnswerWordCountAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'concise-answer-wordcount',
    title: 'Direct answers maintain concise length (30 - 60 words)',
    failureTitle: 'Direct answers are overly verbose or too brief',
    description:
      'Language models prefer answers between 30 and 60 words as initial featured snippets for synthesis.',
    requiredArtifacts: ['DirectAnswers'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const directAnswers = artifacts.DirectAnswers;
    const pairs = directAnswers.pairs;

    if (pairs.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No questions detected',
      });
    }

    const conciseCount = directAnswers.conciseAnswersCount;
    const ratio = conciseCount / pairs.length;
    const score = ratio >= 0.6 ? 1 : Math.max(0.3, ratio);

    return this.generateAuditResult({
      score,
      displayValue: `${conciseCount} of ${pairs.length} answers have concise length (30-60 words)`,
      numericValue: conciseCount,
      numericUnit: 'answers',
      details: this.makeTableDetails(
        [
          { key: 'question', label: 'Question', valueType: 'text' },
          { key: 'words', label: 'Word Count', valueType: 'numeric' },
          { key: 'status', label: 'Evaluation', valueType: 'status' },
        ],
        pairs.map((p) => ({
          question: p.question,
          words: p.answerWordCount,
          status: p.isConcise ? 'Concise (30-60 words)' : p.answerWordCount < 20 ? 'Too brief' : 'Verbose (>75 words)',
        }))
      ),
    });
  }
}
