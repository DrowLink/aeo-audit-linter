/**
 * @fileoverview Main CLI entrypoint for aeo-linter
 */

import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Runner, TerminalReporter, HtmlReporter, defaultConfig } from '@drowlink/aeo-linter-core';
import type { LinterConfig } from '@drowlink/aeo-linter-core';

export async function runCli(): Promise<void> {
  const program = new Command();

  program
    .name('aeo-linter')
    .description('Answer Engine Optimization (AEO/GEO) Linter - Google Lighthouse Architecture')
    .version('0.1.2')
    .argument('<url>', 'Target webpage URL to audit')
    .option('-j, --json', 'Output full report in JSON format')
    .option('--html', 'Generate an interactive visual HTML report dashboard')
    .option('-o, --output <file>', 'File path to save the report (.html or .json)')
    .option('-c, --categories <categories>', 'Comma-separated list of categories to audit')
    .action(async (url: string, options) => {
      try {
        // Validate URL format
        let validUrl: string;
        try {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            validUrl = `https://${url}`;
          } else {
            validUrl = url;
          }
          new URL(validUrl);
        } catch {
          console.error(`\x1b[31mError: Invalid URL '${url}'\x1b[0m`);
          process.exit(1);
        }

        // Filter categories if specified
        let customConfig: LinterConfig = defaultConfig;
        if (options.categories) {
          const selected = (options.categories as string).split(',').map((c) => c.trim().toLowerCase());
          const filteredCategories: LinterConfig['categories'] = {};

          for (const key of Object.keys(defaultConfig.categories)) {
            if (selected.includes(key.toLowerCase())) {
              filteredCategories[key] = defaultConfig.categories[key];
            }
          }

          if (Object.keys(filteredCategories).length === 0) {
            console.error(
              `\x1b[31mError: No valid categories selected. Available: ${Object.keys(
                defaultConfig.categories
              ).join(', ')}\x1b[0m`
            );
            process.exit(1);
          }

          customConfig = {
            ...defaultConfig,
            categories: filteredCategories,
          };
        }

        const isQuiet = Boolean(options.json && !options.output);

        if (!isQuiet) {
          console.log(`\x1b[36m⚡ Starting AEO audit for:\x1b[0m ${validUrl}`);
        }

        const report = await Runner.run(validUrl, {
          config: customConfig,
          onProgress: (phase: string, msg: string) => {
            if (!isQuiet) {
              console.log(`  \x1b[90m[${phase.toUpperCase()}]\x1b[0m ${msg}`);
            }
          },
        });

        // Generate output
        if (options.output) {
          const outPath = path.resolve(process.cwd(), options.output);
          let content = '';

          if (outPath.endsWith('.json') || options.json) {
            content = JSON.stringify(report, null, 2);
          } else {
            content = HtmlReporter.generate(report);
          }

          await fs.writeFile(outPath, content, 'utf-8');
          console.log(`\n\x1b[32m✔ Report successfully saved to:\x1b[0m ${outPath}`);
        } else if (options.html) {
          const defaultHtmlPath = path.resolve(process.cwd(), `aeo-report-${Date.now()}.html`);
          const content = HtmlReporter.generate(report);
          await fs.writeFile(defaultHtmlPath, content, 'utf-8');
          console.log(`\n\x1b[32m✔ Interactive HTML report generated at:\x1b[0m ${defaultHtmlPath}`);
        } else if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(TerminalReporter.generate(report));
        }
      } catch (err) {
        console.error(`\x1b[31mError during AEO audit:\x1b[0m`, err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}
