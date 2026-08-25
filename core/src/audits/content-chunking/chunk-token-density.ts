/**
 * @fileoverview Auditoría para evaluar el tamaño y densidad de tokens de los bloques de contenido (para RAG)
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class ChunkTokenDensityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'chunk-token-density',
    title: 'Los bloques de contenido mantienen una densidad óptima de tokens para RAG (150 - 500 tokens)',
    failureTitle: 'Los bloques de contenido son excesivamente largos o fragmentados',
    description:
      'La mayoría de modelos de embeddings de RAG (OpenAI text-embedding-3, Cohere Embed, Voyage) rinden con mayor precisión cuando los pasajes tienen entre 150 y 500 tokens estructurados bajo un encabezado temático.',
    requiredArtifacts: ['ContentChunks'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const contentChunks = artifacts.ContentChunks;
    const chunks = contentChunks.chunks;

    if (chunks.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No se encontraron bloques sustanciales de texto',
      });
    }

    const optimalChunks = chunks.filter((c) => c.estimatedTokens >= 100 && c.estimatedTokens <= 600);
    const ratio = optimalChunks.length / chunks.length;

    const tableItems = chunks.slice(0, 10).map((c) => ({
      id: c.id,
      heading: c.headingText || '(Sin encabezado)',
      words: c.wordCount,
      tokens: `~${c.estimatedTokens}`,
      status: c.estimatedTokens >= 100 && c.estimatedTokens <= 600 ? 'Óptimo' : c.estimatedTokens < 100 ? 'Muy corto' : 'Muy extenso',
    }));

    return this.generateAuditResult({
      score: ratio >= 0.7 ? 1 : Math.max(0.4, ratio),
      displayValue: `${optimalChunks.length} de ${chunks.length} bloques con tamaño óptimo (Promedio: ~${contentChunks.averageChunkTokenCount} tokens)`,
      details: this.makeTableDetails(
        [
          { key: 'id', label: 'ID', valueType: 'code' },
          { key: 'heading', label: 'Encabezado Asociado', valueType: 'text' },
          { key: 'words', label: 'Palabras', valueType: 'numeric' },
          { key: 'tokens', label: 'Tokens Estimados', valueType: 'numeric' },
          { key: 'status', label: 'Diagnóstico', valueType: 'status' },
        ],
        tableItems
      ),
    });
  }
}
