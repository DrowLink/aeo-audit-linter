/**
 * @fileoverview Auditoría para validar la sintaxis e integridad de esquemas JSON-LD
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class JsonLdSyntaxValidityAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'jsonld-syntax-validity',
    title: 'Todos los bloques JSON-LD tienen sintaxis válida y sin errores',
    failureTitle: 'Se detectaron errores de sintaxis en bloques JSON-LD',
    description:
      'Un JSON malformado impide que los parsers de Answer Engines y RAG extraigan la información estructurada de la entidad.',
    requiredArtifacts: ['JSONLD'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const jsonld = artifacts.JSONLD;

    if (jsonld.items.length === 0) {
      return this.generateAuditResult({
        score: 0.5,
        displayValue: 'No se encontraron bloques JSON-LD en la página',
        explanation: 'Se recomienda agregar esquemas Schema.org mediante <script type="application/ld+json">.',
      });
    }

    const invalidItems = jsonld.items.filter((item) => !item.isValid);
    const validCount = jsonld.items.length - invalidItems.length;
    const score = validCount / jsonld.items.length;

    const tableItems = jsonld.items.map((item, idx) => ({
      index: idx + 1,
      type: item.type ? (Array.isArray(item.type) ? item.type.join(', ') : item.type) : 'Desconocido',
      status: item.isValid ? 'Válido' : 'Error de Sintaxis',
      error: item.syntaxErrors ? item.syntaxErrors.join('; ') : 'Ninguno',
    }));

    return this.generateAuditResult({
      score,
      displayValue: `${validCount} de ${jsonld.items.length} bloques JSON-LD válidos`,
      details: this.makeTableDetails(
        [
          { key: 'index', label: '#', valueType: 'numeric' },
          { key: 'type', label: '@type', valueType: 'code' },
          { key: 'status', label: 'Estado', valueType: 'status' },
          { key: 'error', label: 'Detalle', valueType: 'text' },
        ],
        tableItems
      ),
    });
  }
}
