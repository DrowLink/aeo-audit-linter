/**
 * @fileoverview RobotsTxtGatherer para obtener y parsear robots.txt y evaluar directivas de bots de IA.
 */

import { Gatherer } from '../gatherer.js';
import type { RobotsTxtArtifact, RobotsAgentRule, GathererContext } from '../../types/index.js';

export class RobotsTxtGatherer extends Gatherer<'RobotsTxt'> {
  public override readonly name = 'RobotsTxt' as const;

  public override async getArtifact(context: GathererContext): Promise<RobotsTxtArtifact> {
    const finalUrl = await context.driver.getUrl();
    const urlObj = new URL(finalUrl);
    const robotsUrl = `${urlObj.origin}/robots.txt`;

    let rawContent: string | null = null;
    let statusCode: number | null = null;
    let exists = false;

    try {
      const response = await context.driver.fetch(robotsUrl);
      statusCode = response.status;
      if (response.ok) {
        const text = await response.text();
        // Verificar que no sea una página de error 404 disfrazada de HTML
        if (!text.trim().toLowerCase().startsWith('<!doctype html') && !text.trim().toLowerCase().startsWith('<html')) {
          rawContent = text;
          exists = true;
        }
      }
    } catch {
      // Ignorar errores de red y marcar como no existente
      exists = false;
    }

    const { rulesByAgent, sitemaps } = this.parseRobotsTxt(rawContent || '');
    const aiBotsStatus = this.evaluateAiBots(rulesByAgent, urlObj.pathname);

    return {
      rawContent,
      statusCode,
      exists,
      sitemaps,
      rulesByAgent,
      aiBotsStatus,
    };
  }

  private parseRobotsTxt(content: string): {
    rulesByAgent: Record<string, RobotsAgentRule>;
    sitemaps: string[];
  } {
    const rulesByAgent: Record<string, RobotsAgentRule> = {};
    const sitemaps: string[] = [];

    if (!content) {
      return { rulesByAgent, sitemaps };
    }

    const lines = content.split(/\r?\n/);
    let currentAgents: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.split('#')[0].trim();
      if (!line) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key = line.slice(0, colonIdx).trim().toLowerCase();
      const value = line.slice(colonIdx + 1).trim();

      if (key === 'user-agent') {
        const agent = value.toLowerCase();
        // Si veníamos procesando otro grupo, iniciamos nuevo grupo si no es consecutivo
        currentAgents = [agent];
        if (!rulesByAgent[agent]) {
          rulesByAgent[agent] = {
            userAgent: value,
            allow: [],
            disallow: [],
          };
        }
      } else if (key === 'disallow' && currentAgents.length > 0) {
        for (const ag of currentAgents) {
          if (value) {
            rulesByAgent[ag]?.disallow.push(value);
          }
        }
      } else if (key === 'allow' && currentAgents.length > 0) {
        for (const ag of currentAgents) {
          if (value) {
            rulesByAgent[ag]?.allow.push(value);
          }
        }
      } else if (key === 'crawl-delay' && currentAgents.length > 0) {
        const delay = parseFloat(value);
        if (!isNaN(delay)) {
          for (const ag of currentAgents) {
            const rule = rulesByAgent[ag];
            if (rule) rule.crawlDelay = delay;
          }
        }
      } else if (key === 'sitemap') {
        if (value) {
          sitemaps.push(value);
        }
      }
    }

    return { rulesByAgent, sitemaps };
  }

  private evaluateAiBots(
    rules: Record<string, RobotsAgentRule>,
    pathname: string
  ): RobotsTxtArtifact['aiBotsStatus'] {
    const checkBot = (botName: string): 'allowed' | 'disallowed' | 'partially_disallowed' | 'not_specified' => {
      const botRule = rules[botName.toLowerCase()];
      const wildRule = rules['*'];

      const rule = botRule || wildRule;
      if (!rule) {
        return 'not_specified';
      }

      const isDisallowedAll = rule.disallow.some((p) => p === '/' || p === '/*');
      const isAllowedAll = rule.allow.some((p) => p === '/' || p === '/*');

      if (isDisallowedAll && !isAllowedAll) {
        return 'disallowed';
      }

      const matchingDisallow = rule.disallow.some((p) => pathname.startsWith(p));
      const matchingAllow = rule.allow.some((p) => pathname.startsWith(p));

      if (matchingDisallow && !matchingAllow) {
        return 'disallowed';
      }

      if (matchingAllow && !matchingDisallow) {
        return 'allowed';
      }

      if (rule.disallow.length > 0) {
        return 'partially_disallowed';
      }

      return 'allowed';
    };

    return {
      gptBot: checkBot('gptbot'),
      perplexityBot: checkBot('perplexitybot'),
      claudeBot: checkBot('claudebot'),
      googleExtended: checkBot('google-extended'),
      ccBot: checkBot('ccbot'),
      bytespider: checkBot('bytespider'),
      cohereAi: checkBot('cohere-ai'),
    };
  }
}
