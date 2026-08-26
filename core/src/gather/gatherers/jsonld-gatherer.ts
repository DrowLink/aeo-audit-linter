/**
 * @fileoverview JSONLDGatherer para extraer y estructurar schemas JSON-LD del DOM y señales E-E-A-T.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { JSONLDArtifact, JSONLDItem, AuthorEeatInfo, GathererContext } from '../../types/index.js';

export class JSONLDGatherer extends Gatherer<'JSONLD'> {
  public override readonly name = 'JSONLD' as const;

  public override async getArtifact(context: GathererContext): Promise<JSONLDArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const items: JSONLDItem[] = [];
    const schemasCountByType: Record<string, number> = {};
    const sameAsUrls: string[] = [];

    const authorEeat: AuthorEeatInfo = {
      hasAuthorSchema: false,
      authorSameAsUrls: [],
      hasJobTitle: false,
      hasPublisherSchema: false,
      hasDatePublished: false,
      hasDateModified: false,
      hasDomAuthorByline: false,
      hasDomPublishedDate: false,
    };

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
          this.inspectSchemaNode(parsed, schemasCountByType, sameAsUrls, authorEeat);
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

    // Check DOM byline & dates for visible E-E-A-T
    const domByline = $('[rel="author"], [itemprop="author"], .author, .byline, [class*="author-name"], [class*="post-author"]').first();
    if (domByline.length > 0) {
      const text = domByline.text().trim().replace(/\s+/g, ' ');
      if (text.length > 0 && text.length < 100) {
        authorEeat.hasDomAuthorByline = true;
        authorEeat.domAuthorText = text;
      }
    }

    const domTime = $('time[datetime], [itemprop="datePublished"], [class*="publish-date"], [class*="post-date"]').first();
    if (domTime.length > 0) {
      authorEeat.hasDomPublishedDate = true;
    }

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
      authorEeat,
    };
  }

  private inspectSchemaNode(
    node: Record<string, unknown>,
    typeCounts: Record<string, number>,
    sameAsUrls: string[],
    authorEeat: AuthorEeatInfo
  ): void {
    if (Array.isArray(node)) {
      for (const item of node) {
        if (typeof item === 'object' && item !== null) {
          this.inspectSchemaNode(item as Record<string, unknown>, typeCounts, sameAsUrls, authorEeat);
        }
      }
      return;
    }

    if (node['@graph'] && Array.isArray(node['@graph'])) {
      for (const item of node['@graph']) {
        if (typeof item === 'object' && item !== null) {
          this.inspectSchemaNode(item as Record<string, unknown>, typeCounts, sameAsUrls, authorEeat);
        }
      }
    }

    const type = node['@type'];
    if (typeof type === 'string') {
      const t = type.toLowerCase();
      typeCounts[t] = (typeCounts[t] || 0) + 1;
      if (t === 'person') {
        authorEeat.hasAuthorSchema = true;
        authorEeat.authorType = 'Person';
        if (node['name'] && typeof node['name'] === 'string') {
          authorEeat.authorName = node['name'];
        }
      }
    } else if (Array.isArray(type)) {
      for (const t of type) {
        if (typeof t === 'string') {
          const lower = t.toLowerCase();
          typeCounts[lower] = (typeCounts[lower] || 0) + 1;
          if (lower === 'person') {
            authorEeat.hasAuthorSchema = true;
            authorEeat.authorType = 'Person';
          }
        }
      }
    }

    // Inspect author property inside Article/BlogPosting
    if (node['author']) {
      authorEeat.hasAuthorSchema = true;
      const authorNode = node['author'];
      if (typeof authorNode === 'object' && authorNode !== null && !Array.isArray(authorNode)) {
        const aObj = authorNode as Record<string, unknown>;
        if (aObj['name'] && typeof aObj['name'] === 'string') {
          authorEeat.authorName = aObj['name'];
        }
        if (aObj['@type'] && typeof aObj['@type'] === 'string') {
          authorEeat.authorType = aObj['@type'];
        }
        if (aObj['jobTitle'] && typeof aObj['jobTitle'] === 'string') {
          authorEeat.hasJobTitle = true;
          authorEeat.jobTitle = aObj['jobTitle'];
        }
        if (aObj['sameAs']) {
          const s = aObj['sameAs'];
          if (typeof s === 'string') authorEeat.authorSameAsUrls.push(s);
          else if (Array.isArray(s)) authorEeat.authorSameAsUrls.push(...s.filter((x): x is string => typeof x === 'string'));
        }
      } else if (typeof authorNode === 'string') {
        authorEeat.authorName = authorNode;
      }
    }

    // Inspect publisher property
    if (node['publisher']) {
      authorEeat.hasPublisherSchema = true;
      const pubNode = node['publisher'];
      if (typeof pubNode === 'object' && pubNode !== null) {
        const pObj = pubNode as Record<string, unknown>;
        if (pObj['name'] && typeof pObj['name'] === 'string') {
          authorEeat.publisherName = pObj['name'];
        }
      }
    }

    // Dates
    if (node['datePublished'] && typeof node['datePublished'] === 'string') {
      authorEeat.hasDatePublished = true;
      authorEeat.datePublished = node['datePublished'];
    }
    if (node['dateModified'] && typeof node['dateModified'] === 'string') {
      authorEeat.hasDateModified = true;
      authorEeat.dateModified = node['dateModified'];
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
        this.inspectSchemaNode(node[key] as Record<string, unknown>, typeCounts, sameAsUrls, authorEeat);
      }
    }
  }
}
