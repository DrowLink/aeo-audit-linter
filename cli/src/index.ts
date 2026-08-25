/**
 * @fileoverview CLI principal para aeo-linter
 */

import { Command } from 'commander';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Runner, TerminalReporter, HtmlReporter, defaultConfig } from '@aeo-linter/core';
import type { LinterConfig } from '@aeo-linter/core';

export async function runCli(): Promise<void> {
  const program = new Command();

  program
    .name('aeo-linter')
    .description('Answer Engine Optimization (AEO/GEO) Linter - Arquitectura Google Lighthouse')
    .version('0.1.0')
    .argument('<url>', 'URL de la página web a auditar')
    .option('-j, --json', 'Muestra el resultado completo en formato JSON')
    .option('--html', 'Genera un reporte visual interactivo en formato HTML')
    .option('-o, --output <file>', 'Ruta de archivo para guardar el reporte (.html o .json)')
    .option('-c, --categories <categories>', 'Lista separada por comas de categorías a auditar')
    .action(async (url: string, options) => {
      try {
        // Validar formato de URL
        let validUrl: string;
        try {
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            validUrl = `https://${url}`;
          } else {
            validUrl = url;
          }
          new URL(validUrl);
        } catch {
          console.error(`\x1b[31mError: URL inválida '${url}'\x1b[0m`);
          process.exit(1);
        }

        // Filtrar categorías si se especificaron
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
              `\x1b[31mError: Ninguna categoría válida seleccionada. Disponibles: ${Object.keys(
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
          console.log(`\x1b[36m⚡ Iniciando auditoría AEO para:\x1b[0m ${validUrl}`);
        }

        const report = await Runner.run(validUrl, {
          config: customConfig,
          onProgress: (phase: string, msg: string) => {
            if (!isQuiet) {
              console.log(`  \x1b[90m[${phase.toUpperCase()}]\x1b[0m ${msg}`);
            }
          },
        });

        // Generar salida
        if (options.output) {
          const outPath = path.resolve(process.cwd(), options.output);
          let content = '';

          if (outPath.endsWith('.json') || options.json) {
            content = JSON.stringify(report, null, 2);
          } else {
            content = HtmlReporter.generate(report);
          }

          await fs.writeFile(outPath, content, 'utf-8');
          console.log(`\n\x1b[32m✔ Reporte guardado con éxito en:\x1b[0m ${outPath}`);
        } else if (options.html) {
          const defaultHtmlPath = path.resolve(process.cwd(), `aeo-report-${Date.now()}.html`);
          const content = HtmlReporter.generate(report);
          await fs.writeFile(defaultHtmlPath, content, 'utf-8');
          console.log(`\n\x1b[32m✔ Reporte HTML interactivo generado en:\x1b[0m ${defaultHtmlPath}`);
        } else if (options.json) {
          console.log(JSON.stringify(report, null, 2));
        } else {
          console.log(TerminalReporter.generate(report));
        }
      } catch (err) {
        console.error(`\x1b[31mError durante la auditoría AEO:\x1b[0m`, err instanceof Error ? err.message : err);
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}
