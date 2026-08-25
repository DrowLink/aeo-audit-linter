/**
 * @fileoverview HeadingsHierarchyGatherer to evaluate H1-H6 sequential hierarchy and structure.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { HeadingsHierarchyArtifact, HeadingNode, GathererContext } from '../../types/index.js';

export class HeadingsHierarchyGatherer extends Gatherer<'HeadingsHierarchy'> {
  public override readonly name = 'HeadingsHierarchy' as const;

  public override async getArtifact(context: GathererContext): Promise<HeadingsHierarchyArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const headings: HeadingNode[] = [];
    let h1Count = 0;
    let h2Count = 0;
    let h3Count = 0;

    const headingElements = $('h1, h2, h3, h4, h5, h6');
    headingElements.each((index, el) => {
      const tagName = el.tagName.toLowerCase();
      const level = parseInt(tagName.charAt(1), 10) as HeadingNode['level'];
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      const id = $(el).attr('id');

      if (level === 1) h1Count++;
      if (level === 2) h2Count++;
      if (level === 3) h3Count++;

      headings.push({
        level,
        text,
        id,
        index,
      });
    });

    const skippedLevels: Array<{ from: number; to: number; text: string }> = [];
    let isHierarchySequential = true;

    for (let i = 1; i < headings.length; i++) {
      const prev = headings[i - 1];
      const curr = headings[i];

      // A skipped level occurs when heading depth increases by more than 1 (e.g. h1 -> h3)
      if (curr.level > prev.level + 1) {
        isHierarchySequential = false;
        skippedLevels.push({
          from: prev.level,
          to: curr.level,
          text: curr.text,
        });
      }
    }

    return {
      headings,
      h1Count,
      h2Count,
      h3Count,
      hasSingleH1: h1Count === 1,
      isHierarchySequential,
      skippedLevels,
    };
  }
}
