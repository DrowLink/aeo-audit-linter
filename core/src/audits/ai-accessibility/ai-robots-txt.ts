/**
 * @fileoverview Auditoría que verifica el acceso permitido a rastreadores de IA en robots.txt
 */

import { Audit } from '../audit.js';
import type { Artifacts, AuditMeta, AuditResult } from '../../types/index.js';

export class AiRobotsTxtAudit extends Audit {
  public static override meta: AuditMeta = {
    id: 'ai-robots-txt',
    title: 'El archivo robots.txt permite el rastreo de los principales bots de IA',
    failureTitle: 'El archivo robots.txt bloquea o restringe a rastreadores de IA',
    description:
      'Los Answer Engines y sistemas RAG (ChatGPT/SearchGPT, Perplexity, Claude, Gemini) utilizan crawlers dedicados como GPTBot, PerplexityBot y ClaudeBot para indexar y citar fuentes actualizadas.',
    requiredArtifacts: ['RobotsTxt'],
  };

  public static override async audit(artifacts: Artifacts): Promise<AuditResult> {
    const robots = artifacts.RobotsTxt;

    if (!robots.exists || !robots.rawContent) {
      // Si no existe robots.txt, por estándar todos los bots tienen permitido el acceso total
      return this.generateAuditResult({
        score: 1,
        displayValue: 'Robots.txt no restringe el acceso (acceso libre)',
        explanation: 'No se encontró archivo robots.txt restrictivo, por lo que los bots de IA pueden acceder al contenido.',
      });
    }

    const aiBots = [
      { id: 'GPTBot', name: 'OpenAI (SearchGPT/ChatGPT)', status: robots.aiBotsStatus.gptBot || 'not_specified' },
      { id: 'PerplexityBot', name: 'Perplexity AI', status: robots.aiBotsStatus.perplexityBot || 'not_specified' },
      { id: 'ClaudeBot', name: 'Anthropic Claude', status: robots.aiBotsStatus.claudeBot || 'not_specified' },
      { id: 'Google-Extended', name: 'Google Gemini / Vertex', status: robots.aiBotsStatus.googleExtended || 'not_specified' },
      { id: 'CCBot', name: 'Common Crawl (Dataset Open Source)', status: robots.aiBotsStatus.ccBot || 'not_specified' },
      { id: 'Bytespider', name: 'ByteDance / Doubao', status: robots.aiBotsStatus.bytespider || 'not_specified' },
    ];

    let allowedCount = 0;
    const tableItems = aiBots.map((bot) => {
      const isAllowed = bot.status === 'allowed' || bot.status === 'not_specified';
      if (isAllowed) allowedCount++;

      return {
        bot: bot.id,
        purpose: bot.name,
        status: bot.status === 'disallowed' ? 'Bloqueado (Disallow)' : bot.status === 'partially_disallowed' ? 'Parcialmente restringido' : 'Permitido',
      };
    });

    const score = allowedCount / aiBots.length;

    return this.generateAuditResult({
      score: score >= 0.8 ? 1 : score,
      displayValue: `${allowedCount} de ${aiBots.length} bots de IA con acceso permitido`,
      details: this.makeTableDetails(
        [
          { key: 'bot', label: 'User-Agent', valueType: 'code' },
          { key: 'purpose', label: 'Plataforma / Motor', valueType: 'text' },
          { key: 'status', label: 'Directiva', valueType: 'status' },
        ],
        tableItems
      ),
    });
  }
}
