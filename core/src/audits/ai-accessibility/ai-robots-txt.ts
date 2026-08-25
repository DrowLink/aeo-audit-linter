/**
 * @fileoverview Audit verifying whether robots.txt grants access to major AI crawlers
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiRobotsTxtAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-robots-txt',
    title: 'robots.txt allows crawling by major AI search bots',
    failureTitle: 'robots.txt blocks or restricts major AI search crawlers',
    description:
      'Answer Engines and RAG systems (SearchGPT/ChatGPT, Perplexity, Claude, Gemini) use dedicated crawlers like GPTBot, PerplexityBot, and ClaudeBot to index and cite up-to-date sources.',
    requiredArtifacts: ['RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const robots = artifacts.RobotsTxt;

    if (!robots.exists || !robots.rawContent) {
      return this.generateAuditResult({
        score: 1,
        displayValue: 'robots.txt does not restrict access (unrestricted)',
        explanation: 'No restrictive robots.txt file was found, allowing AI bots to access the content.',
      });
    }

    const aiBots = [
      { id: 'GPTBot', name: 'OpenAI (SearchGPT/ChatGPT)', status: robots.aiBotsStatus.gptBot || 'not_specified' },
      { id: 'PerplexityBot', name: 'Perplexity AI', status: robots.aiBotsStatus.perplexityBot || 'not_specified' },
      { id: 'ClaudeBot', name: 'Anthropic Claude', status: robots.aiBotsStatus.claudeBot || 'not_specified' },
      { id: 'Google-Extended', name: 'Google Gemini / Vertex', status: robots.aiBotsStatus.googleExtended || 'not_specified' },
      { id: 'CCBot', name: 'Common Crawl (Open Datasets)', status: robots.aiBotsStatus.ccBot || 'not_specified' },
      { id: 'Bytespider', name: 'ByteDance / Doubao', status: robots.aiBotsStatus.bytespider || 'not_specified' },
    ];

    let allowedCount = 0;
    const tableItems = aiBots.map((bot) => {
      const isAllowed = bot.status === 'allowed' || bot.status === 'not_specified';
      if (isAllowed) allowedCount++;

      return {
        bot: bot.id,
        purpose: bot.name,
        status: bot.status === 'disallowed' ? 'Blocked (Disallow)' : bot.status === 'partially_disallowed' ? 'Partially restricted' : 'Allowed',
      };
    });

    const score = allowedCount / aiBots.length;

    return this.generateAuditResult({
      score: score >= 0.8 ? 1 : score,
      displayValue: `${allowedCount} of ${aiBots.length} AI bots have crawling access allowed`,
      details: this.makeTableDetails(
        [
          { key: 'bot', label: 'User-Agent', valueType: 'code' },
          { key: 'purpose', label: 'Platform / Engine', valueType: 'text' },
          { key: 'status', label: 'Directive', valueType: 'status' },
        ],
        tableItems
      ),
    });
  }
}
