/**
 * @fileoverview Auditoría para evaluar la presencia de enlaces de desambiguación de entidades sameAs
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class EntitySameAsLinksAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'entity-sameas-links',
    title: 'Se definen propiedades sameAs para desambiguación en Grafos de Conocimiento',
    failureTitle: 'No se encontraron enlaces sameAs en los datos estructurados',
    description:
      'La propiedad `sameAs` (con enlaces a Wikidata, Wikipedia, Crunchbase o perfiles oficiales) conecta la marca o tema con entidades verificadas en el Knowledge Graph de los LLMs.',
    requiredArtifacts: ['JSONLD'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const jsonld = artifacts.JSONLD;
    const sameAsUrls = jsonld.sameAsUrls;

    const hasSameAs = sameAsUrls.length > 0;
    const score = hasSameAs ? 1 : 0.4;

    const tableItems = sameAsUrls.map((url) => {
      let authority = 'Enlace de Autoridad Externa';
      if (url.includes('wikidata.org')) authority = 'Wikidata (Alta Confianza)';
      else if (url.includes('wikipedia.org')) authority = 'Wikipedia (Alta Confianza)';
      else if (url.includes('linkedin.com') || url.includes('twitter.com') || url.includes('x.com')) authority = 'Red Social Oficial';

      return {
        url,
        type: authority,
      };
    });

    return this.generateAuditResult({
      score,
      displayValue: hasSameAs ? `${sameAsUrls.length} enlace(s) sameAs encontrados` : 'Sin enlaces sameAs',
      details: hasSameAs
        ? this.makeTableDetails(
            [
              { key: 'url', label: 'URL sameAs', valueType: 'url' },
              { key: 'type', label: 'Tipo de Entidad', valueType: 'text' },
            ],
            tableItems
          )
        : undefined,
    });
  }
}
