/**
 * @fileoverview LinksGatherer extracts all hyperlink elements, evaluating internal/external distribution and crawlability.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { LinksArtifact, LinkItem, GathererContext } from '../../types/index.js';

export class LinksGatherer extends Gatherer<'Links'> {
  public override readonly name = 'Links' as const;

  public override async getArtifact(context: GathererContext): Promise<LinksArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const baseUrlStr = context.url;
    let baseHostname = '';
    try {
      baseHostname = new URL(baseUrlStr).hostname.toLowerCase();
    } catch {}

    const links: LinkItem[] = [];
    let internalLinksCount = 0;
    let externalLinksCount = 0;
    let missingTextCount = 0;
    let nonCrawlableCount = 0;

    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const rel = $(el).attr('rel');
      const target = $(el).attr('target');

      const trimmedHref = href.trim();
      const isAnchorOnly = trimmedHref === '' || trimmedHref === '#' || trimmedHref.startsWith('#');
      const isJs = trimmedHref.toLowerCase().startsWith('javascript:');
      const isMailOrTel = trimmedHref.toLowerCase().startsWith('mailto:') || trimmedHref.toLowerCase().startsWith('tel:');

      const isCrawlable = !isJs && !isAnchorOnly && !isMailOrTel && trimmedHref.length > 0;

      let isInternal = false;
      let isExternal = false;

      if (isCrawlable) {
        try {
          const resolved = new URL(trimmedHref, baseUrlStr);
          if (baseHostname && (resolved.hostname.toLowerCase() === baseHostname || resolved.hostname.toLowerCase().endsWith('.' + baseHostname))) {
            isInternal = true;
            internalLinksCount++;
          } else {
            isExternal = true;
            externalLinksCount++;
          }
        } catch {
          // If relative URL that failed resolution or malformed
          if (!trimmedHref.startsWith('http')) {
            isInternal = true;
            internalLinksCount++;
          } else {
            isExternal = true;
            externalLinksCount++;
          }
        }
      } else {
        nonCrawlableCount++;
      }

      const hasText = text.length > 0 || $(el).find('img[alt]').length > 0 || $(el).attr('aria-label')?.trim()?.length! > 0;
      if (!hasText) {
        missingTextCount++;
      }

      links.push({
        href: trimmedHref,
        text: text || $(el).attr('aria-label') || $(el).find('img').attr('alt') || '',
        isInternal,
        isExternal,
        hasText,
        isCrawlable,
        rel,
        target,
      });
    });

    return {
      links,
      totalLinks: links.length,
      internalLinksCount,
      externalLinksCount,
      missingTextCount,
      nonCrawlableCount,
    };
  }
}
