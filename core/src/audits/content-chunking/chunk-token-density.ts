/**
 * @fileoverview Audit evaluating text passage length and token density for RAG embeddings
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class ChunkTokenDensityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'chunk-token-density',
    title: 'Content chunks maintain optimal token density for RAG (150 - 500 tokens)',
    failureTitle: 'Content chunks are excessively long or fragmented',
    description:
      'Most RAG embedding models (OpenAI text-embedding-3, Cohere Embed, Voyage) achieve highest retrieval precision when passages contain 150–500 tokens grouped under a topical heading.',
    requiredArtifacts: ['ContentChunks'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const contentChunks = artifacts.ContentChunks;
    const chunks = contentChunks.chunks;

    if (chunks.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No substantial text chunks found',
      });
    }

    const optimalChunks = chunks.filter((c) => c.estimatedTokens >= 100 && c.estimatedTokens <= 600);
    const ratio = optimalChunks.length / chunks.length;

    const tableItems = chunks.slice(0, 10).map((c) => ({
      id: c.id,
      heading: c.headingText || '(No heading)',
      words: c.wordCount,
      tokens: `~${c.estimatedTokens}`,
      status: c.estimatedTokens >= 100 && c.estimatedTokens <= 600 ? 'Optimal' : c.estimatedTokens < 100 ? 'Too short' : 'Too long',
    }));

    return this.generateAuditResult({
      score: ratio >= 0.7 ? 1 : Math.max(0.4, ratio),
      displayValue: `${optimalChunks.length} of ${chunks.length} chunks have optimal size (Average: ~${contentChunks.averageChunkTokenCount} tokens)`,
      details: this.makeTableDetails(
        [
          { key: 'id', label: 'ID', valueType: 'code' },
          { key: 'heading', label: 'Associated Heading', valueType: 'text' },
          { key: 'words', label: 'Words', valueType: 'numeric' },
          { key: 'tokens', label: 'Estimated Tokens', valueType: 'numeric' },
          { key: 'status', label: 'Diagnostic', valueType: 'status' },
        ],
        tableItems
      ),
    });
  }
}
