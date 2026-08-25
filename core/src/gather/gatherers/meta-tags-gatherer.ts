/**
 * @fileoverview MetaTagsGatherer para extraer meta tags, canonical y OpenGraph.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { MetaTagsArtifact, GathererContext } from '../../types/index.js';

export class MetaTagsGatherer extends Gatherer<'MetaTags'> {
  public override readonly name = 'MetaTags' as const;

  public override async getArtifact(context: GathererContext): Promise<MetaTagsArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const title = $('title').first().text().trim() || null;
    const description = $('meta[name="description" i]').attr('content')?.trim() || null;
    const canonicalUrl = $('link[rel="canonical" i]').attr('href')?.trim() || null;
    const viewport = $('meta[name="viewport" i]').attr('content')?.trim() || null;
    const charset = $('meta[charset]').attr('charset')?.trim() || $('meta[http-equiv="Content-Type" i]').attr('content')?.trim() || null;
    const robotsMeta = $('meta[name="robots" i]').attr('content')?.trim() || null;

    const openGraph: Record<string, string> = {};
    $('meta[property^="og:" i]').each((_, el) => {
      const prop = $(el).attr('property')?.toLowerCase();
      const content = $(el).attr('content');
      if (prop && content) {
        openGraph[prop] = content;
      }
    });

    const twitterCard: Record<string, string> = {};
    $('meta[name^="twitter:" i]').each((_, el) => {
      const name = $(el).attr('name')?.toLowerCase();
      const content = $(el).attr('content');
      if (name && content) {
        twitterCard[name] = content;
      }
    });

    return {
      title,
      description,
      canonicalUrl,
      viewport,
      charset,
      openGraph,
      twitterCard,
      robotsMeta,
    };
  }
}
