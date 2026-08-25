/**
 * @fileoverview HttpHeadersGatherer para recopilar y analizar cabeceras de respuesta HTTP.
 */

import { Gatherer } from '../gatherer.js';
import type { HttpHeadersArtifact, GathererContext } from '../../types/index.js';

export class HttpHeadersGatherer extends Gatherer<'HttpHeaders'> {
  public override readonly name = 'HttpHeaders' as const;

  public override async getArtifact(context: GathererContext): Promise<HttpHeadersArtifact> {
    const rawHeaders = await context.driver.getHttpHeaders();

    const getHeader = (key: string): string | null => {
      const val = rawHeaders[key.toLowerCase()];
      if (!val) return null;
      return Array.isArray(val) ? val.join(', ') : val;
    };

    return {
      statusCode: 200,
      headers: rawHeaders,
      xRobotsTag: getHeader('x-robots-tag'),
      contentType: getHeader('content-type'),
      cacheControl: getHeader('cache-control'),
      contentEncoding: getHeader('content-encoding'),
    };
  }
}
