/**
 * @fileoverview DirectAnswersGatherer to detect query patterns and immediate concise answers.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { DirectAnswersArtifact, DirectAnswerPair, GathererContext } from '../../types/index.js';

export class DirectAnswersGatherer extends Gatherer<'DirectAnswers'> {
  public override readonly name = 'DirectAnswers' as const;

  public override async getArtifact(context: GathererContext): Promise<DirectAnswersArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    const pairs: DirectAnswerPair[] = [];
    let definitionPatternsFound = 0;

    const questionWordsRegex = /^(what|how|why|when|where|who|which|is|are|can|do|does|should|will|¿|\?|qué|que|cómo|como|por qué|porque|cuál|cual)\b/i;
    const definitionRegex = /\b(is a|is an|is the|are the|refers to|is defined as|means|consists of|es un|es una|es el|es la|son los|son las|se refiere a|se define como|consiste en)\b/i;

    $('h1, h2, h3, h4').each((_, el) => {
      const headingText = $(el).text().trim();
      const isQuestion = headingText.includes('?') || questionWordsRegex.test(headingText);

      if (isQuestion) {
        const nextElem = $(el).nextAll('p, ul, ol').first();
        if (nextElem.length > 0) {
          const answerText = nextElem.text().trim().replace(/\s+/g, ' ');
          const words = answerText.split(/\s+/).filter(Boolean);
          const answerWordCount = words.length;

          // Concise for Answer Engines: typically between 20 and 75 words (ideal 30-60)
          const isConcise = answerWordCount >= 20 && answerWordCount <= 75;
          const hasDirectDefinition = definitionRegex.test(answerText.slice(0, 150));

          if (hasDirectDefinition) {
            definitionPatternsFound++;
          }

          let confidence = 0.5;
          if (isConcise) confidence += 0.3;
          if (hasDirectDefinition) confidence += 0.2;

          pairs.push({
            question: headingText,
            questionSource: 'heading',
            answerText,
            answerWordCount,
            isConcise,
            hasDirectDefinition,
            confidenceScore: Math.min(confidence, 1.0),
          });
        }
      }
    });

    const conciseAnswersCount = pairs.filter((p) => p.isConcise).length;
    const directAnswerRatio = pairs.length > 0 ? conciseAnswersCount / pairs.length : 0;

    // Fact, Citation, and Numerical Metrics Extraction for GEO
    $('script, style, noscript, svg, nav, footer, header').remove();
    const mainText = $('main, article, section, body').text().replace(/\s+/g, ' ');

    const percentageMatches = mainText.match(/\b\d+(?:\.\d+)?\s*(?:%|percent\b|por ciento\b)/gi) || [];
    const numericalMatches = mainText.match(/(?:[\$€£¥]\s*\d+(?:\.\d+)?|\b\d+(?:\.\d+)?\s*(?:ms|kb|mb|gb|tb|km|kg|k|m|million|billion|millones|tokens|users|usuarios|fps)\b)/gi) || [];
    const citationMatches = mainText.match(/\b(?:according to|study by|research by|survey by|reported by|published by|data shows|data from|source:|según|estudio de|investigación de|fuente:|datos de|informe de)\b/gi) || [];

    const externalSourcesUrls: string[] = [];
    let currentHost = '';
    try {
      const finalUrl = await context.driver.getUrl();
      currentHost = new URL(finalUrl).hostname;
    } catch {}

    $('a[href^="http"]').each((_, a) => {
      const href = $(a).attr('href') || '';
      try {
        const linkUrl = new URL(href);
        if (linkUrl.hostname && linkUrl.hostname !== currentHost && !externalSourcesUrls.includes(linkUrl.origin)) {
          externalSourcesUrls.push(linkUrl.origin);
        }
      } catch {}
    });

    return {
      pairs,
      directAnswerRatio,
      conciseAnswersCount,
      definitionPatternsFound,
      facts: {
        percentagesCount: percentageMatches.length,
        numericalMetricsCount: numericalMatches.length,
        citationPhrasesCount: citationMatches.length,
        externalSourcesCount: externalSourcesUrls.length,
        externalSourcesUrls,
        totalFactSignals: percentageMatches.length + numericalMatches.length + citationMatches.length + externalSourcesUrls.length,
      },
    };
  }
}
