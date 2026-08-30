/**
 * @fileoverview KeywordsGatherer extracts top keywords and their frequency/density from text content.
 */

import * as cheerio from 'cheerio';
import { Gatherer } from '../gatherer.js';
import type { KeywordsArtifact, KeywordItem, GathererContext } from '../../types/index.js';

const COMMON_STOP_WORDS = new Set([
  // English stop words
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'can\'t', 'cannot', 'could', 'couldn\'t',
  'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during',
  'each', 'few', 'for', 'from', 'further',
  'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here',
  'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s',
  'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself',
  'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such',
  'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they',
  'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s',
  'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t',
  'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',

  // Spanish stop words
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su',
  'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'son', 'entre', 'está',
  'cuando', 'muy', 'sin', 'sobre', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante',
  'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos',
  'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos',
  'cual', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo', 'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus',
  'ellas', 'nosotras', 'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya', 'tuyos', 'tuyas',
  'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra', 'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras',
]);

export class KeywordsGatherer extends Gatherer<'Keywords'> {
  public override readonly name = 'Keywords' as const;

  public override async getArtifact(context: GathererContext): Promise<KeywordsArtifact> {
    const html = await context.driver.getHtml();
    const $ = cheerio.load(html);

    // Remove script, style, noscript, svg, iframe
    $('script, style, noscript, svg, iframe').remove();

    const bodyText = $('body').text().toLowerCase();
    // Normalize and tokenize words (letters, accents, digits, min length 3)
    const tokens = bodyText.match(/[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]{3,}/g) || [];

    const totalWords = tokens.length;
    const frequencyMap: Record<string, number> = {};

    for (const token of tokens) {
      if (COMMON_STOP_WORDS.has(token) || /^\d+$/.test(token)) {
        continue;
      }
      frequencyMap[token] = (frequencyMap[token] || 0) + 1;
    }

    const sortedKeywords = Object.entries(frequencyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]): KeywordItem => {
        const densityPercent = totalWords > 0 ? Number(((count / totalWords) * 100).toFixed(2)) : 0;
        return {
          word,
          count,
          densityPercent,
        };
      });

    return {
      topKeywords: sortedKeywords,
      totalWords,
    };
  }
}
