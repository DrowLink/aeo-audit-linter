/**
 * @fileoverview ImagesGatherer extracts all image elements and analyzes their alt tags and dimensions.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { ImagesArtifact, ImageItem, GathererContext } from '../../types/index.js';

export class ImagesGatherer extends Gatherer<'Images'> {
  public override readonly name = 'Images' as const;

  public override async getArtifact(context: GathererContext): Promise<ImagesArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const images: ImageItem[] = [];
    let missingAltCount = 0;
    let passedAltCount = 0;

    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      const altAttr = $(el).attr('alt');
      const role = $(el).attr('role');
      const isDecorative = role === 'presentation' || role === 'none';
      const hasAlt = altAttr !== undefined;
      const altText = altAttr !== undefined ? altAttr.trim() : null;

      const widthStr = $(el).attr('width');
      const heightStr = $(el).attr('height');
      const loading = $(el).attr('loading');

      const width = widthStr ? parseInt(widthStr, 10) : undefined;
      const height = heightStr ? parseInt(heightStr, 10) : undefined;

      if (!hasAlt && !isDecorative) {
        missingAltCount++;
      } else {
        passedAltCount++;
      }

      images.push({
        src,
        alt: altText,
        hasAlt,
        isDecorative,
        width: !isNaN(width as number) ? width : undefined,
        height: !isNaN(height as number) ? height : undefined,
        loading,
      });
    });

    return {
      images,
      totalImages: images.length,
      missingAltCount,
      passedAltCount,
    };
  }
}
