/**
 * @fileoverview Formats audit reports for standard terminal / console output.
 */

import type { AeoReportResult } from '../types/index.js';

export class TerminalReporter {
  public static generate(report: AeoReportResult): string {
    const lines: string[] = [];

    const formatScore = (score: number | null): string => {
      if (score === null) return '\x1b[90mN/A\x1b[0m';
      const s = score <= 1 ? Math.round(score * 100) : Math.round(score);
      if (s >= 90) return `\x1b[32m${s}\x1b[0m`;
      if (s >= 50) return `\x1b[33m${s}\x1b[0m`;
      return `\x1b[31m${s}\x1b[0m`;
    };

    lines.push('');
    lines.push('\x1b[1m\x1b[36m============================================================\x1b[0m');
    lines.push(`\x1b[1m  AEO Linter Report - Answer Engine Optimization\x1b[0m`);
    lines.push(`  URL: \x1b[4m${report.url}\x1b[0m`);
    lines.push(`  Date: ${new Date(report.fetchTime).toLocaleString('en-US')}`);
    lines.push('\x1b[1m\x1b[36m============================================================\x1b[0m');
    lines.push('');
    lines.push(`\x1b[1m  Overall AEO Score: ${formatScore(report.overallScore)} / 100\x1b[0m`);
    lines.push('');

    for (const cat of Object.values(report.categories)) {
      const catScore = cat.score !== null ? Math.round(cat.score * 100) : null;
      lines.push(`\x1b[1m------------------------------------------------------------\x1b[0m`);
      lines.push(`\x1b[1m\x1b[35m[ ${cat.title} ]\x1b[0m - Score: ${formatScore(catScore)} / 100`);
      lines.push(`  \x1b[90m${cat.description}\x1b[0m`);
      lines.push('');

      for (const ref of cat.auditRefs) {
        const audit = ref.result;
        const icon = audit.score !== null && audit.score >= 0.8 ? '\x1b[32m✔\x1b[0m' : '\x1b[31m✖\x1b[0m';
        lines.push(`  ${icon} \x1b[1m${audit.title}\x1b[0m (${formatScore(audit.score)})`);
        if (audit.displayValue) {
          lines.push(`    \x1b[90m↳ ${audit.displayValue}\x1b[0m`);
        }
        if (audit.explanation) {
          lines.push(`    \x1b[33m! ${audit.explanation}\x1b[0m`);
        }
      }
      lines.push('');
    }

    lines.push('\x1b[1m\x1b[36m============================================================\x1b[0m');
    lines.push('');

    return lines.join('\n');
  }
}
