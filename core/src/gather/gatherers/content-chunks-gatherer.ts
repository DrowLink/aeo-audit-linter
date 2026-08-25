/**
 * @fileoverview ContentChunksGatherer for semantic content chunking and token density estimation for RAG.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { ContentChunksArtifact, ContentChunk, GathererContext } from '../../types/index.js';

export class ContentChunksGatherer extends Gatherer<'ContentChunks'> {
  public override readonly name = 'ContentChunks' as const;

  public override async getArtifact(context: GathererContext): Promise<ContentChunksArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    // Remove boilerplate non-content tags
    $('script, style, noscript, svg, nav, footer, header').remove();

    const semanticTagsUsed: string[] = [];
    if ($('main').length > 0) semanticTagsUsed.push('main');
    if ($('article').length > 0) semanticTagsUsed.push('article');
    if ($('section').length > 0) semanticTagsUsed.push('section');

    const chunks: ContentChunk[] = [];
    let chunkCounter = 0;

    const contentContainers = $('article, section, main');
    const targetElements = contentContainers.length > 0 ? contentContainers : $('body');

    targetElements.each((_, container) => {
      const containerTag = container.tagName.toLowerCase();
      const isSemantic = ['article', 'section', 'main'].includes(containerTag);

      const subNodes = $(container).children('h1, h2, h3, h4, p, ul, ol, table, pre');

      let currentHeading: { text: string; level: number } | undefined = undefined;
      let bufferText = '';
      let hasList = false;
      let hasTable = false;
      let hasCode = false;

      const flushChunk = () => {
        const text = bufferText.trim().replace(/\s+/g, ' ');
        if (!text) return;

        const words = text.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        if (wordCount < 10) return; // Ignore small noise fragments

        const estimatedTokens = Math.round(wordCount * 1.3);

        chunks.push({
          id: `chunk-${++chunkCounter}`,
          headingText: currentHeading?.text,
          headingLevel: currentHeading?.level,
          text,
          wordCount,
          estimatedTokens,
          parentTag: containerTag,
          hasList,
          hasTable,
          hasCode,
          isSemanticContainer: isSemantic,
        });

        bufferText = '';
        hasList = false;
        hasTable = false;
        hasCode = false;
      };

      subNodes.each((_, el) => {
        const tag = el.tagName.toLowerCase();
        if (tag.startsWith('h')) {
          flushChunk();
          const level = parseInt(tag.charAt(1), 10);
          currentHeading = { text: $(el).text().trim(), level };
        } else {
          if (['ul', 'ol'].includes(tag)) hasList = true;
          if (tag === 'table') hasTable = true;
          if (tag === 'pre' || $(el).find('code').length > 0) hasCode = true;

          bufferText += ' ' + $(el).text().trim();
          // Split into a subchunk if exceeding ~350 words for embeddings
          if (bufferText.split(/\s+/).length > 350) {
            flushChunk();
          }
        }
      });

      flushChunk();
    });

    const totalWordCount = chunks.reduce((sum, c) => sum + c.wordCount, 0);
    const totalEstimatedTokens = chunks.reduce((sum, c) => sum + c.estimatedTokens, 0);
    const averageChunkTokenCount = chunks.length > 0 ? Math.round(totalEstimatedTokens / chunks.length) : 0;

    return {
      chunks,
      totalWordCount,
      totalEstimatedTokens,
      averageChunkTokenCount,
      semanticTagsUsed,
      hasSemanticMain: $('main').length > 0,
      hasSemanticArticle: $('article').length > 0,
      hasSemanticSections: $('section').length > 0,
    };
  }
}
