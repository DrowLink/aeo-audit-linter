/**
 * @fileoverview LlmsTxtGatherer to check and parse /llms.txt and /llms-full.txt standard files.
 */

import { Gatherer } from '../gatherer.js';
import type { LlmsTxtArtifact, LlmsTxtSection, GathererContext } from '../../types/index.js';

export class LlmsTxtGatherer extends Gatherer<'LlmsTxt'> {
  public override readonly name = 'LlmsTxt' as const;

  public override async getArtifact(context: GathererContext): Promise<LlmsTxtArtifact> {
    const finalUrl = await context.driver.getUrl();
    const urlObj = new URL(finalUrl);
    const llmsUrl = `${urlObj.origin}/llms.txt`;
    const llmsFullUrl = `${urlObj.origin}/llms-full.txt`;

    let rawContent: string | null = null;
    let statusCode: number | null = null;
    let exists = false;
    let hasFullVersion = false;
    let fullStatusCode: number | null = null;

    // 1. Fetch /llms.txt
    try {
      const response = await context.driver.fetch(llmsUrl);
      statusCode = response.status;
      if (response.ok) {
        const text = await response.text();
        // Check it is not an HTML 404/SPA fallback
        const trimmed = text.trim().toLowerCase();
        if (!trimmed.startsWith('<!doctype html') && !trimmed.startsWith('<html') && !trimmed.includes('<head>')) {
          rawContent = text;
          exists = true;
        }
      }
    } catch {
      exists = false;
    }

    // 2. Fetch /llms-full.txt (only if origin permits, check existence)
    try {
      const responseFull = await context.driver.fetch(llmsFullUrl);
      fullStatusCode = responseFull.status;
      if (responseFull.ok) {
        const textFull = await responseFull.text();
        const trimmed = textFull.trim().toLowerCase();
        if (!trimmed.startsWith('<!doctype html') && !trimmed.startsWith('<html')) {
          hasFullVersion = true;
        }
      }
    } catch {
      hasFullVersion = false;
    }

    const { title, summary, sections, totalDeclaredLinks } = this.parseLlmsTxt(rawContent || '');

    return {
      exists,
      statusCode,
      rawContent,
      charCount: rawContent ? rawContent.length : 0,
      hasFullVersion,
      fullStatusCode,
      title,
      summary,
      sections,
      totalDeclaredLinks,
    };
  }

  private parseLlmsTxt(content: string): {
    title?: string;
    summary?: string;
    sections: LlmsTxtSection[];
    totalDeclaredLinks: number;
  } {
    if (!content) {
      return { sections: [], totalDeclaredLinks: 0 };
    }

    let title: string | undefined;
    let summary: string | undefined;
    const sections: LlmsTxtSection[] = [];
    let currentSection: LlmsTxtSection = { title: 'Main', links: [] };
    let totalDeclaredLinks = 0;

    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Extract H1 title (# Title)
      if (line.startsWith('# ') && !title) {
        title = line.replace(/^#\s+/, '').trim();
        continue;
      }

      // Extract blockquote summary (> Summary)
      if (line.startsWith('>') && !summary) {
        summary = line.replace(/^>\s*/, '').trim();
        continue;
      }

      // Extract H2 section (## Section)
      if (line.startsWith('## ')) {
        if (currentSection.links.length > 0 || currentSection.title !== 'Main') {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^##\s+/, '').trim(),
          links: [],
        };
        continue;
      }

      // Extract Markdown links: - [Title](URL): Optional description
      const linkMatch = line.match(/^[-*]\s+\[([^\]]+)\]\(([^)]+)\)(?::?\s*(.*))?$/);
      if (linkMatch) {
        const linkTitle = linkMatch[1]?.trim() || '';
        const linkUrl = linkMatch[2]?.trim() || '';
        const linkDesc = linkMatch[3]?.trim() || undefined;

        currentSection.links.push({
          title: linkTitle,
          url: linkUrl,
          description: linkDesc,
        });
        totalDeclaredLinks++;
      }
    }

    if (currentSection.links.length > 0 || currentSection.title !== 'Main') {
      sections.push(currentSection);
    }

    return {
      title,
      summary,
      sections,
      totalDeclaredLinks,
    };
  }
}
