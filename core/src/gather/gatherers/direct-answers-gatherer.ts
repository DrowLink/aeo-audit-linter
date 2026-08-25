/**
 * @fileoverview DirectAnswersGatherer para detectar patrones de preguntas clave y respuestas concisas inmediatas.
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

    const questionWordsRegex = /^(¿|\?|qué|que|cómo|como|por qué|porque|cuál|cual|cuándo|cuando|dónde|donde|quién|quien|what|how|why|when|where|who|which|is|are|can|do|does)\b/i;
    const definitionRegex = /\b(es un|es una|es el|es la|son los|son las|se refiere a|se define como|consiste en|hace referencia a|is a|is an|is the|are the|refers to|is defined as|means)\b/i;

    $('h1, h2, h3, h4').each((_, el) => {
      const headingText = $(el).text().trim();
      const isQuestion = headingText.includes('?') || questionWordsRegex.test(headingText);

      if (isQuestion) {
        // Encontrar el siguiente párrafo o lista
        const nextElem = $(el).nextAll('p, ul, ol').first();
        if (nextElem.length > 0) {
          const answerText = nextElem.text().trim().replace(/\s+/g, ' ');
          const words = answerText.split(/\s+/).filter(Boolean);
          const answerWordCount = words.length;

          // Conciso para Answer Engines: típicamente entre 20 y 75 palabras (ideal 30-60)
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

    return {
      pairs,
      directAnswerRatio,
      conciseAnswersCount,
      definitionPatternsFound,
    };
  }
}
