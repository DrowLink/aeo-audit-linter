/**
 * @fileoverview Auditoría para evaluar la presencia de esquemas de alto valor para RAG
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class RagSchemaPresenceAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'rag-schema-presence',
    title: 'La página implementa esquemas JSON-LD optimizados para RAG (FAQ, HowTo, Article)',
    failureTitle: 'Faltan esquemas estructurados de alto valor para RAG',
    description:
      'Los esquemas como FAQPage, HowTo, QAPage y Article permiten a los Answer Engines extraer pares pregunta-respuesta y contenido estructurado directamente en sus respuestas sintetizadas.',
    requiredArtifacts: ['JSONLD'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const jsonld = artifacts.JSONLD;

    const ragSchemas = [
      { name: 'FAQPage', present: jsonld.hasFAQPage, value: 'Pares Q&A directos' },
      { name: 'HowTo / QAPage', present: jsonld.hasHowTo || jsonld.hasQAPage, value: 'Instrucciones paso a paso' },
      { name: 'Article / TechArticle', present: jsonld.hasArticle, value: 'Metadatos de autoría y contenido' },
      { name: 'Organization / Product', present: jsonld.hasOrganization || jsonld.hasProduct, value: 'Entidad de negocio / producto' },
    ];

    const presentCount = ragSchemas.filter((s) => s.present).length;
    let score = 0;
    if (presentCount >= 2) {
      score = 1;
    } else if (presentCount === 1) {
      score = 0.7;
    } else {
      score = 0.2;
    }

    const tableItems = ragSchemas.map((s) => ({
      schema: s.name,
      status: s.present ? 'Implementado' : 'No encontrado',
      benefit: s.value,
    }));

    return this.generateAuditResult({
      score,
      displayValue: `${presentCount} tipo(s) de esquema RAG detectados`,
      details: this.makeTableDetails(
        [
          { key: 'schema', label: 'Tipo de Esquema', valueType: 'code' },
          { key: 'status', label: 'Estado', valueType: 'status' },
          { key: 'benefit', label: 'Impacto en RAG / AEO', valueType: 'text' },
        ],
        tableItems
      ),
    });
  }
}
