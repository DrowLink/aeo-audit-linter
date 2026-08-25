/**
 * @fileoverview JSONLDGatherer para extraer y estructurar schemas JSON-LD del DOM.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { JSONLDArtifact, JSONLDItem, GathererContext } from '../../types/index.js';

export class JSONLDGatherer extends Gatherer<'JSONLD'> {
  public override readonly name = 'JSONLD' as const;

  public override async getArtifact(context: GathererContext): Promise<JSONLDArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const items: JSONLDItem[] = [];
    const schemasCountByType: Record<string, number> = {};
    const sameAsUrls: string[] = [];

    const scriptTags = $('script[type="application/ld+json"]');

    scriptTags.each((_, el) => {
      const raw = $(el).text().trim();
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        const item: JSONLDItem = {
          raw,
          parsed,
          type: null,
          context: null,
          isValid: true,
        };

        if (typeof parsed === 'object' && parsed !== null) {
          item.context = parsed['@context'] ? String(parsed['@context']) : null;
          item.type = parsed['@type'] ?? null;
          this.inspectSchemaNode(parsed, schemasCountByType, sameAsUrls);
        }

        items.push(item);
      } catch (err) {
        items.push({
          raw,
          parsed: null,
          type: null,
          context: null,
          isValid: false,
          syntaxErrors: [err instanceof Error ? err.message : String(err)],
        });
      }
    });

    const hasType = (typeName: string): boolean => {
      const count = schemasCountByType[typeName.toLowerCase()] || 0;
      return count > 0;
    };

    return {
      items,
      schemasCountByType,
      hasFAQPage: hasType('faqpage'),
      hasHowTo: hasType('howto'),
      hasArticle: hasType('article') || hasType('newsarticle') || hasType('techarticle') || hasType('blogposting'),
      hasQAPage: hasType('qapage'),
      hasOrganization: hasType('organization') || hasType('corporation'),
      hasProduct: hasType('product'),
      hasSameAs: sameAsUrls.length > 0,
      sameAsUrls,
    };
  }

  private inspectSchemaNode(
    node: Record<string, unknown>,
    typeCounts: Record<string, number>,
    sameAsUrls: string[]
  ): void {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === 'object' && item !== null) {
          this.inspectSchemaNode(item as Record<string, unknown>, typeCounts, sameAsUrls);
        }
      }
      return;
    }

    if (node['@graph'] && Array.isArray(node['@graph'])) {
      for (const item of node['@graph']) {
        if (typeof item === 'object' && item !== null) {
          this.inspectSchemaNode(item as Record<string, unknown>, typeCounts, sameAsUrls);
        }
      }
    }

    const type = node['@type'];
    if (typeof type === 'string') {
      const t = type.toLowerCase();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    } else if (Array.isArray(type)) {
      for (const t of type) {
        if (typeof t === 'string') {
          const lower = t.toLowerCase();
          typeCounts[lower] = (typeCounts[lower] || 0) + 1;
        }
      }
    }

    const sameAs = node['sameAs'];
    if (typeof sameAs === 'string' && sameAs.trim()) {
      sameAsUrls.push(sameAs.trim());
    } else if (Array.isArray(sameAs)) {
      for (const s of sameAs) {
        if (typeof s === 'string' && s.trim()) {
          sameAsUrls.push(s.trim());
        }
      }
    }

    for (const key of Object.keys(node)) {
      if (key !== '@graph' && typeof node[key] === 'object' && node[key] !== null) {
        this.inspectSchemaNode(node[key] as Record<string, unknown>, typeCounts, sameAsUrls);
      }
    }
  }
}
