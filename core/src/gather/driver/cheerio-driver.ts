/**
 * @fileoverview Implementación de Driver basada en Fetch + Cheerio para entornos Node.js / CLI.
 */

import * as cheerio from 'cheerio';
import type { Driver } from '../../types/index.js';

export class CheerioDriver implements Driver {
  private url: string;
  private html: string;
  private headers: Record<string, string | string[]>;
  private $: cheerio.CheerioAPI;

  constructor(options: {
    url: string;
    html: string;
    headers?: Record<string, string | string[]>;
  }) {
    this.url = options.url;
    this.html = options.html;
    this.headers = options.headers || {};
    this.$ = cheerio.load(options.html);
  }

  public static async createFromUrl(
    targetUrl: string,
    fetchFn: typeof fetch = fetch,
    options?: { userAgent?: string; headers?: Record<string, string> }
  ): Promise<CheerioDriver> {
    const defaultHeaders = {
      'User-Agent':
        options?.userAgent ||
        'Mozilla/5.0 (compatible; AEOLinter/1.0; +https://github.com/aeo-linter)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      ...options?.headers,
    };

    const res = await fetchFn(targetUrl, {
      headers: defaultHeaders,
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al cargar ${targetUrl}: ${res.statusText}`);
    }

    const html = await res.text();
    const finalUrl = res.url || targetUrl;

    const headersRecord: Record<string, string | string[]> = {};
    res.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    return new CheerioDriver({
      url: finalUrl,
      html,
      headers: headersRecord,
    });
  }

  public async evaluate<T>(script: string | (() => T)): Promise<T> {
    if (typeof script === 'function') {
      return script();
    }
    throw new Error('evaluate() con string no soportado en CheerioDriver');
  }

  public async fetch(url: string, init?: RequestInit): Promise<Response> {
    return fetch(url, init);
  }

  public async getUrl(): Promise<string> {
    return this.url;
  }

  public async getHtml(): Promise<string> {
    return this.html;
  }

  public async getHttpHeaders(): Promise<Record<string, string | string[]>> {
    return this.headers;
  }

  public get$(): cheerio.CheerioAPI {
    return this.$;
  }
}
